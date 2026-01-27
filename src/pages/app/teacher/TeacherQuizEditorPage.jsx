import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import {
  QuizQuestionService,
  QuizService,
} from "../../../shared/data/quizzes-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { FileService } from "../../../shared/data/files";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { CharacterCountCircle } from "../../../features/teacher/components/CharacterCountCircle";

const QUESTION_TYPES = [
  { value: "single", label: "teacher.quiz.singleChoice" },
  { value: "multi", label: "teacher.quiz.multipleChoice" },
  { value: "trueFalse", label: "teacher.quiz.trueFalse" },
  { value: "short", label: "teacher.quiz.shortAnswer" },
  { value: "image", label: "teacher.quiz.imageQuestion" },
];

// Sortable Item Component
function SortableQuestionItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* 
         Use render prop pattern to pass drag handle props to children 
         without polluting DOM elements with unknown props.
      */}
      {typeof children === "function"
        ? children({ ...attributes, ...listeners })
        : children}
    </div>
  );
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: "0.5" },
    },
  }),
};

export function TeacherQuizEditorPage() {
  const { t } = useTranslation();
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quiz, setQuiz] = React.useState(null);
  const [lesson, setLesson] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    timeLimitSec: 0,
    attemptsAllowed: 0,
    passingScore: 0.7,
  });

  const [questions, setQuestions] = React.useState([]);

  // Dirty Checking State
  const [initialData, setInitialData] = React.useState(null);
  const [isDirty, setIsDirty] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState(null); // For DragOverlay

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor),
  );

  // Load Quiz Data
  React.useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const lessonData = await LessonService.getById(lessonId);
        setLesson(lessonData);

        // Try to find existing quiz for this lesson
        const quizzes = await QuizService.listByLesson(lessonId);
        if (quizzes.length > 0) {
          const existingQuiz = quizzes[0];
          setQuiz(existingQuiz);
          setFormData({
            title: lessonData.title || existingQuiz.title || "",
            description: existingQuiz.description || "",
            timeLimitSec: existingQuiz.timeLimitSec || 0,
            attemptsAllowed: existingQuiz.attemptsAllowed || 0,
            passingScore: existingQuiz.passingScore || 0.7,
          });

          // Load Questions
          const qs = await QuizQuestionService.listByQuiz(existingQuiz.$id);
          setQuestions(qs.map(QuizQuestionService.parse));
        } else {
          // Initialize New Quiz State
          setQuiz(null); // No ID yet
          setFormData({
            title: lessonData.title || "",
            description: "",
            timeLimitSec: 0,
            attemptsAllowed: 0,
            passingScore: 0.7,
          });
          setQuestions([]);
        }
      } catch (error) {
        console.error("Failed to load quiz", error);
        showToast(t("teacher.errors.loadFailed"), "error");
      } finally {
        setLoading(false);
      }
    };
    if (lessonId) loadQuiz();
  }, [lessonId, t, showToast]);

  // Set initial data once loaded
  React.useEffect(() => {
    if (!loading && quiz !== undefined) {
      // Store a snapshot of initial state for dirty checking
      setInitialData({
        formData: { ...formData },
        questions: JSON.parse(JSON.stringify(questions)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, quiz]); // Run once when loading finishes/quiz is set

  // Watch for changes
  React.useEffect(() => {
    if (!initialData) return;

    const isFormChanged =
      JSON.stringify(formData) !== JSON.stringify(initialData.formData);
    const isQuestionsChanged =
      JSON.stringify(questions) !== JSON.stringify(initialData.questions);

    setIsDirty(isFormChanged || isQuestionsChanged);
  }, [formData, questions, initialData]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper for numeric inputs (Fixing the "cannot delete 1" bug)
  const handleNumberChange = (field, value, isFloat = false) => {
    if (value === "") {
      updateField(field, "");
      return;
    }

    // Check validity
    const regex = isFloat ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(value)) {
      updateField(field, value);
    }
  };

  const handleNumberBlur = (
    field,
    defaultValue = 0,
    min = 0,
    max = Infinity,
    isFloat = false,
  ) => {
    let val = formData[field];
    if (val === "" || val === undefined || val === null) {
      updateField(field, defaultValue);
      return;
    }
    let num = isFloat ? parseFloat(val) : parseInt(val, 10);
    if (isNaN(num)) {
      updateField(field, defaultValue);
      return;
    }
    if (num < min) num = min;
    if (num > max) num = max;
    updateField(field, num);
  };

  // Questions Logic
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        prompt: "",
        kind: "single",
        options: ["", ""],
        answerKey: [0],
        points: 1,
        order: questions.length,
        imageId: null,
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    );
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex) => {
    setQuestions((prev) => {
      const newQs = [...prev];
      const q = { ...newQs[questionIndex] };
      q.options = [...q.options, ""];
      newQs[questionIndex] = q;
      return newQs;
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((prev) => {
      const newQs = [...prev];
      const q = { ...newQs[questionIndex] };
      q.options = q.options.map((o, i) => (i === optionIndex ? value : o));
      newQs[questionIndex] = q;
      return newQs;
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuestions((prev) => {
      const newQs = [...prev];
      const q = { ...newQs[questionIndex] };
      q.options = q.options.filter((_, i) => i !== optionIndex);
      // Fix Answer Key Shift
      q.answerKey = q.answerKey
        .filter((idx) => idx !== optionIndex)
        .map((idx) => (idx > optionIndex ? idx - 1 : idx));
      newQs[questionIndex] = q;
      return newQs;
    });
  };

  const toggleCorrectAnswer = (questionIndex, optionIndex) => {
    setQuestions((prev) => {
      const newQs = [...prev];
      const q = { ...newQs[questionIndex] };
      let newAnswerKey;

      if (q.kind === "single" || q.kind === "trueFalse") {
        newAnswerKey = [optionIndex];
      } else {
        if (q.answerKey.includes(optionIndex)) {
          newAnswerKey = q.answerKey.filter((idx) => idx !== optionIndex);
        } else {
          newAnswerKey = [...q.answerKey, optionIndex];
        }
      }
      q.answerKey = newAnswerKey;
      newQs[questionIndex] = q;
      return newQs;
    });
  };

  // Drag Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const item = questions.find((q) => (q.$id || q.id) === active.id);
    setActiveItem(item);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.$id || item.id) === active.id,
        );
        const newIndex = items.findIndex(
          (item) => (item.$id || item.id) === over.id,
        );
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Image Upload for Question
  const handleImageUpload = async (file, questionIndex) => {
    if (!file) return;
    const toastId = showToast("Subiendo imagen...", "info");
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Solo imágenes");
      }
      const attachment = await FileService.uploadLessonAttachment(file);
      updateQuestion(questionIndex, "imageId", attachment.$id);
      showToast(t("teacher.lesson.videoUploaded"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("teacher.errors.uploadFailed"), "error");
    }
  };

  const handleSave = async (returnToCourse = false) => {
    if (!formData.title.trim()) {
      showToast(t("teacher.form.titleRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      let quizId = quiz?.$id;

      // 1. Sync Title with Lesson
      if (lesson && formData.title !== lesson.title) {
        await LessonService.update(lessonId, { title: formData.title });
        // Update local state to avoid re-syncing if saved again
        setLesson((prev) => ({ ...prev, title: formData.title }));
      }

      // 2. Create or Update Quiz
      if (!quizId) {
        const newQuiz = await QuizService.create({
          courseId,
          lessonId,
          ...formData,
          order: 0,
        });
        quizId = newQuiz.$id;
        setQuiz(newQuiz);
      } else {
        await QuizService.update(quizId, formData);
      }

      // 2. Sync Questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.$id) {
          await QuizQuestionService.update(q.$id, {
            prompt: q.prompt,
            kind: q.kind,
            options: q.options,
            answerKey: q.answerKey,
            points: q.points,
            order: i,
            imageId: q.imageId,
          });
        } else {
          const created = await QuizQuestionService.create({
            quizId,
            courseId,
            prompt: q.prompt,
            kind: q.kind,
            options: q.options,
            answerKey: q.answerKey,
            points: q.points,
            order: i,
            imageId: q.imageId,
          });
          q.$id = created.$id;
        }
      }

      showToast(t("common.saved"), "success");

      if (returnToCourse) {
        navigate(-1);
      } else {
        // Reset initial data to current to mark as clean
        setInitialData({
          formData: { ...formData },
          questions: JSON.parse(JSON.stringify(questions)),
        });
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Failed to save quiz:", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("teacher.quiz.editQuiz")}</h1>
            <p className="text-[rgb(var(--text-secondary))]">
              {t("teacher.quiz.settings")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSave(false)} // Save only
            disabled={saving || !isDirty}
            className="min-w-[100px]"
          >
            {saving ? <span>...</span> : t("common.save")}
          </Button>

          <Button
            onClick={() => handleSave(true)} // Save and Return
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
            <h3 className="font-bold text-lg mb-4">
              {t("teacher.quiz.settings")}
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    {t("teacher.quiz.quizTitle")}{" "}
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
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder={t("teacher.quiz.quizTitlePlaceholder")}
                  maxLength={160}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    {t("teacher.quiz.quizDescription")}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {2000 - formData.description.length}
                    </span>
                    <CharacterCountCircle
                      current={formData.description.length}
                      max={2000}
                      size={18}
                    />
                  </div>
                </div>
                <Textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    {t("teacher.quiz.timeLimit")}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={
                      formData.timeLimitSec === ""
                        ? ""
                        : Math.round(formData.timeLimitSec / 60)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") updateField("timeLimitSec", "");
                      else if (/^\d*$/.test(val))
                        updateField("timeLimitSec", parseInt(val, 10) * 60);
                    }}
                    onBlur={() => {
                      if (formData.timeLimitSec === "")
                        updateField("timeLimitSec", 0);
                    }}
                  />
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {t("teacher.quiz.timeLimitMinutes")}
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    {t("teacher.quiz.attemptsAllowed")}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.attemptsAllowed}
                    onChange={(e) =>
                      handleNumberChange("attemptsAllowed", e.target.value)
                    }
                    onBlur={() => handleNumberBlur("attemptsAllowed", 0, 0, 99)}
                  />
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {t("teacher.quiz.attemptsUnlimited")}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                  {t("teacher.quiz.passingScore")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.passingScore}
                    onChange={(e) =>
                      handleNumberChange("passingScore", e.target.value, true)
                    }
                    onBlur={() =>
                      handleNumberBlur("passingScore", 0.7, 0, 1, true)
                    }
                  />
                  <span className="text-sm font-medium">
                    = {(formData.passingScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Questions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {t("teacher.quiz.questions")} ({questions.length})
            </h3>
            <Button onClick={addQuestion} size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t("teacher.quiz.addQuestion")}
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[rgb(var(--border-base))] rounded-2xl bg-[rgb(var(--bg-muted))]/0.3 text-center">
              <p className="text-[rgb(var(--text-secondary))] mb-4">
                {t("teacher.quiz.noQuestions")}
              </p>
              <Button onClick={addQuestion} variant="outline">
                {t("teacher.quiz.addQuestion")}
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.$id || q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <SortableQuestionItem
                      key={q.$id || q.id}
                      id={q.$id || q.id}
                    >
                      {(dragHandleProps) => (
                        <Card className="p-5 border-[rgb(var(--border-base))] hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              className="mt-2 cursor-grab active:cursor-grabbing text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                              {...dragHandleProps}
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                  <select
                                    className="w-full h-10 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                                    value={q.kind}
                                    onChange={(e) => {
                                      updateQuestion(
                                        qIndex,
                                        "kind",
                                        e.target.value,
                                      );
                                      if (e.target.value === "trueFalse") {
                                        updateQuestion(qIndex, "options", [
                                          "Verdadero",
                                          "Falso",
                                        ]);
                                        updateQuestion(
                                          qIndex,
                                          "answerKey",
                                          [0],
                                        );
                                      } else if (e.target.value === "image") {
                                        if (q.options.length < 2)
                                          updateQuestion(qIndex, "options", [
                                            "",
                                            "",
                                          ]);
                                      }
                                    }}
                                  >
                                    {QUESTION_TYPES.map((type) => (
                                      <option
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {t(type.label, {
                                          defaultValue: type.label,
                                        })}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    value={
                                      q.points === 0 && q.points !== ""
                                        ? 0
                                        : q.points
                                    }
                                    min="1"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "") {
                                        updateQuestion(qIndex, "points", "");
                                      } else {
                                        const parsed = parseInt(val, 10);
                                        if (!isNaN(parsed))
                                          updateQuestion(
                                            qIndex,
                                            "points",
                                            parsed,
                                          );
                                      }
                                    }}
                                    onBlur={() => {
                                      if (
                                        q.points === "" ||
                                        q.points === null ||
                                        q.points === undefined
                                      ) {
                                        updateQuestion(qIndex, "points", 1);
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:bg-red-50 -mt-1 -mr-2 sm:mt-0 sm:mr-0"
                                  onClick={() => removeQuestion(qIndex)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>

                              <Textarea
                                placeholder={t("teacher.quiz.questionPrompt")}
                                value={q.prompt}
                                onChange={(e) =>
                                  updateQuestion(
                                    qIndex,
                                    "prompt",
                                    e.target.value,
                                  )
                                }
                                className="min-h-[80px]"
                              />

                              {/* Image Question Type Extra UI */}
                              {q.kind === "image" && (
                                <div className="p-4 rounded-lg bg-[rgb(var(--bg-muted))]/0.5 border border-dashed border-[rgb(var(--border-base))]">
                                  {q.imageId ? (
                                    <div className="relative group w-fit">
                                      <img
                                        src={FileService.getLessonAttachmentPreviewUrl(
                                          q.imageId,
                                        )}
                                        alt="Question"
                                        className="h-40 w-auto rounded-lg object-contain bg-[rgb(var(--bg-card))]"
                                      />
                                      <button
                                        onClick={() =>
                                          updateQuestion(
                                            qIndex,
                                            "imageId",
                                            null,
                                          )
                                        }
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                      <ImageIcon className="h-8 w-8 text-[rgb(var(--text-muted))] mb-2" />
                                      <p className="text-sm font-medium mb-2">
                                        Upload visual reference
                                      </p>
                                      <div className="relative">
                                        <Button variant="outline" size="sm">
                                          Choose Image
                                        </Button>
                                        <input
                                          type="file"
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleImageUpload(
                                              e.target.files[0],
                                              qIndex,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Options Logic */}
                              {[
                                "single",
                                "multi",
                                "trueFalse",
                                "image",
                              ].includes(q.kind) && (
                                <div className="space-y-3 pl-2 border-l-2 border-[rgb(var(--border-base))]">
                                  {q.options.map((opt, oIndex) => (
                                    <div
                                      key={oIndex}
                                      className="flex items-center gap-3"
                                    >
                                      <button
                                        onClick={() =>
                                          toggleCorrectAnswer(qIndex, oIndex)
                                        }
                                        className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                                          q.answerKey.includes(oIndex)
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "border-gray-400 hover:border-green-500"
                                        }`}
                                      >
                                        {q.answerKey.includes(oIndex) && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </button>
                                      <Input
                                        value={opt}
                                        readOnly={q.kind === "trueFalse"}
                                        onChange={(e) =>
                                          updateOption(
                                            qIndex,
                                            oIndex,
                                            e.target.value,
                                          )
                                        }
                                        className="h-9"
                                        placeholder={`Option ${oIndex + 1}`}
                                      />
                                      {q.kind !== "trueFalse" && (
                                        <button
                                          onClick={() =>
                                            removeOption(qIndex, oIndex)
                                          }
                                          className="text-[rgb(var(--text-muted))] hover:text-red-500"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {q.kind !== "trueFalse" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addOption(qIndex)}
                                      className="text-[rgb(var(--brand-primary))] h-8"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />{" "}
                                      {t(
                                        "teacher.quiz.addOption",
                                        "Añadir opción",
                                      )}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}
                    </SortableQuestionItem>
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={dropAnimation}>
                {activeItem ? (
                  <Card className="p-5 border-[rgb(var(--border-base))] shadow-xl opacity-80 cursor-grabbing">
                    <div className="flex gap-3">
                      <GripVertical className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                      <div className="font-medium">
                        {activeItem.prompt || "New Question..."}
                      </div>
                    </div>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
