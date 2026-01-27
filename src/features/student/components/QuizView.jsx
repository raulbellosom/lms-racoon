import React, { useState, useEffect } from "react";
import { QuizStudentService } from "../../../shared/data/quizzes-student";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileService } from "../../../shared/data/files";

export function QuizView({ lessonId, courseId, onComplete }) {
  const { auth } = useAuth();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null); // Previous or current attempt

  // Quiz taking state
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> value
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  // Timer
  useEffect(() => {
    if (activeAttemptId && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit(true); // Auto-submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeAttemptId, timeLeft]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      // 1. Find quiz for this lesson
      const quizzes = await QuizStudentService.listQuizzesByLesson(lessonId);
      if (quizzes.length === 0) {
        setQuiz(null);
        setLoading(false);
        return;
      }
      const q = quizzes[0];

      // 2. Fetch full details (questions)
      const fullQuiz = await QuizStudentService.getQuizForStudent(q.$id);
      setQuiz(fullQuiz);
      setQuestions(fullQuiz.questions || []);

      // 3. Check for existing attempts
      const latest = await QuizStudentService.getLatestAttempt(
        q.$id,
        auth.user.$id,
      );
      setAttempt(latest);
    } catch (error) {
      console.error("Failed to load quiz", error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const newAttempt = await QuizStudentService.startAttempt({
        quizId: quiz.$id,
        courseId,
        userId: auth.user.$id,
      });
      setActiveAttemptId(newAttempt.$id);
      setAnswers({});

      if (quiz.timeLimitSec > 0) {
        setTimeLeft(quiz.timeLimitSec);
      } else {
        setTimeLeft(null);
      }
    } catch (e) {
      showToast("Error al iniciar el quiz", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalPoints = 0;

    questions.forEach((q) => {
      const userAns = answers[q.$id];
      // Simple grading logic (Improve for multi/short types)
      // For MVP assuming single choice index or value match
      // If answerKey is array of indices

      // Case 1: Single/TrueFalse/Image
      if (q.kind === "single" || q.kind === "trueFalse" || q.kind === "image") {
        // answerKey might be [0] (index)
        const correctIndex = q.answerKey?.[0]; // 0-based index
        // User ans is probably index (integer)
        if (userAns !== undefined && Number(userAns) === Number(correctIndex)) {
          correctCount += q.points || 1;
        }
      }
      // Case 2: Multi
      // Case 3: Short (Text match)

      totalPoints += q.points || 1;
    });

    const score = totalPoints > 0 ? correctCount / totalPoints : 0;
    const passed = score >= (quiz.passingScore || 0.7);

    return { score, passed };
  };

  const handleSubmit = async (isAuto = false) => {
    if (!activeAttemptId) return;
    setSubmitting(true);
    try {
      const { score, passed } = calculateScore();

      await QuizStudentService.submitAttempt(activeAttemptId, {
        answers,
        score,
        passed,
      });

      // Refresh
      setActiveAttemptId(null);
      loadQuiz();
      showToast(
        isAuto ? "Tiempo agotado. Quiz enviado." : "Quiz enviado correctamente",
        "success",
      );

      if (passed) {
        onComplete?.();
      }
    } catch (e) {
      showToast("Error al enviar respuestas", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingContent />;
  if (!quiz)
    return (
      <div className="p-8 text-center text-gray-500">
        No hay evaluación configurada para esta lección.
      </div>
    );

  // View: Result (if attempt exists and finished, or not retrying)
  // If activeAttemptId is set, show quiz questions.
  // Else show "Start" or "Result".

  const showStart = !activeAttemptId;
  const showResult = !!attempt && !activeAttemptId;

  if (activeAttemptId) {
    // RENDERING QUESTIONS
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center bg-[rgb(var(--brand-primary)/0.05)] p-4 rounded-2xl border border-[rgb(var(--brand-primary)/0.1)]">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--brand-primary))] opacity-80">
              Evaluación en curso
            </div>
            <div className="font-bold text-lg">{quiz.title}</div>
          </div>
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 shadow-sm font-mono text-xl font-black ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[rgb(var(--text-primary))]"}`}
            >
              <Clock className="h-5 w-5" />
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>

        {quiz.description && (
          <div className="markdown-content text-[rgb(var(--text-secondary))] p-4 bg-[rgb(var(--bg-muted))]/30 rounded-xl border border-[rgb(var(--border-base))]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {quiz.description}
            </ReactMarkdown>
          </div>
        )}

        <div className="space-y-8">
          {questions.length === 0 ? (
            <Card className="p-8 text-center text-gray-500 italic">
              Esta evaluación no tiene preguntas configuradas aún.
            </Card>
          ) : (
            questions.map((q, idx) => (
              <Card key={q.$id} className="p-6">
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-500">
                    Pregunta {idx + 1}
                  </span>
                  <div className="text-lg font-medium mt-1">{q.prompt}</div>
                </div>

                {q.imageId && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black/5 border border-[rgb(var(--border-base))] flex justify-center">
                    <img
                      src={FileService.getLessonAttachmentPreviewUrl(q.imageId)}
                      alt="Referencia visual"
                      className="max-h-[300px] w-auto h-auto object-contain"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {q.options?.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors bg-white dark:bg-gray-900 shadow-sm"
                    >
                      <input
                        type="radio"
                        name={q.$id}
                        value={optIdx}
                        checked={answers[q.$id] === optIdx} // Storing index
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.$id]: optIdx }))
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            size="lg"
          >
            {submitting ? "Enviando..." : "Enviar Respuestas"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Description Section */}
      {quiz.description && (
        <div className="markdown-content text-[rgb(var(--text-secondary))] max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {quiz.description}
          </ReactMarkdown>
        </div>
      )}

      {/* 2. Stats & Result Section */}
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Compact Result Card if attempt exists */}
        {attempt && (
          <div
            className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${
              attempt.passed
                ? "bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                : "bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${attempt.passed ? "bg-green-100 text-green-600 dark:bg-green-900/50" : "bg-red-100 text-red-600 dark:bg-red-900/50"}`}
              >
                {attempt.passed ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Tu Puntuación
                </div>
                <div className="text-4xl font-black leading-none">
                  {Math.round(attempt.score * 100)}%
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
              <div
                className={`text-2xl font-black ${attempt.passed ? "text-green-600" : "text-red-600"}`}
              >
                {attempt.passed ? "¡Aprobado!" : "No aprobado"}
              </div>
              <div className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">
                Meta: {Math.round(quiz.passingScore * 100)}% para aprobar
              </div>
            </div>
          </div>
        )}

        {/* Info Grid (Always visible or only if no result? Let's keep it for context) */}
        {!attempt && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[rgb(var(--bg-muted))] rounded-2xl flex items-center gap-4 border border-[rgb(var(--border-base))]">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Límite de tiempo
                </div>
                <div className="font-bold">
                  {quiz.timeLimitSec
                    ? `${Math.round(quiz.timeLimitSec / 60)} min`
                    : "Sin límite"}
                </div>
              </div>
            </div>
            <div className="p-4 bg-[rgb(var(--bg-muted))] rounded-2xl flex items-center gap-4 border border-[rgb(var(--border-base))]">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Para aprobar
                </div>
                <div className="font-bold">
                  {Math.round(quiz.passingScore * 100)}% de aciertos
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {(!attempt ||
            !attempt.passed ||
            quiz.attemptsAllowed === 0 ||
            quiz.attemptsAllowed > 1) && (
            <Button
              onClick={startQuiz}
              size="lg"
              className="px-12 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {attempt ? "Intentar de nuevo" : "Comenzar Evaluación"}
            </Button>
          )}

          {attempt?.passed && (
            <Button
              variant="outline"
              onClick={onComplete}
              className="rounded-full font-bold"
            >
              Continuar a la siguiente lección
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
