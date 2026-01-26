# Plan de Trabajo: Base de Datos V2 y Nuevas Features

Este documento detalla los ajustes a la base de datos y la implementación de nuevas funcionalidades para Racoon LMS.

## 1. User Preferences (`userPreferences`)

Necesitamos una estructura flexible para preferencias pero tipada para lo esencial.

**Estrategia:**
Crear una colección `userPreferences` linked al `userId` (1:1).

- Columnas fijas para lo crítico: `language`, `theme`.
- Columna `prefsJson` (string) para preferencias dinámicas/futuras (notificaciones específicas, layout, etc) sin tener que alterar el schema constantemente.

**Schema:**

- `userId`: string (unique)
- `language`: string (default "es")
- `theme`: enum (light, dark, system)
- `prefsJson`: string (JSON) — Ejemplo: `{"email_offers": true, "whatsapp_notifs": false, "volume": 80}`

## 2. Notificaciones (`notifications`)

Sistema centralizado de notificaciones internas y preparación para Push (FCM).

**Schema:**

- `userId`: string (Destinatario)
- `type`: enum (`system`, `sale`, `review`, `assignment`, `course_update`)
- `title`: string
- `body`: string
- `dataJson`: string (JSON con `link`, `actionId`, etc.)
- `read`: boolean (default `false`)
- `readedAt`: datetime (nullable)

**Implementación FCM (Push Notifications):**
Para notificaciones Push en PWA (Android/iOS) y Web:

1.  **Configuración Firebase:**
    - Crear proyecto en Firebase Console.
    - Obtener `FCM Server Key` (Legacy) o configurar Service Account para HTTP v1 API.
    - Habilitar "Cloud Messaging".

2.  **Configuración Frontend (PWA):**
    - Añadir `firebase` SDK.
    - Crear `public/firebase-messaging-sw.js` (Service Worker para background messages).
    - Solicitar permiso: `Notification.requestPermission()`.
    - Obtener Token FCM: `getToken(messaging, { vapidKey: '...' })`.
    - Guardar este token en la colección `userPreferences` (o `userPushTokens` si queremos múltiples dispositivos, ej: array de tokens en `prefsJson` o colección aparte. Recomendación: Array en `prefsJson` o colección simple `pushTokens`).

3.  **Backend (Appwrite Functions):**
    - Cuando ocurre un evento (ej: `onPurchase`, `onReview`), la Appwrite Function debe:
      - Crear el documento en colección `notifications`.
      - Buscar los FCM Tokens del usuario.
      - Enviar la request a FCM API para disparar la push al dispositivo.

## 3. Carrito de Compras (`cart`)

Reparación y sincronización.
Actualmente el carrito es local. Pasaremos a un modelo Híbrido:

- **Guest:** `localStorage`.
- **Auth:** Colección `cart` en DB.
- **Login:** Merge de `localStorage` -> DB.

**Schema `cart` (Items):**

- `userId`: string
- `courseId`: string
- _Constraint:_ Unique(`userId`, `courseId`)
- `addedAt`: datetime

**Estrategia de Alertas (Abandoned Cart):**

- Crear una Appwrite Function programada (CRON) que busque items en `cart` con `addedAt > 30 days`.
- Enviar email/notificación al usuario con cupón.

## 4. Cupones y Descuentos (`coupons`)

Sistema de descuentos flexible.

**Schema `coupons`:**

- `code`: string (unique, uppercase)
- `type`: enum (`percent`, `fixed`)
- `value`: float (ej: 20 para 20%, o 100 para $100)
- `courseId`: string (nullable, si es específico para un curso)
- `maxUses`: integer (nullable, límite global)
- `usedCount`: integer (default 0)
- `expiresAt`: datetime (nullable)
- `enabled`: boolean

**Schema `couponRedemptions`:** (Para evitar que un usuario use el mismo cupón 2 veces si es de 1 solo uso por persona)

- `couponId`: string
- `userId`: string
- `redeemedAt`: datetime

## 5. Cortesías y Contenido Gratuito (`freeContent`)

Permitir que ciertas lecciones sean públicas para usuarios registrados (Free Preview).

**Cambio en Schema Existente:**

- Colección **`lessons`**: Agregar atributo `isFreePreview` (boolean, default false).
- **Lógica:** En el backend/reglas de acceso, si `lesson.isFreePreview == true`, permitir lectura a usuarios Auth (incluso si no tienen Enrollment activo).

---

## Tareas inmediatas

- [ ] Actualizar Schema en Appwrite (ver `appwrite_db_racoon_lms.md`).
- [ ] Actualizar `.env`.
- [ ] Fix `CartContext`: Implementar lógica de Sync.
- [ ] Crear Hooks UI para Preferences y Notifications.
