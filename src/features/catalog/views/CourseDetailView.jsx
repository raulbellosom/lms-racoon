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
  ShoppingCart,
  ShoppingBag,
  Star,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "../../../shared/ui/Card";

import { Button } from "../../../shared/ui/Button";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { CourseMetaTags } from "../components/CourseMetaTags";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getProfileById, ProfileService } from "../../../shared/data/profiles";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../shared/ui/Tabs";
import { Avatar } from "../../../shared/ui/Avatar";
import { Modal } from "../../../shared/ui/Modal";
import { getRandomBanner, getBannerById } from "../../../shared/assets/banners";
import { CategoryService } from "../../../shared/data/categories";
import { FavoritesService } from "../../../shared/data/favorites";

import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { checkEnrollmentStatus } from "../../../shared/data/enrollments";

const SOCIAL_ICONS = {
  website: Globe,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  tiktok: Globe,
  discord: Globe,
  phone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  whatsappGroup: Users,
  other: Globe,
};

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
  const [instructor, setInstructor] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("description");
  const [showAllSocials, setShowAllSocials] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    React.useState(false);
  const [shouldShowShowMore, setShouldShowShowMore] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(null);
  const reviewsRef = React.useRef(null);
  const descriptionRef = React.useRef(null);

  React.useEffect(() => {
    const checkHeight = () => {
      if (descriptionRef.current) {
        const height = descriptionRef.current.scrollHeight;
        setShouldShowShowMore(height > 300);
      }
    };

    // Use ResizeObserver for more robust height detection (handles content changes better)
    const observer = new ResizeObserver(checkHeight);
    if (descriptionRef.current) {
      observer.observe(descriptionRef.current);
    }

    // Also check on mount
    checkHeight();

    return () => observer.disconnect();
  }, [course?.description]);

  const handleScrollToReviews = () => {
    setActiveTab("reviews");
    setTimeout(() => {
      reviewsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const [isFavorite, setIsFavorite] = React.useState(false);
  const [favoritesCount, setFavoritesCount] = React.useState(0);
  const [togglingFavorite, setTogglingFavorite] = React.useState(false);
  const [isEnrolled, setIsEnrolled] = React.useState(false);

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
          const [isFav, enrolled] = await Promise.all([
            FavoritesService.isFavorite(auth.user.$id, id),
            checkEnrollmentStatus(auth.user.$id, id),
          ]);
          setIsFavorite(isFav);
          setIsEnrolled(enrolled);
        } catch (err) {
          console.error("Failed to load user status", err);
        }
      } else {
        setIsFavorite(false);
        setIsEnrolled(false);
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

      // Fetch Instructor
      if (courseData.teacherId) {
        getProfileById(courseData.teacherId)
          .then((teacher) => setInstructor(teacher))
          .catch((err) => console.error("Failed to load instructor", err));
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
    return <LoadingScreen />;
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

  /*
   * Handle Promo Video (MinIO HLS)
   * Legacy Appwrite video support is removed.
   */
  const promoVideoUrl =
    course.promoVideoProvider === "minio" ? course.promoVideoHlsUrl : null;

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

  if (course.promoVideoProvider === "minio" && course.promoVideoHlsUrl) {
    activeMediaType = "video";
    activeMediaUrl = course.promoVideoHlsUrl;
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
                  <button
                    onClick={handleScrollToReviews}
                    className="flex items-center gap-1 text-base font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <span className="text-amber-400 text-lg">★</span>{" "}
                    {rating.toFixed(1)}
                  </button>
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

            {/* Content Tabs */}
            <div className="mb-10" ref={reviewsRef}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="description">
                    {t("courses.description") || "Descripción"}
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    {t("courses.reviews.title")} ({stats?.ratingCount || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description">
                  <div className="relative">
                    <motion.div
                      initial={false}
                      animate={{
                        height:
                          !isDescriptionExpanded && shouldShowShowMore
                            ? 300
                            : "auto",
                      }}
                      className="overflow-hidden relative"
                      transition={{
                        duration: 0.5,
                        ease: [0.04, 0.62, 0.23, 0.98],
                      }}
                    >
                      <div
                        ref={descriptionRef}
                        className="markdown-content text-[rgb(var(--text-secondary))]"
                      >
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

                      {/* Fade Overlay - only show if collapsed AND content is long */}
                      <AnimatePresence>
                        {!isDescriptionExpanded && shouldShowShowMore && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-[rgb(var(--bg-base))] to-transparent pointer-events-none z-10"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {shouldShowShowMore && (
                      <div className="mt-4 flex justify-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setIsDescriptionExpanded(!isDescriptionExpanded)
                          }
                          className="text-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary-light))] transition-colors gap-2 p-0 font-bold"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              {t("common.showLess") || "Ver menos"}
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              {t("common.showMore") || "Ver más"}
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Instructor Section */}
                  {instructor && (
                    <div className="mt-12 pt-8 border-t border-[rgb(var(--border-base))]">
                      <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-6">
                        {t("courses.aboutInstructor")}
                      </h3>
                      <Card className="p-6 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]">
                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="shrink-0 flex flex-col items-center gap-4">
                            <Avatar
                              src={ProfileService.getAvatarUrl(
                                instructor.avatarFileId,
                              )}
                              name={instructor.displayName || "Instructor"}
                              className="h-24 w-24 text-2xl"
                              ring
                            />

                            {/* Socials */}
                            {instructor.socials && (
                              <div className="flex flex-wrap gap-2 justify-center">
                                {(() => {
                                  try {
                                    const socials =
                                      typeof instructor.socials === "string"
                                        ? JSON.parse(instructor.socials)
                                        : instructor.socials;

                                    const allItems = [];
                                    // Standard
                                    Object.entries(socials || {}).forEach(
                                      ([key, value]) => {
                                        if (key === "others" || !value) return;
                                        allItems.push({
                                          key,
                                          value,
                                          label:
                                            t(
                                              `profile.socials.networks.${key}`,
                                            ) || key,
                                          icon: SOCIAL_ICONS[key] || Globe,
                                        });
                                      },
                                    );
                                    // Others
                                    if (Array.isArray(socials.others)) {
                                      socials.others.forEach((other, idx) => {
                                        if (!other.value) return;
                                        allItems.push({
                                          key: `other-${idx}`,
                                          value: other.value,
                                          label: other.label,
                                          icon: Globe,
                                        });
                                      });
                                    }

                                    const visibleItems = allItems.slice(0, 3);
                                    const remainingCount = allItems.length - 3;

                                    return (
                                      <>
                                        {visibleItems.map((item) => {
                                          const Icon = item.icon;
                                          const href =
                                            item.key === "email"
                                              ? `mailto:${item.value}`
                                              : item.key === "phone"
                                                ? `tel:${item.value}`
                                                : item.value.startsWith("http")
                                                  ? item.value
                                                  : `https://${item.value}`;

                                          return (
                                            <a
                                              key={item.key}
                                              href={href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-full bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white transition-all hover:scale-110 active:scale-95"
                                              title={item.label || item.key}
                                            >
                                              <Icon className="h-4 w-4" />
                                            </a>
                                          );
                                        })}

                                        {remainingCount > 0 && (
                                          <button
                                            onClick={() =>
                                              setShowAllSocials(true)
                                            }
                                            className="px-3 py-1.5 rounded-full bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white transition-all text-xs font-bold flex items-center justify-center hover:scale-110 active:scale-95"
                                            title={t("common.viewAll")}
                                          >
                                            +{remainingCount}
                                          </button>
                                        )}

                                        {/* Modal for all socials */}
                                        <Modal
                                          open={showAllSocials}
                                          onClose={() =>
                                            setShowAllSocials(false)
                                          }
                                          title={t("profile.socials.title")}
                                          size="md"
                                        >
                                          <div className="space-y-4">
                                            {allItems.map((item) => {
                                              const Icon = item.icon;
                                              const href =
                                                item.key === "email"
                                                  ? `mailto:${item.value}`
                                                  : item.key === "phone"
                                                    ? `tel:${item.value}`
                                                    : item.value.startsWith(
                                                          "http",
                                                        )
                                                      ? item.value
                                                      : `https://${item.value}`;

                                              const handleCopy = (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(
                                                  item.value,
                                                );
                                                setCopiedKey(item.key);
                                                setTimeout(
                                                  () => setCopiedKey(null),
                                                  2000,
                                                );
                                              };

                                              const handleOpen = (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.open(
                                                  href,
                                                  "_blank",
                                                  "noopener,noreferrer",
                                                );
                                              };

                                              return (
                                                <div
                                                  key={item.key}
                                                  className="flex items-center gap-3 p-3 rounded-2xl bg-[rgb(var(--bg-muted))] border border-transparent hover:border-[rgb(var(--brand-primary))] hover:border-opacity-30 transition-all group"
                                                >
                                                  <div className="shrink-0 p-2.5 rounded-xl bg-[rgb(var(--bg-surface))] text-[rgb(var(--brand-primary))] shadow-sm">
                                                    <Icon className="h-5 w-5" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black text-[rgb(var(--brand-primary))] uppercase tracking-widest opacity-80 mb-0.5">
                                                      {item.label}
                                                    </div>
                                                    <div className="text-sm font-bold text-[rgb(var(--text-primary))] truncate mb-1">
                                                      {item.value}
                                                    </div>
                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                      <button
                                                        onClick={handleCopy}
                                                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white transition-all text-xs font-bold shadow-sm"
                                                      >
                                                        {copiedKey ===
                                                        item.key ? (
                                                          <>
                                                            <Check className="h-3 w-3" />
                                                            Copiado
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Copy className="h-3 w-3" />
                                                            Copiar
                                                          </>
                                                        )}
                                                      </button>
                                                      <button
                                                        onClick={handleOpen}
                                                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white transition-all text-xs font-bold shadow-sm"
                                                      >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Abrir
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </Modal>
                                      </>
                                    );
                                  } catch (e) {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 text-center sm:text-left">
                            <div className="mb-1 text-lg font-bold text-[rgb(var(--text-primary))]">
                              {instructor.firstName} {instructor.lastName}
                            </div>
                            {instructor.headline && (
                              <div className="mb-4 text-sm font-medium text-[rgb(var(--brand-primary))] uppercase tracking-wide">
                                {instructor.headline}
                              </div>
                            )}
                            <div className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line leading-relaxed">
                              {instructor.bio || "Instructor en Racoon LMS."}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="py-8">
                    <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl bg-[rgb(var(--bg-muted))]">
                      <div className="text-center">
                        <div className="text-4xl font-black text-[rgb(var(--text-primary))]">
                          {(stats?.averageRating || 0).toFixed(1)}
                        </div>
                        <div className="flex text-amber-400 justify-center my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= Math.round(stats?.averageRating || 0) ? "fill-current" : "text-[rgb(var(--text-tertiary))]"}`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                          {t("courses.reviews.totalReviews") || "valoraciones"}
                        </div>
                      </div>
                      <div className="h-12 w-px bg-[rgb(var(--border-base))]" />
                      <div className="flex-1 text-sm text-[rgb(var(--text-secondary))]">
                        <p>{t("courses.reviews.verifiedSource")}</p>
                      </div>
                    </div>

                    {/* Placeholder for actual reviews list */}
                    <div className="text-center py-12 text-[rgb(var(--text-muted))]">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>{t("courses.reviews.noReviewsTitle")}</p>
                      <p className="text-xs mt-1">
                        {t("courses.reviews.noReviewsDesc")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Curriculum */}
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--text-primary))]">
                {t("courses.courseContent")}
              </h2>
              <CourseCurriculum
                content={course.content || []}
                isEnrolled={isEnrolled || isOwner}
                onPlayPreview={(lessonId) => {
                  // If we are enrolled, we might want to go to learn page?
                  // Or open a modal? The user asked for "btn to go to player".
                  // If enrolled -> navigate to learn page.
                  // If not enrolled (free preview) -> navigate to learn page (since we established we handle it there)
                  navigate(`/app/learn/${id}/${lessonId}`);
                }}
              />
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

                <div className="flex gap-3">
                  {/* Secondary Action (Add to Cart) - Icon Button */}
                  {!isOwner && !isDraft && (
                    <Button
                      variant="outline"
                      className="h-12 w-16 shrink-0 border-border-base hover:bg-bg-surface-hover"
                      title={t("courses.addToCart")}
                      onClick={() => {
                        // Handle Add to Cart
                        console.log("Add to cart");
                      }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Primary Action Button (Buy/Access) */}
                  <Button
                    className="h-12 w-full flex-1 shadow-lg shadow-brand-primary/20"
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
                    {isOwner ? (
                      t("courses.manage")
                    ) : isDraft ? (
                      t("courses.unavailable")
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        {t("courses.buyCourse") || "Comprar curso"}
                      </>
                    )}
                  </Button>
                </div>

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
              ? "z-30 bottom-[calc(3.85rem+env(safe-area-inset-bottom,0px))]"
              : "z-50 bottom-0 pb-safe"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="text-xl font-black text-[rgb(var(--text-primary))] leading-tight">
                {formattedPrice}
              </div>
              <div className="text-[10px] font-medium text-[rgb(var(--text-muted))] italic">
                {isDraft ? t("status.draft") : "Oferta limitada"}
              </div>
            </div>

            <div className="flex flex-1 gap-2 items-center">
              {/* Add to Cart (Mobile) - Icon Only */}
              {!isOwner && !isDraft && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border-base bg-bg-surface text-text-primary hover:bg-bg-surface-hover"
                  onClick={() => {
                    console.log("Add to cart");
                  }}
                  title={t("courses.addToCart")}
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              )}

              {/* Buy Button (Mobile) */}
              <Button
                className="flex-1 h-11 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/25"
                size="sm"
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
                {isOwner ? (
                  t("courses.manage")
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {t("courses.buyCourse") || "Comprar curso"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
