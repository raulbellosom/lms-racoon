import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCircle2,
  ListVideo,
  PlayCircle,
  Lock,
  Play,
  ArrowLeft,
  FileText,
  File,
  Download,
  Paperclip,
  ChevronDown,
  ChevronRight,
  BookText,
  Layers3,
  ClipboardList,
  MessageSquare,
  HelpCircle,
  Folder,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "../../../shared/ui/Tabs";
import { Textarea } from "../../../shared/ui/Textarea";
import {
  listCommentsForCourse,
  createComment,
} from "../../../shared/data/comments";
// Removed listAssignmentsForCourse import
import { Button } from "../../../shared/ui/Button";
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
import { VideoPlayer } from "../../../shared/ui/VideoPlayer";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../shared/ui/cn";

// Helper for file icons
const getFileIcon = (filename) => {
  const ext = filename?.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return FileText;
  return File;
};

// --- Extracted Components to prevent re-renders ---

const LessonViewer = ({
  current,
  course,
  isLocked,
  theaterMode,
  setTheaterMode,
  handleBack,
  markComplete,
}) => {
  // Common Back Button for non-video views
  const BackButton = () => (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors mb-4"
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="font-bold text-sm">Volver al curso</span>
    </button>
  );

  if (isLocked) {
    return (
      <div className="w-full bg-black relative aspect-video shadow-2xl">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
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
              Adquiere este curso para acceder a todas las lecciones y recursos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "video") {
    return (
      <div className="w-full">
        <div className="bg-black relative aspect-video shadow-2xl">
          <VideoPlayer
            src={
              current.videoFileId
                ? FileService.getLessonVideoUrl(current.videoFileId)
                : null
            }
            poster={
              current.videoCoverFileId
                ? FileService.getCourseCoverUrl(current.videoCoverFileId)
                : undefined
            }
            title={current.title}
            onBack={handleBack}
            theaterMode={theaterMode}
            onToggleTheater={() => setTheaterMode(!theaterMode)}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  // Non-video content: Header placeholder
  return (
    <div className="w-full">
      <BackButton />
      <div className="relative aspect-video lg:aspect-21/9 rounded-2xl overflow-hidden bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-base))] shadow-sm flex items-center justify-center p-8 group">
        {(current.videoCoverFileId || course.coverFileId) && (
          <img
            src={FileService.getCourseCoverUrl(
              current.videoCoverFileId || course.coverFileId,
            )}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
          />
        )}
        <div className="relative z-10 text-center max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 p-2 rounded-full bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] mb-4">
            {current.kind === "quiz" && <HelpCircle className="h-5 w-5" />}
            {current.kind === "assignment" && (
              <ClipboardList className="h-5 w-5" />
            )}
            {current.kind === "article" && <FileText className="h-5 w-5" />}
            <span className="text-xs font-black uppercase tracking-widest px-2">
              {current.kind === "quiz"
                ? "Evaluación"
                : current.kind === "assignment"
                  ? "Tarea"
                  : "Artículo / Lectura"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[rgb(var(--text-primary))] tracking-tight mb-2">
            {current.title}
          </h2>
          <p className="text-[rgb(var(--text-secondary))] font-medium">
            Sigue las instrucciones en la sección de descripción para continuar.
          </p>
        </div>
      </div>
    </div>
  );
};

const LessonTabs = ({
  lessonTab,
  setLessonTab,
  current,
  currentAttachments,
  isLocked,
  comments,
  commentDraft,
  setCommentDraft,
  auth,
  isEnrolled,
  isOwner,
  busy,
  done,
  markComplete,
  setComments,
  courseId,
}) => {
  return (
    <div className="mt-6">
      <Tabs value={lessonTab} onValueChange={setLessonTab} className="w-full">
        <TabsList className="mb-6 flex-wrap overflow-x-auto scrollbar-hide justify-start">
          <TabsTrigger value="description">
            <div className="flex items-center gap-2">
              <BookText className="h-4 w-4" />
              <span>Descripción</span>
            </div>
          </TabsTrigger>
          {currentAttachments.length > 0 && !isLocked && (
            <TabsTrigger value="resources">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Recursos ({currentAttachments.length})</span>
              </div>
            </TabsTrigger>
          )}
          <TabsTrigger value="chapters">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              <span>Capítulos</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="qa">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Q&A ({comments.filter((c) => !c.parentId).length})</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="px-1">
          {lessonTab === "description" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h1 className="text-2xl font-bold mb-4">{current.title}</h1>
              {(current.description ||
                (current.kind !== "quiz" && current.kind !== "assignment")) && (
                <div className="markdown-content text-[rgb(var(--text-secondary))] leading-relaxed mb-8">
                  {current.description ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {current.description}
                    </ReactMarkdown>
                  ) : (
                    <p className="italic opacity-60">
                      Sin descripción detallada.
                    </p>
                  )}
                </div>
              )}

              {!isLocked && (
                <div className="mt-2 pt-2 border-t border-[rgb(var(--border-base))]">
                  {current.kind === "quiz" && (
                    <QuizView
                      lessonId={current.$id}
                      courseId={courseId}
                      onComplete={markComplete}
                    />
                  )}

                  {current.kind === "assignment" && (
                    <div className="rounded-2xl border border-[rgb(var(--border-base))] overflow-hidden bg-[rgb(var(--bg-base))] shadow-sm">
                      <AssignmentView
                        lessonId={current.$id}
                        courseId={courseId}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {lessonTab === "resources" && (
            <div className="animate-in fade-in duration-300 space-y-3">
              <h3 className="font-bold text-lg mb-4">Archivos Adjuntos</h3>
              {currentAttachments.map((att) => {
                const Icon = getFileIcon(att.name);
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--brand-primary))] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[rgb(var(--bg-muted))] text-[rgb(var(--brand-primary))]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-[rgb(var(--text-primary))]">
                          {att.name}
                        </div>
                        <div className="text-xs text-[rgb(var(--text-muted))]">
                          {(att.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                    <a
                      href={FileService.getLessonAttachmentUrl(att.id)}
                      download
                      className="p-2 rounded-full hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--brand-primary))] transition-colors"
                      title="Descargar"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {lessonTab === "chapters" && (
            <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-6 text-center animate-in fade-in duration-300">
              <PlayCircle className="h-10 w-10 mx-auto mb-3 text-[rgb(var(--text-muted))]" />
              <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                Capítulos del video
              </h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))] max-w-xs mx-auto">
                Próximamente podrás saltar directamente a los puntos clave de
                esta lección.
              </p>
            </div>
          )}

          {lessonTab === "qa" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-4">
                <h4 className="text-sm font-bold mb-3">Haz una pregunta</h4>
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
                  .filter((c) => c.lessonId === current.$id && !c.parentId)
                  .map((c) => (
                    <div
                      key={c.$id}
                      className="rounded-xl border border-[rgb(var(--border-base))] p-4 bg-[rgb(var(--bg-surface))]"
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

        {/* Action Button: Only if enrolled AND NOT owner */}
        {isEnrolled && !isOwner && (
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
        )}
      </Tabs>
    </div>
  );
};

const CourseContentList = ({
  className,
  course,
  isEnrolled,
  isOwner,
  current,
  done = {},
  expandedSections = {},
  toggleSection,
  onSelectLesson,
}) => {
  return (
    <div
      className={cn(
        "p-0 overflow-hidden shadow-none border-none bg-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-sm font-black uppercase tracking-widest inline-flex items-center gap-2 text-[rgb(var(--brand-primary))]">
          <ListVideo className="h-4 w-4" />
          Contenido
        </div>
        <div className="rounded-full bg-[rgb(var(--brand-primary)/0.1)] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--brand-primary))]">
          {course.sections?.flatMap((s) => s.lessons || []).length || 0}{" "}
          lecciones
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 scrollbar-thin pb-10">
        {course.sections?.map((section) => {
          const isExpanded = expandedSections[section.$id];

          return (
            <div
              key={section.$id}
              className="rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))/0.15] overflow-hidden backdrop-blur-sm mb-4 transition-all"
            >
              <button
                onClick={() => toggleSection(section.$id)}
                className="w-full flex items-center justify-between p-3 bg-[rgb(var(--bg-muted))/0.5] hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors"
                type="button"
              >
                <div className="text-[10px] font-black text-[rgb(var(--text-primary))] uppercase tracking-widest text-left opacity-70">
                  {section.title}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      {section.lessons?.map((l) => {
                        const isFree = !!l.isFreePreview;
                        const canAccess = isEnrolled || isOwner || isFree;
                        const isActive = l.$id === current.$id;
                        const hasAttachments =
                          l.attachments && l.attachments.length > 0;

                        // Determine Thumbnail
                        let thumbUrl = null;
                        if (l.videoCoverFileId)
                          thumbUrl = FileService.getCourseCoverUrl(
                            l.videoCoverFileId,
                            { width: 100, height: 60 },
                          );

                        return (
                          <button
                            key={l.$id}
                            onClick={() => onSelectLesson(l)}
                            className={[
                              "w-full text-left rounded-md p-2 transition-all duration-200 group relative overflow-hidden flex gap-3",
                              isActive
                                ? "bg-[rgb(var(--brand-primary)/0.05)] ring-1 ring-[rgb(var(--brand-primary)/0.2)]"
                                : "hover:bg-[rgb(var(--bg-muted))] border border-transparent hover:border-[rgb(var(--border-base))]",
                            ].join(" ")}
                          >
                            {/* Thumbnail / Icon */}
                            <div className="shrink-0 w-24 aspect-video rounded-md overflow-hidden bg-black/5 relative grid place-items-center">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={l.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : l.kind === "quiz" ? (
                                <div className="w-full h-full bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                                  <HelpCircle className="h-6 w-6 text-violet-500" />
                                </div>
                              ) : l.kind === "assignment" ? (
                                <div className="w-full h-full bg-linear-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                  <ClipboardList className="h-6 w-6 text-orange-500" />
                                </div>
                              ) : l.kind === "article" ? (
                                <div className="w-full h-full bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-blue-500" />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-black/5 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-[rgb(var(--text-muted))]" />
                                </div>
                              )}

                              {!canAccess && (
                                <div className="absolute inset-0 bg-black/50 grid place-items-center">
                                  <Lock className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                              <div
                                className={`text-xs font-bold leading-tight line-clamp-2 ${isActive ? "text-[rgb(var(--brand-primary))]" : "text-[rgb(var(--text-secondary))]"}`}
                              >
                                {l.title}
                              </div>
                              <div className="text-[10px] text-[rgb(var(--text-muted))] font-medium flex items-center gap-2">
                                <span>
                                  {Math.round((l.durationSec || 0) / 60)} min
                                </span>
                                {hasAttachments && (
                                  <Paperclip className="h-3 w-3 opacity-70" />
                                )}
                              </div>
                            </div>

                            {done[l.$id] && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[rgb(var(--success))]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function LearnPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const toast = useToast();
  const [course, setCourse] = React.useState(null);
  const [current, setCurrent] = React.useState(null);
  const [done, setDone] = React.useState({}); // lessonId -> true
  const [busy, setBusy] = React.useState(false);
  const [lessonTab, setLessonTab] = React.useState("description");
  const [comments, setComments] = React.useState([]);

  const [commentDraft, setCommentDraft] = React.useState("");
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Theater Mode State
  const [theaterMode, setTheaterMode] = React.useState(false);

  // Attachments State
  const [currentAttachments, setCurrentAttachments] = React.useState([]);

  // Collapsed Sections State
  const [expandedSections, setExpandedSections] = React.useState({});

  // Determine if mobile for default theater mode
  React.useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setTheaterMode(true);
      }
    };

    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (!courseId) return;

    let isMounted = true;

    const loadData = async () => {
      // Only set loading to true if we don't have a course yet or the courseId changed (genuine navigation)
      // DO NOT set loading to true just because auth state updated or on strict mode double-invocations
      if (!course || course.$id !== courseId) {
        setLoading(true);
      }

      const currentError = null;
      setError(null);

      try {
        const [c, sectionsData, lessonsData] = await Promise.all([
          getCourseById(courseId),
          SectionService.listByCourse(courseId),
          LessonService.listByCourse(courseId),
        ]);

        if (!isMounted) return;

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
            if (isMounted) setIsEnrolled(enrolled);
          }
        }

        // Determine current lesson
        // If we already have a 'current' lesson and it belongs to this course, try to keep it
        // to prevent UI jumping unless the URL param explicitly changed.
        const allLessons = sectionsWithLessons.flatMap((s) => s.lessons || []);
        const first = allLessons[0];

        let target = lessonId
          ? allLessons.find((l) => l.$id === lessonId)
          : first;

        // Fallback or keep current if valid (though usually data flows from URL)
        setCurrent(target || first);

        // Expand the section containing the target lesson
        if (target) {
          const section = sectionsWithLessons.find((s) =>
            s.lessons.some((l) => l.$id === target.$id),
          );
          if (section) {
            setExpandedSections((prev) => ({ ...prev, [section.$id]: true }));
          }
        }

        // Optional: List comments/assignments
        // We run these without awaiting to not block the main UI render
        listCommentsForCourse(c.$id)
          .then((res) => isMounted && setComments(res))
          .catch(() => []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load learn page data", err);
        setError(err);
        toast.push({
          title: "Error",
          message: "No se pudo cargar la información del curso.",
          variant: "error",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId, auth.user?.$id]);

  // Load attachments
  React.useEffect(() => {
    const fetchAttachments = async () => {
      if (!current) {
        setCurrentAttachments([]);
        return;
      }
      if (current.attachments && current.attachments.length > 0) {
        // Appwrite supports array of strings
        try {
          const files = await Promise.all(
            current.attachments.map(async (id) => {
              try {
                const meta = await FileService.getLessonAttachmentMetadata(id);
                return {
                  id: meta.$id,
                  name: meta.name,
                  size: meta.sizeOriginal,
                };
              } catch {
                return null;
              }
            }),
          );
          setCurrentAttachments(files.filter(Boolean));
        } catch {
          setCurrentAttachments([]);
        }
      } else if (current.attachmentsJson) {
        // Old format backward compatibility
        try {
          setCurrentAttachments(JSON.parse(current.attachmentsJson));
        } catch {
          setCurrentAttachments([]);
        }
      } else {
        setCurrentAttachments([]);
      }
    };
    fetchAttachments();
  }, [current]);

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

  const handleBack = () => {
    if (auth.user) {
      navigate(`/app/courses/${courseId}`);
    } else {
      navigate(`/catalog/${courseId}`);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
        <Button onClick={() => setLessonTab("description")} variant="outline">
          Volver al curso
        </Button>
      </div>
    );
  }

  const isLocked = !isEnrolled && !isOwner && !current.isFreePreview;

  // Render
  return (
    <div
      className={`mx-auto ${theaterMode ? "max-w-[1800px] px-0" : "max-w-7xl px-4 py-6"}`}
    >
      {/* Theater Mode Layout */}
      {theaterMode ? (
        <div className="space-y-6">
          <div className="bg-black w-full">
            <div className="max-w-[1800px] mx-auto">
              <LessonViewer
                current={current}
                course={course}
                isLocked={isLocked}
                theaterMode={theaterMode}
                setTheaterMode={setTheaterMode}
                handleBack={handleBack}
                markComplete={markComplete}
              />
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 grid gap-8 lg:grid-cols-[1fr_350px]">
            <LessonTabs
              lessonTab={lessonTab}
              setLessonTab={setLessonTab}
              current={current}
              currentAttachments={currentAttachments}
              isLocked={isLocked}
              comments={comments}
              commentDraft={commentDraft}
              setCommentDraft={setCommentDraft}
              auth={auth}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              busy={busy}
              done={done}
              markComplete={markComplete}
              setComments={setComments}
              courseId={courseId}
            />
            <CourseContentList
              className="hidden lg:block h-fit sticky top-24"
              course={course}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              current={current}
              done={done}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onSelectLesson={(l) =>
                navigate(`/app/learn/${courseId}/${l.$id}`)
              }
            />
          </div>
          {/* Mobile / Stacked Content */}
          <div className="lg:hidden px-4">
            <CourseContentList
              course={course}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              current={current}
              done={done}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onSelectLesson={(l) =>
                navigate(`/app/learn/${courseId}/${l.$id}`)
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_350px]">
          {/* Left Column */}
          <div className="min-w-0">
            <LessonViewer
              current={current}
              course={course}
              isLocked={isLocked}
              theaterMode={theaterMode}
              setTheaterMode={setTheaterMode}
              handleBack={handleBack}
              markComplete={markComplete}
            />
            <LessonTabs
              lessonTab={lessonTab}
              setLessonTab={setLessonTab}
              current={current}
              currentAttachments={currentAttachments}
              isLocked={isLocked}
              comments={comments}
              commentDraft={commentDraft}
              setCommentDraft={setCommentDraft}
              auth={auth}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              busy={busy}
              done={done}
              markComplete={markComplete}
              setComments={setComments}
              courseId={courseId}
            />
          </div>

          {/* Right Column */}
          <div className="hidden lg:block min-w-0">
            <CourseContentList
              className="h-fit sticky top-24"
              course={course}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              current={current}
              done={done}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onSelectLesson={(l) =>
                navigate(`/app/learn/${courseId}/${l.$id}`)
              }
            />
          </div>

          {/* Mobile Content List */}
          <div className="lg:hidden mt-4">
            <CourseContentList
              course={course}
              isEnrolled={isEnrolled}
              isOwner={isOwner}
              current={current}
              done={done}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              onSelectLesson={(l) =>
                navigate(`/app/learn/${courseId}/${l.$id}`)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
