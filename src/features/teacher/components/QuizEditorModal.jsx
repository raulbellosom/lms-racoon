import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { QuizQuestionService } from "../../../shared/data/quizzes-teacher";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../../shared/ui/LoadingScreen";

const QUESTION_TYPES = [
  { value: "single", label: "singleChoice" },
  { value: "multi", label: "multipleChoice" },
  { value: "trueFalse", label: "trueFalse" },
  { value: "short", label: "shortAnswer" },
];

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

  // Question management
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
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
      className="max-w-3xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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
                value={Math.round(formData.timeLimitSec / 60)}
                onChange={(e) =>
                  updateField(
                    "timeLimitSec",
                    parseInt(e.target.value) * 60 || 0,
                  )
                }
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
                  updateField("attemptsAllowed", parseInt(e.target.value) || 0)
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
                  updateField("passingScore", parseFloat(e.target.value) || 0)
                }
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
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <Card key={q.$id || q._tempId} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="cursor-move">
                      <GripVertical className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Question Type */}
                      <select
                        className="w-full sm:w-auto h-8 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-2 text-xs"
                        value={q.kind}
                        onChange={(e) => {
                          updateQuestion(qIndex, "kind", e.target.value);
                          if (e.target.value === "trueFalse") {
                            updateQuestion(qIndex, "options", [
                              "True",
                              "False",
                            ]);
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

                      {/* Question Prompt */}
                      <Textarea
                        placeholder={t("teacher.quiz.questionPrompt")}
                        value={q.prompt}
                        onChange={(e) =>
                          updateQuestion(qIndex, "prompt", e.target.value)
                        }
                        rows={2}
                      />

                      {/* Options (for choice questions) */}
                      {(q.kind === "single" ||
                        q.kind === "multi" ||
                        q.kind === "trueFalse") && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
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
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                  q.answerKey.includes(oIndex)
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-[rgb(var(--border-base))] hover:border-green-500"
                                }`}
                              >
                                {q.answerKey.includes(oIndex) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, e.target.value)
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
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    className="h-8 w-8 text-red-500"
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
                            >
                              <Plus className="mr-1 h-3 w-3" />{" "}
                              {t("teacher.quiz.addOption")}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Points */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[rgb(var(--text-secondary))]">
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
                          className="w-16 h-8"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
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
