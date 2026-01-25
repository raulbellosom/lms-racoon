import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookText,
  Layers3,
  UploadCloud,
  ChevronLeft,
  Save,
  Eye,
  HelpCircle,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { db } from "../../../shared/appwrite/client";
import { FileService } from "../../../shared/data/files";
import { VideoPlayer } from "../../../shared/ui/VideoPlayer";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Dropdown, DropdownItem } from "../../../shared/ui/Dropdown";
import { ConfirmationModal } from "../../../shared/ui/ConfirmationModal";

// Modular components
import {
  CourseBasicInfoForm,
  CourseMediaUploader,
  CoursePricingForm,
  CurriculumEditor,
  LessonEditorModal,
  MarkdownDescriptionEditor,
} from "../../../features/teacher";

// Tab Button Component
function TabButton({
  active,
  icon: Icon,
  children,
  onClick,
  disabled = false,
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
        active
          ? "bg-[rgb(var(--brand-primary))/0.1] text-[rgb(var(--brand-primary))]"
          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

export function TeacherCourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [confirmation, setConfirmation] = React.useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default",
    confirmText: "",
  });

  const closeConfirmation = () => {
    setConfirmation((prev) => ({ ...prev, open: false }));
  };
  const isNew = courseId === "new";

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [tab, setTab] = React.useState(
    () => localStorage.getItem("teacher_course_editor_tab") || "details",
  );

  React.useEffect(() => {
    localStorage.setItem("teacher_course_editor_tab", tab);
  }, [tab]);
  const [categories, setCategories] = React.useState([]);

  // Curriculum State
  const [sections, setSections] = React.useState([]);
  const [lessonsBySection, setLessonsBySection] = React.useState({});

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState(null);
  const [sectionTitle, setSectionTitle] = React.useState("");

  // Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = React.useState(false);
  const [editingLesson, setEditingLesson] = React.useState(null);
  const [lessonSection, setLessonSection] = React.useState(null);

  // Video Preview State
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewLesson, setPreviewLesson] = React.useState(null);

  const handlePreviewLesson = (lesson) => {
    setPreviewLesson(lesson);
    setPreviewOpen(true);
  };

  // Form State
  const [formData, setFormData] = React.useState({
    title: "",
    subtitle: "",
    description: "",
    categoryId: "",
    level: "beginner",
    priceCents: 0,
    currency: "MXN",
    language: "es",
    coverFileId: "",
  });

  // Track initial state for dirty check
  const [initialFormData, setInitialFormData] = React.useState(null);

  const [errors, setErrors] = React.useState({});

  // Derived state for validation
  const isFormValid = React.useMemo(() => {
    const { title, subtitle, description, categoryId } = formData;
    return (
      title?.length >= 4 &&
      title?.length <= 120 &&
      subtitle?.length <= 180 &&
      description?.length <= 8000 &&
      !!categoryId
    );
  }, [formData]);

  const isDirty = React.useMemo(() => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  React.useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadCourse();
    } else {
      setLoading(false);
      // Set initial empty state for new course
      setInitialFormData({
        title: "",
        subtitle: "",
        description: "",
        categoryId: "",
        level: "beginner",
        priceCents: 0,
        currency: "MXN",
        language: "es",
        coverFileId: "",
        bannerFileId: "",
        promoVideoFileId: "",
        promoVideoCoverFileId: "",
      });
    }
  }, [courseId]);

  React.useEffect(() => {
    if (tab === "curriculum" && courseId && !isNew) {
      loadCurriculum();
    }
  }, [tab, courseId]);

  const loadCurriculum = async () => {
    try {
      const sects = await SectionService.listByCourse(courseId);
      setSections(sects);

      const lessonsMap = {};
      await Promise.all(
        sects.map(async (sec) => {
          const less = await LessonService.listBySection(sec.$id);
          lessonsMap[sec.$id] = less;
        }),
      );
      setLessonsBySection(lessonsMap);
    } catch (error) {
      console.error("Failed to load curriculum", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.categories,
      );
      setCategories(res.documents);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await TeacherCoursesService.getById(courseId);

      // Authorization check: Only course owner can edit
      if (data.teacherId !== auth.user?.$id) {
        showToast(
          t("teacher.errors.unauthorized") ||
            "No tienes permiso para editar este curso",
          "error",
        );
        navigate("/app/teach/courses");
        return;
      }

      setCourse(data);
      let promoVideoCoverFileId = "";
      if (data.promoVideoFileId) {
        try {
          // Find the lesson with this video to get its cover
          const lessons = await LessonService.listByCourse(courseId);
          const promoLesson = lessons.find(
            (l) => l.videoFileId === data.promoVideoFileId,
          );
          if (promoLesson?.videoCoverFileId) {
            promoVideoCoverFileId = promoLesson.videoCoverFileId;
          }
        } catch (e) {
          console.warn("Failed to resolve promo video cover", e);
        }
      }

      const loadedData = {
        title: data.title,
        subtitle: data.subtitle || "",
        description: data.description || "",
        categoryId: data.categoryId,
        level: data.level,
        priceCents: data.priceCents || 0,
        currency: data.currency || "MXN",
        language: data.language || "es",
        coverFileId: data.coverFileId || "",
        bannerFileId: data.bannerFileId || "",
        promoVideoFileId: data.promoVideoFileId || "",
        promoVideoCoverFileId: promoVideoCoverFileId, // Populated from lesson
      };
      setFormData(loadedData);
      setInitialFormData(loadedData);
    } catch (error) {
      console.error("Failed to load course", error);
      navigate("/app/teach/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    const newErrors = {};
    if (!formData.title) newErrors.title = t("teacher.form.titleRequired");
    if (!formData.categoryId)
      newErrors.categoryId = t("teacher.form.categoryRequired");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(t("teacher.errors.validationFailed"), "error");
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      // Sanitize data: Remove promoVideoCoverFileId strictly for UI state
      const { promoVideoCoverFileId, ...dataToSave } = formData;

      if (isNew) {
        const newCourse = await TeacherCoursesService.create({
          ...dataToSave,
          teacherId: auth.user.$id,
        });
        navigate(`/app/teach/courses/${newCourse.$id}`, { replace: true });
        setCourse(newCourse);
        setInitialFormData(formData);
        showToast(t("teacher.courseCreated"), "success");
      } else {
        const updated = await TeacherCoursesService.update(
          courseId,
          dataToSave,
        );
        setCourse(updated);
        setInitialFormData(formData);
        showToast(t("teacher.courseUpdated"), "success");
      }
    } catch (error) {
      console.error("Save failed", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  // Section handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionTitle("");
    setSectionModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionModalOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) return;

    try {
      if (editingSection) {
        const updated = await SectionService.update(editingSection.$id, {
          title: sectionTitle.trim(),
        });
        setSections(sections.map((s) => (s.$id === updated.$id ? updated : s)));
      } else {
        const newSec = await SectionService.create({
          courseId,
          title: sectionTitle.trim(),
          order: sections.length,
        });
        setSections([...sections, newSec]);
        setLessonsBySection({ ...lessonsBySection, [newSec.$id]: [] });
      }
      setSectionModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast(t("teacher.errors.saveFailed"), "error");
    }
  };

  const handleDeleteSection = (section) => {
    setConfirmation({
      open: true,
      title: t("teacher.curriculum.deleteSectionConfirm"),
      description:
        t("teacher.curriculum.deleteSectionDesc") ||
        "¿Estás seguro de que quieres eliminar esta sección? Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: t("common.delete"),
      onConfirm: async () => {
        try {
          await SectionService.delete(section.$id);
          setSections(sections.filter((s) => s.$id !== section.$id));
          closeConfirmation();
        } catch (e) {
          console.error(e);
          showToast(t("teacher.errors.deleteFailed"), "error");
          closeConfirmation();
        }
      },
    });
  };

  // Lesson handlers
  const handleAddLesson = (section) => {
    setEditingLesson(null);
    setLessonSection(section);
    setLessonModalOpen(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonSection(sections.find((s) => s.$id === lesson.sectionId));
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (lessonData, lessonId) => {
    try {
      if (lessonId) {
        const updated = await LessonService.update(lessonId, lessonData);
        setLessonsBySection({
          ...lessonsBySection,
          [lessonData.sectionId]: lessonsBySection[lessonData.sectionId].map(
            (l) => (l.$id === lessonId ? updated : l),
          ),
        });
      } else {
        const currentLessons = lessonsBySection[lessonData.sectionId] || [];
        const newLesson = await LessonService.create({
          ...lessonData,
          order: currentLessons.length,
        });
        setLessonsBySection({
          ...lessonsBySection,
          [lessonData.sectionId]: [...currentLessons, newLesson],
        });
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteLesson = (lesson) => {
    setConfirmation({
      open: true,
      title: t("teacher.curriculum.deleteLessonConfirm"),
      description:
        t("teacher.curriculum.deleteLessonDesc") ||
        "¿Estás seguro de que quieres eliminar esta lección?",
      variant: "destructive",
      confirmText: t("common.delete"),
      onConfirm: async () => {
        try {
          await LessonService.delete(lesson.$id);
          setLessonsBySection({
            ...lessonsBySection,
            [lesson.sectionId]: lessonsBySection[lesson.sectionId].filter(
              (l) => l.$id !== lesson.$id,
            ),
          });
          closeConfirmation();
        } catch (e) {
          console.error(e);
          showToast(t("teacher.errors.deleteFailed"), "error");
          closeConfirmation();
        }
      },
    });
  };

  // Publish handlers
  const handleTogglePublish = () => {
    const newState = !course?.isPublished;

    setConfirmation({
      open: true,
      title: newState
        ? t("teacher.publish.confirmPublish")
        : t("teacher.publish.confirmUnpublish"),
      description: newState
        ? t("teacher.publish.confirmPublishDesc") ||
          "El curso será visible para todos los estudiantes."
        : t("teacher.publish.confirmUnpublishDesc") ||
          "El curso dejará de ser visible para los estudiantes.",
      variant: newState ? "default" : "destructive",
      confirmText: newState
        ? t("teacher.publish.publishNow")
        : t("teacher.publish.unpublishNow"),
      onConfirm: async () => {
        try {
          const updated = await TeacherCoursesService.publish(
            courseId,
            newState,
          );
          setCourse(updated);
          showToast(
            newState ? t("teacher.published") : t("teacher.unpublished"),
            "success",
          );
          closeConfirmation();
        } catch (e) {
          console.error(e);
          showToast(t("teacher.errors.statusChangeFailed"), "error");
          closeConfirmation();
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgb(var(--brand-primary))] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 pb-24">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/teach/courses")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
                {isNew
                  ? t("teacher.createCourse")
                  : formData.title || t("teacher.editCourse")}
              </h1>
              {!isNew && (
                <Badge variant={course?.isPublished ? "success" : "secondary"}>
                  {course?.isPublished
                    ? t("teacher.status.published")
                    : t("teacher.status.draft")}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] truncate">
              {isNew ? t("teacher.form.generalInfo") : t("teacher.editCourse")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:flex"
            onClick={() => window.open(`/app/courses/${courseId}`, "_blank")}
          >
            <Eye className="mr-2 h-4 w-4" /> {t("teacher.lesson.preview")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 mb-4 sm:mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 sm:gap-2 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] pt-2 pb-0 min-w-max">
          <TabButton
            active={tab === "details"}
            onClick={() => setTab("details")}
            icon={BookText}
          >
            {t("teacher.tabs.details")}
          </TabButton>
          <TabButton
            active={tab === "curriculum"}
            onClick={() => !isNew && setTab("curriculum")}
            icon={Layers3}
            disabled={isNew}
          >
            {t("teacher.tabs.curriculum")}
          </TabButton>
          <TabButton
            active={tab === "quizzes"}
            onClick={() => !isNew && setTab("quizzes")}
            icon={HelpCircle}
            disabled={isNew}
          >
            {t("teacher.tabs.quizzes")}
          </TabButton>
          <TabButton
            active={tab === "assignments"}
            onClick={() => !isNew && setTab("assignments")}
            icon={ClipboardList}
            disabled={isNew}
          >
            {t("teacher.tabs.assignments")}
          </TabButton>
          <TabButton
            active={tab === "reviews"}
            onClick={() => !isNew && setTab("reviews")}
            icon={MessageSquare}
            disabled={isNew}
          >
            {t("teacher.tabs.reviews")}
          </TabButton>
          <TabButton
            active={tab === "publish"}
            onClick={() => !isNew && setTab("publish")}
            icon={UploadCloud}
            disabled={isNew}
          >
            {t("teacher.publish.title")}
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* === DETAILS TAB === */}
        {tab === "details" && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <CourseBasicInfoForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                errors={errors}
              />

              {/* Full-width Description Editor */}
              <MarkdownDescriptionEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                maxLength={8000}
              />
            </div>

            {/* Right Column: Media & Pricing */}
            <div className="space-y-4 sm:space-y-6">
              <CourseMediaUploader
                formData={formData}
                setFormData={setFormData}
                uploading={uploading}
                setUploading={setUploading}
                courseId={courseId}
              />
              <CoursePricingForm
                formData={formData}
                setFormData={setFormData}
              />

              {/* Save Button */}
              <div className="sticky bottom-24 z-10 lg:static">
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={handleSave}
                  disabled={saving || uploading || !isDirty || !isFormValid}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving
                    ? t("teacher.form.saving")
                    : t("teacher.form.saveChanges")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === CURRICULUM TAB === */}
        {tab === "curriculum" && (
          <CurriculumEditor
            sections={sections}
            lessonsBySection={lessonsBySection}
            onAddSection={handleAddSection}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onAddLesson={handleAddLesson}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            onPreviewLesson={handlePreviewLesson}
          />
        )}

        {/* === QUIZZES TAB === */}
        {tab === "quizzes" && (
          <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
            <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("teacher.quiz.noQuizzes")}</p>
            <Button className="mt-4">{t("teacher.quiz.createQuiz")}</Button>
          </Card>
        )}

        {/* === ASSIGNMENTS TAB === */}
        {tab === "assignments" && (
          <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
            <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("teacher.assignment.noAssignments")}</p>
            <Button className="mt-4">
              {t("teacher.assignment.createAssignment")}
            </Button>
          </Card>
        )}

        {/* === REVIEWS TAB === */}
        {tab === "reviews" && (
          <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("teacher.reviews.noReviews")}</p>
          </Card>
        )}

        {/* === PUBLISH TAB === */}
        {tab === "publish" && (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  course?.isPublished
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {course?.isPublished
                  ? t("teacher.publish.published")
                  : t("teacher.publish.draft")}
              </h3>
              <p className="mt-2 max-w-md text-[rgb(var(--text-secondary))]">
                {course?.isPublished
                  ? t("teacher.publish.publishedDesc")
                  : t("teacher.publish.draftDesc")}
              </p>

              <div className="mt-8">
                <Button
                  size="lg"
                  variant={course?.isPublished ? "secondary" : "primary"}
                  onClick={handleTogglePublish}
                >
                  {course?.isPublished
                    ? t("teacher.publish.unpublishCourse")
                    : t("teacher.publish.publishNow")}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Section Modal */}
      <Modal
        open={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title={
          editingSection
            ? t("teacher.curriculum.editSection")
            : t("teacher.addSection")
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.curriculum.sectionTitle")}
            </label>
            <Input
              placeholder={t("teacher.curriculum.sectionTitlePlaceholder")}
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSectionModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveSection}>{t("common.save")}</Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <LessonEditorModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        lesson={editingLesson}
        section={lessonSection}
        courseId={courseId}
        onSave={handleSaveLesson}
      />

      {/* Video Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewLesson(null);
        }}
        title={`Vista previa: ${previewLesson?.title || ""}`}
        className="max-w-4xl sm:max-w-5xl lg:max-w-7xl"
      >
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {previewLesson?.videoFileId ? (
            <VideoPlayer
              src={FileService.getLessonVideoUrl(previewLesson.videoFileId)}
              poster={
                previewLesson.videoCoverFileId
                  ? FileService.getCourseCoverUrl(
                      previewLesson.videoCoverFileId,
                      { width: 1280, height: 720 },
                    )
                  : null
              }
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              No hay video disponible
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmation.open}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        description={confirmation.description}
        variant={confirmation.variant}
        confirmText={confirmation.confirmText}
      />
    </div>
  );
}
