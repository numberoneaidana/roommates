/**
 * roommate-kz  ·  Node.js / Express backend
 * Real-time matching via WebSocket  ·  Supabase (PostgreSQL) for persistence
 */

import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { supabase, supabaseAdmin } from "./supabase.js";
import { authMiddleware, optionalAuth } from "./middleware/auth.js";
import profilesRouter from "./routes/profiles.js";
import matchesRouter from "./routes/matches.js";
import messagesRouter from "./routes/messages.js";
import authRouter from "./routes/auth.js";
import uploadRouter from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
httpServer.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000", "https://roommatch-weld.vercel.app"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Add this before httpServer.listen
app.get("/", (req, res) => {
  res.json({
    message: "RoomMatch API is running",
    docs: "https://github.com/numberoneaidana/roommates.git", // optional
    version: "1.0.0"
  });
});
// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false });
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

// ── Static uploads ────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRouter);
app.use("/api/profiles", authMiddleware, profilesRouter);
app.use("/api/matches",  authMiddleware, matchesRouter);
app.use("/api/messages", authMiddleware, messagesRouter);
app.use("/api/upload",   authMiddleware, uploadRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

// Map: userId (string) → Set<WebSocket>
const clients = new Map();

function broadcast(userId, payload) {
  const sockets = clients.get(String(userId));
  if (!sockets) return;
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

// Exported so routes can trigger real-time pushes
export { broadcast, clients };

wss.on("connection", (ws, req) => {
  // Authenticate via ?token=... query param
  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");

  let userId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = String(decoded.sub ?? decoded.id);
  } catch {
    ws.close(4001, "Unauthorized");
    return;
  }

  // Register socket
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(ws);

  // Mark user online in DB (fire-and-forget)
  supabaseAdmin.from("profiles").update({ online: true, last_seen: new Date().toISOString() }).eq("id", userId).then(() => {});

  console.log(`WS connected: user=${userId}  total=${[...clients.values()].reduce((a, s) => a + s.size, 0)}`);

  let pingTimeout = null;

  const heartbeat = () => {
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(() => ws.terminate(), 35000);
  };
  heartbeat();

  ws.on("message", async (raw) => {
    heartbeat();
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    switch (data.type) {

      // ── ping/pong keepalive ──────────────────────────────────────────────
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      // ── typing indicator ─────────────────────────────────────────────────
      case "typing": {
        const receiverId = String(data.receiver_id);
        // Only forward if a real match exists
        const { data: match } = await supabaseAdmin
          .from("matches")
          .select("id")
          .or(`and(user1_id.eq.${userId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userId})`)
          .single();
        if (match) broadcast(receiverId, { type: "typing", sender_id: userId });
        break;
      }

      // ── real-time message (WebSocket fast-path) ──────────────────────────
      case "message": {
        const receiverId = String(data.receiver_id);
        const text = (data.text || "").trim().slice(0, 2000);
        if (!text) break;

        // Verify match
        const { data: match, error: matchErr } = await supabaseAdmin
          .from("matches")
          .select("id")
          .or(`and(user1_id.eq.${userId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userId})`)
          .maybeSingle();
        if (matchErr) console.error("WS match lookup error:", matchErr);
        if (!match) { console.warn(`WS: no match between ${userId} and ${receiverId}`); break; }

        // Persist
        const { data: saved, error } = await supabaseAdmin
          .from("messages")
          .insert({ sender_id: userId, receiver_id: receiverId, content: text, match_id: match.id })
          .select()
          .single();
        if (error) { console.error("WS message persist error:", error); break; }

        // Echo to sender with real DB id
        ws.send(JSON.stringify({ type: "message", id: saved.id, sender_id: userId, receiver_id: receiverId, text, status: "sent" }));

        // Deliver to receiver(s)
        broadcast(receiverId, { type: "message", id: saved.id, sender_id: userId, receiver_id: receiverId, text, status: "delivered" });
        break;
      }

      default: break;
    }
  });

  ws.on("close", () => {
    clearTimeout(pingTimeout);
    const sockets = clients.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        clients.delete(userId);
        // Mark offline
        supabaseAdmin.from("profiles").update({ online: false, last_seen: new Date().toISOString() }).eq("id", userId).then(() => {});
      }
    }
    console.log(`WS closed: user=${userId}`);
  });

  ws.on("error", (err) => {
    console.error(`WS error user=${userId}:`, err.message);
    ws.terminate();
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 roommate-kz API running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});