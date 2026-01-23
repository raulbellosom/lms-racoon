import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Play,
  CheckCircle,
  Globe,
  Award,
  Clock,
  BarChart,
  Share2,
  Heart,
} from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { CourseCurriculum } from "../components/CourseCurriculum";

// Mock Data
const MOCK_COURSE_DETAILS = {
  $id: "c1",
  title: "Master en React 2024: De Cero a Experto",
  subtitle:
    "Aprende Hooks, Context, Redux, Next.js y crea aplicaciones reales y escalables para el mundo laboral.",
  description: `
    <p>Este es el curso más completo para aprender React desde cero hasta un nivel avanzado. No necesitas conocimientos previos de la librería, pero sí de JavaScript.</p>
    <p>A lo largo del curso construiremos 5 aplicaciones reales que podrás incluir en tu portafolio.</p>
    <h3>¿Qué aprenderás?</h3>
    <ul>
      <li>Dominar los fundamentos de React 19</li>
      <li>Hooks modernos (useState, useEffect, useTransition)</li>
      <li>Gestión de estado global con Context y Zustand</li>
      <li>Next.js 14 App Router</li>
    </ul>
  `,
  rating: 4.9,
  studentsCount: 1540,
  updatedAt: "2024-01-15",
  language: "Español",
  level: "Avanzado",
  priceCents: 19999,
  currency: "MXN",
  coverUrl:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1200",
  instructor: {
    name: "Raúl Belloso",
    bio: "Senior Frontend Engineer & Instructor. Apasionado por la enseñanza y el código limpio.",
    avatarUrl: "https://github.com/raulbellosom.png",
  },
  content: [
    {
      title: "Introducción a React",
      lessons: [
        {
          $id: "l1",
          title: "Bienvenida al curso",
          kind: "video",
          durationSec: 300,
        },
        { $id: "l2", title: "¿Qué es React?", kind: "video", durationSec: 600 },
        {
          $id: "l3",
          title: "Configuración del entorno",
          kind: "article",
          durationSec: 0,
        },
      ],
    },
    {
      title: "Hooks Fundamentales",
      lessons: [
        {
          $id: "l4",
          title: "useState en profundidad",
          kind: "video",
          durationSec: 1200,
        },
        {
          $id: "l5",
          title: "useEffect y ciclo de vida",
          kind: "video",
          durationSec: 1500,
        },
        {
          $id: "l6",
          title: "Quiz: Hooks básicos",
          kind: "quiz",
          durationSec: 0,
        },
      ],
    },
  ],
};

export function CourseDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // In real app, fetch course by ID
  const course = MOCK_COURSE_DETAILS;

  const formattedPrice =
    course.priceCents === 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: course.currency,
        }).format(course.priceCents / 100);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-32 md:pb-20">
      {/* Hero Header */}
      <div className="relative bg-[rgb(var(--bg-surface-strong))] text-white">
        {/* Background Blur Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={course.coverUrl}
            alt=""
            className="h-full w-full object-cover opacity-20 blur-3xl"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:flex lg:gap-12">
          {/* Left Content */}
          <div className="lg:w-2/3">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded bg-[rgb(var(--brand-primary))] px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Bestseller
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                <span className="text-amber-400">★</span> {course.rating}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold md:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-gray-200 md:text-xl">
              {course.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.studentsCount} estudiantes
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Última actualización:{" "}
                {course.updatedAt}
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" /> {course.language}
              </div>
            </div>

            {/* Instructor mini */}
            <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-6">
              <img
                src={course.instructor.avatarUrl}
                alt={course.instructor.name}
                className="h-10 w-10 rounded-full border border-white/20"
              />
              <div>
                <div className="text-xs text-gray-400">Creado por</div>
                <div className="font-semibold text-white underline decoration-dotted underline-offset-4">
                  {course.instructor.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Description */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
              Descripción del curso
            </h2>
            <div
              className="prose prose-invert max-w-none text-[rgb(var(--text-secondary))]"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </section>

          {/* Curriculum */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
              Contenido del curso
            </h2>
            <CourseCurriculum content={course.content} />
          </section>

          {/* Requirements/Instructor details could go here */}
        </div>

        {/* Sidebar Sticky Card (Desktop) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-1 shadow-2xl">
            {/* Video Preview Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <img
                src={course.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition hover:scale-110 cursor-pointer">
                  <Play className="ml-1 h-8 w-8 fill-white text-white shadow-xl" />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-2 text-3xl font-black text-[rgb(var(--text-primary))]">
                {formattedPrice}
              </div>
              <Button className="mb-3 w-full animate-pulse" size="lg">
                Inscribirme ahora
              </Button>
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" /> Añadir a favoritos
              </Button>

              <div className="mt-6 space-y-3 text-sm text-[rgb(var(--text-secondary))]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> Certificado de finalización
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Acceso de por vida
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" /> Nivel {course.level}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar for Enrollment */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 shadow-top lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {formattedPrice}
            </div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Oferta por tiempo limitado
            </div>
          </div>
          <Button className="flex-1" size="lg">
            Inscribirme
          </Button>
        </div>
      </div>
    </div>
  );
}
