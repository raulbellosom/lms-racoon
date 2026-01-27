import React, { useState, useEffect } from "react";
import { StudentSubmissionService } from "../../../shared/data/submissions-student";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { FileService } from "../../../shared/data/files";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Textarea } from "../../../shared/ui/Textarea";
import { Upload, File, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

export function AssignmentView({ lessonId, courseId }) {
  const { auth } = useAuth();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]); // Array of file objects (new uploads)
  const [existingFiles, setExistingFiles] = useState([]); // Array of IDs
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [lessonId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get Assignment
      const asgs = await AssignmentService.listByLesson(lessonId);
      if (asgs.length === 0) {
        setAssignment(null);
        setLoading(false);
        return;
      }
      const asg = asgs[0];
      setAssignment(asg);

      // 2. Get Submission
      const sub = await StudentSubmissionService.getMySubmission(
        asg.$id,
        auth.user.$id,
      );
      setSubmission(sub);

      if (sub) {
        setBody(sub.body || "");
        setExistingFiles(sub.attachments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (e.target.files?.length) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    setSubmitting(true);
    try {
      // Upload new files
      const newAttachmentIds = [];
      for (const file of files) {
        const res = await FileService.uploadSubmissionAttachment(file);
        newAttachmentIds.push(res.id);
      }

      const allAttachments = [...existingFiles, ...newAttachmentIds];

      await StudentSubmissionService.saveSubmission({
        submissionId: submission?.$id,
        assignmentId: assignment.$id,
        courseId,
        userId: auth.user.$id,
        body,
        attachments: allAttachments,
        status: "submitted",
      });

      showToast("Tarea entregada correctamente", "success");
      setFiles([]);
      loadData(); // Refresh
    } catch (e) {
      console.error(e);
      showToast("Error al entregar tarea", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingContent />;
  if (!assignment)
    return (
      <div className="p-8 text-center text-gray-500">
        No hay tarea configurada.
      </div>
    );

  const isGraded = submission?.status === "reviewed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-[rgb(var(--border-base))] p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
        <div className="prose dark:prose-invert max-w-none text-sm text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
          {assignment.description}
        </div>

        <div className="mt-4 flex gap-4 text-sm font-medium">
          <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            Puntos: {assignment.pointsMax}
          </div>
          {assignment.dueAt && (
            <div className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Vence: {new Date(assignment.dueAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Status / Feedback */}
      {submission && (
        <div
          className={`rounded-xl border p-4 ${
            submission.status === "reviewed"
              ? "bg-green-50 border-green-200"
              : submission.status === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-lg capitalize">
              Estado:{" "}
              {submission.status === "submitted"
                ? "Entregado"
                : submission.status === "reviewed"
                  ? "Calificado"
                  : submission.status === "rejected"
                    ? "Rechazado"
                    : "Borrador"}
            </span>
            {submission.submittedAt && (
              <span className="text-sm opacity-75">
                Enviado el {new Date(submission.submittedAt).toLocaleString()}
              </span>
            )}
          </div>

          {submission.teacherFeedback && (
            <div className="mt-2 pt-2 border-t border-black/10">
              <div className="text-sm font-semibold mb-1">
                Retroalimentación del instructor:
              </div>
              <div className="text-sm bg-white p-3 rounded-lg shadow-sm">
                {submission.teacherFeedback}
              </div>
            </div>
          )}

          {isGraded && (
            <div className="mt-2 font-bold text-xl text-green-700">
              Calificación: {submission.pointsAwarded} / {assignment.pointsMax}
            </div>
          )}
        </div>
      )}

      {/* Submission Form */}
      {!isGraded && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Tu Entrega</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Comentario / Respuesta
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Archivos Adjuntos
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {/* Existing files */}
                {existingFiles.length > 0 &&
                  existingFiles.map((fid) => (
                    <div
                      key={fid}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                    >
                      <File className="w-4 h-4" />
                      <span>Archivo adjunto</span>
                      {/* Ideally we fetch mime/name, but ID is enough for MVP */}
                    </div>
                  ))}
                {/* New files */}
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
                  >
                    <File className="w-4 h-4" />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById("asg-file").click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir archivo
              </Button>
              <input
                id="asg-file"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Entregando..."
                  : submission
                    ? "Actualizar Entrega"
                    : "Entregar Tarea"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
