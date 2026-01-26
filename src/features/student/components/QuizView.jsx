import React, { useState, useEffect } from "react";
import { QuizStudentService } from "../../../shared/data/quizzes-student";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "../../../app/providers/ToastProvider";

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

      // Case 1: Single/TrueFalse
      if (q.kind === "single" || q.kind === "trueFalse") {
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

  if (loading)
    return <div className="p-8 text-center">Cargando evaluación...</div>;
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
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <span className="font-bold text-lg">{quiz.title}</span>
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? "text-red-500" : ""}`}
            >
              <Clock className="h-5 w-5" />
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <Card key={q.$id} className="p-6">
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-500">
                  Pregunta {idx + 1}
                </span>
                <div className="text-lg font-medium mt-1">{q.prompt}</div>
              </div>

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
          ))}
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
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        <p className="text-gray-500 max-w-lg mx-auto">{quiz.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-500">Límite de tiempo</div>
          <div className="font-semibold text-lg">
            {quiz.timeLimitSec
              ? `${Math.round(quiz.timeLimitSec / 60)} min`
              : "Sin límite"}
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-500">Para aprobar</div>
          <div className="font-semibold text-lg">
            {Math.round(quiz.passingScore * 100)}%
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-500">Intentos</div>
          <div className="font-semibold text-lg">
            {attempt ? "1 usado" : "0 usados"}
          </div>
        </div>
      </div>

      {attempt && (
        <div
          className={`p-6 rounded-xl border-2 w-full max-w-lg ${attempt.passed ? "border-green-100 bg-green-50 dark:bg-green-900/10" : "border-red-100 bg-red-50 dark:bg-red-900/10"}`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {attempt.passed ? (
              <CheckCircle2 className="text-green-600 h-8 w-8" />
            ) : (
              <XCircle className="text-red-600 h-8 w-8" />
            )}
            <span
              className={`text-xl font-bold ${attempt.passed ? "text-green-700" : "text-red-700"}`}
            >
              {attempt.passed ? "¡Aprobado!" : "No aprobado"}
            </span>
          </div>
          <div className="text-3xl font-black mb-1">
            {Math.round(attempt.score * 100)}%
          </div>
          <div className="text-sm opacity-75">Tu puntuación</div>
        </div>
      )}

      {/* Start Button */}
      {(!attempt ||
        !attempt.passed ||
        quiz.attemptsAllowed === 0 ||
        quiz.attemptsAllowed > 1) && (
        <Button
          onClick={startQuiz}
          size="lg"
          className="px-12 animate-in fade-in zoom-in"
        >
          {attempt ? "Intentar de nuevo" : "Comenzar Evaluación"}
        </Button>
      )}

      {attempt?.passed && (
        <Button variant="outline" onClick={onComplete}>
          Continuar a la siguiente lección
        </Button>
      )}
    </div>
  );
}
