import React from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ListVideo, PlayCircle, Lock, Play } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "../../../shared/ui/Tabs";
import { Textarea } from "../../../shared/ui/Textarea";
import {
  listCommentsForCourse,
  createComment,
} from "../../../shared/data/comments";
import { listAssignmentsForCourse } from "../../../shared/data/assignments";
import { Button } from "../../../shared/ui/Button";
import { ProgressBar } from "../../../shared/ui/ProgressBar";
import { getCourseById } from "../../../shared/data/courses";
import { useAuth } from "../../../app/providers/AuthProvider";
import { upsertLessonProgress } from "../../../shared/data/enrollments";
import { useToast } from "../../../app/providers/ToastProvider";
import { checkEnrollmentStatus } from "../../../shared/data/enrollments";
import { QuizView } from "../../../features/student/components/QuizView";
import { AssignmentView } from "../../../features/student/components/AssignmentView";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

export function LearnPage() {
  const { courseId, lessonId } = useParams();
  const { auth } = useAuth();
  const toast = useToast();
  const [course, setCourse] = React.useState(null);
  const [current, setCurrent] = React.useState(null);
  const [done, setDone] = React.useState({}); // lessonId -> true
  const [busy, setBusy] = React.useState(false);
  const [lessonTab, setLessonTab] = React.useState("overview");
  const [comments, setComments] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);

  const [commentDraft, setCommentDraft] = React.useState("");
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);

  React.useEffect(() => {
    getCourseById(courseId).then(async (c) => {
      setCourse(c);

      // Check enrollment/owner
      if (auth.user) {
        if (auth.user.$id === c.teacherId) {
          setIsOwner(true);
          setIsEnrolled(true); // Owner has full access
        } else {
          try {
            const enrolled = await checkEnrollmentStatus(auth.user.$id, c.$id);
            setIsEnrolled(enrolled);
          } catch {
            setIsEnrolled(false);
          }
        }
      }

      const first = c.sections?.[0]?.lessons?.[0];
      const target =
        c.sections
          ?.flatMap((s) => s.lessons || [])
          .find((l) => l.$id === lessonId) || first;
      setCurrent(target);
      Promise.all([
        listCommentsForCourse(c.$id).catch(() => []),
        listAssignmentsForCourse(c.$id).catch(() => []),
      ]).then(([cm, asg]) => {
        setComments(cm);
        setAssignments(asg);
      });
    });
  }, [courseId, lessonId]);

  const lessons = course?.sections?.flatMap((s) => s.lessons || []) || [];
  const pct = lessons.length
    ? (Object.keys(done).length / lessons.length) * 100
    : 0;

  const markComplete = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await upsertLessonProgress({
        userId: auth.user.$id,
        courseId,
        lessonId: current.$id,
        watchedSec: current.durationSec || 0,
        completed: true,
      });
      setDone((p) => ({ ...p, [current.$id]: true }));
      toast.push({
        title: "Progreso guardado",
        message: "Lección marcada como completada.",
        variant: "success",
      });
    } catch (e) {
      toast.push({
        title: "Error",
        message: e?.message || "No se pudo guardar.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!course) return <LoadingScreen />;

  if (!current) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-2 text-xl font-bold">Lección no encontrada</h2>
        <p className="mb-4 text-[rgb(var(--text-secondary))]">
          La lección que buscas no existe o no está disponible.
        </p>
        <Button onClick={() => setLessonTab("overview")} variant="outline">
          Volver al curso
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            {course.title}
          </div>
          <div className="mt-1 text-xl font-black tracking-tight line-clamp-2">
            {current.title}
          </div>
        </div>
        <div className="w-36">
          <div className="text-xs text-[rgb(var(--text-secondary))] mb-1">
            Avance
          </div>
          <ProgressBar value={pct} />
          <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            {Math.round(pct)}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          {/* Video placeholder (connect to Appwrite Storage URL when ready) */}
          {/* Main Content Area: Video, Quiz, or Assignment */}
          {/* Main Content Area: Video, Quiz, or Assignment */}
          {/* Check Access */}
          {!isEnrolled && !isOwner && !current.isFreePreview ? (
            <div className="aspect-video bg-black/90 relative group">
              {/* Cover Image */}
              {(current.videoCoverFileId || course.coverFileId) && (
                <img
                  src={`YOUR_APPWRITE_ENDPOINT/storage/buckets/courseCovers/files/${current.videoCoverFileId || course.coverFileId}/view?project=${"YOUR_PROJECT_ID"}`}
                  /* TODO: Use FileService helper properly */
                  alt="Locked content"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <Lock className="h-16 w-16 text-white/50 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Contenido Bloqueado
                </h3>
                <p className="text-white/80 max-w-md mb-6">
                  Adquiere este curso para acceder a todas las lecciones y
                  recursos.
                </p>
                {/* Button handled by surrounding context presumably, or link to course detail? */}
                {/* Actually we can navigate to pay, but for now just the message as requested */}
              </div>
            </div>
          ) : (
            <>
              {current.kind === "quiz" ? (
                <QuizView
                  lessonId={current.$id}
                  courseId={courseId}
                  onComplete={markComplete}
                />
              ) : current.kind === "assignment" ? (
                <AssignmentView lessonId={current.$id} courseId={courseId} />
              ) : (
                <div className="aspect-video bg-black/90 grid place-items-center">
                  {current.kind === "video" ? (
                    current.videoFileId ? (
                      <video
                        className="w-full h-full"
                        controls
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        src={`YOUR_APPWRITE_ENDPOINT/storage/buckets/lessonVideos/files/${current.videoFileId}/view?project=${"YOUR_PROJECT_ID"}`}
                        /* TODO: Use FileService.getVideoUrl logic properly */
                      />
                    ) : (
                      <div className="text-center">
                        <PlayCircle className="mx-auto h-12 w-12 text-white/90" />
                        <div className="mt-2 text-sm text-white/80">
                          Video no disponible
                        </div>
                      </div>
                    )
                  ) : (
                    /* Article Placeholder or dedicated Article View? */
                    <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 text-gray-500 h-full flex flex-col items-center justify-center">
                      <ListVideo className="h-12 w-12 mb-2" />
                      <div>Lectura: Ver contenido abajo</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="p-4">
            {!isEnrolled && !isOwner && !current.isFreePreview ? (
              <div className="text-center py-8 text-[rgb(var(--text-muted))] italic flex flex-col items-center justify-center min-h-[200px]">
                <Lock className="h-8 w-8 mb-2 opacity-50" />
                Contenido adicional bloqueado.
              </div>
            ) : (
              <>
                <Tabs
                  value={lessonTab}
                  onValueChange={setLessonTab}
                  className="mb-3"
                >
                  <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="chapters">Capítulos</TabsTrigger>
                    <TabsTrigger value="assignments">
                      Tareas ({assignments.length})
                    </TabsTrigger>
                    <TabsTrigger value="qa">
                      Q&A ({comments.filter((c) => !c.parentId).length})
                    </TabsTrigger>
                    <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  </TabsList>
                </Tabs>

                {lessonTab === "overview" && (
                  <div>
                    <div className="text-sm font-extrabold">Descripción</div>
                    <div className="mt-2 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                      {current.description ||
                        "Esta lección incluye explicación, recursos y checklist práctico."}
                    </div>
                  </div>
                )}

                {lessonTab === "chapters" && (
                  <div className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-3">
                    <div className="text-sm font-extrabold">
                      Capítulos del video
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                      (UI lista) Conecta la colección{" "}
                      <span className="font-semibold">lessonTimestamps</span>{" "}
                      para saltar a timestamps.
                    </div>
                  </div>
                )}

                {lessonTab === "assignments" && (
                  <div className="space-y-2">
                    {assignments.length === 0 ? (
                      <div className="text-sm text-[rgb(var(--text-secondary))]">
                        No hay tareas publicadas.
                      </div>
                    ) : (
                      assignments.map((a) => (
                        <div
                          key={a.$id}
                          className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-3"
                        >
                          <div className="text-sm font-extrabold">
                            {a.title}
                          </div>
                          <div className="mt-1 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                            {a.description}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {lessonTab === "qa" && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-3">
                      <div className="text-sm font-extrabold">
                        Pregunta algo
                      </div>
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Escribe tu pregunta o comentario…"
                        />
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            if (!commentDraft.trim()) return;
                            const doc = await createComment({
                              courseId,
                              lessonId: current.$id,
                              userId: auth.user.$id,
                              body: commentDraft.trim(),
                            });
                            setComments((prev) => [doc, ...prev]);
                            setCommentDraft("");
                          }}
                        >
                          Publicar
                        </Button>
                      </div>
                    </div>

                    {comments
                      .filter((c) => c.lessonId === current.$id && !c.parentId)
                      .slice(0, 20)
                      .map((c) => (
                        <div
                          key={c.$id}
                          className="rounded-2xl border border-[rgb(var(--border-base))] p-3"
                        >
                          <div className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                            {c.body}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {lessonTab === "quiz" && (
                  <div className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-3">
                    <div className="text-sm font-extrabold">
                      Quiz de la lección
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                      (UI lista) Conecta{" "}
                      <span className="font-semibold">quizzes</span>,{" "}
                      <span className="font-semibold">quizQuestions</span> y{" "}
                      <span className="font-semibold">quizAttempts</span>.
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={markComplete}
                    disabled={busy || !!done[current.$id]}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {done[current.$id]
                      ? "Completada"
                      : busy
                        ? "Guardando..."
                        : "Marcar como completada"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold inline-flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
              Lecciones
            </div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              {lessons.length}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {lessons.map((l) => {
              const isFree = !!l.isFreePreview;
              const canAccess = isEnrolled || isOwner || isFree;

              return (
                <button
                  key={l.$id}
                  onClick={() => setCurrent(l)}
                  className={[
                    "w-full text-left rounded-2xl border p-3 transition",
                    l.$id === current.$id
                      ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.10]"
                      : "border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-muted))]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!canAccess ? (
                          <Lock className="h-3 w-3 text-[rgb(var(--text-muted))]" />
                        ) : null}
                        {canAccess && isFree && !isEnrolled && !isOwner ? (
                          <Play className="h-3 w-3 text-green-500" />
                        ) : null}
                        <div className="text-sm font-semibold line-clamp-1">
                          {l.title}
                        </div>
                      </div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">
                        {Math.round((l.durationSec || 0) / 60)} min
                      </div>
                    </div>
                    {done[l.$id] ? (
                      <CheckCircle2 className="h-4 w-4 text-[rgb(var(--success))]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
            {/* Closing brace for map */}
          </div>
        </Card>
      </div>
    </div>
  );
}
