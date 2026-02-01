# Racoon LMS — onUserCreated

**Trigger:** `users.*.create`  
**Runtime:** Node 18+  
**SDK:** node-appwrite ^17

## Qué hace

1.  **Profiles**: Crea (o actualiza) un documento en la colección `profiles` con el mismo `$id` del usuario Auth.
2.  **User Preferences**: Crea un documento de preferencias iniciales (Default: MX).
3.  **Email Verification**: Invoca automáticamente a la función `emailVerification` para enviar el correo de bienvenida/verificación.

## Requiere env vars

| Variable                                  | Descripción                          |
| ----------------------------------------- | ------------------------------------ |
| `APPWRITE_FUNCTION_ENDPOINT`              | Endpoint de Appwrite                 |
| `APPWRITE_FUNCTION_PROJECT_ID`            | Project ID                           |
| `APPWRITE_FUNCTION_API_KEY`               | API Key (ver permisos)               |
| `APPWRITE_DATABASE_ID`                    | ID de la BD `lms`                    |
| `APPWRITE_PROFILES_COLLECTION_ID`         | Colección `profiles`                 |
| `APPWRITE_USER_PREFERENCES_COLLECTION_ID` | Colección `userPreferences`          |
| `APPWRITE_FN_EMAIL_VERIFICATION`          | ID de la función `emailVerification` |

## Permisos de API Key

- `users.read`
- `users.write` (si se llegara a necesitar actualizar el usuario auth)
- `databases.read`
- `databases.write` (para crear documentos en profiles/preferences)
- `functions.write` o `execution.write` (para invocar `emailVerification`)
