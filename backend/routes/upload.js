import express  from "express";
import multer   from "multer";
import path     from "path";
import { supabaseAdmin } from "../supabase.js";

const router = express.Router();

// Keep file in memory — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error("Only JPG/PNG/WEBP/GIF allowed"), ok);
  },
});

// POST /api/upload/photo
router.post("/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" });

    const ext      = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const filename = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(filename);
    return res.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Upload error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;