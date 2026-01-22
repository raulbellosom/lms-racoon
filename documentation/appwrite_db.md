# Appwrite DB — Racoon LMS (sin Relationship attributes)

**Appwrite:** 1.8.2 RC2  
**Convención:** camelCase en collections y atributos  
**Relaciones:** por _foreign keys_ (strings) — **NO** usar atributo `relationship`

> Nota Appwrite (importante): **No combinar `required` + `default`** en el mismo atributo.
>
> - Si tiene `default`, déjalo `required=false`.
> - Si es `required=true`, no pongas default.

---

## Database

- **databaseId:** `lms`

---

## IDs por .env

La app está preparada para que los IDs sean configurables por `.env`:

- `VITE_APPWRITE_DATABASE_ID`
- `VITE_APPWRITE_COL_*`
- `VITE_APPWRITE_BUCKET_*`
- `VITE_APPWRITE_FN_*`

---

# Collections

## 1) `profiles`

**DocId = Auth userId** (espejo del usuario)

| Attribute    | Type         | Required | Default | Constraints  | Notes             |
| ------------ | ------------ | -------: | ------- | ------------ | ----------------- | ------ | --------------------- |
| displayName  | string       |       ✅ | —       | min=2 max=80 | nombre público    |
| role         | enum(string) |       ✅ | —       | `student     | teacher           | admin` | control UI y permisos |
| avatarFileId | string       |       ❌ | ""      | max=36       | Storage `avatars` |
| bio          | string       |       ❌ | ""      | max=500      |                   |
| phone        | string       |       ❌ | ""      | max=20       |                   |
| country      | string       |       ❌ | "MX"    | max=2        | ISO-2             |
| createdAt    | datetime     |       ❌ | —       |              | ISO               |
| updatedAt    | datetime     |       ❌ | —       |              | ISO               |
| enabled      | boolean      |       ❌ | true    |              | borrado lógico    |

**Indexes**

- `idx_role_asc` — key — `role` (asc)
- `idx_name_search` — fulltext — `displayName`

---

## 2) `categories`

| Attribute | Type     | Required | Default | Constraints  | Notes  |
| --------- | -------- | -------: | ------- | ------------ | ------ |
| name      | string   |       ✅ | —       | min=2 max=48 |        |
| slug      | string   |       ✅ | —       | min=2 max=48 | unique |
| createdAt | datetime |       ❌ | —       |              |        |
| enabled   | boolean  |       ❌ | true    |              |        |

**Indexes**

- `uniq_slug` — unique — `slug`
- `idx_name_search` — fulltext — `name`

---

## 3) `courses`

| Attribute        | Type         | Required | Default | Constraints         | Notes                  |
| ---------------- | ------------ | -------: | ------- | ------------------- | ---------------------- | --------- | --- |
| title            | string       |       ✅ | —       | min=4 max=120       |                        |
| subtitle         | string       |       ❌ | ""      | max=180             |                        |
| description      | string       |       ❌ | ""      | max=8000            | markdown/plain         |
| categoryId       | string       |       ✅ | —       | max=36              | FK -> categories.$id   |
| teacherId        | string       |       ✅ | —       | max=36              | FK -> profiles.$id     |
| teacherName      | string       |       ❌ | ""      | max=80              | cache UI               |
| language         | string       |       ❌ | "es"    | max=6               | es, en-US, etc         |
| level            | enum(string) |       ✅ | —       | `beginner           | intermediate           | advanced` |     |
| coverFileId      | string       |       ❌ | ""      | max=36              | Storage `courseCovers` |
| promoVideoFileId | string       |       ❌ | ""      | max=36              | opcional               |
| priceCents       | integer      |       ❌ | 0       | min=0 max=200000000 |                        |
| currency         | string       |       ❌ | "MXN"   | max=3               |                        |
| isPublished      | boolean      |       ❌ | false   |                     |                        |
| publishedAt      | datetime     |       ❌ | —       |                     |                        |
| createdAt        | datetime     |       ❌ | —       |                     |                        |
| updatedAt        | datetime     |       ❌ | —       |                     |                        |
| enabled          | boolean      |       ❌ | true    |                     |                        |

**Indexes**

- `idx_publishedAt_desc` — key — `publishedAt` (desc)
- `idx_isPublished_asc` — key — `isPublished` (asc)
- `idx_title_search` — fulltext — `title`
- `idx_teacherId_asc` — key — `teacherId` (asc)
- `idx_categoryId_asc` — key — `categoryId` (asc)

