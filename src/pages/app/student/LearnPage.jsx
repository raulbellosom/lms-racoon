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
  Search,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import { Avatar } from "../../../shared/ui/Avatar";
import { Switch } from "../../../shared/ui/Switch";
import { Input } from "../../../shared/ui/Input";
import { getProfileById, ProfileService } from "../../../shared/data/profiles";
import { useTranslation } from "react-i18next";
import { Card } from "../../../shared/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "../../../shared/ui/Tabs";
import { Textarea } from "../../../shared/ui/Textarea";
import {
  listCommentsForCourse,
  createComment,
  updateComment,
  deleteComment,
} from "../../../shared/data/comments";
// Removed listAssignmentsForCourse import
import { Button } from "../../../shared/ui/Button";
import { Dropdown, DropdownItem } from "../../../shared/ui/Dropdown";
import { Modal, ModalFooter } from "../../../shared/ui/Modal";
// Consolidated lucide-react imports above
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
  const { t } = useTranslation();
  // Common Back Button for non-video views
  const BackButton = () => (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors mb-4"
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="font-bold text-sm">{t("courses.backToCourse")}</span>
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
              {t("courses.locked.title")}
            </h3>
            <p className="text-white/60 max-w-md mx-auto">
              {t("courses.locked.description")}
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
              current.videoProvider === "minio" && current.videoHlsUrl
                ? current.videoHlsUrl
                : current.videoFileId
                  ? FileService.getLessonVideoUrl(current.videoFileId)
                  : ""
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
  authors,
}) => {
  const { t } = useTranslation();
  const [showAllQuestions, setShowAllQuestions] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState(null); // commentId
  const [editingCommentId, setEditingCommentId] = React.useState(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [replyDraft, setReplyDraft] = React.useState("");
  const [mobileReplyOpen, setMobileReplyOpen] = React.useState(false);
  const [mobileReplyTarget, setMobileReplyTarget] = React.useState(null); // comment object to reply to

  // Filter Comments Logic

  // Filter Comments Logic
  const filteredComments = React.useMemo(() => {
    let result = comments.filter((c) => {
      // 1. Filter by Lesson (unless showAll is true)
      if (!showAllQuestions && c.lessonId !== current.$id) return false;
      // 2. Filter by Parent (only top-level)
      if (c.parentId) return false;
      return true;
    });

    if (searchQuery) {
      const keywords = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((kw) => kw.length >= 2);
      if (keywords.length > 0) {
        result = result.filter((c) => {
          const parentBody = c.body.toLowerCase();
          const replies = comments.filter((r) => r.parentId === c.$id);
          const repliesBody = replies
            .map((r) => r.body.toLowerCase())
            .join(" ");
          const fullText = `${parentBody} ${repliesBody}`;

          // All keywords must be present as whole words or starting parts
          return keywords.every((kw) => {
            const regex = new RegExp(
              `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
              "i",
            );
            return regex.test(fullText);
          });
        });

        // Relevance Sorting: Count total matches across keywords
        result.sort((a, b) => {
          const getScore = (comm) => {
            const fb = comm.body.toLowerCase();
            const rb = comments
              .filter((r) => r.parentId === comm.$id)
              .map((r) => r.body.toLowerCase())
              .join(" ");
            const txt = `${fb} ${rb}`;
            return keywords.reduce((acc, kw) => {
              const regex = new RegExp(
                `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
                "gi",
              );
              return acc + (txt.match(regex)?.length || 0);
            }, 0);
          };
          return getScore(b) - getScore(a);
        });
      }
    }
    return result;
  }, [comments, current.$id, showAllQuestions, searchQuery]);

  // Highlight search keywords
  const renderHighlightedText = (text) => {
    if (!searchQuery) return text;
    const keywords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((kw) => kw.length >= 2);
    if (keywords.length === 0) return text;

    try {
      // Use word boundary \b to avoid partial matches like "ia" in "gracias"
      const pattern = keywords
        .map((kw) => `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
        .join("|");
      const regex = new RegExp(`(${pattern})`, "gi");

      return (
        <span
          dangerouslySetInnerHTML={{
            __html: text.replace(
              regex,
              '<mark class="bg-yellow-500/30 text-inherit rounded-xs px-1">$1</mark>',
            ),
          }}
        />
      );
    } catch (e) {
      return text;
    }
  };

  // Handle Reply Submit (shared between desktop inline and mobile modal)
  const handleReplySubmit = async (parentCommentId) => {
    if (!replyDraft.trim()) return;
    try {
      const doc = await createComment({
        courseId,
        lessonId: current.$id,
        userId: auth.user.$id,
        body: replyDraft.trim(),
        parentId: parentCommentId,
      });
      setComments((prev) => [doc, ...prev]);
      setReplyDraft("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create reply", error);
    }
  };

  // Count for Tab (Current Lesson Only)
  const currentLessonCount = comments.filter(
    (c) => c.lessonId === current.$id && !c.parentId,
  ).length;

  return (
    <div className="mt-6">
      <Tabs value={lessonTab} onValueChange={setLessonTab} className="w-full">
        <TabsList className="mb-6 flex-wrap overflow-x-auto scrollbar-hide justify-start">
          <TabsTrigger value="description">
            <div className="flex items-center gap-2">
              <BookText className="h-4 w-4" />
              <span>{t("courses.description")}</span>
            </div>
          </TabsTrigger>
          {currentAttachments.length > 0 && !isLocked && (
            <TabsTrigger value="resources">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>
                  {t("courses.resources")} ({currentAttachments.length})
                </span>
              </div>
            </TabsTrigger>
          )}
          <TabsTrigger value="chapters">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              <span>{t("courses.chapters")}</span>
            </div>
          </TabsTrigger>
          {/* Only show count if > 0 per requirement A */}
          <TabsTrigger value="qa">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>
                {t("courses.qa.title")}
                {currentLessonCount > 0 && ` (${currentLessonCount})`}
              </span>
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
                      {t("courses.lesson.noDescription")}
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
              <h3 className="font-bold text-lg mb-4">
                {t("courses.lesson.attachments")}
              </h3>
              {currentAttachments.map((att) => {
                const Icon = getFileIcon(att.name);
                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--brand-primary))] transition-colors"
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
                {t("courses.lesson.videoChapters")}
              </h3>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))] max-w-xs mx-auto">
                {t("courses.lesson.chaptersDesc")}
              </p>
            </div>
          )}

          {lessonTab === "qa" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Ask Question Box */}
              <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-4">
                <h4 className="text-sm font-bold mb-3">
                  {t("courses.qa.askQuestion")}
                </h4>
                {isEnrolled || isOwner ? (
                  <div className="space-y-3">
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder={t("courses.qa.placeholder")}
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
                        {t("courses.qa.submit")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[rgb(var(--text-secondary))] italic">
                    {t(
                      "courses.qa.enrollToAsk",
                      "Debes estar inscrito para hacer preguntas.",
                    )}
                  </div>
                )}
              </div>

              {/* Filters & Search */}
              {/* Filters & Search */}
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  placeholder={t("courses.qa.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 sm:pr-[280px] rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] transition-all placeholder:text-[rgb(var(--text-muted))]"
                />

                {/* Desktop Toggle (Inside) */}
                <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-3 pl-4 border-l border-[rgb(var(--border-base))] h-8">
                  <Switch
                    checked={showAllQuestions}
                    onChange={(checked) => setShowAllQuestions(checked)}
                    id="show-all-qa-desktop"
                  />
                  <label
                    htmlFor="show-all-qa-desktop"
                    className="text-sm font-medium cursor-pointer select-none text-[rgb(var(--text-secondary))]"
                  >
                    {t("courses.qa.showAll")}
                  </label>
                </div>
              </div>

              {/* Mobile Toggle (Outside) */}
              <div className="sm:hidden flex items-center justify-between px-1">
                <label
                  htmlFor="show-all-qa-mobile"
                  className="text-sm font-medium cursor-pointer select-none text-[rgb(var(--text-secondary))]"
                >
                  {t("courses.qa.showAll")}
                </label>
                <Switch
                  checked={showAllQuestions}
                  onChange={(checked) => setShowAllQuestions(checked)}
                  id="show-all-qa-mobile"
                />
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {filteredComments.length > 0 ? (
                  filteredComments.map((c) => {
                    const author = authors[c.userId];
                    const isInstructor = author?.role === "teacher";
                    const isMyComment = auth.user?.$id === c.userId;
                    const canDelete = isMyComment || isOwner || isInstructor; // Instructors/Owner can delete any? Or just theirs? Sticking to user request: instructor deletes theirs.
                    // Wait, user said "instructor solo puede borrar SUS comentarios". But usually owner can moderate?
                    // I will interpret "isMyComment" as the primary deletion rule for now.
                    // But usually an Instructor/Admin SHOULD delete spam.
                    // Let's implement: Can Delete if (My Comment OR (I am owner/instructor AND it is a student comment?))
                    // Simplest interpretation of user request: ONLY delete OWN content.
                    const canDeleteComment = isMyComment;

                    const replies = comments.filter(
                      (r) => r.parentId === c.$id,
                    );
                    const isEditing = editingCommentId === c.$id;

                    return (
                      <div
                        key={c.$id}
                        className="rounded-xl border border-[rgb(var(--border-base))] p-5 bg-[rgb(var(--bg-surface))]"
                      >
                        <div className="flex gap-4 group">
                          <Avatar
                            src={ProfileService.getAvatarUrl(
                              author?.avatarFileId,
                            )}
                            name={
                              author?.firstName && author?.lastName
                                ? `${author.firstName} ${author.lastName}`
                                : author?.displayName || "User"
                            }
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col mb-1 relative">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                    {author?.firstName && author?.lastName
                                      ? `${author.firstName} ${author.lastName}`
                                      : author?.displayName ||
                                        t("courses.qa.student")}
                                  </span>
                                  {isInstructor && (
                                    <span className="text-[10px] bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] px-1.5 py-0.5 rounded font-bold uppercase">
                                      {t("courses.qa.instructor")}
                                    </span>
                                  )}
                                  <span className="text-xs text-[rgb(var(--text-muted))]">
                                    • {new Date(c.$createdAt).toLocaleString()}
                                  </span>
                                </div>

                                {/* Actions Menu (Edit/Delete) - Replaces hover button */}
                                {(isMyComment || (isEnrolled && isMyComment)) &&
                                  !isEditing && (
                                    <Dropdown
                                      align="right"
                                      trigger={
                                        <button className="p-1 rounded-full text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                      }
                                    >
                                      <DropdownItem
                                        icon={Edit2}
                                        onClick={() => {
                                          setEditingCommentId(c.$id);
                                          setEditDraft(c.body);
                                          setReplyingTo(null);
                                        }}
                                      >
                                        {t("common.edit")}
                                      </DropdownItem>
                                      {canDeleteComment && (
                                        <DropdownItem
                                          icon={Trash2}
                                          danger
                                          onClick={async () => {
                                            if (confirm("Are you sure?")) {
                                              try {
                                                await deleteComment(c.$id);
                                                setComments((prev) =>
                                                  prev.filter(
                                                    (item) =>
                                                      item.$id !== c.$id,
                                                  ),
                                                );
                                                // Also remove replies if needed? usually backend handles cascading or we filter
                                                // Frontend clean up:
                                                const replyIds = comments
                                                  .filter(
                                                    (r) => r.parentId === c.$id,
                                                  )
                                                  .map((r) => r.$id);
                                                setComments((prev) =>
                                                  prev.filter(
                                                    (item) =>
                                                      item.$id !== c.$id &&
                                                      !replyIds.includes(
                                                        item.$id,
                                                      ),
                                                  ),
                                                );
                                              } catch (e) {
                                                console.error(
                                                  "Failed to delete",
                                                  e,
                                                );
                                              }
                                            }
                                          }}
                                        >
                                          {t("common.delete")}
                                        </DropdownItem>
                                      )}
                                    </Dropdown>
                                  )}
                              </div>
                              {author?.headline && (
                                <span className="text-xs text-[rgb(var(--text-secondary))] line-clamp-1">
                                  {author.headline}
                                </span>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                  className="min-h-[80px] bg-[rgb(var(--bg-muted))]"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditDraft("");
                                    }}
                                  >
                                    {t("common.cancel")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={!editDraft.trim() || busy}
                                    onClick={async () => {
                                      if (!editDraft.trim()) return;
                                      try {
                                        await updateComment(c.$id, {
                                          body: editDraft,
                                        });
                                        setComments((prev) =>
                                          prev.map((item) =>
                                            item.$id === c.$id
                                              ? { ...item, body: editDraft }
                                              : item,
                                          ),
                                        );
                                        setEditingCommentId(null);
                                        setEditDraft("");
                                      } catch (error) {
                                        console.error(
                                          "Failed to update comment",
                                          error,
                                        );
                                      }
                                    }}
                                  >
                                    {t("common.save")}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-[rgb(var(--text-primary))] whitespace-pre-line mt-2 group relative">
                                {renderHighlightedText(c.body)}
                              </div>
                            )}

                            {/* Action Bar */}
                            {(isEnrolled || isOwner) && !isEditing && (
                              <div className="mt-3 flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    // Check if mobile (simple check) or just open dialog?
                                    // User asked for modal in responsive.
                                    // We can use a width check or just always use modal on small screens?
                                    // For now, let's toggle a state.
                                    if (window.innerWidth < 640) {
                                      setMobileReplyTarget(c);
                                      setMobileReplyOpen(true);
                                      setReplyDraft("");
                                    } else {
                                      if (replyingTo === c.$id) {
                                        setReplyingTo(null);
                                        setReplyDraft("");
                                      } else {
                                        setReplyingTo(c.$id);
                                        setReplyDraft("");
                                      }
                                    }
                                  }}
                                  className="text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--brand-primary))] transition-colors flex items-center gap-1"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {t("courses.qa.respond", "Responder")}
                                </button>
                              </div>
                            )}

                            {/* Replies List */}
                            {replies.length > 0 && (
                              <div className="mt-4 space-y-4 pl-4 border-l-2 border-[rgb(var(--border-base))]">
                                {replies.map((reply) => {
                                  const rAuthor = authors[reply.userId];
                                  const rIsInstructor =
                                    rAuthor?.role === "teacher";
                                  const isMyReply =
                                    auth.user?.$id === reply.userId;
                                  const isEditingReply =
                                    editingCommentId === reply.$id;

                                  const canDeleteReply = isMyReply;

                                  return (
                                    <div
                                      key={reply.$id}
                                      className="flex gap-3 group"
                                    >
                                      <Avatar
                                        src={ProfileService.getAvatarUrl(
                                          rAuthor?.avatarFileId,
                                        )}
                                        name={
                                          rAuthor?.firstName &&
                                          rAuthor?.lastName
                                            ? `${rAuthor.firstName} ${rAuthor.lastName}`
                                            : rAuthor?.displayName || "User"
                                        }
                                        size="sm"
                                      />
                                      <div className="flex-1">
                                        <div className="flex flex-col mb-1 relative">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-[rgb(var(--text-primary))]">
                                                {rAuthor?.firstName &&
                                                rAuthor?.lastName
                                                  ? `${rAuthor.firstName} ${rAuthor.lastName}`
                                                  : rAuthor?.displayName ||
                                                    t("courses.qa.student")}
                                              </span>
                                              {rIsInstructor && (
                                                <span className="text-[9px] bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] px-1 py-0.5 rounded font-bold uppercase">
                                                  {t("courses.qa.instructor")}
                                                </span>
                                              )}
                                              <span className="text-[10px] text-[rgb(var(--text-muted))]">
                                                •{" "}
                                                {new Date(
                                                  reply.$createdAt,
                                                ).toLocaleString()}
                                              </span>
                                            </div>

                                            {/* Action Menu (Reply) */}
                                            {(isMyReply || isOwner) &&
                                              !isEditingReply && (
                                                <Dropdown
                                                  align="right"
                                                  trigger={
                                                    <button className="p-1 rounded-full text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))] transition-colors">
                                                      <MoreVertical className="h-3 w-3" />
                                                    </button>
                                                  }
                                                >
                                                  <DropdownItem
                                                    icon={Edit2}
                                                    onClick={() => {
                                                      setEditingCommentId(
                                                        reply.$id,
                                                      );
                                                      setEditDraft(reply.body);
                                                    }}
                                                  >
                                                    {t("common.edit")}
                                                  </DropdownItem>
                                                  {canDeleteReply && (
                                                    <DropdownItem
                                                      icon={Trash2}
                                                      danger
                                                      onClick={async () => {
                                                        if (
                                                          confirm(
                                                            "Are you sure?",
                                                          )
                                                        ) {
                                                          try {
                                                            await deleteComment(
                                                              reply.$id,
                                                            );
                                                            setComments(
                                                              (prev) =>
                                                                prev.filter(
                                                                  (item) =>
                                                                    item.$id !==
                                                                    reply.$id,
                                                                ),
                                                            );
                                                          } catch (e) {
                                                            console.error(e);
                                                          }
                                                        }
                                                      }}
                                                    >
                                                      {t("common.delete")}
                                                    </DropdownItem>
                                                  )}
                                                </Dropdown>
                                              )}
                                          </div>
                                        </div>

                                        {isEditingReply ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={editDraft}
                                              onChange={(e) =>
                                                setEditDraft(e.target.value)
                                              }
                                              className="text-xs min-h-[60px] bg-[rgb(var(--bg-muted))]"
                                            />
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingCommentId(null);
                                                  setEditDraft("");
                                                }}
                                              >
                                                {t("common.cancel")}
                                              </Button>
                                              <Button
                                                size="sm"
                                                disabled={!editDraft.trim()}
                                                onClick={async () => {
                                                  if (!editDraft.trim()) return;
                                                  try {
                                                    await updateComment(
                                                      reply.$id,
                                                      { body: editDraft },
                                                    );
                                                    setComments((prev) =>
                                                      prev.map((item) =>
                                                        item.$id === reply.$id
                                                          ? {
                                                              ...item,
                                                              body: editDraft,
                                                            }
                                                          : item,
                                                      ),
                                                    );
                                                    setEditingCommentId(null);
                                                    setEditDraft("");
                                                  } catch (error) {
                                                    console.error(
                                                      "Failed to update reply",
                                                      error,
                                                    );
                                                  }
                                                }}
                                              >
                                                {t("common.save")}
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-[rgb(var(--text-primary))] whitespace-pre-line group relative">
                                            {renderHighlightedText(reply.body)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Reply Form */}
                            {replyingTo === c.$id && (
                              <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                <Avatar
                                  src={ProfileService.getAvatarUrl(
                                    authors[auth.user?.$id]?.avatarFileId,
                                  )}
                                  name={
                                    authors[auth.user?.$id]?.firstName &&
                                    authors[auth.user?.$id]?.lastName
                                      ? `${authors[auth.user?.$id]?.firstName} ${authors[auth.user?.$id]?.lastName}`
                                      : auth.user?.name || "Me"
                                  }
                                  size="sm"
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                  <Textarea
                                    autoFocus
                                    value={replyDraft}
                                    onChange={(e) =>
                                      setReplyDraft(e.target.value)
                                    }
                                    placeholder={t(
                                      "courses.qa.replyPlaceholder",
                                      "Escribe tu respuesta...",
                                    )}
                                    className="text-xs min-h-[80px] bg-[rgb(var(--bg-muted))]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyDraft("");
                                      }}
                                    >
                                      {t("common.cancel")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={!replyDraft.trim()}
                                      onClick={async () => {
                                        await handleReplySubmit(c.$id);
                                      }}
                                    >
                                      {t("common.submit")}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-[rgb(var(--text-muted))]">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>
                      {searchQuery
                        ? t("common.noResults", "No se encontraron resultados")
                        : showAllQuestions
                          ? t("courses.qa.noQuestionsCourse")
                          : t("courses.qa.noQuestionsLesson")}
                    </p>
                    {!searchQuery && !showAllQuestions && (
                      <p className="text-sm mt-1">{t("courses.qa.beFirst")}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Reply Modal */}
              <Modal
                open={mobileReplyOpen}
                onClose={() => {
                  setMobileReplyOpen(false);
                  setReplyDraft("");
                  setMobileReplyTarget(null);
                }}
                title={t("courses.qa.respond", "Responder")}
                showClose={true}
                size="md"
              >
                <div className="space-y-4">
                  {mobileReplyTarget && (
                    <div className="bg-[rgb(var(--bg-muted))] p-3 rounded-lg text-sm text-[rgb(var(--text-secondary))] border-l-2 border-[rgb(var(--brand-primary))] italic">
                      {mobileReplyTarget.body.length > 100
                        ? mobileReplyTarget.body.substring(0, 100) + "..."
                        : mobileReplyTarget.body}
                    </div>
                  )}
                  <Textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder={t(
                      "courses.qa.replyPlaceholder",
                      "Escribe tu respuesta...",
                    )}
                    className="min-h-[120px] text-base"
                    autoFocus
                  />
                  <ModalFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMobileReplyOpen(false);
                        setReplyDraft("");
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!mobileReplyTarget) return;
                        await handleReplySubmit(mobileReplyTarget.$id);
                        setMobileReplyOpen(false);
                      }}
                      disabled={!replyDraft.trim() || busy}
                    >
                      {t("courses.qa.submit", "Enviar")}
                    </Button>
                  </ModalFooter>
                </div>
              </Modal>
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
                ? t("courses.lesson.completed")
                : busy
                  ? t("courses.lesson.saving")
                  : t("courses.lesson.markComplete")}
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
  const { t } = useTranslation();
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
          {t("courses.content")}
        </div>
        <div className="rounded-full bg-[rgb(var(--brand-primary)/0.1)] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--brand-primary))]">
          {course.sections?.flatMap((s) => s.lessons || []).length || 0}{" "}
          {t("courses.lessons")}
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
  const [authors, setAuthors] = React.useState({}); // userId -> profile

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
        // Optional: List comments/assignments
        // We run these without awaiting to not block the main UI render
        listCommentsForCourse(c.$id)
          .then(async (res) => {
            if (!isMounted) return;
            setComments(res);

            // Fetch authors
            const userIds = [...new Set(res.map((c) => c.userId))];
            const newAuthors = {};
            // Fetch one by one for simplicity (optimize later if needed)
            for (const uid of userIds) {
              try {
                const profile = await getProfileById(uid);
                newAuthors[uid] = profile;
              } catch (e) {
                console.warn("Failed to load author", uid);
              }
            }

            // Also fetch current user profile if not present
            if (auth.user && !newAuthors[auth.user.$id]) {
              try {
                const myProfile = await getProfileById(auth.user.$id);
                newAuthors[auth.user.$id] = myProfile;
              } catch (e) {
                console.error("Failed to fetch my profile", e);
              }
            }

            if (isMounted) setAuthors((prev) => ({ ...prev, ...newAuthors }));
          })
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
              authors={authors}
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
              authors={authors}
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
