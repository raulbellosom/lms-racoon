// Seed data used ONLY when Appwrite env vars are missing (demo mode).
// Keep it small and realistic; UI should still feel like a real e-learning platform.

export const demoReviews = [
  {
    $id: "r1",
    courseId: "course-react",
    userId: "u_demo_1",
    rating: 5,
    title: "Clarísimo y directo",
    body: "Me gustó que cada lección va al punto. Los capítulos ayudan mucho.",
    createdAt: "2026-01-15T10:00:00.000Z",
    enabled: true,
  },
  {
    $id: "r2",
    courseId: "course-react",
    userId: "u_demo_2",
    rating: 4,
    title: "Muy bueno",
    body: "Buen ritmo y buen material descargable. Agregaría más ejercicios.",
    createdAt: "2026-01-17T18:20:00.000Z",
    enabled: true,
  },
];

export const demoComments = [
  {
    $id: "cm1",
    courseId: "course-react",
    lessonId: "l-1",
    userId: "u_demo_2",
    body: "¿Alguien tiene un ejemplo real para practicar este módulo?",
    parentId: "",
    createdAt: "2026-01-18T09:10:00.000Z",
    enabled: true,
  },
  {
    $id: "cm2",
    courseId: "course-react",
    lessonId: "l-1",
    userId: "u_demo_1",
    body: "Sí, yo usé un proyecto pequeño y me funcionó. Te paso mi enfoque:",
    parentId: "cm1",
    createdAt: "2026-01-18T10:05:00.000Z",
    enabled: true,
  },
];

export const demoAssignments = [
  {
    $id: "a1",
    courseId: "course-react",
    title: "Tarea 1 — Implementa el layout",
    description:
      "Crea un layout mobile-first con navbar, tabs y una vista de curso. Sube capturas o ZIP.",
    dueAt: "",
    pointsMax: 10,
    order: 1,
    enabled: true,
  },
  {
    $id: "a2",
    courseId: "course-react",
    title: "Tarea 2 — Progreso por lección",
    description:
      "Implementa marcado de lección completada y calcula progreso de curso (porcentaje).",
    dueAt: "",
    pointsMax: 15,
    order: 2,
    enabled: true,
  },
];
