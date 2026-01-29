# Racoon Video API

Microservice for handling video uploads, MinIO storage, and HLS transcoding.

## Features

- **Uploads**: Receives video files from the frontend.
- **Storage**: Uploads raw video files to a MinIO (S3-compatible) `raw-videos` bucket.
- **Transcoding**: Converts videos to HLS format (.m3u8 + .ts segments) using `ffmpeg`.
- **Playback**: Returns an HLS URL for streaming.

## Installation

1.  Navigate to the directory:
    ```bash
    cd video-api
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Ensure `ffmpeg` is installed on the system:
    ```bash
    # Ubuntu/Debian
    sudo apt update
    sudo apt install ffmpeg
    ```

## Configuration (.env)

Create a `.env` file based on `.env.example`.

### Key Variables

- **PORT**: Service port (default: 3001, Production: 4015).
- **MINIO_ENDPOINT**:
  - Local Dev: `s3.racoondevs.com` (if public) or `localhost`.
  - VPS Production: `127.0.0.1` (to communicate internally with MinIO on the same server).
- **MINIO_PORT**: `9000` (Standard MinIO API port).
- **MINIO_USE_SSL**: `false` (if connecting to localhost/127.0.0.1).
- **HLS_OUTPUT_DIR**: Directory where HLS files will be saved (e.g., `/opt/video-stack/hls-data`).
- **HLS_PUBLIC_URL**: Public URL for accessing the HLS stream (e.g., `https://videos.racoondevs.com`).

## Deployment (PM2)

Use the provided scripts in `package.json`:

```bash
# Start in production mode
npm run prod

# Restart
npm run prod:restart

# Logs
npm run prod:logs
```

## API Endpoints

### `POST /lessons/:lessonId/video`

- **Body**: `FormData` with a `file` field.
- **Response**:
  ```json
  {
    "videoProvider": "minio",
    "videoObjectKey": "lessons/123/source.mp4",
    "videoHlsUrl": "https://videos.racoondevs.com/hls/lessons/123/index.m3u8",
    "durationSec": 120
  }
  ```
