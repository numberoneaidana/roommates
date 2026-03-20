/**
 * /api/auth
 *   POST /register  – create user + profile
 *   POST /login     – return JWT
 *   GET  /me        – current user profile
 *   PUT  /me        – update current user profile
 */
/**
 * /api/auth
 *   POST /register  – create user + profile
 *   POST /login     – return JWT
 *   GET  /me        – current user profile
 *   PUT  /me        – update current user profile
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Convert boolean OR "yes"/"no"/""  →  "yes" | "no" | ""
const toYesNo = (v) => {
  if (v === true  || v === "yes") return "yes";
  if (v === false || v === "no")  return "no";
  return "";
};

// Normalise schedule — "Гибкий" / "Переменный" both map to "Переменный"
const toSchedule = (v) => {
  if (v === "Жаворонок") return "Жаворонок";
  if (v === "Сова")      return "Сова";
  if (v)                 return "Переменный";  // Гибкий, Переменный, anything else
  return null;
};

const signToken = (userId, email) =>
  jwt.sign({ sub: userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, name, age, gender, region, renter_type, budget, bio, occupation,
          schedule, cleanliness, pets, smoking, alcohol, remote, religion, move_in,
          tags, languages, photos, study_work, address, lat, lng } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password and name are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  // Check duplicate
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing) return res.status(409).json({ error: "Email already registered" });

  const password_hash = await bcrypt.hash(password, 12);

  // Insert user
  const { data: user, error: uErr } = await supabaseAdmin
    .from("users")
    .insert({ email: email.toLowerCase().trim(), password_hash })
    .select()
    .single();

  if (uErr) return res.status(500).json({ error: "Failed to create account" });

  // Insert profile
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: user.id,
      name: name.trim(),
      age:         Number(age)         || null,
      gender:      gender              || null,
      bio:         bio?.trim()         || null,
      occupation:  occupation?.trim()  || null,
      study_work:  study_work?.trim()  || null,
      region:      region              || null,
      address:     address?.trim()     || null,
      lat:         lat ? Number(lat)   : null,
      lng:         lng ? Number(lng)   : null,
      renter_type: renter_type         || "looking",
      budget:      budget ? Number(budget) : null,
      move_in:     move_in             || null,
      schedule:    toSchedule(schedule),
      cleanliness: cleanliness ? Number(cleanliness) : null,
      pets:        toYesNo(pets),
      smoking:     toYesNo(smoking),
      alcohol:     toYesNo(alcohol),
      remote:      toYesNo(remote),
      religion:    religion            || null,
      tags:        Array.isArray(tags)      ? tags      : [],
      languages:   Array.isArray(languages) ? languages : [],
      photos:      Array.isArray(photos)    ? photos    : [],
    })
    .select()
    .single();

  if (pErr) {
    // Rollback user if profile failed
    await supabaseAdmin.from("users").delete().eq("id", user.id);
    console.error("Profile insert error:", pErr);
    return res.status(500).json({ error: "Failed to create profile" });
  }

  const token = signToken(user.id, user.email);
  return res.status(201).json({
    token,
    user: sanitiseProfile(profile),
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const token = signToken(user.id, user.email);
  return res.json({ token, user: sanitiseProfile(profile ?? { id: user.id, name: "User" }) });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error || !profile) return res.status(404).json({ error: "Profile not found" });
  return res.json(sanitiseProfile(profile));
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
router.put("/me", authMiddleware, async (req, res) => {
  const allowed = [
    "name","age","gender","bio","occupation","study_work","region","address",
    "lat","lng","renter_type","budget","move_in","schedule","cleanliness",
    "pets","smoking","alcohol","remote","religion","tags","languages","photos",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Update failed" });
  return res.json(sanitiseProfile(data));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitiseProfile(p) {
  if (!p) return null;
  // Never expose password_hash (it's only on the users table anyway, but belt & braces)
  const { password_hash, ...safe } = p;
  return safe;
}

export default router;