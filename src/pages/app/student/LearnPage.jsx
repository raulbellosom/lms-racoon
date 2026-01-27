import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ListVideo,
  PlayCircle,
  Lock,
  Play,
  ArrowLeft,
} from "lucide-react";
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
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { FileService } from "../../../shared/data/files";

export function LearnPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
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

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      // Only set loading to true if we don't have a course yet or the courseId changed
      if (!course || course.$id !== courseId) {
        setLoading(true);
      }
      setError(null);

      try {
        const [c, sectionsData, lessonsData] = await Promise.all([
          getCourseById(courseId),
          SectionService.listByCourse(courseId),
          LessonService.listByCourse(courseId),
        ]);

        // Integrate lessons into sections
        const sectionsWithLessons = sectionsData.map((s) => ({
          ...s,
          lessons: lessonsData
            .filter((l) => l.sectionId === s.$id)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        }));

        setCourse({ ...c, sections: sectionsWithLessons });

        // Check enrollment/owner
        if (auth.user) {
          if (auth.user.$id === c.teacherId) {
            setIsOwner(true);
            setIsEnrolled(true);
          } else {
            const enrolled = await checkEnrollmentStatus(auth.user.$id, c.$id);
            setIsEnrolled(enrolled);
          }
        }

        const allLessons = sectionsWithLessons.flatMap((s) => s.lessons || []);
        const first = allLessons[0];
        const target = lessonId
          ? allLessons.find((l) => l.$id === lessonId)
          : first;

        setCurrent(target || first);

        // Optional: List comments/assignments
        listCommentsForCourse(c.$id)
          .then(setComments)
          .catch(() => []);
        listAssignmentsForCourse(c.$id)
          .then(setAssignments)
          .catch(() => []);
      } catch (err) {
        console.error("Failed to load learn page data", err);
        setError(err);
        toast.push({
          title: "Error",
          message: "No se pudo cargar la información del curso.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, lessonId, auth.user?.$id]);

  const lessonsCount =
    course?.sections?.flatMap((s) => s.lessons || []).length || 0;
  const pct = lessonsCount
    ? (Object.keys(done).length / lessonsCount) * 100
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

  if (loading && !course) return <LoadingScreen />;

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="mb-2 text-xl font-bold">Error al cargar</h2>
        <p className="mb-4 text-[rgb(var(--text-secondary))]">
          Hubo un problema al cargar el curso.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  // Crash prevention: Ensure both course and current lesson are loaded before rendering main UI
  if (!course || !current) {
    if (loading) return <LoadingScreen />;

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
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (auth.user) {
              navigate(`/app/courses/${courseId}`);
            } else {
              navigate(`/catalog/${courseId}`);
            }
          }}
          className="h-10 w-10 p-0 rounded-full hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] shrink-0"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-[rgb(var(--text-secondary))] truncate">
              {course.title}
            </div>
            <div className="mt-0.5 text-xl font-black tracking-tight line-clamp-1">
              {current.title}
            </div>
          </div>
          <div className="w-32 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-1 text-right">
              {Math.round(pct)}% completado
            </div>
            <ProgressBar value={pct} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          {/* Check Access */}
          {!isEnrolled && !isOwner && !current.isFreePreview ? (
            <div className="aspect-video bg-black/95 relative flex flex-col items-center justify-center p-6 text-center">
              {(current.videoCoverFileId || course.coverFileId) && (
                <img
                  src={FileService.getCourseCoverUrl(
                    current.videoCoverFileId || course.coverFileId,
                  )}
                  alt="Locked content"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />
              )}
              <div className="relative z-10">
                <Lock className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Contenido Bloqueado
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Adquiere este curso para acceder a todas las lecciones y
                  recursos.
                </p>
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
                <div className="aspect-video bg-black grid place-items-center">
                  {current.kind === "video" ? (
                    current.videoFileId ? (
                      <video
                        key={current.$id}
                        className="w-full h-full"
                        controls
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        src={FileService.getLessonVideoUrl(current.videoFileId)}
                        poster={
                          current.videoCoverFileId
                            ? FileService.getCourseCoverUrl(
                                current.videoCoverFileId,
                              )
                            : undefined
                        }
                      />
                    ) : (
                      <div className="text-center">
                        <PlayCircle className="mx-auto h-12 w-12 text-white/50" />
                        <div className="mt-2 text-sm text-white/40">
                          Video no disponible
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8 text-[rgb(var(--text-muted))] h-full flex flex-col items-center justify-center bg-[rgb(var(--bg-muted))]">
                      <ListVideo className="h-12 w-12 mb-2 opacity-50" />
                      <div>Contenido de lectura disponible abajo</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="p-4 sm:p-6">
            {!isEnrolled && !isOwner && !current.isFreePreview ? (
              <div className="text-center py-12 text-[rgb(var(--text-muted))] italic flex flex-col items-center justify-center min-h-[200px]">
                <Lock className="h-8 w-8 mb-4 opacity-30" />
                Contenido adicional bloqueado.
              </div>
            ) : (
              <>
                <Tabs
                  value={lessonTab}
                  onValueChange={setLessonTab}
                  className="mb-6 overflow-x-auto"
                >
                  <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(var(--brand-primary))] data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger
                      value="chapters"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(var(--brand-primary))] data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Capítulos
                    </TabsTrigger>
                    <TabsTrigger
                      value="assignments"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(var(--brand-primary))] data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Tareas ({assignments.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="qa"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(var(--brand-primary))] data-[state=active]:bg-transparent px-4 py-2"
                    >
                      Q&A ({comments.filter((c) => !c.parentId).length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    {lessonTab === "overview" && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-sm font-black text-[rgb(var(--text-primary))] uppercase tracking-wider mb-3">
                          Descripción
                        </h3>
                        <div className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line leading-relaxed">
                          {current.description ||
                            "Esta lección incluye explicación detallada y recursos prácticos."}
                        </div>
                      </div>
                    )}

                    {lessonTab === "chapters" && (
                      <div className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-6 text-center animate-in fade-in duration-300">
                        <PlayCircle className="h-10 w-10 mx-auto mb-3 text-[rgb(var(--text-muted))]" />
                        <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                          Capítulos del video
                        </h3>
                        <p className="mt-2 text-sm text-[rgb(var(--text-secondary))] max-w-xs mx-auto">
                          Próximamente podrás saltar directamente a los puntos
                          clave de esta lección.
                        </p>
                      </div>
                    )}

                    {lessonTab === "assignments" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {assignments.length === 0 ? (
                          <div className="text-center py-8 text-sm text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] rounded-2xl">
                            No hay tareas publicadas para este curso aún.
                          </div>
                        ) : (
                          assignments.map((a) => (
                            <div
                              key={a.$id}
                              className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 shadow-sm"
                            >
                              <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                {a.title}
                              </div>
                              <div className="mt-2 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                                {a.description}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {lessonTab === "qa" && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-4">
                          <h4 className="text-sm font-bold mb-3">
                            Haz una pregunta
                          </h4>
                          <div className="space-y-3">
                            <Textarea
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="Comparte tus dudas o comentarios sobre esta lección..."
                              className="bg-[rgb(var(--bg-surface))] border-none focus:ring-1 focus:ring-[rgb(var(--brand-primary))]"
                            />
                            <div className="flex justify-end">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={!commentDraft.trim()}
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
                                Publicar Comentario
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {comments
                            .filter(
                              (c) => c.lessonId === current.$id && !c.parentId,
                            )
                            .map((c) => (
                              <div
                                key={c.$id}
                                className="rounded-2xl border border-[rgb(var(--border-base))] p-4 bg-[rgb(var(--bg-surface))]"
                              >
                                <div className="text-sm text-[rgb(var(--text-primary))] whitespace-pre-line">
                                  {c.body}
                                </div>
                                <div className="mt-2 text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold">
                                  {new Date(c.$createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs>

                <div className="mt-8 pt-6 border-t border-[rgb(var(--border-base))]">
                  <Button
                    onClick={markComplete}
                    disabled={busy || !!done[current.$id]}
                    className="w-full sm:w-auto font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {done[current.$id]
                      ? "Lección Completada"
                      : busy
                        ? "Guardando..."
                        : "Marcar como completada"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-4 h-fit sticky top-20">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-sm font-black uppercase tracking-widest inline-flex items-center gap-2 text-[rgb(var(--brand-primary))]">
              <ListVideo className="h-4 w-4" />
              Contenido
            </div>
            <div className="rounded-full bg-[rgb(var(--brand-primary)/0.1)] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--brand-primary))]">
              {course.sections?.flatMap((s) => s.lessons || []).length || 0}{" "}
              lecciones
            </div>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            {course.sections?.map((section) => (
              <div key={section.$id} className="space-y-2">
                <div className="px-2 text-[10px] font-black text-[rgb(var(--text-muted))] uppercase tracking-tight">
                  {section.title}
                </div>
                <div className="space-y-1.5">
                  {section.lessons?.map((l) => {
                    const isFree = !!l.isFreePreview;
                    const canAccess = isEnrolled || isOwner || isFree;
                    const isActive = l.$id === current.$id;

                    return (
                      <button
                        key={l.$id}
                        onClick={() => setCurrent(l)}
                        className={[
                          "w-full text-left rounded-xl p-3 transition-all duration-200 group relative overflow-hidden",
                          isActive
                            ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                            : "hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]",
                        ].join(" ")}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--brand-primary))]" />
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {!canAccess ? (
                                <Lock className="h-3 w-3 shrink-0 opacity-50" />
                              ) : isFree && !isEnrolled && !isOwner ? (
                                <Play className="h-3 w-3 shrink-0 text-green-500" />
                              ) : (
                                <PlayCircle
                                  className={`h-3 w-3 shrink-0 ${isActive ? "text-[rgb(var(--brand-primary))]" : "opacity-50"}`}
                                />
                              )}
                              <div
                                className={`text-xs font-bold truncate ${isActive ? "text-[rgb(var(--text-primary))]" : "group-hover:text-[rgb(var(--text-primary))]"}`}
                              >
                                {l.title}
                              </div>
                            </div>
                            <div className="mt-0.5 ml-5 text-[10px] opacity-60 font-medium">
                              {Math.round((l.durationSec || 0) / 60)} min
                            </div>
                          </div>
                          {done[l.$id] && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[rgb(var(--success))] shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
