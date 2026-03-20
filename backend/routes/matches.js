/**
 * /api/matches
 *   GET /   – list all confirmed matches for current user
 *   DELETE /:id – unmatch
 */

import { Router } from "express";
import { supabaseAdmin } from "../supabase.js";

const router = Router();

// ── GET /api/matches ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const me = req.user.id;

  const { data, error } = await supabaseAdmin
    .from("matches")
    .select("id, created_at, user1_id, user2_id")
    .or(`user1_id.eq.${me},user2_id.eq.${me}`)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch matches" });

  // Fetch the other user's profile for each match
  const otherIds = (data || []).map(m => (m.user1_id === me ? m.user2_id : m.user1_id));

  const { data: profiles } = otherIds.length
    ? await supabaseAdmin.from("profiles").select("*").in("id", otherIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const result = (data || []).map(m => {
    const otherId  = m.user1_id === me ? m.user2_id : m.user1_id;
    const profile  = profileMap.get(otherId) ?? { id: otherId };
    return {
      match_id:   m.id,
      matched_at: m.created_at,
      user: { ...profile, matched: true, liked: true },
    };
  });

  return res.json(result);
});

// ── DELETE /api/matches/:id ───────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const me = req.user.id;

  // Confirm the user is a participant before deleting
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id, user1_id, user2_id")
    .eq("id", req.params.id)
    .single();

  if (!match) return res.status(404).json({ error: "Match not found" });
  if (match.user1_id !== me && match.user2_id !== me)
    return res.status(403).json({ error: "Not your match" });

  const { error } = await supabaseAdmin
    .from("matches")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: "Failed to unmatch" });
  return res.json({ unmatched: true });
});

export default router;
