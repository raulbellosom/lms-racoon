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
  Users,
} from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";

export function CourseDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const [courseData, sectionsData, lessonsData, statsData] =
        await Promise.all([
          TeacherCoursesService.getById(id),
          SectionService.listByCourse(id),
          LessonService.listByCourse(id),
          StatsService.getCourseStats(id),
        ]);

      // Organize Content
      const content = sectionsData.map((section) => ({
        title: section.title,
        lessons: lessonsData.filter((l) => l.sectionId === section.$id),
      }));

      setCourse({ ...courseData, content });
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load course details", error);
      // Optional: navigate("/app/explore");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgb(var(--brand-primary))] border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[rgb(var(--bg-base))] p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold">Curso no encontrado</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const formattedPrice =
    course.priceCents === 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: course.currency || "MXN",
        }).format(course.priceCents / 100);

  const coverUrl = course.coverFileId
    ? FileService.getCourseCoverUrl(course.coverFileId)
    : "https://placehold.co/1200x600/2a2a2a/FFF?text=No+Cover";

  const rating = stats?.averageRating || 0;
  const studentsCount = stats?.totalStudents || 0;

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-32 md:pb-20">
      {/* Hero Header */}
      <div className="relative bg-[rgb(var(--bg-surface-strong))] text-white">
        {/* Background Blur Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover opacity-20 blur-3xl"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:flex lg:gap-12">
          {/* Left Content */}
          <div className="lg:w-2/3">
            <div className="mb-4 flex flex-wrap gap-2">
              {/* Label based on criteria, e.g. Bestseller if popular, for now just hardcode 'Featured' or New */}
              <span className="rounded bg-[rgb(var(--brand-primary))] px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Curso
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                <span className="text-amber-400">★</span> {rating.toFixed(1)}
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
                {studentsCount} estudiantes
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Última actualización:{" "}
                {new Date(course.$updatedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />{" "}
                {course.language === "es" ? "Español" : course.language}
              </div>
            </div>

            {/* Instructor mini (using teacherId placeholder as we don't fetch profile yet, or simple static for logged in user) */}
            {/* TODO: Fetch Instructor Profile if needed. For now omit or mock generic */}
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
              style={{ whiteSpace: "pre-wrap" }} // Handle plain text formatting nicely
            >
              {course.description || "Sin descripción."}
            </div>
          </section>

          {/* Curriculum */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
              Contenido del curso
            </h2>
            <CourseCurriculum content={course.content || []} />
          </section>
        </div>

        {/* Sidebar Sticky Card (Desktop) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-1 shadow-2xl">
            {/* Video Preview Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <img
                src={coverUrl}
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
              <Button className="mb-3 w-full" size="lg">
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
                  <BarChart className="h-4 w-4" /> Nivel{" "}
                  <span className="capitalize">{course.level}</span>
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