---

## 4) `courseSections`

| Attribute | Type     | Required | Default | Constraints     | Notes             |
| --------- | -------- | -------: | ------- | --------------- | ----------------- |
| courseId  | string   |       ✅ | —       | max=36          | FK -> courses.$id |
| title     | string   |       ✅ | —       | min=2 max=120   |                   |
| order     | integer  |       ✅ | —       | min=0 max=10000 |                   |
| createdAt | datetime |       ❌ | —       |                 |                   |
| enabled   | boolean  |       ❌ | true    |                 |                   |

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)

---

## 5) `lessons`

| Attribute       | Type         | Required | Default | Constraints      | Notes                      |
| --------------- | ------------ | -------: | ------- | ---------------- | -------------------------- | ---- | ----------- | --- |
| courseId        | string       |       ✅ | —       | max=36           | FK -> courses.$id          |
| sectionId       | string       |       ✅ | —       | max=36           | FK -> courseSections.$id   |
| title           | string       |       ✅ | —       | min=2 max=140    |                            |
| description     | string       |       ❌ | ""      | max=8000         |                            |
| kind            | enum(string) |       ✅ | —       | `video           | article                    | quiz | assignment` |     |
| order           | integer      |       ✅ | —       | min=0 max=100000 |                            |
| durationSec     | integer      |       ❌ | 0       | min=0 max=86400  |                            |
| videoFileId     | string       |       ❌ | ""      | max=36           | bucket `lessonVideos`      |
| attachmentsJson | string       |       ❌ | "[]"    | max=8000         | lista de fileIds/metadatos |
| createdAt       | datetime     |       ❌ | —       |                  |                            |
| updatedAt       | datetime     |       ❌ | —       |                  |                            |
| enabled         | boolean      |       ❌ | true    |                  |                            |

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_sectionId_order_asc` — key — `sectionId` (asc), `order` (asc)

---

## 6) `lessonTimestamps`

Capítulos del video (para “saltos” y mini índice).

| Attribute | Type    | Required | Default | Constraints      | Notes                                    |
| --------- | ------- | -------: | ------- | ---------------- | ---------------------------------------- |
| lessonId  | string  |       ✅ | —       | max=36           | FK -> lessons.$id                        |
| courseId  | string  |       ✅ | —       | max=36           | FK -> courses.$id (para queries rápidas) |
| title     | string  |       ✅ | —       | min=2 max=120    |                                          |
| atSec     | integer |       ✅ | —       | min=0 max=86400  | segundo del video                        |
| order     | integer |       ✅ | —       | min=0 max=100000 |                                          |
| enabled   | boolean |       ❌ | true    |                  |                                          |

**Indexes**

- `idx_lessonId_order_asc` — key — `lessonId` (asc), `order` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)

---

## 7) `enrollments`

| Attribute   | Type         | Required | Default | Constraints         | Notes              |
| ----------- | ------------ | -------: | ------- | ------------------- | ------------------ | --------- | ---------- | --- |
| userId      | string       |       ✅ | —       | max=36              | FK -> profiles.$id |
| courseId    | string       |       ✅ | —       | max=36              | FK -> courses.$id  |
| status      | enum(string) |       ✅ | —       | `active             | refunded           | cancelled | completed` |     |
| priceCents  | integer      |       ❌ | 0       | min=0 max=200000000 |                    |
| currency    | string       |       ❌ | "MXN"   | max=3               |                    |
| enrolledAt  | datetime     |       ❌ | —       |                     |                    |
| completedAt | datetime     |       ❌ | —       |                     |                    |
| enabled     | boolean      |       ❌ | true    |                     |                    |

**Indexes**

- `uniq_user_course` — unique — `userId`, `courseId`
- `idx_userId_asc` — key — `userId` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)

---

## 8) `lessonProgress`

| Attribute  | Type     | Required | Default | Constraints     | Notes |
| ---------- | -------- | -------: | ------- | --------------- | ----- |
| userId     | string   |       ✅ | —       | max=36          |       |
| courseId   | string   |       ✅ | —       | max=36          |       |
| lessonId   | string   |       ✅ | —       | max=36          |       |
| watchedSec | integer  |       ❌ | 0       | min=0 max=86400 |       |
| completed  | boolean  |       ❌ | false   |                 |       |
| updatedAt  | datetime |       ❌ | —       |                 |       |
| enabled    | boolean  |       ❌ | true    |                 |       |

**Indexes**

- `uniq_user_lesson` — unique — `userId`, `lessonId`
- `idx_user_course_asc` — key — `userId` (asc), `courseId` (asc)

---

## 9) `courseStats`

Denormalización para listado rápido (rating promedio, conteos, progreso global, etc.)

| Attribute     | Type     | Required | Default | Constraints         | Notes  |
| ------------- | -------- | -------: | ------- | ------------------- | ------ |
| courseId      | string   |       ✅ | —       | max=36              | unique |
| ratingAvg     | float    |       ❌ | 0       | min=0 max=5         |        |
| ratingCount   | integer  |       ❌ | 0       | min=0 max=999999999 |        |
| studentsCount | integer  |       ❌ | 0       | min=0 max=999999999 |        |
| commentsCount | integer  |       ❌ | 0       | min=0 max=999999999 |        |
| updatedAt     | datetime |       ❌ | —       |                     |        |
| enabled       | boolean  |       ❌ | true    |                     |        |

**Indexes**

- `uniq_courseId` — unique — `courseId`
- `idx_ratingAvg_desc` — key — `ratingAvg` (desc)
- `idx_studentsCount_desc` — key — `studentsCount` (desc)

---

## 10) `reviews`

| Attribute | Type     | Required | Default | Constraints | Notes |
| --------- | -------- | -------: | ------- | ----------- | ----- |
| courseId  | string   |       ✅ | —       | max=36      |       |
| userId    | string   |       ✅ | —       | max=36      |       |
| rating    | integer  |       ✅ | —       | min=1 max=5 |       |
| title     | string   |       ❌ | ""      | max=120     |       |
| body      | string   |       ❌ | ""      | max=2000    |       |
| createdAt | datetime |       ❌ | —       |             |       |
| enabled   | boolean  |       ❌ | true    |             |       |

**Indexes**

- `idx_courseId_desc` — key — `courseId` (asc), `createdAt` (desc)
- `idx_userId_asc` — key — `userId` (asc)
- `uniq_user_course_review` — unique — `userId`, `courseId`

---

## 11) `comments`

Comentarios por curso y/o lección, con respuestas por `parentId`.

| Attribute | Type     | Required | Default | Constraints    | Notes    |
| --------- | -------- | -------: | ------- | -------------- | -------- |
| courseId  | string   |       ✅ | —       | max=36         |          |
| lessonId  | string   |       ❌ | ""      | max=36         | opcional |
| userId    | string   |       ✅ | —       | max=36         |          |
| parentId  | string   |       ❌ | ""      | max=36         | reply-to |
| body      | string   |       ✅ | —       | min=1 max=4000 |          |
| createdAt | datetime |       ❌ | —       |                |          |
| enabled   | boolean  |       ❌ | true    |                |          |

**Indexes**

- `idx_courseId_createdAt_desc` — key — `courseId` (asc), `createdAt` (desc)
- `idx_lessonId_createdAt_desc` — key — `lessonId` (asc), `createdAt` (desc)
- `idx_parentId_asc` — key — `parentId` (asc)

---

## 12) `assignments`

Tareas por curso (y opcionalmente por lección).

| Attribute   | Type     | Required | Default | Constraints      | Notes    |
| ----------- | -------- | -------: | ------- | ---------------- | -------- |
| courseId    | string   |       ✅ | —       | max=36           |          |
| lessonId    | string   |       ❌ | ""      | max=36           | opcional |
| title       | string   |       ✅ | —       | min=2 max=160    |          |
| description | string   |       ❌ | ""      | max=8000         |          |
| dueAt       | datetime |       ❌ | —       |                  |          |
| pointsMax   | integer  |       ❌ | 10      | min=0 max=1000   |          |
| order       | integer  |       ✅ | —       | min=0 max=100000 |          |
| enabled     | boolean  |       ❌ | true    |                  |          |

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_lessonId_asc` — key — `lessonId` (asc)

