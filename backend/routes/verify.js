import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabase, supabaseAdmin } from "../supabase.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, "../uploads/verifications");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Only accept image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * POST /api/verify/upload
 * Upload identity document for verification
 * - Saves file to local storage (can be migrated to S3/GCS)
 * - Updates profile verification_status to 'pending'
 * - Returns document URL
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const userId = req.user.id;
    const fileUrl = `/uploads/verifications/${req.file.filename}`;

    // Update profile in Supabase
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        verification_status: "pending",
        id_document_url: fileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, verification_status, id_document_url")
      .single();

    if (error) {
      // Clean up uploaded file if DB update fails
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: `Database update failed: ${error.message}` });
    }

    res.json({
      success: true,
      message: "Document uploaded successfully",
      url: fileUrl,
      status: "pending",
      profile: data,
    });
  } catch (err) {
    // Clean up file on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("Verification upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

/**
 * GET /api/verify/pending
 * Admin endpoint: Get all profiles pending verification
 * Only accessible to admin users
 */
router.get("/pending", async (req, res) => {
  try {
    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", req.user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Get all pending verifications
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      count: data?.length || 0,
      profiles: data || [],
    });
  } catch (err) {
    console.error("Get pending verifications error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/verify/:profileId
 * Admin endpoint: Approve or reject verification
 * Only accessible to admin users
 */
router.patch("/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;
    const { verification_status, rejection_reason } = req.body;

    if (!["approved", "rejected"].includes(verification_status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", req.user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Update profile verification status
    const updateData = {
      verification_status,
      updated_at: new Date().toISOString(),
    };

    if (verification_status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", profileId)
      .select("id, verification_status, rejection_reason, id_document_url")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      message: `Profile ${verification_status}`,
      profile: data,
    });
  } catch (err) {
    console.error("Verification decision error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
