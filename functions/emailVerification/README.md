# Email Verification Function

Esta función maneja todo el flujo de verificación de correo electrónico: enviar correo, verificar token, y reenviar correo.

## Overview

**Runtime**: Node.js 18.0+ / 20.0+
**Trigger**: HTTP (Invocada por `onUserCreated` o por el Frontend /users/verification)

## Permissions & Scopes

Esta función requiere una **API Key** con los siguientes scopes:

- `documents.read`
- `documents.write` (Para crear tokens y actualizar profiles)

## Environment Variables

| Variable                                     | Descripción                      | Ejemplo / Default       |
| -------------------------------------------- | -------------------------------- | ----------------------- |
| `APPWRITE_FUNCTION_PROJECT_ID`               | ID del proyecto (System)         |                         |
| `APPWRITE_API_KEY`                           | API Key con permisos de BD       |                         |
| `APPWRITE_DATABASE_ID`                       | ID de la base de datos           | `lms`                   |
| `APPWRITE_PROFILES_COLLECTION_ID`            | ID colección profiles            | `profiles`              |
| `APPWRITE_EMAIL_VERIFICATIONS_COLLECTION_ID` | ID colección email_verifications | `email_verifications`   |
| `APP_BASE_URL`                               | URL base del frontend para links | `http://localhost:5173` |
| `EMAIL_SMTP_HOST`                            | Host del servidor SMTP           |                         |
| `EMAIL_SMTP_PORT`                            | Puerto SMTP                      | `587`                   |
| `EMAIL_SMTP_USER`                            | Usuario SMTP                     |                         |
| `EMAIL_SMTP_PASS`                            | Contraseña SMTP                  |                         |
| `EMAIL_FROM_ADDRESS`                         | Remitente                        | `no-reply@...`          |

## Actions

La función responde a un JSON body con la propiedad `action`:

### 1. `send`

Genera un token y envía un correo de verificación.

- **Body**: `{ "action": "send", "userAuthId": "...", "email": "..." }`

### 2. `verify`

Valida un token y marca el email como verificado en `profiles`.

- **Body**: `{ "action": "verify", "token": "..." }`

### 3. `resend`

Invalida tokens anteriores y envía uno nuevo.

- **Body**: `{ "action": "resend", "email": "..." }`
