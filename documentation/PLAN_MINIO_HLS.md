# PLAN: Migración de videos a MinIO + HLS (sin Appwrite Storage para videos)

## Contexto

Estamos construyendo `racoon-lms` (React + Vite) usando Appwrite para Auth/DB y Functions.  
Appwrite Storage limita el tamaño de archivo por objeto (ej. ~30MB), por lo que NO es viable para videos de cursos.

### Objetivo

- Guardar MP4 originales en MinIO (bucket `raw-videos`).
- Generar HLS (playlist `.m3u8` + segmentos `.ts/.m4s`) en el VPS y servirlo vía Nginx (dominio `videos.racoondevs.com`).
- El frontend reproducirá videos HLS usando `hls.js` (Chrome/Edge/Firefox) y HLS nativo (Safari/iOS).
- Eliminar dependencia de Appwrite bucket `lessonVideos` y eliminar campo `videoFileId` (estamos en desarrollo, sin datos importantes).

---

## Infraestructura actual (ya listo)

### MinIO

- Console: `https://minio.racoondevs.com`
- S3 API: `https://s3.racoondevs.com` (DNS only / nube gris recomendado)
- Buckets creados en MinIO:
  - `raw-videos`
  - `hls-videos` (opcional; en MVP podemos NO usarlo y servir HLS desde disco)

### Directorios en VPS

En el VPS existe:

- `/opt/video-stack/minio-data` -> persistencia de MinIO
- `/opt/video-stack/uploads` -> staging de MP4 (temporal)
- `/opt/video-stack/hls-data` -> salida HLS servida por Nginx (archivos estáticos)

---

## Arquitectura propuesta (MVP robusto)

### Flujo de subida (Teacher)

1. El Teacher crea/guarda una lección en Appwrite (para obtener `lessonId`).
2. El frontend sube el archivo MP4 a un servicio propio “Video API” (en el VPS):
   - `POST /api/lessons/:lessonId/video` (multipart: `file`)
3. Video API:
   - Guarda temporalmente el MP4 en `/opt/video-stack/uploads/<lessonId>.mp4`
   - Sube el MP4 a MinIO bucket `raw-videos` con key: `lessons/<lessonId>/source.mp4`
   - Ejecuta `ffmpeg` y genera HLS en:
     - `/opt/video-stack/hls-data/lessons/<lessonId>/index.m3u8`
     - `/opt/video-stack/hls-data/lessons/<lessonId>/*.ts` (o `.m4s`)
   - Responde con JSON:
     ```json
     {
       "videoProvider": "minio",
       "videoObjectKey": "lessons/<lessonId>/source.mp4",
       "videoHlsUrl": "https://videos.racoondevs.com/hls/lessons/<lessonId>/index.m3u8",
       "durationSec": 1234
     }
     ```
4. Frontend actualiza la lección en Appwrite con:
   - `videoProvider="minio"`
   - `videoHlsUrl=...`
   - `videoObjectKey=...`
   - `videoStatus="ready"`

### Flujo de reproducción (Student)

1. El frontend obtiene la lección (Appwrite DB).
2. Si `videoProvider === "minio"` -> usa `videoHlsUrl`
3. Reproduce con:
   - Safari/iOS: HLS nativo
   - Otros: `hls.js`

---

## Cambios en Appwrite Database (colección: lessons)

### Eliminar (dev stage)

- Eliminar el campo: `videoFileId` (ya no se usará)
- Eliminar bucket Appwrite `lessonVideos` (y su referencia en IDs/env si existe)

### Agregar campos nuevos en `lessons`

- `videoProvider` (string) default: `"minio"`
- `videoHlsUrl` (string) default: `""`
- `videoObjectKey` (string) default: `""`
- `videoStatus` (string) default: `"ready"`  
  valores sugeridos: `uploading | processing | ready | error`
- `videoDurationSec` (int) default: `0` (opcional pero útil)
- `videoError` (string) default: `""` (opcional)

> Nota: como estamos en desarrollo, podemos hacer estos cambios sin migración compleja.

---

