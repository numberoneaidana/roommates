/**
 * /api/messages
 *   GET  /:profileId          – fetch messages in the thread (supports ?since_id=N)
 *   POST /:profileId          – send a message (REST fallback; WS is preferred)
 *   PUT  /:profileId/read     – mark messages as read
 */

import { Router } from "express";
import { supabaseAdmin } from "../supabase.js";
import { broadcast } from "../server.js";

const router = Router();

// ── GET /api/messages/:profileId ─────────────────────────────────────────────
router.get("/:profileId", async (req, res) => {
  const me = req.user.id;
  const other = req.params.profileId;
  const sinceAt = req.query.since_at || null;   // ISO timestamp for incremental poll

  // Verify match exists
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${me},user2_id.eq.${other}),` +
      `and(user1_id.eq.${other},user2_id.eq.${me})`
    )
    .maybeSingle();

  if (!match) return res.status(403).json({ error: "No match found" });

  let query = supabaseAdmin
    .from("messages")
    .select("id, sender_id, receiver_id, content, read_at, created_at")
    .eq("match_id", match.id)
    .order("created_at", { ascending: true })
    .limit(200);

  // Incremental fetch: only messages newer than a known timestamp
  if (sinceAt) query = query.gt("created_at", sinceAt);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Failed to fetch messages" });

  return res.json(data || []);
});

// ── POST /api/messages/:profileId ────────────────────────────────────────────
router.post("/:profileId", async (req, res) => {
  const me = req.user.id;
  const other = req.params.profileId;
  const content = (req.body.content || req.body.text || "").trim().slice(0, 2000);

  if (!content) return res.status(400).json({ error: "Message cannot be empty" });

  // Verify match
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${me},user2_id.eq.${other}),` +
      `and(user1_id.eq.${other},user2_id.eq.${me})`
    )
    .single();

  if (!match) return res.status(403).json({ error: "You are not matched with this user" });

  const { data: msg, error } = await supabaseAdmin
    .from("messages")
    .insert({ sender_id: me, receiver_id: other, content, match_id: match.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Failed to send message" });

  // Push real-time delivery to receiver (if connected via WS)
  broadcast(other, {
    type:        "message",
    id:          msg.id,
    sender_id:   me,
    receiver_id: other,
    text:        content,
    status:      "delivered",
  });

  return res.status(201).json(msg);
});

// ── PUT /api/messages/:profileId/read ────────────────────────────────────────
router.put("/:profileId/read", async (req, res) => {
  const me = req.user.id;
  const other = req.params.profileId;

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${me},user2_id.eq.${other}),` +
      `and(user1_id.eq.${other},user2_id.eq.${me})`
    )
    .maybeSingle();

  if (!match) return res.status(403).json({ error: "No match found" });

  const { error } = await supabaseAdmin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", match.id)
    .eq("receiver_id", me)
    .is("read_at", null);

  if (error) return res.status(500).json({ error: "Failed to mark as read" });
  return res.json({ ok: true });
});

export default router;