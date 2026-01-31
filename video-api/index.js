import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import videoRoutes from "./routes/videos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
app.listen(PORT, () => {
  console.log(`Video API Server running on port ${PORT}`);
  console.log(`ffmpeg path: ${process.env.FFMPEG_PATH || "default"}`);
  console.log(
    `MinIO Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  );
  console.log(`MinIO SSL: ${process.env.MINIO_USE_SSL}`);
});
