# Appwrite DB — Racoon LMS (sin Relationship attributes)

**Appwrite:** 1.8.2 RC2  
**Convención:** `camelCase` en collections y atributos  
**Relaciones:** por llaves foráneas (strings) — **NO** usar atributo `relationship`  
**Borrado lógico:** `enabled: true` (para “eliminar”, set `enabled=false`)

## Reglas Appwrite importantes

- **No combines `required=true` con `default`** en el mismo atributo.
  - Si hay `default`, déjalo `required=false`.
  - Si es `required=true`, no pongas `default`.
- `integer` y `float` requieren **min/max** (y pueden tener `default` si NO son required).
- `string` requiere **min/max length**.
- Los índices pueden ser `key`, `unique`, `fulltext`.
- **No usaremos `relationship`**: en su lugar guardamos IDs (`courseId`, `teacherId`, etc.) como `string`.

---

## Database

- **databaseId:** `lms`

---

## Collections

### 1) `profiles`

**Doc ID = Auth userId** (espejo del usuario)

| Attribute    | Type    | Required | Default | Constraints    | Notes                     |
| ------------ | ------- | -------: | ------- | -------------- | ------------------------- |
| firstName    | string  |       ✅ | —       | min=1 max=40   |                           |
| lastName     | string  |       ✅ | —       | min=1 max=60   |                           |
| Role         | enum    |       ✅ | —       | —              | controla UI/permisos      |
| headline     | string  |       ❌ | ""      | min=0 max=120  | Título profesional        |
| bio          | string  |       ❌ | ""      | min=0 max=500  |                           |
| socials      | string  |       ❌ | "{}"    | min=0 max=2500 | JSON links                |
| avatarFileId | string  |       ❌ | ""      | min=0 max=36   | bucket `avatars`          |
| phone        | string  |       ❌ | ""      | min=0 max=20   | formato E.164 recomendado |
| email        | email   |       ✅ | —       | min=0 max=100  | Sync with Auth            |
| country      | string  |       ❌ | "MX"    | min=0 max=2    | ISO-2                     |
| suspended    | boolean |       ❌ | false   | —              | Block login               |
| enabled      | boolean |       ❌ | true    | —              | borrado lógico            |

**Enum values**

- `role`: `student`, `teacher`, `admin`

**Indexes**

- `uq_email` — unique — `email`
- `idx_role_asc` — key — `role` (asc)
- `idx_name_fulltext` — fulltext — `firstName`, `lastName`
- `idx_enabled_asc` — key — `enabled` (asc)
- `idx_email_fulltext` — fulltext — `email`

---

### 2) `categories`

| Attribute | Type    | Required | Default | Constraints  | Notes  |
| --------- | ------- | -------: | ------- | ------------ | ------ |
| name      | string  |       ✅ | —       | min=2 max=48 |        |
| slug      | string  |       ✅ | —       | min=2 max=48 | unique |
| enabled   | boolean |       ❌ | true    | —            |        |

**Indexes**

- `uniq_slug` — unique — `slug`
- `idx_name_fulltext` — fulltext — `name`
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 3) `courses`

| Attribute        | Type     | Required | Default | Constraints         | Notes                            |
| ---------------- | -------- | -------: | ------- | ------------------- | -------------------------------- |
| title            | string   |       ✅ | —       | min=4 max=120       |                                  |
| subtitle         | string   |       ❌ | ""      | min=0 max=180       |                                  |
| description      | string   |       ❌ | ""      | min=0 max=8000      | markdown/plain                   |
| categoryId       | string   |       ✅ | —       | min=1 max=36        | FK -> categories.$id             |
| teacherId        | string   |       ✅ | —       | min=1 max=36        | FK -> profiles.$id               |
| language         | string   |       ❌ | "es"    | min=0 max=6         | es, en-US, etc                   |
| level            | enum     |       ✅ | —       | —                   |                                  |
| coverFileId      | string   |       ❌ | ""      | min=0 max=36        | bucket `courseCovers`            |
| bannerFileId     | string   |       ❌ | ""      | min=0 max=36        | bucket `courseCovers`            |
| promoVideoFileId | string   |       ❌ | ""      | min=0 max=36        | bucket `lessonVideos` (opcional) |
| priceCents       | integer  |       ❌ | 0       | min=0 max=200000000 |                                  |
| currency         | string   |       ❌ | "MXN"   | min=0 max=3         |                                  |
| isPublished      | boolean  |       ❌ | false   | —                   |                                  |
| publishedAt      | datetime |       ❌ | —       | —                   |                                  |
| enabled          | boolean  |       ❌ | true    | —                   |                                  |

