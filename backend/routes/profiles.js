import { Router } from "express";
import { supabaseAdmin } from "../supabase.js";
import { broadcast } from "../server.js";

const router = Router();

// GET /api/profiles  (?mode=browse shows all, mode=swipe hides liked+passed)
router.get("/", async (req, res) => {
  const me = req.user.id;
  const { region, gender, max_budget, min_budget, renter_type,
          limit = 100, offset = 0, mode = "swipe" } = req.query;

  const [{ data: myLikes }, { data: myPasses }] = await Promise.all([
    supabaseAdmin.from("likes").select("liked_id").eq("liker_id", me),
    supabaseAdmin.from("passes").select("passed_id").eq("passer_id", me),
  ]);

  let query = supabaseAdmin
    .from("profiles").select("*").neq("id", me)
    .order("created_at", { ascending: false })
    .limit(Number(limit))
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (mode === "swipe") {
    const hideIds = [...new Set([
      ...(myLikes  || []).map(r => r.liked_id),
      ...(myPasses || []).map(r => r.passed_id),
    ])];
    if (hideIds.length > 0) query = query.not("id", "in", `(${hideIds.join(",")})`);
  }

  if (region)      query = query.eq("region", region);
  if (gender)      query = query.eq("gender", gender);
  if (max_budget)  query = query.lte("budget", Number(max_budget));
  if (min_budget)  query = query.gte("budget", Number(min_budget));
  if (renter_type) query = query.eq("renter_type", renter_type);

  const { data: profiles, error } = await query;
  if (error) {
    console.error("[profiles] fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch profiles" });
  }

  const likedSet   = new Set((myLikes || []).map(r => r.liked_id));
  const matchedIds = await getMatchedIds(me);

  return res.json((profiles || []).map(p => ({
    ...p,
    liked:   likedSet.has(p.id),
    matched: matchedIds.has(p.id),
  })));
});

// GET /api/profiles/:id
router.get("/:id", async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles").select("*").eq("id", req.params.id).single();
  if (error || !profile) return res.status(404).json({ error: "Profile not found" });
  const matchedIds = await getMatchedIds(req.user.id);
  return res.json({ ...profile, matched: matchedIds.has(profile.id) });
});

// POST /api/profiles/like/:id
router.post("/like/:id", async (req, res) => {
  const likerId = req.user.id;
  const likedId = req.params.id;

  console.log(`[like] ${likerId} -> ${likedId}`);

  if (likerId === likedId)
    return res.status(400).json({ error: "Cannot like yourself" });

  // 1. Save like
  const { error: likeErr } = await supabaseAdmin
    .from("likes")
    .upsert({ liker_id: likerId, liked_id: likedId }, { onConflict: "liker_id,liked_id" });

  if (likeErr) {
    console.error("[like] insert error:", JSON.stringify(likeErr));
    return res.status(500).json({ error: "Failed to like" });
  }
  console.log("[like] saved OK");

  // 2. Check mutual like
  const { data: theirLike, error: mutualErr } = await supabaseAdmin
    .from("likes").select("id")
    .eq("liker_id", likedId).eq("liked_id", likerId)
    .maybeSingle();

  if (mutualErr) console.error("[like] mutual check error:", JSON.stringify(mutualErr));
  console.log(`[like] mutual: ${!!theirLike}`);

  if (!theirLike) return res.json({ liked: true, matched: false });

  // 3. Check if match already exists
  const { data: existing, error: existErr } = await supabaseAdmin
    .from("matches").select("id")
    .or(`and(user1_id.eq.${likerId},user2_id.eq.${likedId}),and(user1_id.eq.${likedId},user2_id.eq.${likerId})`)
    .maybeSingle();

  if (existErr) console.error("[like] existing match error:", JSON.stringify(existErr));

  let matchId = existing?.id ?? null;
  console.log(`[like] existing match: ${matchId ?? "none"}`);

  // 4. Create match if needed
  if (!matchId) {
    const u1 = likerId < likedId ? likerId : likedId;
    const u2 = likerId < likedId ? likedId : likerId;
    console.log(`[like] creating match u1=${u1} u2=${u2}`);

    const { data: created, error: createErr } = await supabaseAdmin
      .from("matches")
      .insert({ user1_id: u1, user2_id: u2 })
      .select("id")
      .single();

    if (createErr) {
      console.error("[like] match create FAILED:", JSON.stringify(createErr));
      // Fetch in case it was a duplicate constraint race
      const { data: fallback } = await supabaseAdmin
        .from("matches").select("id")
        .eq("user1_id", u1).eq("user2_id", u2)
        .maybeSingle();
      matchId = fallback?.id ?? null;
      console.log(`[like] fallback match: ${matchId}`);
    } else {
      matchId = created.id;
      console.log(`[like] match created: ${matchId}`);
    }
  }

  // 5. Push real-time event to both users
  broadcast(likerId, { type: "match", match_id: matchId, with_user_id: likedId });
  broadcast(likedId, { type: "match", match_id: matchId, with_user_id: likerId });
  console.log(`[like] ✅ MATCH ${likerId} <-> ${likedId} id=${matchId}`);

  return res.json({ liked: true, matched: true, match_id: matchId });
});

// POST /api/profiles/pass/:id
router.post("/pass/:id", async (req, res) => {
  const { error } = await supabaseAdmin.from("passes")
    .upsert(
      { passer_id: req.user.id, passed_id: req.params.id },
      { onConflict: "passer_id,passed_id" }
    );
  if (error) return res.status(500).json({ error: "Failed to pass" });
  return res.json({ passed: true });
});

async function getMatchedIds(userId) {
  const { data } = await supabaseAdmin.from("matches")
    .select("user1_id, user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  return new Set((data || []).map(m => m.user1_id === userId ? m.user2_id : m.user1_id));
}

export default router;