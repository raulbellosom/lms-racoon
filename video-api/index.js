import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import videoRoutes from "./routes/videos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/lessons", videoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Video API Server running on port ${PORT}`);
  console.log(`ffmpeg path: ${process.env.FFMPEG_PATH || "default"}`);
});