**Enum values**

- `level`: `beginner`, `intermediate`, `advanced`

**Indexes**

- `idx_publishedAt_desc` — key — `publishedAt` (desc)
- `idx_isPublished_asc` — key — `isPublished` (asc)
- `idx_title_fulltext` — fulltext — `title`
- `idx_teacherId_asc` — key — `teacherId` (asc)
- `idx_categoryId_asc` — key — `categoryId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 4) `courseSections`

| Attribute | Type    | Required | Default | Constraints     | Notes             |
| --------- | ------- | -------: | ------- | --------------- | ----------------- |
| courseId  | string  |       ✅ | —       | min=1 max=36    | FK -> courses.$id |
| title     | string  |       ✅ | —       | min=2 max=120   |                   |
| order     | integer |       ✅ | —       | min=0 max=10000 |                   |
| enabled   | boolean |       ❌ | true    | —               |                   |

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 5) `lessons`

| Attribute        | Type     | Required | isArray | Default | Constraints      | Notes                      |
| ---------------- | -------- | -------: | ------- | ------- | ---------------- | -------------------------- |
| courseId         | string   |       ✅ | false   | —       | min=1 max=36     | FK -> courses.$id          |
| sectionId        | string   |       ✅ | false   | —       | min=1 max=36     | FK -> courseSections.$id   |
| title            | string   |       ✅ | false   | —       | min=2 max=140    |                            |
| description      | string   |       ❌ | false   | ""      | min=0 max=8000   |                            |
| kind             | enum     |       ✅ | false   | —       | —                |                            |
| order            | integer  |       ✅ | false   | —       | min=0 max=100000 |                            |
| durationSec      | integer  |       ❌ | false   | 0       | min=0 max=86400  |                            |
| videoFileId      | string   |       ❌ | false   | ""      | min=0 max=36     | bucket `lessonVideos`      |
| videoCoverFileId | string   |       ❌ | false   | ""      | min=0 max=36     | bucket `lessonVideos`      |
| attachments      | string[] |       ❌ | true    | []      | size=36          | bucket `lessonAttachments` |
| isFreePreview    | boolean  |       ❌ | false   | false   | —                |                            |
| enabled          | boolean  |       ❌ | false   | true    | —                |                            |

**Enum values**

- `kind`: `video`, `article`, `quiz`, `assignment`

**attachments**

- `String[]` de `fileIds`: jpg, png, svg, pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, 7z, gif, html, js, css, txt, md, mp4, mp3, wav, webm, ogg, m4a, m4v, webm, ogv

**Indexes**

- `idx_courseId_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_sectionId_order_asc` — key — `sectionId` (asc), `order` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 6) `lessonTimestamps`

| Attribute | Type    | Required | Default | Constraints      | Notes                               |
| --------- | ------- | -------: | ------- | ---------------- | ----------------------------------- |
| lessonId  | string  |       ✅ | —       | min=1 max=36     | FK -> lessons.$id                   |
| courseId  | string  |       ✅ | —       | min=1 max=36     | FK -> courses.$id (queries rápidas) |
| title     | string  |       ✅ | —       | min=2 max=120    |                                     |
| atSec     | integer |       ✅ | —       | min=0 max=86400  | segundo del video                   |
| order     | integer |       ✅ | —       | min=0 max=100000 |                                     |
| enabled   | boolean |       ❌ | true    | —                |                                     |

**Indexes**

- `idx_lessonId_order_asc` — key — `lessonId` (asc), `order` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 7) `enrollments`

| Attribute   | Type     | Required | Default | Constraints         | Notes              |
| ----------- | -------- | -------: | ------- | ------------------- | ------------------ |
| userId      | string   |       ✅ | —       | min=1 max=36        | FK -> profiles.$id |
| courseId    | string   |       ✅ | —       | min=1 max=36        | FK -> courses.$id  |
| status      | enum     |       ✅ | —       | —                   |                    |
| priceCents  | integer  |       ❌ | 0       | min=0 max=200000000 |                    |
| currency    | string   |       ❌ | "MXN"   | min=0 max=3         |                    |
| enrolledAt  | datetime |       ❌ | —       | —                   |                    |
| completedAt | datetime |       ❌ | —       | —                   |                    |
| enabled     | boolean  |       ❌ | true    | —                   |                    |

**Enum values**

- `status`: `active`, `completed`, `cancelled`, `refunded`

**Indexes**

- `uniq_user_course` — unique — `userId`, `courseId`
- `idx_userId_asc` — key — `userId` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 8) `lessonProgress`

| Attribute  | Type    | Required | Default | Constraints     | Notes |
| ---------- | ------- | -------: | ------- | --------------- | ----- |
| userId     | string  |       ✅ | —       | min=1 max=36    |       |
| courseId   | string  |       ✅ | —       | min=1 max=36    |       |
| lessonId   | string  |       ✅ | —       | min=1 max=36    |       |
| watchedSec | integer |       ❌ | 0       | min=0 max=86400 |       |
| completed  | boolean |       ❌ | false   | —               |       |
| enabled    | boolean |       ❌ | true    | —               |       |

**Indexes**

- `uniq_user_lesson` — unique — `userId`, `lessonId`
- `idx_user_course_asc` — key — `userId` (asc), `courseId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 9) `courseStats`

