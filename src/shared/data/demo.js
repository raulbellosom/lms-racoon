export const demoCategories = [
  { $id: "cat-dev", name: "Desarrollo", slug: "desarrollo" },
  { $id: "cat-design", name: "Diseño", slug: "diseno" },
  { $id: "cat-business", name: "Negocios", slug: "negocios" },
];

export const demoCourses = [
  {
    $id: "course-react",
    title: "React Moderno (Mobile-first) — de 0 a PRO",
    subtitle: "Construye PWAs con React + Vite + Tailwind 4.1",
    description:
      "Aprende a crear una plataforma real con arquitectura limpia, animaciones, Appwrite y patrones reusables.",
    categoryId: "cat-dev",
    level: "beginner",
    language: "es",
    coverUrl:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1400&q=80",
    teacherName: "Racoon Devs",
    ratingAvg: 4.8,
    ratingCount: 1240,
    studentsCount: 8400,
    priceCents: 19900,
    currency: "MXN",
    isPublished: true,
    sections: [
      {
        $id: "sec-1",
        title: "Bienvenida",
        order: 1,
        lessons: [
          { $id: "l-1", title: "Cómo tomar el curso", order: 1, durationSec: 210, kind: "video" },
          { $id: "l-2", title: "Setup del proyecto", order: 2, durationSec: 600, kind: "video" },
        ],
      },
      {
        $id: "sec-2",
        title: "UI + UX que enamora",
        order: 2,
        lessons: [
          { $id: "l-3", title: "Tokens + Dark Mode", order: 1, durationSec: 540, kind: "video" },
          { $id: "l-4", title: "Micro-interacciones", order: 2, durationSec: 480, kind: "video" },
        ],
      },
    ],
  },
  {
    $id: "course-ui",
    title: "UI Systems: Componentes reusables como Senior",
    subtitle: "Atomic design + Tailwind + Motion",
    description:
      "Aprende a construir una librería de componentes consistente, rápida y con accesibilidad.",
    categoryId: "cat-design",
    level: "intermediate",
    language: "es",
    coverUrl:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=80",
    teacherName: "Racoon Devs",
    ratingAvg: 4.7,
    ratingCount: 620,
    studentsCount: 3200,
    priceCents: 14900,
    currency: "MXN",
    isPublished: true,
    sections: [
      {
        $id: "sec-1",
        title: "Sistema de diseño",
        order: 1,
        lessons: [
          { $id: "l-1", title: "Qué hace coherente un UI", order: 1, durationSec: 330, kind: "video" },
        ],
      },
    ],
  },
];