## Cambios en el Frontend (racoon-lms)

### Archivos detectados que usan `videoFileId` actualmente

- `src/features/catalog/views/CourseDetailView.jsx`
- `src/features/teacher/components/LessonEditorModal.jsx`
- `src/features/teacher/components/LessonItem.jsx`
- `src/pages/app/student/LearnPage.jsx`
- `src/pages/app/teacher/TeacherCourseEditorPage.jsx`
- `src/shared/data/files.js` (subida a Appwrite Storage)
- `src/shared/appwrite/ids.js` (bucket `lessonVideos`)

### Objetivo de refactor

1. Remover Appwrite Storage para videos:

- `src/shared/data/files.js` dejará de subir videos de lección a Appwrite.
- Remover `APPWRITE.buckets.lessonVideos` de `src/shared/appwrite/ids.js`.

2. Implementar `VideoService` para subir a “Video API”:

- Crear archivo nuevo: `src/shared/services/videoApi.js` (o similar)
- Añadir `VITE_VIDEO_API_BASE_URL` en `.env` del frontend, ej:
  - `VITE_VIDEO_API_BASE_URL=https://api-videos.racoondevs.com` (o el dominio que se decida)
- Endpoint: `POST {BASE}/api/lessons/:lessonId/video` con `FormData`.

3. Ajustar LessonEditorModal

- Antes: subía a Appwrite y guardaba `videoFileId`
- Ahora:
  - Guardar la lección (crear/actualizar) para tener `lessonId`
  - Subir video a Video API con `lessonId`
  - Actualizar la lección con `videoHlsUrl`, `videoObjectKey`, etc.

4. Ajustar LearnPage + Player

- Cambiar lógica:
  - Si `lesson.videoProvider === "minio"` -> reproducir `lesson.videoHlsUrl`
- Implementar reproducción HLS:
  - Instalar `hls.js` y crear/actualizar componente player para soportar `.m3u8`

---

## Video API (nuevo servicio en el VPS)

### Requisitos mínimos

- Node.js + Express
- Multer (upload multipart)
- `minio` SDK (S3 compatible)
- `ffmpeg` instalado en el host o dentro del contenedor del servicio

### Endpoints propuestos

- `POST /api/lessons/:lessonId/video`
  - auth opcional en MVP (por ahora), pero ideal:
    - token de Appwrite o JWT propio
- `GET /health`

### Salida HLS

- Archivos físicos en:
  - `/opt/video-stack/hls-data/lessons/<lessonId>/index.m3u8`
- URL pública:
  - `https://videos.racoondevs.com/hls/lessons/<lessonId>/index.m3u8`

---

## Nginx (host) para HLS

Crear vhost en `/etc/nginx/sites-available/videos.racoondevs.com.conf`:

- Sirve `/hls/` desde `alias /opt/video-stack/hls-data/`
- Headers:
  - `Content-Type` para `.m3u8` y `.ts`
  - `Accept-Ranges`
  - CORS (inicialmente `*`, luego restringir al dominio del LMS)
- Cache:
  - segmentos cacheables (7 días)
  - playlist sin cache

Certbot por webroot.

---

## Seguridad (fase 2, no bloquear MVP)

En MVP el HLS podría ser público (URL accesible).  
Para producción se recomienda:

- Token de acceso o `auth_request` de Nginx contra un endpoint que valide sesión/compra.
- URLs firmadas con expiración.

---

## Checklist de aceptación

- [ ] Teacher crea lección y sube video MP4 grande (>30MB) sin Appwrite Storage.
- [ ] Video se procesa y se genera `index.m3u8` + segmentos.
- [ ] `https://videos.racoondevs.com/hls/lessons/<lessonId>/index.m3u8` responde 200.
- [ ] Student reproduce en Chrome (hls.js) y en iOS Safari (nativo).
- [ ] Ya no existe bucket `lessonVideos` en Appwrite.
- [ ] Ya no existe `videoFileId` en lessons.
- [ ] UI/CRUD no rompe: CourseDetail, LessonItem, LearnPage, Teacher editor.