| Attribute     | Type    | Required | Default | Constraints         | Notes  |
| ------------- | ------- | -------: | ------- | ------------------- | ------ |
| courseId      | string  |       ✅ | —       | min=1 max=36        | unique |
| ratingAvg     | float   |       ❌ | 0       | min=0 max=5         |        |
| ratingCount   | integer |       ❌ | 0       | min=0 max=999999999 |        |
| studentsCount | integer |       ❌ | 0       | min=0 max=999999999 |        |
| commentsCount | integer |       ❌ | 0       | min=0 max=999999999 |        |
| enabled       | boolean |       ❌ | true    | —                   |        |

**Indexes**

- `uniq_courseId` — unique — `courseId`
- `idx_ratingAvg_desc` — key — `ratingAvg` (desc)
- `idx_studentsCount_desc` — key — `studentsCount` (desc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 10) `reviews`

| Attribute | Type    | Required | Default | Constraints    | Notes |
| --------- | ------- | -------: | ------- | -------------- | ----- |
| courseId  | string  |       ✅ | —       | min=1 max=36   |       |
| userId    | string  |       ✅ | —       | min=1 max=36   |       |
| rating    | integer |       ✅ | —       | min=1 max=5    |       |
| title     | string  |       ❌ | ""      | min=0 max=120  |       |
| body      | string  |       ❌ | ""      | min=0 max=2000 |       |
| enabled   | boolean |       ❌ | true    | —              |       |

**Indexes**

- `uniq_user_course_review` — unique — `userId`, `courseId`
- `idx_course_created_desc` — key — `courseId` (asc), `createdAt` (desc)
- `idx_userId_asc` — key — `userId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 11) `comments`

| Attribute | Type    | Required | Default | Constraints    | Notes    |
| --------- | ------- | -------: | ------- | -------------- | -------- |
| courseId  | string  |       ✅ | —       | min=1 max=36   |          |
| lessonId  | string  |       ❌ | ""      | min=0 max=36   | opcional |
| userId    | string  |       ✅ | —       | min=1 max=36   |          |
| parentId  | string  |       ❌ | ""      | min=0 max=36   | reply-to |
| body      | string  |       ✅ | —       | min=1 max=4000 |          |
| enabled   | boolean |       ❌ | true    | —              |          |

**Indexes**

- `idx_course_created_desc` — key — `courseId` (asc), `createdAt` (desc)
- `idx_lesson_created_desc` — key — `lessonId` (asc), `createdAt` (desc)
- `idx_parentId_asc` — key — `parentId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 12) `assignments`

| Attribute   | Type     | Required | Default | Constraints      | Notes    |
| ----------- | -------- | -------: | ------- | ---------------- | -------- |
| courseId    | string   |       ✅ | —       | min=1 max=36     |          |
| lessonId    | string   |       ❌ | ""      | min=0 max=36     | opcional |
| title       | string   |       ✅ | —       | min=2 max=160    |          |
| description | string   |       ❌ | ""      | min=0 max=7500   |          |
| dueAt       | datetime |       ❌ | —       | —                |          |
| pointsMax   | integer  |       ❌ | 10      | min=0 max=1000   |          |
| order       | integer  |       ✅ | —       | min=0 max=100000 |          |
| enabled     | boolean  |       ❌ | true    | —                |          |

**Indexes**