---

## 13) `submissions`

Entregas de tareas del alumno + revisión del maestro.

| Attribute       | Type         | Required | Default | Constraints    | Notes     |
| --------------- | ------------ | -------: | ------- | -------------- | --------- | -------- | --------- | --- |
| assignmentId    | string       |       ✅ | —       | max=36         |           |
| courseId        | string       |       ✅ | —       | max=36         |           |
| userId          | string       |       ✅ | —       | max=36         |           |
| body            | string       |       ❌ | ""      | max=8000       |           |
| attachmentsJson | string       |       ❌ | "[]"    | max=8000       | fileIds   |
| status          | enum(string) |       ✅ | —       | `draft         | submitted | reviewed | rejected` |     |
| pointsAwarded   | integer      |       ❌ | 0       | min=0 max=1000 |           |
| teacherFeedback | string       |       ❌ | ""      | max=8000       |           |
| submittedAt     | datetime     |       ❌ | —       |                |           |
| reviewedAt      | datetime     |       ❌ | —       |                |           |
| enabled         | boolean      |       ❌ | true    |                |           |

**Indexes**

- `uniq_assignment_user` — unique — `assignmentId`, `userId`
- `idx_course_user_asc` — key — `courseId` (asc), `userId` (asc)

---

## 14) `quizzes`

