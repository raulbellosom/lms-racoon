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
import * as minioService from "./services/minioService.js";

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
// Debug logging for all requests
app.use((req, res, next) => {
  console.log(`[Global] Request Received: ${req.method} ${req.url}`);
  next();
});

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
const startServer = async () => {
  try {
    // Ensure MinIO buckets exist
    await minioService.ensureBuckets();

    const HOST = "127.0.0.1";
    const server = app.listen(PORT, HOST, () => {
      console.log(`Video API running on ${HOST}:${PORT}`);
    });

    // Increase timeout for large uploads (e.g. 10GB upload on slow connection)
    // Default is 2 minutes (120000). Set to 30 minutes.
    server.timeout = 30 * 60 * 1000;
    server.keepAliveTimeout = 30 * 60 * 1000;
    server.headersTimeout = 31 * 60 * 1000; // Must be > keepAliveTimeout
  } catch (error) {
    console.error("Failed to start Video API:", error);
    process.exit(1);
  }
};

startServer();