- `idx_course_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_lessonId_asc` — key — `lessonId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 13) `submissions`

| Attribute       | Type     | Required | isArray | Default | Constraints    | Notes   |
| --------------- | -------- | -------- | ------- | ------- | -------------- | ------- |
| assignmentId    | string   | ✅       | ❌      | —       | min=1 max=36   |         |
| courseId        | string   | ✅       | ❌      | —       | min=1 max=36   |         |
| userId          | string   | ✅       | ❌      | —       | min=1 max=36   |         |
| body            | string   | ❌       | ❌      | ""      | min=0 max=8000 |         |
| attachments     | string[] | ❌       | ✅      | []      | min=0 max=36   | fileIds |
| status          | enum     | ✅       | ❌      | —       | —              |         |
| pointsAwarded   | integer  | ❌       | ❌      | 0       | min=0 max=1000 |         |
| teacherFeedback | string   | ❌       | ❌      | ""      | min=0 max=7500 |         |
| submittedAt     | datetime | ❌       | ❌      | —       | —              |         |
| reviewedAt      | datetime | ❌       | ❌      | —       | —              |         |
| enabled         | boolean  | ❌       | ❌      | true    | —              |         |

**Enum values**

- `status`: `draft`, `submitted`, `reviewed`, `rejected`

**Indexes**

- `uniq_assignment_user` — unique — `assignmentId`, `userId`
- `idx_course_user_asc` — key — `courseId` (asc), `userId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 14) `quizzes`

| Attribute       | Type    | Required | Default | Constraints      | Notes        |
| --------------- | ------- | -------: | ------- | ---------------- | ------------ |
| courseId        | string  |       ✅ | —       | min=1 max=36     |              |
| lessonId        | string  |       ❌ | ""      | min=0 max=36     | opcional     |
| title           | string  |       ✅ | —       | min=2 max=160    |              |
| description     | string  |       ❌ | ""      | min=0 max=2000   |              |
| timeLimitSec    | integer |       ❌ | 0       | min=0 max=86400  | 0=sin límite |
| attemptsAllowed | integer |       ❌ | 0       | min=0 max=50     | 0=ilimitado  |
| passingScore    | float   |       ❌ | 0.7     | min=0 max=1      |              |
| order           | integer |       ✅ | —       | min=0 max=100000 |              |
| enabled         | boolean |       ❌ | true    | —                |              |

**Indexes**

- `idx_course_order_asc` — key — `courseId` (asc), `order` (asc)
- `idx_lessonId_asc` — key — `lessonId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 15) `quizQuestions`

| Attribute     | Type    | Required | Default | Constraints      | Notes |
| ------------- | ------- | -------: | ------- | ---------------- | ----- |
| quizId        | string  |       ✅ | —       | min=1 max=36     |       |
| courseId      | string  |       ✅ | —       | min=1 max=36     |       |
| prompt        | string  |       ✅ | —       | min=2 max=2000   |       |
| kind          | enum    |       ✅ | —       | —                |       |
| optionsJson   | string  |       ❌ | "[]"    | min=0 max=7500   |       |
| answerKeyJson | string  |       ❌ | "[]"    | min=0 max=6000   |       |
| points        | integer |       ❌ | 1       | min=0 max=100    |       |
| order         | integer |       ✅ | —       | min=0 max=100000 |       |
| enabled       | boolean |       ❌ | true    | —                |       |

**Enum values**

- `kind`: `single`, `multi`, `trueFalse`, `short`

**Indexes**

- `idx_quiz_order_asc` — key — `quizId` (asc), `order` (asc)
- `idx_courseId_asc` — key — `courseId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 16) `quizAttempts`

| Attribute   | Type     | Required | Default | Constraints     | Notes                 |
| ----------- | -------- | -------: | ------- | --------------- | --------------------- |
| quizId      | string   |       ✅ | —       | min=1 max=36    |                       |
| courseId    | string   |       ✅ | —       | min=1 max=36    |                       |
| userId      | string   |       ✅ | —       | min=1 max=36    |                       |
| answersJson | string   |       ❌ | "{}"    | min=0 max=15000 | questionId->respuesta |
| score       | float    |       ❌ | 0       | min=0 max=1     |                       |
| passed      | boolean  |       ❌ | false   | —               |                       |
| startedAt   | datetime |       ❌ | —       | —               |                       |
| submittedAt | datetime |       ❌ | —       | —               |                       |
| enabled     | boolean  |       ❌ | true    | —               |                       |

**Indexes**

- `idx_quiz_user_submitted_desc` — key — `quizId` (asc), `userId` (asc), `submittedAt` (desc)
- `idx_course_user_asc` — key — `courseId` (asc), `userId` (asc)
- `idx_enabled_asc` — key — `enabled` (asc)

---

### 17) `password_reset_tokens`

| Attribute | Type     | Required | Default | Constraints  | Notes                |
| --------- | -------- | -------: | ------- | ------------ | -------------------- |
| userId    | string   |       ✅ | —       | min=1 max=36 | Auth user ID         |
| token     | string   |       ✅ | —       | min=1 max=64 | Secure random string |
| email     | string   |       ✅ | —       | min=3 max=80 | Backup/Verification  |
| expireAt  | datetime |       ✅ | —       | —            |                      |
| used      | boolean  |       ❌ | false   | —            |                      |

