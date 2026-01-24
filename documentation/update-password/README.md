# Update Password Function

Función de Appwrite que actualiza la contraseña de un usuario usando un token personalizado de restablecimiento.

## Propósito

Esta función permite actualizar la contraseña de un usuario sin que esté autenticado, validando un token temporal almacenado en la base de datos.

## Configuración

### 1. Habilitar "Execute with Admin API Key"

**MUY IMPORTANTE:** En Appwrite Console → Functions → update-password → Settings:
- ✓ Marca la casilla **"Execute with Admin API Key"**
- Esto inyecta automáticamente las variables:
  - `APPWRITE_FUNCTION_API_KEY`
  - `APPWRITE_FUNCTION_PROJECT_ID`
  - `APPWRITE_FUNCTION_ENDPOINT`

### 2. Variables de Entorno Manuales

Configurar en **Appwrite Console → Functions → update-password → Settings → Variables**:

```
APPWRITE_DATABASE_ID=69656c600033c74e291c
APPWRITE_RESET_TOKENS_COLLECTION_ID=6966ed7c0023f0c3bd6f
```

**NO configurar manualmente:** Las variables `APPWRITE_FUNCTION_*` se inyectan automáticamente.

### 3. Trigger

- **Tipo:** HTTP
- **Path:** `/update-password`
- **Método:** POST

## Uso desde Frontend

```typescript
const response = await fetch(
  "https://appwrite.racoondevs.com/v1/functions/UPDATE_PASSWORD_FUNCTION_ID/executions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": "PROJECT_ID",
    },
    body: JSON.stringify({
      userId: "user_id_here",
      token: "reset_token_here",
      newPassword: "new_password_here",
    }),
  }
);

const result = await response.json();
```

## Request Body

```json
{
  "userId": "6966a88200274fc1f0d5",
  "token": "8d15b4e52171bc36d5f45243fc097a48b0eb40595034f5b2c20518e862c9e96a",
  "newPassword": "NuevaContraseña123"
}
```

## Response

### Éxito (200)

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### Error (400/401/500)

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Seguridad

- ✅ Valida que el token no haya sido usado
- ✅ Verifica que el token no haya expirado
- ✅ Requiere contraseña mínima de 8 caracteres
- ✅ Marca el token como usado después de actualizar
- ✅ Usa API de Admin para bypass de autenticación

## Flujo

1. Usuario recibe email con enlace que contiene `userId` y `token`
2. Frontend valida el token (consulta a DB)
3. Usuario ingresa nueva contraseña
4. Frontend llama a esta función con `userId`, `token` y `newPassword`
5. Función valida el token y actualiza la contraseña usando API de Admin
6. Token se marca como usado
7. Usuario puede iniciar sesión con la nueva contraseña
