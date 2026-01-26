# Guía de Configuración FCM (Firebase Cloud Messaging)

Sigue estos pasos para completar la integración de notificaciones Push.

## 1. Frontend (.env)

En tu archivo `.env` (o `.env.local`), añade las siguientes variables con los datos de tu proyecto Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
VITE_FIREBASE_VAPID_KEY=tu_web_push_certificate_key_publica
```

_Nota: `VITE_FIREBASE_VAPID_KEY` se obtiene en Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration -> Generate Key Pair. **Debes usar la "Key pair" (la que empieza por `B...`), NO la Private Key.\***_

## 2. Service Worker (public/firebase-messaging-sw.js)

Edita el archivo `public/firebase-messaging-sw.js` y Pega tu configuración **hardcoded** (directamente en el código), ya que los Service Workers no leen el `.env` fácilmente.

## 3. Backend (Appwrite Functions)

Para que las funciones envíen notificaciones, necesitas configurar variables de entorno en la **Appwrite Console** para cada función (`onEnrollmentCreated` y `onReviewCreated`):

### Variables Requeridas:

1.  **`FIREBASE_SERVICE_ACCOUNT_JSON`**:
    - Ve a Firebase Console -> Project Settings -> Service accounts.
    - Genera una nueva "Private Key". Se descargará un archivo JSON.
    - Abre ese JSON, copia **todo su contenido** (como texto) y pégalo como valor de esta variable.

2.  **IDs de Colecciones (Opcional, si son diferentes a los defaults):**
    - `APPWRITE_DATABASE_ID`: ID de tu base de datos (por defecto: `lms`).
    - `APPWRITE_COURSES_COLLECTION_ID`: ID de la colección Courses (por defecto: `courses`).
    - `APPWRITE_NOTIFICATIONS_COLLECTION_ID`: ID de la colección Notifications (por defecto: `notifications`).
    - `APPWRITE_USER_PREFS_COLLECTION_ID`: ID de la colección UserPreferences (por defecto: `userPreferences`).

## 4. Colección de Notificaciones

Asegúrate de tener una colección llamada `notifications` en tu base de datos con los siguientes atributos:

- `userId` (String): El ID del usuario que recibe la notificación.
- `title` (String)
- `body` (String)
- `read` (Boolean): Default `false`.
- `type` (String): Para categorizar (ej: "enrollment", "review").
- `entityId` (String): ID del objeto relacionado (ej: courseId).
- `createdAt` (Datetime)

## Resumen del Flujo:

1.  El usuario entra a la app, se le pide permiso y se guarda su Token FCM en `userPreferences` (campo `prefsJson` -> `fcmTokens`).
2.  Cuando ocurre un evento (Inscripción/Reseña), la Appwrite Function se dispara.
3.  La función busca al dueño del curso, obtiene sus tokens de `userPreferences` y envía la Push Notification usando `firebase-admin`.
