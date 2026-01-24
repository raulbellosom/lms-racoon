# Función: send-password-reset

Función de Appwrite para enviar emails personalizados de restablecimiento de contraseña.

**IMPORTANTE**: Esta función usa una base de datos temporal para tokens de recuperación seguros que expiran en 1 hora.

## 📋 REQUISITOS PREVIOS

### 1. Crear Colección de Tokens en Appwrite

Debes crear una colección llamada `password_reset_tokens` con los siguientes atributos:

| Atributo | Tipo     | Tamaño | Requerido | Default |
| -------- | -------- | ------ | --------- | ------- |
| userId   | String   | 255    | ✅        | -       |
| token    | String   | 255    | ✅        | -       |
| email    | String   | 255    | ✅        | -       |
| expireAt | DateTime | -      | ✅        | -       |
| used     | Boolean  | -      | ✅        | false   |

**Permisos de la colección:**

- Crear: `users` (cualquier usuario autenticado)
- Leer: `users` (cualquier usuario autenticado)
- Actualizar: `users` (cualquier usuario autenticado)
- Eliminar: No necesario

**Índices (para mejor rendimiento):**

- `userId_idx`: userId (ASC)
- `token_idx`: token (ASC)
- `used_idx`: used (ASC)

## 📦 Dependencias

```json
{
  "node-appwrite": "^13.0.0",
  "nodemailer": "^6.9.7"
}
```

## 🔐 Variables de Entorno Requeridas

| Variable                              | Descripción                           | Ejemplo                              |
| ------------------------------------- | ------------------------------------- | ------------------------------------ |
| `APPWRITE_FUNCTION_ENDPOINT`          | URL del servidor Appwrite             | `https://appwrite.racoondevs.com/v1` |
| `APPWRITE_FUNCTION_PROJECT_ID`        | ID del proyecto                       | `mining-vouchers-system`             |
| `APPWRITE_FUNCTION_API_KEY`           | API Key con permisos users + database | `d1_xxxxx...`                        |
| `EMAIL_USER`                          | Cuenta de Gmail                       | `tu-correo@gmail.com`                |
| `EMAIL_PASSWORD`                      | App Password de Gmail (16 chars)      | `abcd efgh ijkl mnop`                |
| `APP_URL`                             | URL de la aplicación                  | `https://ore.site.racoondevs.com`    |
| `APPWRITE_DATABASE_ID`                | ID de la base de datos                | `mining-db`                          |
| `APPWRITE_RESET_TOKENS_COLLECTION_ID` | ID de colección password_reset_tokens | `password_reset_tokens`              |

## 📥 Payload de Entrada

```json
{
  "email": "usuario@ejemplo.com",
  "adminName": "Juan Admin" // Opcional
}
```

## 📤 Respuesta

**Éxito (200)**:

```json
{
  "success": true,
  "message": "Email de restablecimiento enviado a usuario@ejemplo.com",
  "resetUrl": "https://ore.site.racoondevs.com/reset-password?userId=xxx&secret=yyy"
}
```

**Error (4xx/5xx)**:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## 🚀 Uso desde el Cliente

```javascript
import { functions } from "@/lib/appwrite";

const response = await functions.createExecution(
  "send-password-reset",
  JSON.stringify({
    email: "usuario@ejemplo.com",
    adminName: "Juan Admin",
  }),
  false // async = false
);

if (response.status === "completed") {
  console.log("Email enviado exitosamente");
}
```

## 🎨 Características del Email

- 📧 Diseño HTML profesional con gradientes
- 🎨 Colores morados/azules (#667eea, #764ba2)
- 📱 Responsive (móvil y escritorio)
- 🔒 Información de seguridad y expiración
- ✨ Botón CTA destacado
- 📋 URL alternativa en texto plano

## 📝 Instalación

```bash
cd functions/send-password-reset
npm install
```

## 🧪 Testing Local

```bash
# Configurar variables de entorno en .env
cp .env.example .env

# Ejecutar la función localmente
node src/main.js
```

## 📊 Logs

La función genera logs detallados:

- ✅ Usuario encontrado
- ✅ Token generado
- ✅ Email enviado
- ❌ Errores y stack traces

## 🔧 Troubleshooting

Ver [PASSWORD_RESET_GUIDE.md](../../PASSWORD_RESET_GUIDE.md#-solución-de-problemas)

## 📄 Licencia

MIT - RacoonDevs
