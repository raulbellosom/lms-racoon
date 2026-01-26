import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { SubmissionsService } from "../../../shared/data/submissions-teacher";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import {
  ClipboardList,
  Filter,
  Search,
  Download,
  Check,
  X,
  ChevronRight,
  File,
} from "lucide-react";
import { EmptyState } from "../../../shared/components/EmptyState";
import { useToast } from "../../../app/providers/ToastProvider";

export function TeacherAssignmentGrading({ courseId }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading State
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment.$id);
    }
  }, [selectedAssignment]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const list = await AssignmentService.listByCourse(courseId);
      setAssignments(list);
      // Auto-select first?
      // if (list.length > 0) setSelectedAssignment(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (asgId) => {
    try {
      const list = await SubmissionsService.listByAssignment(asgId);
      setSubmissions(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGrade = async (approved) => {
    if (!gradingSubmission) return;
    setProcessing(true);
    try {
      if (approved) {
        await SubmissionsService.grade(gradingSubmission.$id, {
          pointsAwarded: Number(points),
          teacherFeedback: feedback,
        });
        showToast("Calificación guardada", "success");
      } else {
        await SubmissionsService.reject(gradingSubmission.$id, {
          teacherFeedback: feedback,
        });
        showToast("Entrega rechazada (solicitud de reenvío)", "info");
      }

      // Refresh
      loadSubmissions(selectedAssignment.$id);
      setGradingSubmission(null);
      setPoints(0);
      setFeedback("");
    } catch (e) {
      showToast("Error al calificar", "error");
    } finally {
      setProcessing(false);
    }
  };

  const openGrading = (sub) => {
    setGradingSubmission(sub);
    setPoints(sub.pointsAwarded || selectedAssignment.pointsMax || 10);
    setFeedback(sub.teacherFeedback || "");
  };

  if (loading && assignments.length === 0)
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  if (assignments.length === 0)
    return (
      <EmptyState
        icon={ClipboardList}
        title={t("teacher.assignment.noAssignments")}
        description={t("teacher.assignment.createInCurriculum")}
        className="min-h-[60vh] animate-in fade-in zoom-in-95 duration-500"
      />
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Sidebar: List of Assignments */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg px-2">Tareas del curso</h3>
        <div className="space-y-2">
          {assignments.map((asg) => (
            <button
              key={asg.$id}
              onClick={() => {
                setSelectedAssignment(asg);
                setGradingSubmission(null);
              }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedAssignment?.$id === asg.$id
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20"
                  : "bg-white dark:bg-gray-800 border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="font-medium line-clamp-1">{asg.title}</div>
              <div className="text-xs opacity-70 mt-1 flex justify-between">
                <span>{asg.pointsMax} pts</span>
                {/* Ideally stats here */}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="space-y-6">
        {!selectedAssignment ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-[rgb(var(--text-secondary))] border-2 border-dashed rounded-xl">
            <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
            <p>Selecciona una tarea para ver las entregas</p>
          </div>
        ) : gradingSubmission ? (
          // GRADING INTERFACE
          <Card className="p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold">Calificando Entrega</h2>
                <div className="text-sm text-[rgb(var(--text-secondary))]">
                  Estudiante ID:{" "}
                  <span className="font-mono">{gradingSubmission.userId}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGradingSubmission(null)}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-[rgb(var(--text-secondary))]">
                    Respuesta del estudiante
                  </h4>
                  <p className="whitespace-pre-wrap text-sm">
                    {gradingSubmission.body || "(Sin texto)"}
                  </p>

                  {gradingSubmission.attachments?.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="font-semibold text-sm mb-2 text-[rgb(var(--text-secondary))]">
                        Adjuntos
                      </h4>
                      <div className="space-y-2">
                        {gradingSubmission.attachments.map((fid) => (
                          <div
                            key={fid}
                            className="flex items-center gap-2 text-sm text-blue-600"
                          >
                            <File className="h-4 w-4" />
                            <span>Archivo adjunto ({fid})</span>
                            {/* Use FileService to download/view logic */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-[rgb(var(--text-muted))]">
                  Entregado:{" "}
                  {new Date(gradingSubmission.submittedAt).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Puntos (Máx {selectedAssignment.pointsMax})
                  </label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    max={selectedAssignment.pointsMax}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Retroalimentación
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Muy buen trabajo..."
                    rows={5}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleGrade(true)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" /> Aprobar y Calificar
                  </Button>
                  <Button
                    onClick={() => handleGrade(false)}
                    disabled={processing}
                    variant="secondary"
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20"
                  >
                    <X className="h-4 w-4 mr-2" /> Rechazar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          // LIST OF SUBMISSIONS
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-bold">Entregas ({submissions.length})</h3>
              <div className="flex gap-2">{/* Filters could go here */}</div>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-[rgb(var(--text-muted))]">
                Ningún estudiante ha entregado esta tarea aún.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-900 text-[rgb(var(--text-secondary))]">
                  <tr>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Puntos</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.$id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td
                        className="p-3 font-mono text-xs max-w-[100px] truncate"
                        title={sub.userId}
                      >
                        {sub.userId}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize
                                                ${
                                                  sub.status === "submitted"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : sub.status === "reviewed"
                                                      ? "bg-green-100 text-green-700"
                                                      : sub.status ===
                                                          "rejected"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }
                                            `}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-[rgb(var(--text-secondary))]">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3 font-bold">
                        {sub.status === "reviewed"
                          ? `${sub.pointsAwarded} / ${selectedAssignment.pointsMax}`
                          : "-"}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openGrading(sub)}
                        >
                          {sub.status === "reviewed" ? "Editar" : "Calificar"}{" "}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
