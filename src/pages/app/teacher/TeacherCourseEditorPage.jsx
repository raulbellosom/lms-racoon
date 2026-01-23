import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookText,
  Layers3,
  UploadCloud,
  ChevronLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Video,
  FileText,
  GripVertical,
  X,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { SectionService } from "../../../shared/data/sections-teacher";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { db } from "../../../shared/appwrite/client"; // For categories
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Textarea } from "../../../shared/ui/Textarea"; // Make sure this exists or use standard textarea
import { Badge } from "../../../shared/ui/Badge";

// Simple Tab Button Component
function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all",
        active
          ? "bg-[rgb(var(--brand-primary))/0.1] text-[rgb(var(--brand-primary))]"
          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export function TeacherCourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isNew = courseId === "new";

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [tab, setTab] = React.useState("details");
  const [categories, setCategories] = React.useState([]);

  // Curriculum State
  const [sections, setSections] = React.useState([]);
  const [lessonsBySection, setLessonsBySection] = React.useState({});

  // Form State
  const [formData, setFormData] = React.useState({
    title: "",
    subtitle: "",
    description: "",
    categoryId: "",
    level: "beginner",
    priceCents: 0,
    language: "es",
  });

  React.useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadCourse();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    if (tab === "curriculum" && courseId && !isNew) {
      loadCurriculum();
    }
  }, [tab, courseId]);

  const loadCurriculum = async () => {
    try {
      const sects = await SectionService.listByCourse(courseId);
      setSections(sects);

      const lessonsMap = {};
      await Promise.all(
        sects.map(async (sec) => {
          const less = await LessonService.listBySection(sec.$id);
          lessonsMap[sec.$id] = less;
        }),
      );
      setLessonsBySection(lessonsMap);
    } catch (error) {
      console.error("Failed to load curriculum", error);
    }
  };

  const handleAddSection = async () => {
    const title = prompt("Título de la nueva sección:");
    if (!title) return;

    try {
      const newSec = await SectionService.create({
        courseId,
        title,
        order: sections.length,
      });
      setSections([...sections, newSec]);
      setLessonsBySection({ ...lessonsBySection, [newSec.$id]: [] });
    } catch (e) {
      console.error(e);
      alert("Error al crear sección");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("¿Eliminar sección y sus lecciones?")) return;
    try {
      await SectionService.delete(sectionId);
      setSections(sections.filter((s) => s.$id !== sectionId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLesson = async (sectionId) => {
    const title = prompt("Título de la lección:");
    if (!title) return;

    const currentLessons = lessonsBySection[sectionId] || [];
    try {
      const newLesson = await LessonService.create({
        courseId,
        sectionId,
        title,
        kind: "video", // Default to video for now
        order: currentLessons.length,
      });
      setLessonsBySection({
        ...lessonsBySection,
        [sectionId]: [...currentLessons, newLesson],
      });
    } catch (e) {
      console.error(e);
      alert("Error al crear lección");
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId) => {
    if (!confirm("¿Eliminar lección?")) return;
    try {
      await LessonService.delete(lessonId);
      setLessonsBySection({
        ...lessonsBySection,
        [sectionId]: lessonsBySection[sectionId].filter(
          (l) => l.$id !== lessonId,
        ),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async () => {
    try {
      // Assuming categories collection is public or readable
      const res = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.categories,
      );
      setCategories(res.documents);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await TeacherCoursesService.getById(courseId);
      setCourse(data);
      setFormData({
        title: data.title,
        subtitle: data.subtitle || "",
        description: data.description || "",
        categoryId: data.categoryId,
        level: data.level,
        priceCents: data.priceCents || 0,
        language: data.language || "es",
      });
    } catch (error) {
      console.error("Failed to load course", error);
      navigate("/app/teach/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.categoryId) {
      alert("Título y Categoría son requeridos.");
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const newCourse = await TeacherCoursesService.create({
          ...formData,
          teacherId: auth.user.$id,
        });
        navigate(`/app/teach/courses/${newCourse.$id}`, { replace: true });
        setCourse(newCourse);
      } else {
        const updated = await TeacherCoursesService.update(courseId, formData);
        setCourse(updated);
        // Maybe show toast
      }
    } catch (error) {
      console.error("Save failed", error);
      alert("Error al guardar. Revisa la consola.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando editor...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/teach/courses")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                {isNew ? "Nuevo Curso" : formData.title || "Sin título"}
              </h1>
              {!isNew && (
                <Badge variant={course?.isPublished ? "success" : "secondary"}>
                  {course?.isPublished ? "Publicado" : "Borrador"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {isNew
                ? "Comienza definiendo los detalles básicos"
                : "Editando contenido del curso"}
            </p>
          </div>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 mb-6 flex gap-2 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] pt-2 backdrop-blur-sm">
        <TabButton
          active={tab === "details"}
          onClick={() => setTab("details")}
          icon={BookText}
        >
          Detalles
        </TabButton>
        <TabButton
          active={tab === "curriculum"}
          onClick={() => !isNew && setTab("curriculum")}
          icon={Layers3}
        >
          Contenido {isNew && "(Guardar primero)"}
        </TabButton>
        <TabButton
          active={tab === "publish"}
          onClick={() => !isNew && setTab("publish")}
          icon={UploadCloud}
        >
          Publicar
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* === DETAILS TAB === */}
        {tab === "details" && (
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-bold">Información Básica</h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Col 1 */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    Título del Curso <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ej: Introducción a React..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    Subtítulo Corto
                  </label>
                  <Input
                    placeholder="Resumen en una línea..."
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.$id} value={cat.$id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                      Nivel
                    </label>
                    <select
                      className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                      Idioma
                    </label>
                    <select
                      className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    Descripción
                  </label>
                  <Textarea
                    placeholder="Describe lo que aprenderán los estudiantes..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Price (Mock for now, field exists in schema) */}
                {/* Cover Image Placeholder */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    Portada (Próximamente)
                  </label>
                  <div className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] text-sm text-[rgb(var(--text-muted))]">
                    Arrastra una imagen o clic para subir
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Card>
        )}

        {/* === CURRICULUM TAB === */}
        {tab === "curriculum" && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Contenido del Curso</h3>
              <Button onClick={handleAddSection} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Agregar Sección
              </Button>
            </div>

            {sections.length === 0 ? (
              <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
                No hay secciones. Agrega una para comenzar.
              </Card>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div
                    key={section.$id}
                    className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-[rgb(var(--bg-muted))] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--bg-surface))] text-xs font-bold text-[rgb(var(--text-secondary))]">
                          {index + 1}
                        </div>
                        <span className="font-bold text-[rgb(var(--text-primary))]">
                          {section.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSection(section.$id)}
                          className="text-red-500 hover:text-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-[rgb(var(--bg-surface))]">
                      <div className="space-y-2">
                        {(lessonsBySection[section.$id] || []).map(
                          (lesson, lIndex) => (
                            <div
                              key={lesson.$id}
                              className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-base))] ks-2 py-2 px-3 transition hover:border-[rgb(var(--brand-primary))]"
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-[rgb(var(--text-muted))] cursor-move" />
                                <div
                                  className={`p-1.5 rounded-md ${lesson.kind === "video" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}
                                >
                                  {lesson.kind === "video" ? (
                                    <Video className="h-4 w-4" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                </div>
                                <span className="text-sm font-medium">
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteLesson(section.$id, lesson.$id)
                                  }
                                >
                                  <X className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4 w-full border-dashed border-2 border-[rgb(var(--border-base))] bg-transparent hover:bg-[rgb(var(--bg-muted))]"
                        onClick={() => handleAddLesson(section.$id)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Agregar Lección
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === PUBLISH TAB === */}
        {tab === "publish" && (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${course?.isPublished ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}
              >
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {course?.isPublished
                  ? "Tu curso está publicado"
                  : "Tu curso está en borrador"}
              </h3>
              <p className="mt-2 max-w-md text-[rgb(var(--text-secondary))]">
                {course?.isPublished
                  ? "Los estudiantes pueden ver y matricularse en este curso."
                  : "Este curso no es visible para los estudiantes. Publícalo cuando estés listo."}
              </p>

              <div className="mt-8">
                <Button
                  size="lg"
                  variant={course?.isPublished ? "secondary" : "primary"}
                  onClick={async () => {
                    if (
                      confirm(
                        course?.isPublished
                          ? "¿Despublicar este curso?"
                          : "¿Publicar este curso ahora?",
                      )
                    ) {
                      try {
                        const updated = await TeacherCoursesService.publish(
                          courseId,
                          !course?.isPublished,
                        );
                        setCourse(updated);
                      } catch (e) {
                        console.error(e);
                        alert("Error al cambiar estado");
                      }
                    }
                  }}
                >
                  {course?.isPublished
                    ? "Despublicar Curso"
                    : "Publicar Curso Ahora"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
