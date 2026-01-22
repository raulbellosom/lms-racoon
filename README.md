# Racoon LMS (Udemy/Coursera-style) — React + Vite + TailwindCSS 4.1 + PWA

Plataforma **mobile-first** (100% responsiva) con:
- Catálogo de cursos
- Curso público (landing + contenido)
- Auth (login / register)
- App (alumno): inicio, mis cursos, progreso, reproductor (demo)
- App (maestro): panel (UI) para administrar cursos (CRUD listo para conectar)

> **Appwrite 1.8.2 RC2**: la base de datos y funciones están documentadas en `/documentation`.

---

## 1) Requisitos
- Node 18+ (recomendado Node 18 LTS)
- Appwrite 1.8.2 RC2

---

## 2) Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

---

## 3) Variables de entorno (.env)

`VITE_APPWRITE_ENDPOINT` y `VITE_APPWRITE_PROJECT_ID` son obligatorias para modo real.

Sin estas variables, la app corre en **modo demo** con datos de ejemplo.

---

## 4) Appwrite: Base de datos y buckets

Lee:
- `documentation/appwrite_db.md`
- `documentation/appwrite_setup.md`
- `documentation/functions.md`

---

## 5) Roles (profile.role)
- `student`
- `teacher`
- `admin`

El panel maestro (`/app/teach`) requiere `teacher` o `admin`.

---

## 6) Próximos pasos recomendados
- Implementar CRUD real del panel maestro:
  - `courses`, `courseSections`, `lessons`
- Conectar reproductor con `lesson.videoFileId` (Storage)
- Integrar pagos (Stripe/MercadoPago) con Appwrite Functions:
  - crear `order` + marcar `enrollment.status=paid`

