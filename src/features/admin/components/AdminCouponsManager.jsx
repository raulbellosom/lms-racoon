import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  Ticket,
  Percent,
  DollarSign,
  Loader2,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { ID, Query } from "appwrite";
import { db as databases, storage } from "../../../shared/appwrite/client";
import { useToast } from "../../../app/providers/ToastProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Badge } from "../../../shared/ui/Badge";
import { Modal } from "../../../shared/ui/Modal";
import { Switch } from "../../../shared/ui/Switch";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";
import { CharacterCountCircle } from "../../teacher/components/CharacterCountCircle";
import { Combobox } from "../../../shared/ui/Combobox";
import { ProfileService, getProfileById } from "../../../shared/data/profiles";
import { APPWRITE } from "../../../shared/appwrite/ids";

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COL_COUPONS = import.meta.env.VITE_APPWRITE_COL_COUPONS;
const COL_COURSES = import.meta.env.VITE_APPWRITE_COL_COURSES;

export function AdminCouponsManager() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]); // For course selection
  const [creators, setCreators] = useState({}); // { [userId]: { name, role } }
  const [copiedId, setCopiedId] = useState(null); // For copy feedback

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    type: "percent", // percent | fixed
    value: 0,
    maxUses: 0, // 0 = unlimited
    expiresAt: "", // ISO string or empty
    enabled: true,
    courseId: "", // Empty = Global
  });

  useEffect(() => {
    loadCoupons();
    loadCourses();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(DB_ID, COL_COUPONS, [
        Query.orderDesc("$createdAt"),
        Query.limit(100), // Pagination TODO
      ]);
      setCoupons(res.documents);
      await loadCreators(res.documents);
    } catch (e) {
      console.error("Failed to load coupons", e);
      showToast(t("teacher.errors.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCreators = async (docs) => {
    try {
      // Extract unique user IDs from permissions: 'read("user:ID")' or 'write("user:ID")'
      // Typically the creator has write/delete permissions.
      const userIds = new Set();
      docs.forEach((doc) => {
        if (doc.$permissions) {
          doc.$permissions.forEach((perm) => {
            const match = perm.match(/user:([a-zA-Z0-9.\-_]+)/);
            if (match && match[1]) {
              userIds.add(match[1]);
            }
          });
        }
      });

      // Also get instructors from courses if relevant, but let's stick to permissions for "Created By"
      if (userIds.size === 0) return;

      // Fetch profiles (concurrently)
      // Note: listDocuments with 'equal("$id", [...ids])' might limit number of IDs.
      // For robustness, we'll fetch individually or use a query if IDs are few.
      // Appwrite query supports array in 'equal' for $id? Yes in newer versions.
      // Let's try fetching distinct profiles.
      const promises = Array.from(userIds).map((id) =>
        getProfileById(id).catch(() => null),
      );
      const profiles = await Promise.all(promises);

      const creatorMap = {};
      profiles.forEach((p) => {
        if (p) {
          creatorMap[p.$id] = {
            name: p.displayName || p.email || "Unknown",
            role: p.role || "user",
          };
        }
      });
      setCreators((prev) => ({ ...prev, ...creatorMap }));
    } catch (e) {
      console.error("Failed to load creators", e);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, COL_COURSES, [
        Query.select(["$id", "title", "coverFileId", "teacherId"]),
        Query.limit(100),
      ]);

      const courseDocs = res.documents;

      // Fetch instructors for these courses
      const teacherIds = [
        ...new Set(courseDocs.map((c) => c.teacherId).filter(Boolean)),
      ];
      if (teacherIds.length > 0) {
        try {
          const promises = teacherIds.map((id) =>
            getProfileById(id).catch(() => null),
          );
          const teachers = await Promise.all(promises);
          const teacherMap = {};
          teachers.forEach((t) => {
            if (t)
              teacherMap[t.$id] =
                `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
                t.displayName ||
                t.email;
          });

          // Append instructor name to course objects
          courseDocs.forEach((c) => {
            if (c.teacherId && teacherMap[c.teacherId]) {
              c.instructorName = teacherMap[c.teacherId];
            }
          });
        } catch (err) {
          console.error("Failed to load course instructors", err);
        }
      }

      setCourses(courseDocs);
    } catch (e) {
      console.error("Failed to load courses", e);
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(t("teacher.coupons.copySuccess"), "success");
  };

  const getCreatorName = (coupon) => {
    // Try to find creator from permissions
    const perms = coupon.$permissions || [];
    // Prefer 'delete' permission owner as creator usually
    const ownerPerm = perms.find((p) => p.startsWith('delete("user:'));
    if (ownerPerm) {
      const match = ownerPerm.match(/user:([^"]+)/);
      if (match && creators[match[1]]) {
        return creators[match[1]].name;
      }
    }
    // Fallback to any user permission
    const anyUser = perms.find((p) => p.startsWith('read("user:'));
    if (anyUser) {
      const match = anyUser.match(/user:([^"]+)/);
      if (match && creators[match[1]]) {
        return creators[match[1]].name;
      }
    }
    return t("common.unknown", "Desconocido");
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxUses: coupon.maxUses,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
        enabled: coupon.enabled,
        courseId: coupon.courseId || "",
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "percent",
        value: 10,
        maxUses: 0,
        expiresAt: "",
        enabled: true,
        courseId: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || formData.value <= 0) {
      showToast(t("teacher.coupons.validationError"), "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase().replace(/\s/g, ""),
        type: formData.type,
        value: parseFloat(formData.value),
        maxUses: parseInt(formData.maxUses) || 0,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : null,
        enabled: formData.enabled,
        courseId: formData.courseId || null, // Global if null
      };

      if (editingCoupon) {
        const updated = await databases.updateDocument(
          DB_ID,
          COL_COUPONS,
          editingCoupon.$id,
          payload,
        );
        setCoupons((prev) =>
          prev.map((c) => (c.$id === updated.$id ? updated : c)),
        );
        showToast(t("teacher.coupons.updated", "Cupón actualizado"), "success");
      } else {
        const created = await databases.createDocument(
          DB_ID,
          COL_COUPONS,
          ID.unique(),
          payload,
        );
        setCoupons((prev) => [created, ...prev]);
        showToast(t("teacher.coupons.created", "Cupón creado"), "success");
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast(t("teacher.errors.saveFailed", "Error al guardar"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t(
          "teacher.coupons.confirmDelete",
          "¿Estás seguro de eliminar este cupón?",
        ),
      )
    )
      return;
    try {
      await databases.deleteDocument(DB_ID, COL_COUPONS, id);
      setCoupons((prev) => prev.filter((c) => c.$id !== id));
      showToast(t("teacher.coupons.deleted", "Cupón eliminado"), "success");
    } catch (e) {
      showToast(t("teacher.errors.deleteFailed", "Error al eliminar"), "error");
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const updated = await databases.updateDocument(
        DB_ID,
        COL_COUPONS,
        coupon.$id,
        {
          enabled: !coupon.enabled,
        },
      );
      setCoupons((prev) =>
        prev.map((c) => (c.$id === updated.$id ? updated : c)),
      );
    } catch (e) {
      showToast(
        t("teacher.errors.updateFailed", "Error al actualizar"),
        "error",
      );
    }
  };

  const getCourseName = (id) => {
    const course = courses.find((c) => c.$id === id);
    return course ? course.title : t("common.unknown", "Curso desconocido");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
            {t("admin.coupons.title", "Gestión de Cupones")}
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t(
              "admin.coupons.subtitle",
              "Administra todos los cupones de la plataforma (Globales y Específicos)",
            )}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />{" "}
          {t("teacher.coupons.add", "Crear Cupón")}
        </Button>
      </div>

      {loading ? (
        <LoadingContent message={t("common.loading")} />
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t("teacher.coupons.empty", "No hay cupones")}
          description={t(
            "admin.coupons.emptyDesc",
            "Crea cupones globales para campañas de marketing.",
          )}
          className="min-h-[50vh] animate-in fade-in zoom-in-95 duration-500"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon.$id} className="p-4 relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                    <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopy(coupon.code, coupon.$id)}
                      className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors bg-white/50 dark:bg-black/20 p-1 rounded"
                      title={t("common.copy", "Copiar")}
                    >
                      {copiedId === coupon.$id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Badge variant={coupon.enabled ? "success" : "secondary"}>
                    {coupon.enabled
                      ? t("common.active", "Activo")
                      : t("common.inactive", "Inactivo")}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(coupon)}
                    className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--brand-primary))] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Ticket className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.$id)}
                    className="text-[rgb(var(--text-tertiary))] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-[rgb(var(--text-primary))] font-medium">
                  {coupon.type === "percent" ? (
                    <Percent className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                  )}
                  {coupon.value}
                  {coupon.type === "percent" ? "%" : ""}{" "}
                  {t("teacher.coupons.discount", "de descuento")}
                </div>

                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  <span className="font-semibold">
                    {t("common.course", "Curso")}:
                  </span>{" "}
                  {getCourseName(coupon.courseId)}
                </div>

                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  {t("teacher.coupons.used", "Usado:")}{" "}
                  <strong>{coupon.usedCount}</strong> /{" "}
                  {coupon.maxUses > 0 ? coupon.maxUses : "∞"}
                </div>

                <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-[rgb(var(--border-base)/0.5)]">
                  {coupon.expiresAt && (
                    <div className="text-xs text-[rgb(var(--text-secondary))]">
                      <span className="font-medium">
                        {t("teacher.coupons.expires", "Expira:")}
                      </span>{" "}
                      {new Date(coupon.expiresAt).toLocaleDateString(
                        undefined,
                        {
                          timeZone: "UTC",
                        },
                      )}
                    </div>
                  )}
                  <div className="text-xs text-[rgb(var(--text-tertiary))]">
                    <span className="font-medium">
                      {t("teacher.coupons.createdBy")}
                    </span>{" "}
                    {getCreatorName(coupon)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border-base))]">
                <span
                  className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap overflow-hidden text-ellipsis mr-2"
                  title={`${t("teacher.coupons.createdAt")} ${new Date(coupon.$createdAt).toLocaleDateString()}`}
                >
                  {t("teacher.coupons.createdAt")}{" "}
                  {new Date(coupon.$createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium">
                    {t("common.enabled", "Habilitado")}
                  </span>
                  <Switch
                    checked={coupon.enabled}
                    onChange={() => handleToggleStatus(coupon)}
                    className="h-4 w-8"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCoupon
            ? t("teacher.coupons.edit", "Editar Cupón")
            : t("teacher.coupons.create", "Crear Cupón")
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">
                {t("teacher.coupons.code", "Código")}
              </label>
              <CharacterCountCircle
                current={formData.code.length}
                max={20}
                size={18}
              />
            </div>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 20),
                })
              }
              placeholder="E.g. GLOBALSALE2024"
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("teacher.coupons.course", "Curso (Optional)")}
            </label>
            <Combobox
              options={[
                {
                  value: "",
                  label: t("admin.coupons.global", "Global (Todos los cursos)"),
                  description: t(
                    "admin.coupons.globalDesc",
                    "Aplica a cualquier compra",
                  ),
                },
                ...courses.map((course) => ({
                  value: course.$id,
                  label: course.title,
                  image: course.coverFileId
                    ? storage.getFilePreview(
                        APPWRITE.buckets.courseCovers,
                        course.coverFileId,
                      )
                    : null,
                  description: course.instructorName || "", // Display instructor name here
                })),
              ]}
              value={formData.courseId}
              onChange={(val) => setFormData({ ...formData, courseId: val })}
              placeholder={t("common.searchPlaceholder", "Buscar curso...")}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t("teacher.coupons.type", "Tipo")}
              </label>
              <select
                className="w-full rounded-md border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-2 text-sm"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="percent">
                  {t("teacher.coupons.typePercent", "Porcentaje (%)")}
                </option>
                <option value="fixed">
                  {t("teacher.coupons.typeFixed", "Monto Fijo ($)")}
                </option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t("teacher.coupons.value", "Valor")}
              </label>
              <Input
                type="number"
                min="0"
                value={formData.value}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    value: val === "" ? "" : parseFloat(val),
                  });
                }}
                onBlur={() => {
                  if (formData.value === "" || isNaN(formData.value)) {
                    setFormData({ ...formData, value: 0 });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t("teacher.coupons.maxUses", "Límite de Usos (0=∞)")}
              </label>
              <Input
                type="number"
                min="0"
                value={formData.maxUses}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    maxUses: val === "" ? "" : parseInt(val),
                  });
                }}
                onBlur={() => {
                  if (formData.maxUses === "" || isNaN(formData.maxUses)) {
                    setFormData({ ...formData, maxUses: 0 });
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t("teacher.coupons.expiresAt", "Vencimiento (Opcional)")}
              </label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
