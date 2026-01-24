import React from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import {
  MoreVertical,
  Plus,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  Ban,
} from "lucide-react";
import { useToast } from "../../../app/providers/ToastProvider";
import { CategoryService } from "../../../shared/data/categories";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../../../shared/ui/Dropdown";
import { Modal, ModalFooter } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
  });

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const docs = await CategoryService.list();
      setCategories(docs);
    } catch (error) {
      console.error(error);
      showToast("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", slug: "" });
    setIsModalOpen(true);
  };

  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const handleNameChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug || generateSlug(val), // Auto-generate slug if empty or user hasn't manually edited it much (heuristic)
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      showToast("Nombre y Slug requeridos", "error");
      return;
    }

    setSaving(true);
    try {
      const newCat = await CategoryService.create(formData);
      setCategories([...categories, newCat]);
      setIsModalOpen(false);
      showToast("Categoría creada", "success");
    } catch (error) {
      console.error(error);
      showToast("Error al crear categoría", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      if (cat.enabled) {
        await CategoryService.delete(cat.$id);
        showToast("Categoría deshabilitada", "success");
      } else {
        await CategoryService.restore(cat.$id);
        showToast("Categoría habilitada", "success");
      }
      // Reload or update verification
      loadCategories(); // simplest
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar estado", "error");
    }
  };

  return (
    <PageLayout
      title="Categorías"
      subtitle="Administra las categorías de cursos"
    >
      <div className="mb-6 flex justify-end">
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      <Card>
        {/* Header */}
        <div className="hidden rounded-t-xl border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] px-6 py-4 font-bold text-[rgb(var(--text-primary))] md:grid md:grid-cols-12 md:gap-4">
          <div className="md:col-span-5">Nombre</div>
          <div className="md:col-span-3">Slug</div>
          <div className="md:col-span-2">Estado</div>
          <div className="text-right md:col-span-2">Acciones</div>
        </div>

        {/* List */}
        <div className="divide-y divide-[rgb(var(--border-base))]">
          {loading ? (
            <div className="p-8 text-center text-[rgb(var(--text-secondary))]">
              Cargando...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-[rgb(var(--text-secondary))]">
              No hay categorías registradas.
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.$id}
                className={`flex flex-col gap-4 p-4 transition-colors hover:bg-[rgb(var(--bg-surface-hover))] md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-6 ${
                  !cat.enabled ? "opacity-50 grayscale" : ""
                }`}
              >
                <div className="font-bold text-[rgb(var(--text-primary))] md:col-span-5">
                  {cat.name}
                </div>
                <div className="text-sm text-[rgb(var(--text-secondary))] md:col-span-3 font-mono">
                  {cat.slug}
                </div>
                <div className="md:col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      cat.enabled
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {cat.enabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Dropdown
                    align="end"
                    trigger={
                      <button className="rounded-full p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    }
                  >
                    <DropdownItem
                      icon={cat.enabled ? Ban : CheckCircle}
                      onClick={() => handleToggleStatus(cat)}
                      danger={cat.enabled}
                    >
                      {cat.enabled ? "Deshabilitar" : "Habilitar"}
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title="Nueva Categoría"
        description="Crea una categoría para organizar los cursos."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Nombre *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={saving}
              placeholder="Ej. Desarrollo Web"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Slug *
            </label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              disabled={saving}
              placeholder="ej. desarrollo-web"
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  );
}
