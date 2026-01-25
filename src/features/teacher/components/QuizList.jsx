import React from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  Clock,
  Target,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { QuizService } from "../../../shared/data/quizzes-teacher";
import { useToast } from "../../../app/providers/ToastProvider";
import { ConfirmationModal } from "../../../shared/ui/ConfirmationModal";

/**
 * QuizList - List and manage quizzes for a course
 * @param {string} courseId - Course ID
 * @param {Function} onEdit - Edit quiz callback
 * @param {Function} onCreate - Create quiz callback
 */
export function QuizList({ courseId, onEdit, onCreate }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await QuizService.listByCourse(courseId);
      setQuizzes(data);
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (quiz) => {
    setConfirmation({
      open: true,
      title: t("teacher.quiz.deleteQuizConfirm"),
      description:
        t("teacher.quiz.deleteQuizDesc") ||
        "¿Estás seguro de eliminar este examen?",
      variant: "destructive",
      confirmText: t("common.delete"),
      onConfirm: async () => {
        try {
          await QuizService.delete(quiz.$id);
          setQuizzes(quizzes.filter((q) => q.$id !== quiz.$id));
          closeConfirmation();
        } catch (error) {
          console.error("Failed to delete quiz:", error);
          showToast(t("teacher.errors.deleteFailed"), "error");
          closeConfirmation();
        }
      },
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return t("teacher.quiz.attemptsUnlimited");
    return `${Math.floor(seconds / 60)} ${t("teacher.quiz.timeLimitMinutes")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgb(var(--brand-primary))] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("teacher.quiz.title")}</h3>
        <Button onClick={onCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("teacher.quiz.createQuiz")}
        </Button>
      </div>

      {/* Quizzes list */}
      {quizzes.length === 0 ? (
        <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
          <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>{t("teacher.quiz.noQuizzes")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.$id}
              className="p-4 hover:border-[rgb(var(--brand-primary))] transition-colors cursor-pointer"
              onClick={() => onEdit?.(quiz)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold truncate">{quiz.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {quiz.questionCount || 0} {t("teacher.quiz.questions")}
                    </Badge>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[rgb(var(--text-muted))]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(quiz.timeLimitSec)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {Math.round(quiz.passingScore * 100)}%
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(quiz)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(quiz)}
                    className="h-8 w-8 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
