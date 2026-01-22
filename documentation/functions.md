# Appwrite Functions (Node 18/19, node-appwrite v17+)

## 1) Function: `onUserCreated`
**Objetivo:** Crear documento espejo en `profiles` usando **el mismo id** que el usuario de Auth.

**Trigger (Events):**
- `users.*.create`

**Runtime:**
- Node 18 (recomendado) o Node 19

**Env vars:**
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID=lms`
- `APPWRITE_PROFILES_COLLECTION_ID=profiles`

**Permisos:**
- La API Key debe tener permisos de `databases.write` (y `users.read` opcional).

---

## 2) Function: `recomputeCourseStats` (opcional)
**Objetivo:** Recalcular `courses.ratingAvg`, `ratingCount`, `studentsCount` a partir de `reviews` y `enrollments`.
**Trigger sugerido:**
- `databases.lms.collections.reviews.documents.*.create`
- `databases.lms.collections.enrollments.documents.*.create`

---

## Código listo (incluido en `/functions`) 
- `functions/onUserCreated/` (completo y deployable)

