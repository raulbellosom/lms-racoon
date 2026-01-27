import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save, ClipboardList, BookOpen } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { useToast } from "../../../app/providers/ToastProvider";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { CharacterCountCircle } from "../../../features/teacher/components/CharacterCountCircle";

export function TeacherAssignmentEditorPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [lesson, setLesson] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [assignment, setAssignment] = React.useState(null);

  const [formData, setFormData] = React.useState({
    title: "", // Lesson title
    instructions: "", // Assignment instructions (Markdown)
    maxPoints: 100,
    dueDate: "",
  });

  // Dirty State Tracking
  const [initialData, setInitialData] = React.useState(null);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  React.useEffect(() => {
    if (!initialData) return;
    const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(isChanged);
  }, [formData, initialData]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get Lesson
      const lessonData = await LessonService.getById(lessonId);
      setLesson(lessonData);

      // 2. Get Assignment linked to this lesson
      // AssignmentService.listByLesson returns array
      const assignments = await AssignmentService.listByLesson(lessonId);

      let currentAssignment = null;
      if (assignments.length > 0) {
        currentAssignment = assignments[0];
        setAssignment(currentAssignment);
      }

      const initialForm = {
        title: lessonData.title || "",
        instructions:
          currentAssignment?.description ||
          currentAssignment?.instructions ||
          "",
        maxPoints: currentAssignment?.maxPoints || 100,
        dueDate: currentAssignment?.dueDate || "", // TODO: Handle date format
      };

      setFormData(initialForm);
      setInitialData(initialForm);
    } catch (error) {
      console.error("Failed to load assignment data", error);
      showToast(t("teacher.errors.loadFailed"), "error");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const mdeOptions = React.useMemo(
    () => ({
      spellChecker: false,
      minHeight: "500px",
      maxHeight: "calc(100vh - 280px)",
      placeholder: t("teacher.assignment.assignmentDescription"),
      status: false,
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
      ],
    }),
    [t],
  );

  const handleSave = async (returnToCourse = false) => {
    if (!formData.title.trim()) {
      showToast(t("teacher.form.titleRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      // 1. Update Lesson Title if changed
      if (formData.title !== lesson.title) {
        await LessonService.update(lessonId, { title: formData.title });
      }

      // 2. Create or Update Assignment
      const assignmentData = {
        lessonId,
        courseId,
        description: formData.instructions,
        title: formData.title,
        pointsMax: Number(formData.maxPoints),
        dueAt: formData.dueDate || null,
      };

      if (assignment) {
        const updated = await AssignmentService.update(
          assignment.$id,
          assignmentData,
        );
        setAssignment(updated);
      } else {
        const created = await AssignmentService.create(assignmentData);
        setAssignment(created);
      }

      showToast(t("common.saved"), "success");

      if (returnToCourse) {
        navigate(-1);
      } else {
        // Reset dirty state
        setInitialData({ ...formData });
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Save failed", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("teacher.assignment.editAssignment")}
            </h1>
            <p className="text-[rgb(var(--text-secondary))]">
              {t("teacher.assignment.settings")}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || !isDirty}
            className="min-w-[100px]"
          >
            {saving ? "..." : t("common.save")}
          </Button>

          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !isDirty}
            className="min-w-[140px]"
          >
            {saving ? (
              <span>{t("common.saving")}...</span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("common.save")} & {t("common.back")}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-4 text-[rgb(var(--brand-primary))]">
              <ClipboardList className="h-6 w-6" />
              <h2 className="font-bold text-lg">
                {t("teacher.form.generalInfo")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">
                    {t("teacher.assignment.assignmentTitle")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {160 - formData.title.length}
                    </span>
                    <CharacterCountCircle
                      current={formData.title.length}
                      max={160}
                      size={18}
                    />
                  </div>
                </div>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={t(
                    "teacher.assignment.assignmentTitlePlaceholder",
                  )}
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("teacher.assignment.maxPoints")}
                </label>
                <Input
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty string to clear the input
                    // Only parse if not empty
                    const numVal = val === "" ? "" : parseFloat(val);
                    setFormData((prev) => ({ ...prev, maxPoints: numVal }));
                  }}
                  min="0"
                />
              </div>

              {/* TODO: Date Picker for Due Date? Keeping simple input for now or could implement a date picker component if available */}
              {/* 
               <div>
                <label className="block text-sm font-medium mb-1">
                  {t("teacher.assignment.dueDate")}
                </label>
                 <Input
                  type="datetime-local"
                  value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              */}
            </div>
          </Card>
        </div>

        {/* Right Column: Instructions Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
                <h2 className="font-bold text-lg">
                  {t("teacher.assignment.assignmentDescription")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgb(var(--text-muted))]">
                  {7500 - formData.instructions.length}
                </span>
                <CharacterCountCircle
                  current={formData.instructions.length}
                  max={7500}
                  size={18}
                />
              </div>
            </div>
            <div className="prose-editor">
              <SimpleMDE
                value={formData.instructions}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, instructions: val }))
                }
                options={mdeOptions}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
