import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, GripVertical, Check, Save } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import {
  QuizQuestionService,
  QuizService,
} from "../../../shared/data/quizzes-teacher";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../../shared/ui/LoadingScreen";

const QUESTION_TYPES = [
  { value: "single", label: "singleChoice" },
  { value: "multi", label: "multipleChoice" },
  { value: "trueFalse", label: "trueFalse" },
  { value: "short", label: "shortAnswer" },
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
      {/* Pass drag handle props to children or render handle here if needed. 
            We'll expect the child to render a handle and we just pass the props down via cloneElement or context? 
            Easier: Just pass attributes/listeners to the child content if it exposes a handle prop.
            But here we are wrapping the Card. Let's make the handle explicit in the child render.
        */}
      {React.cloneElement(children, {
        dragHandleProps: { ...attributes, ...listeners },
      })}
    </div>
  );
}

/**
 * QuizEditorModal - Create/edit a quiz with questions
 * @param {boolean} open - Modal open state
 * @param {Function} onClose - Close callback
 * @param {Object} quiz - Quiz data (null for new)
 * @param {string} courseId - Parent course ID
 * @param {Function} onSave - Save callback
 */
export function QuizEditorModal({
  open,
  onClose,
  quiz,
  courseId,
  lessonId,
  onSave,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isNew = !quiz?.$id;

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    timeLimitSec: 0,
    attemptsAllowed: 0,
    passingScore: 0.7,
  });

  const [questions, setQuestions] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [loadingQuestions, setLoadingQuestions] = React.useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor),
  );

  // Load quiz data
  React.useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || "",
        description: quiz.description || "",
        timeLimitSec: quiz.timeLimitSec || 0,
        attemptsAllowed: quiz.attemptsAllowed || 0,
        passingScore: quiz.passingScore || 0.7,
      });
      loadQuestions();
    } else {
      setFormData({
        title: "",
        description: "",
        timeLimitSec: 0,
        attemptsAllowed: 0,
        passingScore: 0.7,
      });
      setQuestions([]);
    }
  }, [quiz, open]);

  const loadQuestions = async () => {
    if (!quiz?.$id) return;
    setLoadingQuestions(true);
    try {
      const qs = await QuizQuestionService.listByQuiz(quiz.$id);
      setQuestions(qs.map(QuizQuestionService.parse));
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper for numeric inputs
  const handleNumberChange = (field, value, isFloat = false) => {
    // Allow empty string to let user clear the input
    if (value === "") {
      updateField(field, "");
      return;
    }

    if (isFloat) {
      // Allow valid float format (including trailing decimal point)
      if (/^\d*\.?\d*$/.test(value)) {
        updateField(field, value);
      }
    } else {
      // Allow only digits
      if (/^\d*$/.test(value)) {
        updateField(field, value);
      }
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

    // Clamp
    if (num < min) num = min;
    if (num > max) num = max;

    updateField(field, num);
  };

  // Special handler for time limit (minutes input stored as seconds)
  const handleTimeLimitChange = (value) => {
    if (value === "") {
      updateField("timeLimitSec", "");
      return;
    }
    if (/^\d*$/.test(value)) {
      updateField("timeLimitSec", value); // Store raw input temporarily
    }
  };

  const handleTimeLimitBlur = () => {
    let val = formData.timeLimitSec;
    if (val === "" || val === null) {
      updateField("timeLimitSec", 0);
      return;
    }
    let minutes = parseInt(val, 10);
    if (isNaN(minutes) || minutes < 0) minutes = 0;
    // Store as seconds for the backend, but we need to consider how we treat the input state.
    // Wait, the input value prop expects minutes.
    // So distinct state vs derived state is tricky here.
    // Let's store raw seconds in formData, but while editing we might need local state?
    // Actually, distinct handlers like this are messy if formData stores seconds.
    // Better approach: Let's assume input is Minutes.
    // If we use 'timeLimitSec' to store SECONDS, then input value={timeLimitSec / 60}
    // But then typing '1' sets 'timeLimitSec' to 1 (which is 1/60 min?), wait.
    // Standard approach:
    // On Change: input '1' -> store '60'
    // On Blur: validate.
    // Clearing: input '' -> store '' (special case in rendering)
    // If we store '' in formData.timeLimitSec, then input value='' works.
    updateField("timeLimitSec", minutes * 60);
  };

  // Question management
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(), // Ensure distinct ID for DnD
        _tempId: Date.now().toString(),
        prompt: "",
        kind: "single",
        options: ["", ""],
        answerKey: [0],
        points: 1,
        order: questions.length,
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    );
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex) => {
    const q = questions[questionIndex];
    updateQuestion(questionIndex, "options", [...q.options, ""]);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const q = questions[questionIndex];
    const newOptions = [...q.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, "options", newOptions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const q = questions[questionIndex];
    const newOptions = q.options.filter((_, i) => i !== optionIndex);
    // Adjust answer key
    let newAnswerKey = q.answerKey
      .filter((idx) => idx !== optionIndex)
      .map((idx) => (idx > optionIndex ? idx - 1 : idx));
    updateQuestion(questionIndex, "options", newOptions);
    updateQuestion(questionIndex, "answerKey", newAnswerKey);
  };

  const toggleCorrectAnswer = (questionIndex, optionIndex) => {
    const q = questions[questionIndex];
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
    updateQuestion(questionIndex, "answerKey", newAnswerKey);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
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

  // Save quiz
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast(t("teacher.form.titleRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      let quizId = quiz?.$id;

      // Save quiz settings
      if (isNew) {
        const newQuiz = await QuizService.create({
          courseId,
          lessonId,
          ...formData,
          order: 0,
        });
        quizId = newQuiz.$id;
      } else {
        await QuizService.update(quizId, formData);
      }

      // Save questions
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
          });
        } else {
          await QuizQuestionService.create({
            quizId,
            courseId,
            prompt: q.prompt,
            kind: q.kind,
            options: q.options,
            answerKey: q.answerKey,
            points: q.points,
            order: i,
          });
        }
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error("Failed to save quiz:", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? t("teacher.quiz.createQuiz") : t("teacher.quiz.editQuiz")}
      className="max-w-6xl w-full"
    >
      <div className="p-1 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Quiz Settings */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.quiz.quizTitle")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={t("teacher.quiz.quizTitlePlaceholder")}
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.quiz.quizDescription")}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.quiz.timeLimit")}
              </label>
              <Input
                type="number"
                min="0"
                value={
                  formData.timeLimitSec === ""
                    ? ""
                    : Math.round(formData.timeLimitSec / 60)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    updateField("timeLimitSec", "");
                  } else if (/^\d*$/.test(val)) {
                    updateField("timeLimitSec", parseInt(val, 10) * 60);
                  }
                }}
                onBlur={() => {
                  if (formData.timeLimitSec === "") {
                    updateField("timeLimitSec", 0);
                  }
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
                onBlur={() =>
                  handleNumberBlur("attemptsAllowed", 0, 0, 50, false)
                }
              />
              <span className="text-xs text-[rgb(var(--text-muted))]">
                {t("teacher.quiz.attemptsUnlimited")}
              </span>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.quiz.passingScore")}
              </label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.passingScore}
                onChange={(e) =>
                  handleNumberChange("passingScore", e.target.value, true)
                }
                onBlur={() => handleNumberBlur("passingScore", 0.7, 0, 1, true)}
              />
              <span className="text-xs text-[rgb(var(--text-muted))]">
                {t("teacher.quiz.passingScorePercent")}
              </span>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">{t("teacher.quiz.questions")}</h4>
            <Button onClick={addQuestion} size="sm" variant="secondary">
              <Plus className="mr-2 h-4 w-4" /> {t("teacher.quiz.addQuestion")}
            </Button>
          </div>

          {loadingQuestions ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : questions.length === 0 ? (
            <Card className="p-6 text-center text-[rgb(var(--text-secondary))]">
              {t("teacher.quiz.noQuestions")}
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
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
                      <Card className="p-4 bg-[rgb(var(--bg-card))]">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <div
                            className="cursor-move p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                            /* This prop is injected by SortableQuestionItem cloneElement */
                            {...q.dragHandleProps}
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-3 w-full">
                            <div className="flex flex-col sm:flex-row gap-3">
                              {/* Question Type */}
                              <select
                                className="w-full sm:w-48 h-10 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                                value={q.kind}
                                onChange={(e) => {
                                  updateQuestion(
                                    qIndex,
                                    "kind",
                                    e.target.value,
                                  );
                                  if (e.target.value === "trueFalse") {
                                    const qClone = { ...q };
                                    // logic to reset options
                                    const newOpts = ["True", "False"];
                                    updateQuestion(qIndex, "options", newOpts);
                                    updateQuestion(qIndex, "answerKey", [0]);
                                  }
                                }}
                              >
                                {QUESTION_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {t(`teacher.quiz.${type.label}`)}
                                  </option>
                                ))}
                              </select>

                              {/* Points */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[rgb(var(--text-secondary))] uppercase whitespace-nowrap">
                                  {t("teacher.quiz.points")}:
                                </span>
                                <Input
                                  type="number"
                                  min="1"
                                  value={q.points}
                                  onChange={(e) =>
                                    updateQuestion(
                                      qIndex,
                                      "points",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-20 h-10"
                                />
                              </div>
                            </div>

                            {/* Question Prompt */}
                            <Textarea
                              placeholder={t("teacher.quiz.questionPrompt")}
                              value={q.prompt}
                              onChange={(e) =>
                                updateQuestion(qIndex, "prompt", e.target.value)
                              }
                              rows={2}
                              className="w-full"
                            />

                            {/* Options (for choice questions) */}
                            {(q.kind === "single" ||
                              q.kind === "multi" ||
                              q.kind === "trueFalse") && (
                              <div className="space-y-2 mt-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                  {t("teacher.quiz.options")}
                                </span>
                                {q.options.map((opt, oIndex) => (
                                  <div
                                    key={oIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleCorrectAnswer(qIndex, oIndex)
                                      }
                                      className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                                        q.answerKey.includes(oIndex)
                                          ? "border-green-500 bg-green-500 text-white"
                                          : "border-[rgb(var(--border-base))] hover:border-green-500"
                                      }`}
                                      title={t("teacher.quiz.correctAnswer")}
                                    >
                                      {q.answerKey.includes(oIndex) && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                    <Input
                                      value={opt}
                                      onChange={(e) =>
                                        updateOption(
                                          qIndex,
                                          oIndex,
                                          e.target.value,
                                        )
                                      }
                                      placeholder={`${t("teacher.quiz.options")} ${oIndex + 1}`}
                                      className="flex-1"
                                      disabled={q.kind === "trueFalse"}
                                    />
                                    {q.kind !== "trueFalse" &&
                                      q.options.length > 2 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            removeOption(qIndex, oIndex)
                                          }
                                          className="h-9 w-9 text-red-500 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                  </div>
                                ))}
                                {q.kind !== "trueFalse" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addOption(qIndex)}
                                    className="mt-2 text-[rgb(var(--brand-primary))]"
                                  >
                                    <Plus className="mr-1 h-3 w-3" />{" "}
                                    {t("teacher.quiz.addOption")}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-red-500 shrink-0 hover:bg-red-50 -mr-2 sm:mr-0"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </Card>
                    </SortableQuestionItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("teacher.form.saving") : t("teacher.quiz.saveQuiz")}
        </Button>
      </div>
    </Modal>
  );
}