**Indexes**

- `uniq_token` — unique — `token`
- `idx_userId` — key — `userId` (asc)

---

### 18) `favorites`

| Attribute | Type     | Required | Default | Constraints  | Notes              |
| --------- | -------- | -------: | ------- | ------------ | ------------------ |
| userId    | string   |       ✅ | —       | min=1 max=36 | FK -> profiles.$id |
| courseId  | string   |       ✅ | —       | min=1 max=36 | FK -> courses.$id  |
| createdAt | datetime |       ❌ | —       | —            |                    |

**Indexes**

- `uniq_user_course` — unique — `userId`, `courseId`
- `idx_courseId` — key — `courseId` (asc)

---

### 19) `userPreferences`

| Attribute | Type   | Required | Default  | Constraints     | Notes |
| --------- | ------ | -------: | -------- | --------------- | ----- |
| userId    | string |       ✅ | —        | min=1 max=36    |       |
| language  | string |       ❌ | "es"     | min=2 max=5     |       |
| theme     | enum   |       ❌ | "system" | —               |       |
| prefsJson | string |       ❌ | "{}"     | min=0 max=10000 |       |

**Enum values**

- `theme`: `light`, `dark`, `system`

**Indexes**

- `uniq_userId` — unique — `userId`

---

### 20) `notifications`

| Attribute | Type     | Required | Default | Constraints    | Notes      |
| --------- | -------- | -------: | ------- | -------------- | ---------- |
| userId    | string   |       ✅ | —       | min=1 max=36   |            |
| type      | enum     |       ✅ | —       | —              |            |
| title     | string   |       ✅ | —       | min=1 max=120  |            |
| body      | string   |       ✅ | —       | min=1 max=500  |            |
| dataJson  | string   |       ❌ | "{}"    | min=0 max=2000 | extra data |
| read      | boolean  |       ❌ | false   | —              |            |
| readedAt  | datetime |       ❌ | —       | —              |            |

**Enum values**

- `type`: `system`, `sale`, `review`, `assignment`, `course_update`

**Indexes**

- `idx_user_read` — key — `userId` (asc), `read` (asc)
- `idx_read` — key — `read` (asc)

---

### 21) `cart`

| Attribute | Type     | Required | Default | Constraints  | Notes |
| --------- | -------- | -------: | ------- | ------------ | ----- |
| userId    | string   |       ✅ | —       | min=1 max=36 |       |
| courseId  | string   |       ✅ | —       | min=1 max=36 |       |
| addedAt   | datetime |       ✅ | —       | —            |       |

**Indexes**

- `uniq_user_course` — unique — `userId` (asc), `courseId` (asc)
- `idx_userId` — key — `userId` (asc)

---

### 22) `coupons`

| Attribute | Type     | Required | Default | Constraints  | Notes            |
| --------- | -------- | -------: | ------- | ------------ | ---------------- |
| code      | string   |       ✅ | —       | min=3 max=20 | uppercase unique |
| type      | enum     |       ✅ | —       | —            |                  |
| value     | float    |       ✅ | —       | min=0        |                  |
| courseId  | string   |       ❌ | ""      | min=0 max=36 | global si vacío  |
| maxUses   | integer  |       ❌ | 0       | min=0        | 0 = ilimitado    |
| usedCount | integer  |       ❌ | 0       | min=0        |                  |
| expiresAt | datetime |       ❌ | —       | —            |                  |
| enabled   | boolean  |       ❌ | true    | —            |                  |

**Enum values**

- `type`: `percent`, `fixed`

**Indexes**

- `uniq_code` — unique — `code`
- `idx_enabled` — key — `enabled` (asc)

---

### 23) `couponRedemptions`

| Attribute  | Type     | Required | Default | Constraints  | Notes |
| ---------- | -------- | -------: | ------- | ------------ | ----- |
| couponId   | string   |       ✅ | —       | min=1 max=36 |       |
| userId     | string   |       ✅ | —       | min=1 max=36 |       |
| redeemedAt | datetime |       ✅ | —       | —            |       |
| orderId    | string   |       ❌ | ""      | min=0 max=36 |       |

**Indexes**

- `uniq_coupon_user` — unique — `couponId`, `userId` (si es 1 user per coupon) or key

---

## Buckets

- `avatars` — foto de perfil
- `courseCovers` — portadas de cursos
- `lessonVideos` — videos por lección
- `lessonAttachments` — PDF/ZIP/etc
- `submissionAttachments` — entregas del alumno
