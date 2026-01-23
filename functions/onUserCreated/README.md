# Racoon LMS — onUserCreated

**Trigger:** `users.*.create`  
**Runtime:** Node 18  
**SDK:** node-appwrite ^17

## Qué hace
- Crea (o actualiza) `profiles/{userId}` usando el mismo `$id` del usuario Auth.
- Genera `firstName`/`lastName` a partir del `name` del Auth user.

## Requiere env vars
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PROFILES_COLLECTION_ID`
