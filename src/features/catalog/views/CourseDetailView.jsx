import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  AlertCircle,
} from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getRandomBanner, getBannerById } from "../../../shared/assets/banners";

export function CourseDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState(null);
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [svgBanner] = React.useState(getRandomBanner());

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

      const content = sectionsData.map((section) => ({
        title: section.title,
        lessons: lessonsData.filter((l) => l.sectionId === section.$id),
      }));

      setCourse({ ...courseData, content });
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load course details", error);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackGradient = (id) => {
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
      "linear-gradient(135deg, #FCCF31 0%, #F55555 100%)",
      "linear-gradient(135deg, #13547a 0%, #80d0c7 100%)",
    ];
    const index = id ? id.charCodeAt(id.length - 1) % gradients.length : 0;
    return gradients[index];
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

  // --- Logic & Security ---
  const isOwner = auth.user?.$id === course.teacherId;
  const isDraft = !course.isPublished;
  const canEnroll = !isOwner && !isDraft;
  const canInteract = !isOwner && !isDraft;

  const formattedPrice =
    course.priceCents === 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: course.currency || "MXN",
        }).format(course.priceCents / 100);

  const coverUrl = course.coverFileId
    ? FileService.getCourseCoverUrl(course.coverFileId)
    : null;

  // Banner: use specific banner, or fallback to cover, or fallback to SVG
  let bannerUrl = null;
  if (course.bannerFileId) {
    const pattern = getBannerById(course.bannerFileId);
    if (pattern) {
      bannerUrl = pattern.url;
    } else {
      bannerUrl = FileService.getCourseCoverUrl(course.bannerFileId);
    }
  }

  // If no banner, use cover as background, then SVG
  const backgroundUrl = bannerUrl || coverUrl;

  const promoVideoUrl = course.promoVideoFileId
    ? FileService.getLessonVideoUrl(course.promoVideoFileId)
    : null;

  const rating = stats?.averageRating || 0;
  const studentsCount = stats?.totalStudents || 0;

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-32 md:pb-20">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden bg-[rgb(var(--bg-surface-strong))] text-white transition-all duration-500 ease-in-out"
        style={{ minHeight: showTrailer ? "60vh" : "auto" }}
      >
        {/* Background (Image or Gradient) */}
        {!showTrailer && (
          <div className="absolute inset-0 overflow-hidden">
            {backgroundUrl ? (
              <div className="h-full w-full">
                <img
                  src={backgroundUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-20 blur-xl animate-ken-burns"
                />
                <div className="absolute inset-0 bg-base-900/60" />
              </div>
            ) : (
              <div
                className="h-full w-full opacity-30"
                dangerouslySetInnerHTML={{ __html: svgBanner.svg }}
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-[rgb(var(--bg-base))] to-transparent" />
          </div>
        )}

        {/* Video Player Overlay */}
        <AnimatePresence>
          {showTrailer && promoVideoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black"
            >
              <div className="relative h-full w-full max-w-7xl mx-auto flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-30 text-white bg-black/50 hover:bg-black/70 rounded-full"
                  onClick={() => setShowTrailer(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <video
                  src={promoVideoUrl}
                  controls
                  autoPlay
                  className="max-h-full max-w-full shadow-2xl"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:flex lg:gap-12">
          {/* Left Content */}
          <motion.div
            className="lg:w-2/3"
            animate={{
              opacity: showTrailer ? 0 : 1,
              y: showTrailer ? 50 : 0,
              pointerEvents: showTrailer ? "none" : "auto",
            }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              {isDraft && (
                <span className="rounded bg-amber-500/20 border border-amber-500/50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-500">
                  {t("status.draft")}
                </span>
              )}
              {isOwner && (
                <span className="rounded bg-blue-500/20 border border-blue-500/50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                  {t("roles.teacher")}
                </span>
              )}

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
                {studentsCount} {t("courses.students")}
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

            {/* Promo Video Button (Mobile mainly, or if sidebar is hidden) */}
            {promoVideoUrl && (
              <div className="mt-6 lg:hidden">
                <Button onClick={() => setShowTrailer(true)} className="gap-2">
                  <Play className="h-4 w-4 fill-current" />{" "}
                  {t("teacher.lesson.preview")}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Validation Alert */}
          {(isDraft || isOwner) && (
            <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold mb-1">Modo de Vista Previa</p>
                <p>
                  {isOwner
                    ? "Estás viendo tu propio curso. Las opciones de compra y reseña están desactivadas."
                    : "Este curso aún no está publicado. Solo el instructor puede verlo."}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
              Descripción del curso
            </h2>
            <div
              className="prose prose-invert max-w-none text-[rgb(var(--text-secondary))]"
              style={{ whiteSpace: "pre-wrap" }}
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
            <div
              className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/20"
              style={
                !course.coverFileId
                  ? { background: getFallbackGradient(course.$id) }
                  : {}
              }
            >
              <img
                src={coverUrl || ""}
                alt=""
                className={`h-full w-full object-cover transition-opacity ${!coverUrl ? "hidden" : ""}`}
                style={{ opacity: showTrailer ? 0 : 1 }}
              />
              {!showTrailer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {promoVideoUrl ? (
                    <div
                      className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition hover:scale-110 cursor-pointer"
                      onClick={() => setShowTrailer(true)}
                    >
                      <Play className="ml-1 h-8 w-8 fill-white text-white shadow-xl" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-white/5 p-4 backdrop-blur-sm">
                      <Clock className="ml-0.5 h-8 w-8 text-white/50" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-2 text-3xl font-black text-[rgb(var(--text-primary))]">
                {formattedPrice}
              </div>

              <Button
                className="mb-3 w-full"
                size="lg"
                disabled={!canEnroll && !isOwner}
                onClick={() => {
                  if (isOwner) {
                    navigate(`/app/teach/courses/${id}`);
                    return;
                  }
                  if (!canEnroll) return;
                  // handleEnroll(); // Future implementation
                }}
              >
                {isOwner
                  ? t("courses.manage")
                  : isDraft
                    ? t("courses.unavailable")
                    : t("courses.enrollNow")}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                disabled={!canInteract}
                onClick={
                  canInteract ? () => console.log("Toggle favorite") : undefined
                }
              >
                <Heart className="mr-2 h-4 w-4" />
                {canInteract
                  ? t("courses.addToFavorites")
                  : t("courses.favoritesDisabled")}
              </Button>

              <div className="mt-6 space-y-3 text-sm text-[rgb(var(--text-secondary))]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> {t("courses.certificate")}
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> {t("courses.lifetimeAccess")}
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" /> {t("courses.level")}{" "}
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
              {isDraft ? t("status.draft") : "Oferta limitada"}
            </div>
          </div>
          <Button
            className="flex-1"
            size="lg"
            disabled={!canEnroll && !isOwner}
            onClick={() => {
              if (isOwner) {
                navigate(`/app/teach/courses/${id}`);
                return;
              }
              if (!canEnroll) return;
            }}
          >
            {isOwner ? t("courses.manage") : t("courses.enrollNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
