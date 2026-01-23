# Racoon LMS — syncUserProfile

**Tipo:** HTTP Function (invocada desde frontend)  
**Runtime:** Node 18  
**SDK:** node-appwrite ^17

## Qué hace
- Actualiza `profiles/{userId}` (firstName, lastName, etc.)
- Sincroniza `users.updateName(userId, fullName)` en Auth

## Seguridad
- Si se invoca desde el frontend con sesión, Appwrite inyecta `APPWRITE_FUNCTION_USER_ID`.
- Si no hay sesión, puedes habilitar llamadas de servicio con `SYNC_PROFILE_SERVICE_SECRET`.
