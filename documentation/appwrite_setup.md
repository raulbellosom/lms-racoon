# Appwrite Setup (1.8.2 RC2)

## 1) Database

- Crear database: **lms**
- Crear collections según `appwrite_db_racoon_lms.md`

## 2) Storage buckets (recomendado)

- `courseCovers`
- `lessonVideos`
- `lessonAttachments`
- `avatars`

Regla general:

- Lectura pública solo si el curso está publicado.
- Si no, lectura para `users` autenticados o dueño (teacherId).

## 3) Permisos (modelo recomendado)

Para simplificar, una estrategia robusta es:

- Documents creados por el maestro: `read` para `role:teacher` (o por `userId`) y `update/delete` para el creador.
- Courses publicados: `read` para `any` (público) y `update/delete` para el creador.
- Enrollment/progress: `read/update` solo para `userId` propietario.

En Appwrite, esto se controla en permisos del documento al crearlo (o con reglas en Functions).

## 4) Function triggers

- `onUserCreated`: evento `users.*.create` para crear profile espejo con el mismo `$id`.
