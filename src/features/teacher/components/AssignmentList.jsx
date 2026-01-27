import React from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Edit2,
  Trash2,
  ClipboardList,
  Calendar,
  Award,
  Users,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { useToast } from "../../../app/providers/ToastProvider";
import { ConfirmationModal } from "../../../shared/ui/ConfirmationModal";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

/**
 * AssignmentList - List and manage assignments for a course
 * @param {string} courseId - Course ID
 * @param {Function} onEdit - Edit assignment callback
 * @param {Function} onCreate - Create assignment callback
 * @param {Function} onViewSubmissions - View submissions callback
 */
export function AssignmentList({
  courseId,
  onEdit,
  onCreate,
  onViewSubmissions,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [assignments, setAssignments] = React.useState([]);
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
    loadAssignments();
  }, [courseId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await AssignmentService.listByCourse(courseId);
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (assignment) => {
    setConfirmation({
      open: true,
      title: t("teacher.assignment.deleteAssignmentConfirm"),
      description:
        t("teacher.assignment.deleteAssignmentDesc") ||
        "¿Estás seguro de eliminar esta tarea?",
      variant: "destructive",
      confirmText: t("common.delete"),
      onConfirm: async () => {
        try {
          await AssignmentService.delete(assignment.$id);
          setAssignments(assignments.filter((a) => a.$id !== assignment.$id));
          closeConfirmation();
        } catch (error) {
          console.error("Failed to delete assignment:", error);
          showToast(t("teacher.errors.deleteFailed"), "error");
          closeConfirmation();
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("teacher.assignment.noDueDate");
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingContent />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("teacher.assignment.title")}</h3>
        <Button onClick={onCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />{" "}
          {t("teacher.assignment.createAssignment")}
        </Button>
      </div>

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
          <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>{t("teacher.assignment.noAssignments")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card
              key={assignment.$id}
              className="p-4 hover:border-[rgb(var(--brand-primary))] transition-colors cursor-pointer"
              onClick={() => onEdit?.(assignment)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-bold truncate">{assignment.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {assignment.pointsMax} pts
                    </Badge>
                  </div>
                  {assignment.description && (
                    <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[rgb(var(--text-muted))]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(assignment.dueAt)}
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
                    onClick={() => onViewSubmissions?.(assignment)}
                    className="h-8 w-8"
                    title={t("teacher.assignment.viewSubmissions")}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(assignment)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(assignment)}
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
