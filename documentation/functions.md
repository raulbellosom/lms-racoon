# Cloud Functions (Funciones en la Nube)

## 1. `authHandler`

**Propósito**: Manejador unificado para flujos de autenticación que requieren lógica del lado del servidor, como recuperación de contraseña y gestión de estado de usuarios.

**Disparadores (Triggers)**: `HTTP POST /auth-handler`

**Acciones (parámetro `action` en el cuerpo):**

### A) `request_recovery` (Solicitar Recuperación)

- **Entrada**: `{ "action": "request_recovery", "email": "usuario@ejemplo.com" }`
- **Lógica**:
  1. Busca el usuario por email en Appwrite Auth.
  2. Genera un token aleatorio seguro de 64 caracteres.
  3. Guarda el token en la colección `password_reset_tokens` (Auto-expira en 1h).
  4. Envía email HTML al usuario con el enlace: `https://[DOMINIO_APP]/reset-password?userId=[UID]&token=[TOKEN]`.
- **Salida**: `{ "success": true, "message": "Recovery email sent" }`

### B) `update_password` (Actualizar Contraseña)

- **Entrada**: `{ "action": "update_password", "userId": "...", "token": "...", "newPassword": "..." }`
- **Lógica**:
  1. Valida `userId` y `token` contra `password_reset_tokens`.
  2. Verifica si el token expiró o ya fue usado.
  3. Actualiza la contraseña usando la API Admin de Appwrite (`users.updatePassword`).
  4. Marca el token como `used=true` (usado).
- **Salida**: `{ "success": true }`

---

## 2. `onUserCreated`

**Propósito**: Sincroniza nuevos usuarios de Appwrite Auth hacia la colección `profiles`.

**Disparadores (Triggers)**: Evento `users.*.create` (En la consola de Appwrite)

**Lógica**:

1. Extrae `name` y `email` del payload del evento.
2. Crea un documento en `profiles` con el mismo `$id` que el usuario de auth.
3. Establece el rol por defecto (`student`) y campos iniciales como `suspended: false`.

---

## 3. `syncUserProfile`

**Propósito**: Ayudante de sincronización bidireccional. Principalmente llamado por el cliente para actualizar datos del perfil y opcionalmente sincronizar campos básicos de Auth (nombre, email, teléfono) si cambiaron.

**Disparadores (Triggers)**: `HTTP POST /sync-user-profile`

**Lógica**:

1. Autentica la petición (via contexto de Usuario Appwrite o Token de Servicio).
2. Actualiza el documento en `profiles` (permitiendo actualizaciones parciales).
3. Si información crítica (Nombre, Email, Teléfono) cambió, actualiza el usuario en Appwrite Auth via API Admin.

---

## Variables de Entorno

Ver `.env.example` en la carpeta de cada función o en la raíz para las variables requeridas.
