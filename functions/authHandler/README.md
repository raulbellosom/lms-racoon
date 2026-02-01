# authHandler Function

## Descripción

Función serverless unificada para gestionar autenticación y administración de usuarios en Racoon LMS. Maneja tres acciones principales:

1. **`request_recovery`** - Genera token de recuperación y envía email
2. **`update_password`** - Valida token y actualiza contraseña
3. **`create_user`** - Crea nuevos usuarios (Admin)

## Configuración en Appwrite

### 1. Crear la Función

1. Ve a **Functions** en tu proyecto Appwrite
2. Crea una nueva función con:
   - **Name**: `authHandler`
   - **Runtime**: Node.js 18+
   - **Execute Access**: `Any` (para permitir llamadas públicas de recuperación)

### 2. Variables de Entorno

Configura las siguientes variables en la función:

```bash
# Appwrite (auto-inyectadas por Appwrite Functions)
APPWRITE_FUNCTION_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=tu-project-id
APPWRITE_FUNCTION_API_KEY=tu-api-key-con-permisos

# Base de Datos
APPWRITE_DATABASE_ID=lms
APPWRITE_PASSWORD_RESET_TOKENS_COLLECTION_ID=password_reset_tokens

# SMTP (Gmail ejemplo)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=tu-email@gmail.com
EMAIL_SMTP_PASS=tu-app-password
EMAIL_FROM_NAME=Racoon LMS
EMAIL_FROM_ADDRESS=noreply@racoonlms.com

# Frontend
APP_BASE_URL=https://tu-dominio.com
```

### 3. Permisos de API Key

La API Key debe tener los siguientes scopes:

- `users.read`
- `users.write` (para crear usuarios y actualizar contraseñas)
- `documents.read`
- `documents.write` (para tokens de reset)

### 4. Dependencias

```json
{
  "node-appwrite": "^17.0.0",
  "nodemailer": "^6.9.0"
}
```

## Uso

### 1. Request Recovery (Recuperar Contraseña)

**Payload:**

```json
{
  "action": "request_recovery",
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Recovery email sent"
}
```

**Flujo:**

1. Busca usuario por email
2. Genera token aleatorio (64 chars hex)
3. Guarda token en `password_reset_tokens` con expiración de 1 hora
4. Envía email con link de reset

### 2. Update Password (Actualizar Contraseña)

**Payload:**

```json
{
  "action": "update_password",
  "userId": "697300b9001aedccd654",
  "token": "abc123...",
  "newPassword": "nuevaContraseña123"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Password updated"
}
```

**Validaciones:**

- Token válido y no usado
- Token no expirado
- Contraseña mínimo 8 caracteres

### 3. Create User (Crear Usuario - Admin)

**Payload:**

```json
{
  "action": "create_user",
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "name": "Juan Pérez",
  "phone": "+523221234567"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "userId": "69730...",
  "user": { ... }
}
```

**Nota:** Después de crear el usuario, el trigger `onUserCreated` automáticamente crea el perfil en la colección `profiles`.

## Colecciones Requeridas

### password_reset_tokens

| Atributo | Tipo     | Requerido | Descripción           |
| -------- | -------- | --------- | --------------------- |
| userId   | string   | Sí        | ID del usuario        |
| token    | string   | Sí        | Token de recuperación |
| email    | string   | Sí        | Email del usuario     |
| expireAt | datetime | Sí        | Fecha de expiración   |
| used     | boolean  | Sí        | Si ya fue usado       |

**Permisos:**

- Create: `Any` (la función lo crea)
- Read: `Any` (la función lo lee)
- Update: `Any` (la función lo actualiza)

## Configuración SMTP (Gmail)

1. Habilita verificación en 2 pasos en tu cuenta Google
2. Ve a [App Passwords](https://myaccount.google.com/apppasswords)
3. Genera una contraseña de aplicación
4. Usa esa contraseña en `EMAIL_SMTP_PASS`

## Troubleshooting

### Error: "Server misconfigured"

- Verifica que todas las variables de entorno estén configuradas
- Revisa que la API Key tenga los permisos correctos

### Error: "Invalid or used token"

- El token ya fue usado o no existe
- Verifica que el token no haya expirado (1 hora)

### Email no se envía

- Verifica credenciales SMTP
- Revisa logs de la función en Appwrite
- Asegúrate que `EMAIL_SMTP_SECURE` sea `false` para puerto 587

## Desarrollo Local

1. Copia `.env.example` a `.env`
2. Configura las variables
3. Instala dependencias: `npm install`
4. Ejecuta: `npm start` (si tienes script configurado)

## Seguridad

- Los tokens expiran en 1 hora
- Los tokens son de un solo uso
- Las contraseñas deben tener mínimo 8 caracteres
- La función valida formato de email antes de procesar
