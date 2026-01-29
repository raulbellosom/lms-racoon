import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadVideo } from "../controllers/videoController.js";

const router = express.Router();

// Configure upload storage (temporary local storage)
const uploadDir = process.env.UPLOAD_DIR || "/opt/video-stack/uploads"; // Default to VPS path, but configurable

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.warn(`Could not create upload dir ${uploadDir}: ${e.message}`);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use lessonId as filename if available, or timestamp
    const lessonId = req.params.lessonId || Date.now().toString();
    const ext = path.extname(file.originalname);
    cb(null, `${lessonId}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5000 }, // 5GB limit
});

// Route: POST /api/lessons/:lessonId/video
router.post("/:lessonId/video", upload.single("file"), uploadVideo);

export default router;
