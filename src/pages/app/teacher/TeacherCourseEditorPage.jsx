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
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { db } from "../../../shared/appwrite/client";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";

// Modular components
import {
  CourseBasicInfoForm,
  CourseMediaUploader,
  CoursePricingForm,
  CurriculumEditor,
  LessonEditorModal,
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
  const isNew = courseId === "new";

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [tab, setTab] = React.useState("details");
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

  React.useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadCourse();
    } else {
      setLoading(false);
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
      setCourse(data);
      setFormData({
        title: data.title,
        subtitle: data.subtitle || "",
        description: data.description || "",
        categoryId: data.categoryId,
        level: data.level,
        priceCents: data.priceCents || 0,
        currency: data.currency || "MXN",
        language: data.language || "es",
        coverFileId: data.coverFileId || "",
      });
    } catch (error) {
      console.error("Failed to load course", error);
      navigate("/app/teach/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.categoryId) {
      alert(
        `${t("teacher.form.titleRequired")}. ${t("teacher.form.categoryRequired")}`,
      );
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const newCourse = await TeacherCoursesService.create({
          ...formData,
          teacherId: auth.user.$id,
        });
        navigate(`/app/teach/courses/${newCourse.$id}`, { replace: true });
        setCourse(newCourse);
      } else {
        const updated = await TeacherCoursesService.update(courseId, formData);
        setCourse(updated);
      }
    } catch (error) {
      console.error("Save failed", error);
      alert(t("teacher.errors.saveFailed"));
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
      alert(t("teacher.errors.saveFailed"));
    }
  };

  const handleDeleteSection = async (section) => {
    if (!confirm(t("teacher.curriculum.deleteSectionConfirm"))) return;
    try {
      await SectionService.delete(section.$id);
      setSections(sections.filter((s) => s.$id !== section.$id));
    } catch (e) {
      console.error(e);
      alert(t("teacher.errors.deleteFailed"));
    }
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

  const handleDeleteLesson = async (lesson) => {
    if (!confirm(t("teacher.curriculum.deleteLessonConfirm"))) return;
    try {
      await LessonService.delete(lesson.$id);
      setLessonsBySection({
        ...lessonsBySection,
        [lesson.sectionId]: lessonsBySection[lesson.sectionId].filter(
          (l) => l.$id !== lesson.$id,
        ),
      });
    } catch (e) {
      console.error(e);
      alert(t("teacher.errors.deleteFailed"));
    }
  };

  // Publish handlers
  const handleTogglePublish = async () => {
    const newState = !course?.isPublished;
    const msg = newState
      ? t("teacher.publish.confirmPublish")
      : t("teacher.publish.confirmUnpublish");
    if (!confirm(msg)) return;

    try {
      const updated = await TeacherCoursesService.publish(courseId, newState);
      setCourse(updated);
    } catch (e) {
      console.error(e);
      alert(t("teacher.errors.statusChangeFailed"));
    }
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
        {!isNew && (
          <Button variant="secondary" size="sm" className="hidden sm:flex">
            <Eye className="mr-2 h-4 w-4" /> {t("teacher.lesson.preview")}
          </Button>
        )}
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
            <div className="lg:col-span-2">
              <CourseBasicInfoForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
              />
            </div>

            {/* Right Column: Media & Pricing */}
            <div className="space-y-4 sm:space-y-6">
              <CourseMediaUploader
                formData={formData}
                setFormData={setFormData}
                uploading={uploading}
                setUploading={setUploading}
              />
              <CoursePricingForm
                formData={formData}
                setFormData={setFormData}
              />

              {/* Save Button */}
              <div className="sticky bottom-4 z-10">
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={handleSave}
                  disabled={saving || uploading}
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
    </div>
  );
}