| Attribute       | Type    | Required | Default | Constraints      | Notes        |
| --------------- | ------- | -------: | ------- | ---------------- | ------------ |
| courseId        | string  |       ✅ | —       | max=36           |              |
| lessonId        | string  |       ❌ | ""      | max=36           |              |
| title           | string  |       ✅ | —       | min=2 max=160    |              |
| description     | string  |       ❌ | ""      | max=2000         |              |
| timeLimitSec    | integer |       ❌ | 0       | min=0 max=86400  | 0=sin límite |
| attemptsAllowed | integer |       ❌ | 0       | min=0 max=50     | 0=ilimitado  |
| passingScore    | float   |       ❌ | 0.7     | min=0 max=1      |              |
| order           | integer |       ✅ | —       | min=0 max=100000 |              |
| enabled         | boolean |       ❌ | true    |                  |              |

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_lessonId_asc` — key — `lessonId` (asc)

---

## 15) `quizQuestions`

| Attribute     | Type         | Required | Default | Constraints      | Notes             |
| ------------- | ------------ | -------: | ------- | ---------------- | ----------------- | --------- | ------ | --- |
| quizId        | string       |       ✅ | —       | max=36           |                   |
| courseId      | string       |       ✅ | —       | max=36           |                   |
| prompt        | string       |       ✅ | —       | min=2 max=2000   |                   |
| kind          | enum(string) |       ✅ | —       | `single          | multi             | trueFalse | short` |     |
| optionsJson   | string       |       ❌ | "[]"    | max=8000         | array de opciones |
| answerKeyJson | string       |       ❌ | "[]"    | max=8000         | keys/indices      |
| points        | integer      |       ❌ | 1       | min=0 max=100    |                   |
| order         | integer      |       ✅ | —       | min=0 max=100000 |                   |
| enabled       | boolean      |       ❌ | true    |                  |                   |

**Indexes**

- `idx_quizId_order_asc` — key — `quizId` (asc), `order` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)

---

## 16) `quizAttempts`

Intentos del alumno (respuestas + score).

| Attribute   | Type     | Required | Default | Constraints | Notes                      |
| ----------- | -------- | -------: | ------- | ----------- | -------------------------- |
| quizId      | string   |       ✅ | —       | max=36      |                            |
| courseId    | string   |       ✅ | —       | max=36      |                            |
| userId      | string   |       ✅ | —       | max=36      |                            |
| answersJson | string   |       ❌ | "{}"    | max=15000   | mapa questionId->respuesta |
| score       | float    |       ❌ | 0       | min=0 max=1 | normalizado                |
| passed      | boolean  |       ❌ | false   |             |                            |
| startedAt   | datetime |       ❌ | —       |             |                            |
| submittedAt | datetime |       ❌ | —       |             |                            |
| enabled     | boolean  |       ❌ | true    |             |                            |

**Indexes**

- `idx_quiz_user_desc` — key — `quizId` (asc), `userId` (asc), `submittedAt` (desc)
- `idx_course_user_asc` — key — `courseId` (asc), `userId` (asc)

---

# Buckets

- `avatars` — foto de perfil
- `courseCovers` — portada de curso
- `lessonVideos` — videos por lección
- `lessonAttachments` — PDFs/ZIPs/etc
- `submissionAttachments` — entregas del alumno

---

# Reglas de borrado lógico

En todas las collections se incluye `enabled: true`.  
Las “eliminaciones” deben hacerse marcando `enabled=false`.
