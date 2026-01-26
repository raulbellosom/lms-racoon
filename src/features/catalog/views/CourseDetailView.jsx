import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { CourseMetaTags } from "../components/CourseMetaTags";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getRandomBanner, getBannerById } from "../../../shared/assets/banners";
import { CategoryService } from "../../../shared/data/categories";
import { FavoritesService } from "../../../shared/data/favorites";

export function CourseDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState(null);
  const [category, setCategory] = React.useState(null);

  const [isFavorite, setIsFavorite] = React.useState(false);
  const [favoritesCount, setFavoritesCount] = React.useState(0);
  const [togglingFavorite, setTogglingFavorite] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id, auth.user]); // Reload if auth changes

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const [courseData, sectionsData, lessonsData, statsData, favsCountInit] =
        await Promise.all([
          TeacherCoursesService.getById(id),
          SectionService.listByCourse(id),
          LessonService.listByCourse(id),
          StatsService.getCourseStats(id),
          FavoritesService.getCourseFavoritesCount(id),
        ]);

      let favsCount = favsCountInit;

      if (auth.user) {
        try {
          const isFav = await FavoritesService.isFavorite(auth.user.$id, id);
          setIsFavorite(isFav);
        } catch (err) {
          console.error("Failed to load user favorites status", err);
        }
      } else {
        setIsFavorite(false);
      }

      const content = sectionsData.map((section) => ({
        title: section.title,
        lessons: lessonsData.filter((l) => l.sectionId === section.$id),
      }));

      setCourse({ ...courseData, content });
      setStats(statsData);
      setFavoritesCount(favsCount);

      // Fetch promo video cover if applicable
      if (courseData.promoVideoFileId) {
        try {
          const promoLesson = lessonsData.find(
            (l) => l.videoFileId === courseData.promoVideoFileId,
          );
          if (promoLesson?.videoCoverFileId) {
            courseData.promoVideoCoverFileId = promoLesson.videoCoverFileId;
          }
        } catch (e) {
          console.warn("Failed to resolve promo video cover", e);
        }
      }
      // Re-set course with promo cover
      setCourse({
        ...courseData,
        content,
        promoVideoCoverFileId: courseData.promoVideoCoverFileId,
      });

      // Fetch category if exists
      if (courseData.categoryId) {
        try {
          const cat = await CategoryService.getById(courseData.categoryId);
          setCategory(cat);
        } catch (error) {
          console.error("Failed to load category", error);
          setCategory({ name: "General", slug: "general" });
        }
      } else {
        console.log("No categoryId found in course");
      }
    } catch (error) {
      console.error("Failed to load course details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!auth.user) return; // Should be hidden, but safety check

    setTogglingFavorite(true);
    try {
      if (isFavorite) {
        await FavoritesService.removeFromFavorites(auth.user.$id, course.$id);
        setIsFavorite(false);
        setFavoritesCount((prev) => Math.max(0, prev - 1));
      } else {
        await FavoritesService.addToFavorites(auth.user.$id, course.$id);
        setIsFavorite(true);
        setFavoritesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setTogglingFavorite(false);
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
        <h2 className="mb-2 text-2xl font-bold">{t("courses.notFound")}</h2>
        <Button onClick={() => navigate(-1)}>{t("courses.goBack")}</Button>
      </div>
    );
  }

  // Access Control: Only course owner can view unpublished courses
  if (!course.isPublished && auth.user?.$id !== course.teacherId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[rgb(var(--bg-base))] p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold">{t("courses.notAvailable")}</h2>
        <p className="mb-4 text-[rgb(var(--text-secondary))]">
          {t("courses.notPublished")}
        </p>
        <Button onClick={() => navigate("/app/explore")}>
          {t("courses.exploreCourses")}
        </Button>
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

  const promoVideoUrl = course.promoVideoFileId
    ? FileService.getLessonVideoUrl(course.promoVideoFileId)
    : null;

  const rating = stats?.averageRating || 0;
  // Use DB students count or 0, maybe stats logic differs but let's stick to existing
  // The user prompt asked to "ver cuantas personas tiene en favoritos ese curso de manera publica"
  // so we display favoritesCount.
  const totalStudents = stats?.totalStudents || 0;

  let activeMediaType = "cover";
  let activeMediaUrl = coverUrl;

  // Resolve Banner (Pattern or File)
  let resolvedBannerUrl = null;
  if (course.bannerFileId) {
    const pattern = getBannerById(course.bannerFileId);
    resolvedBannerUrl = pattern
      ? pattern.url
      : FileService.getCourseCoverUrl(course.bannerFileId);
  }

  if (course.promoVideoFileId) {
    activeMediaType = "video";
    activeMediaUrl = FileService.getLessonVideoUrl(course.promoVideoFileId);
  } else if (resolvedBannerUrl) {
    activeMediaType = "banner";
    activeMediaUrl = resolvedBannerUrl;
  }

  return (
    <>
      <CourseMetaTags course={course} />
      <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-32 md:pb-20">
        {/* Hero Section */}
        <div className="relative min-h-[300px] overflow-hidden bg-[rgb(var(--bg-surface-strong))] text-white">
          {/* Blurred Background */}
          {/* Blurred Background with Dark Overlay for Better Contrast */}
          <div className="absolute inset-0">
            <img
              src={resolvedBannerUrl || coverUrl || ""}
              alt=""
              className="h-full w-full object-cover opacity-50 blur-md scale-110"
            />
            {/* Always dark overlay to ensure white text readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>

          {/* Content Grid */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 md:py-12">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center min-h-[250px]">
              {/* Left: Course Info */}
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-white/90 hover:text-white hover:bg-white/20 pl-0"
                    onClick={() => {
                      if (window.history.length > 1) {
                        navigate(-1);
                      } else {
                        navigate(auth.user ? "/app/explore" : "/catalog");
                      }
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("common.back") || "Volver"}
                  </Button>
                </div>

                {/* Badges */}
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  {/* Category Badge */}
                  {category && (
                    <button
                      onClick={() =>
                        navigate(`/app/explore?category=${category.slug}`)
                      }
                      className="rounded bg-brand-primary/20 border border-brand-primary/50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-brand-primary-light hover:bg-brand-primary/30 transition-colors cursor-pointer"
                    >
                      {category.name}
                    </button>
                  )}
                  {/* Level Badge */}
                  <button
                    onClick={() =>
                      navigate(`/app/explore?level=${course.level}`)
                    }
                    className="rounded bg-blue-500/20 border border-blue-500/50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-500/30 transition-colors cursor-pointer"
                  >
                    {t(`courses.levels.${course.level}`)}
                  </button>
                  {/* Rating */}
                  <span className="flex items-center gap-1 text-base font-medium text-amber-400">
                    <span className="text-amber-400 text-lg">★</span>{" "}
                    {rating.toFixed(1)}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold md:text-4xl lg:text-5xl leading-tight text-white mb-4 drop-shadow-lg">
                  {course.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl drop-shadow-md">
                  {course.subtitle}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-white/80 font-medium mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {totalStudents} {t("courses.students")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {favoritesCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {t("courses.lastUpdated")}:{" "}
                    {new Date(course.$updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />{" "}
                    {t(`common.languages.${course.language}`) ||
                      course.language}
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Share - Always visible for published */}
                  {!isDraft && course.isPublished && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const shareUrl = `${window.location.protocol}//${window.location.host}/courses/${course.$id}`;

                        const shareData = {
                          title: course.title,
                          text: course.subtitle,
                          url: shareUrl,
                        };

                        try {
                          if (navigator.share) {
                            await navigator.share(shareData);
                          } else {
                            await navigator.clipboard.writeText(shareUrl);
                            console.log("Link copied to clipboard!");
                          }
                        } catch (err) {
                          console.error("Share failed:", err);
                        }
                      }}
                      className="gap-2 border-white/30 bg-black/30 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                      {t("common.share") || "Compartir"}
                    </Button>
                  )}

                  {/* Add to Favorites - Only if Logged In */}
                  {auth.user && !isOwner && (
                    <Button
                      variant={isFavorite ? "secondary" : "outline"}
                      onClick={handleToggleFavorite}
                      disabled={togglingFavorite}
                      className={`gap-2 ${isFavorite ? "text-red-500 bg-white" : "border-white/30 bg-black/30 text-white hover:bg-white/20 hover:text-white"}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                      />
                      {isFavorite ? "Favorito" : t("courses.addToFavorites")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Banner Image or Video */}
              <div className="flex items-center justify-center lg:justify-end">
                <div className="w-full max-w-xl">
                  {activeMediaType === "video" ? (
                    <video
                      src={activeMediaUrl}
                      controls
                      className="w-full rounded-xl shadow-2xl border border-white/10"
                      poster={
                        course.promoVideoCoverFileId
                          ? FileService.getCourseCoverUrl(
                              course.promoVideoCoverFileId,
                            )
                          : coverUrl || undefined
                      }
                    />
                  ) : (
                    <img
                      src={activeMediaUrl || ""}
                      alt={course.title}
                      className="w-full rounded-xl shadow-2xl border border-white/10"
                    />
                  )}
                </div>
              </div>
            </div>
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
                  <p className="font-bold mb-1">{t("courses.previewMode")}</p>
                  <p>
                    {isOwner
                      ? t("courses.previewModeOwner")
                      : t("courses.previewModeUnpublished")}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
                {t("courses.courseDescription")}
              </h2>
              <div className="markdown-content text-[rgb(var(--text-secondary))]">
                {course.description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(course.description || "")
                      .replace(/\r\n/g, "\n")
                      .replace(/\n(\* |\d+\. |> )/g, "\n\n$1")}
                  </ReactMarkdown>
                ) : (
                  <p>{t("courses.noDescription")}</p>
                )}
              </div>
            </section>

            {/* Curriculum */}
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
                {t("courses.courseContent")}
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
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {promoVideoUrl ? (
                    <div
                      className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition hover:scale-110 cursor-pointer"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        // setIsExpanded(true); // Assuming logic exists if expanded, else just scroll
                      }}
                    >
                      <Play className="ml-1 h-8 w-8 fill-white text-white shadow-xl" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-white/5 p-4 backdrop-blur-sm">
                      <Clock className="ml-0.5 h-8 w-8 text-white/50" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-2 text-3xl font-black text-[rgb(var(--text-primary))]">
                  {formattedPrice}
                </div>

                {/* Primary Action Button (Buy/Access) */}
                <Button
                  className="mb-3 w-full"
                  size="lg"
                  disabled={!canEnroll && !isOwner}
                  onClick={() => {
                    if (isOwner) {
                      navigate(`/app/teach/courses/${id}`);
                      return;
                    }
                    if (!auth.user) {
                      navigate("/auth/register", {
                        state: { returnUrl: location.pathname },
                      });
                      return;
                    }
                    // handleEnroll();
                  }}
                >
                  {isOwner
                    ? t("courses.manage")
                    : isDraft
                      ? t("courses.unavailable")
                      : t("courses.buyCourse") || "Comprar curso"}
                </Button>

                {/* Secondary Action (Add to Cart) */}
                {!isOwner && !isDraft && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Handle Add to Cart
                      console.log("Add to cart");
                    }}
                  >
                    {t("courses.addToCart") || "Añadir al carrito"}
                  </Button>
                )}

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
        {/* Adjusted Z-index and Bottom position to respect AppLayout specific navigation */}
        <div
          className={`fixed left-0 right-0 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 shadow-top lg:hidden transition-all duration-300 ${
            auth.user
              ? "z-30 bottom-[calc(3.8rem+env(safe-area-inset-bottom))]"
              : "z-50 bottom-0 pb-safe"
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-[rgb(var(--text-primary))]">
                  {formattedPrice}
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  {isDraft ? t("status.draft") : "Oferta limitada"}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Add to Cart (Mobile) */}
              {!isOwner && !isDraft && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    console.log("Add to cart");
                  }}
                >
                  {t("courses.addToCart") || "Carrito"}
                </Button>
              )}

              {/* Buy Button (Mobile) */}
              <Button
                className="flex-[2]"
                size="lg"
                disabled={!canEnroll && !isOwner}
                onClick={() => {
                  if (isOwner) {
                    navigate(`/app/teach/courses/${id}`);
                    return;
                  }
                  if (!canEnroll) return;
                  // handleEnroll();
                }}
              >
                {isOwner
                  ? t("courses.manage")
                  : t("courses.buyCourse") || "Comprar curso"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
