import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CRITICAL: Load .env with explicit path for PM2 compatibility
dotenv.config({ path: join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import videoRoutes from "./routes/videos.js";

const app = express();
const PORT = process.env.PORT || 4015;

// CORS Configuration
const corsOptions = {
  origin: ["http://localhost:5173", "https://lms.site.racoondevs.com"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// Routes
// Routes
// Mount at /lessons for Nginx usage (strips /api/)
app.use("/lessons", videoRoutes);
// Mount at /api/lessons for local usage (direct access)
app.use("/api/lessons", videoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const HOST = "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`Video API Server running on ${HOST}:${PORT}`);
  console.log(`ffmpeg path: ${process.env.FFMPEG_PATH || "default"}`);
  console.log(
    `MinIO Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  );
  console.log(`MinIO SSL: ${process.env.MINIO_USE_SSL}`);
});
