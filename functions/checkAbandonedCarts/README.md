# Check Abandoned Carts Function

Esta Appwrite Function se encarga de identificar carritos abandonados y notificar a los usuarios para recuperar la venta.

## Descripción

La función busca en la colección `cart` items que hayan sido añadidos hace 30 días (ventana de 30 a 31 días) y crea una notificación de sistema para el usuario recordándole su carrito pendiente.

## Trigger (Disparador)

Esta función debe programarse mediante **CRON** para ejecutarse diariamente.

**Schedule expression:** `0 10 * * *` (Todos los días a las 10:00 AM)

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

- `APPWRITE_ENDPOINT`: Endpoint de tu servidor Appwrite.
- `APPWRITE_PROJECT_ID`: ID del proyecto.
- `APPWRITE_API_KEY`: API Key con permisos de lectura/escritura en Database.
- `APPWRITE_DATABASE_ID`: ID de la base de datos (ej: `lms`).
- `APPWRITE_CART_COLLECTION_ID`: ID de la colección de carritos (ej: `cart`).
- `APPWRITE_NOTIFICATIONS_COLLECTION_ID`: ID de la colección de notificaciones (ej: `notifications`).

## Scopes Requeridos (API Key)

- `documents.read`
- `documents.write`

## Lógica Interna

1. Calcula el rango de fechas: `now - 31 days` hasta `now - 30 days`.
2. Busca documentos en la colección `cart` creados (`addedAt`) en ese rango.
3. Agrupa los items por `userId`.
4. Crea una notificación en la colección `notifications` para cada usuario encontrado.
