const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const videoRoutes = require("./routes/videos");

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
