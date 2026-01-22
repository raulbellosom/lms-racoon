import React from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3, Layers3, PlayCircle, Star } from "lucide-react";
import { Button } from "../../shared/ui/Button";
import { Badge } from "../../shared/ui/Badge";
import { Card } from "../../shared/ui/Card";
import { getCourseById } from "../../shared/data/courses";
import { listReviewsForCourse, createReview } from "../../shared/data/reviews";
import {
  listCommentsForCourse,
  createComment,
} from "../../shared/data/comments";
import { listAssignmentsForCourse } from "../../shared/data/assignments";
import { Tabs, Tab } from "../../shared/ui/Tabs";
import { Textarea } from "../../shared/ui/Textarea";
import { useAuth } from "../../app/providers/AuthProvider";
import { enrollInCourse } from "../../shared/data/enrollments";
import { useToast } from "../../app/providers/ToastProvider";
import { formatMoney } from "../../shared/utils/money";

export function CoursePublicPage() {
  const { courseId } = useParams();
  const { auth, authStore } = useAuth();
  const toast = useToast();
  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const [tab, setTab] = React.useState("about");
  const [reviews, setReviews] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);
  const [reviewDraft, setReviewDraft] = React.useState({
    rating: 5,
    title: "",
    body: "",
  });
  const [commentDraft, setCommentDraft] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    getCourseById(courseId)
      .then(async (c) => {
        setCourse(c);
        const [rv, cm, asg] = await Promise.all([
          listReviewsForCourse(c.$id).catch(() => []),
          listCommentsForCourse(c.$id).catch(() => []),
          listAssignmentsForCourse(c.$id).catch(() => []),
        ]);
        setReviews(rv);
        setComments(cm);
        setAssignments(asg);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const totalLessons =
    course?.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) ||
    0;
  const totalDuration = course?.sections?.reduce(
    (sum, s) =>
      sum + (s.lessons || []).reduce((a, l) => a + (l.durationSec || 0), 0),
    0,
  );

  const onEnroll = async () => {
    if (!auth.session) {
      toast.push({
        title: "Inicia sesión",
        message: "Necesitas una cuenta para inscribirte.",
      });
      return;
    }
    setBusy(true);
    try {
      await enrollInCourse({
        userId: auth.user.$id,
        courseId: course.$id,
        priceCents: course.priceCents || 0,
        currency: course.currency || "MXN",
      });
      toast.push({
        title: "¡Listo!",
        message: "Te inscribiste al curso.",
        variant: "success",
      });
      await authStore.refresh();
    } catch (e) {
      toast.push({
        title: "Error",
        message: e?.message || "No se pudo inscribir.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return <div className="mx-auto max-w-6xl px-4 py-10">Cargando...</div>;
  if (!course)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">Curso no encontrado.</div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">{course.level}</Badge>
            <Badge>{course.language?.toUpperCase?.() || "ES"}</Badge>
            <Badge>{course.teacherName}</Badge>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            {course.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[rgb(var(--text-secondary))]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
              <span className="font-semibold text-[rgb(var(--text-primary))]">
                {course.ratingAvg?.toFixed?.(1) ?? "—"}
              </span>
              <span className="text-[rgb(var(--text-muted))]">
                ({course.ratingCount ?? 0})
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-4 w-4" /> {totalLessons} lecciones
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-4 w-4" /> {Math.round(totalDuration / 60)}{" "}
              min
            </span>
          </div>

          <Card className="mt-5 overflow-hidden">
            <img
              src={course.coverUrl}
              alt={course.title}
              className="h-56 w-full object-cover"
            />
            <div className="p-4">
              <div className="text-sm font-extrabold">Descripción</div>
              <div className="mt-2 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                {course.description}
              </div>
            </div>
          </Card>

          <div className="mt-6">
            <Tabs
              value={tab}
              onChange={setTab}
              className="sticky top-16 z-10 -mx-4 px-4 py-2 bg-[rgb(var(--bg-base))]/80 backdrop-blur-soft"
            >
              <Tab value="about" label="Contenido" />
              <Tab
                value="assignments"
                label={`Tareas (${assignments.length})`}
              />
              <Tab
                value="qa"
                label={`Q&A (${comments.filter((c) => !c.parentId).length})`}
              />
              <Tab value="reviews" label={`Reviews (${reviews.length})`} />
            </Tabs>

            {tab === "about" && (
              <div className="mt-5">
                <div className="text-sm font-extrabold">Contenido</div>
                <div className="mt-3 space-y-3">
                  {course.sections?.map((s) => (
                    <Card key={s.$id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold">
                            {s.title}
                          </div>
                          <div className="text-xs text-[rgb(var(--text-secondary))]">
                            {s.lessons?.length || 0} lecciones
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {s.lessons?.map((l) => (
                          <div
                            key={l.$id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--bg-muted))] p-3"
                          >
                            <div className="inline-flex items-center gap-2 text-sm font-semibold">
                              <PlayCircle className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                              {l.title}
                            </div>
                            <div className="text-xs text-[rgb(var(--text-secondary))]">
                              {Math.round((l.durationSec || 0) / 60)} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {tab === "assignments" && (
              <div className="mt-5 space-y-3">
                {assignments.length === 0 ? (
                  <div className="text-sm text-[rgb(var(--text-secondary))]">
                    Aún no hay tareas publicadas para este curso.
                  </div>
                ) : (
                  assignments.map((a) => (
                    <Card key={a.$id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold">
                            {a.title}
                          </div>
                          <div className="mt-1 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                            {a.description}
                          </div>
                        </div>
                        <Badge variant="brand">{a.pointsMax} pts</Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === "qa" && (
              <div className="mt-5">
                <Card className="p-4">
                  <div className="text-sm font-extrabold">Pregunta algo</div>
                  <div className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
                    Esto funciona como un foro por curso/lesson. (Con Appwrite
                    quedará persistente.)
                  </div>
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Escribe tu pregunta o comentario…"
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        if (!auth.session)
                          return toast.push({
                            title: "Inicia sesión",
                            message: "Necesitas una cuenta para comentar.",
                          });
                        if (!commentDraft.trim()) return;
                        const doc = await createComment({
                          courseId: course.$id,
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
                </Card>

                <div className="mt-4 space-y-3">
                  {comments
                    .filter((c) => !c.parentId)
                    .map((c) => (
                      <Card key={c.$id} className="p-4">
                        <div className="text-sm font-extrabold">Usuario</div>
                        <div className="mt-1 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                          {c.body}
                        </div>
                        <div className="mt-3 space-y-2 pl-3 border-l border-[rgb(var(--border-base))]">
                          {comments
                            .filter((r) => r.parentId === c.$id)
                            .map((r) => (
                              <div
                                key={r.$id}
                                className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line"
                              >
                                {r.body}
                              </div>
                            ))}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {tab === "reviews" && (
              <div className="mt-5">
                <Card className="p-4">
                  <div className="text-sm font-extrabold">Deja tu review</div>
                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[rgb(var(--text-secondary))]">
                        Rating:
                      </span>
                      <select
                        className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 py-2 text-sm"
                        value={reviewDraft.rating}
                        onChange={(e) =>
                          setReviewDraft((d) => ({
                            ...d,
                            rating: Number(e.target.value),
                          }))
                        }
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 py-2 text-sm"
                      value={reviewDraft.title}
                      onChange={(e) =>
                        setReviewDraft((d) => ({ ...d, title: e.target.value }))
                      }
                      placeholder="Título (opcional)"
                    />
                    <Textarea
                      value={reviewDraft.body}
                      onChange={(e) =>
                        setReviewDraft((d) => ({ ...d, body: e.target.value }))
                      }
                      placeholder="Cuéntanos tu experiencia..."
                    />
                    <Button
                      onClick={async () => {
                        if (!auth.session)
                          return toast.push({
                            title: "Inicia sesion",
                            message: "Necesitas una cuenta para dejar review.",
                          });
                        const doc = await createReview({
                          courseId: course.$id,
                          userId: auth.user.$id,
                          rating: reviewDraft.rating,
                          title: reviewDraft.title.trim(),
                          body: reviewDraft.body.trim(),
                        });
                        setReviews((prev) => [doc, ...prev]);
                        setReviewDraft({ rating: 5, title: "", body: "" });
                      }}
                    >
                      Publicar review
                    </Button>
                  </div>
                </Card>

                <div className="mt-4 space-y-3">
                  {reviews.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--text-secondary))]">
                      Aún no hay reviews.
                    </div>
                  ) : (
                    reviews.map((r) => (
                      <Card key={r.$id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold">
                            {r.title || "Review"}
                          </div>
                          <Badge variant="brand">{r.rating}★</Badge>
                        </div>
                        {r.body ? (
                          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))] whitespace-pre-line">
                            {r.body}
                          </div>
                        ) : null}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit">
          <Card className="p-4">
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Precio
            </div>
            <div className="mt-1 text-2xl font-black">
              {formatMoney(course.priceCents || 0, course.currency || "MXN")}
            </div>

            <div className="mt-4 space-y-2">
              {auth.session ? (
                <Button onClick={onEnroll} disabled={busy} className="w-full">
                  {busy ? "Inscribiendo..." : "Inscribirme"}
                </Button>
              ) : (
                <Link to="/auth/login">
                  <Button className="w-full">
                    Iniciar sesión para inscribirme
                  </Button>
                </Link>
              )}

              <Link to="/catalog">
                <Button variant="secondary" className="w-full">
                  Seguir explorando
                </Button>
              </Link>
            </div>

            <div className="mt-4 rounded-2xl bg-[rgb(var(--bg-muted))] p-3 text-xs text-[rgb(var(--text-secondary))]">
              Este proyecto está listo para conectar pagos (Stripe/MercadoPago)
              desde Appwrite Functions, pero por ahora sólo incluye el flujo de
              inscripción.
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
