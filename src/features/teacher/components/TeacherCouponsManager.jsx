import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Ticket, Percent, DollarSign } from "lucide-react";
import { ID, Query } from "appwrite";
import { db as databases } from "../../../shared/appwrite/client";
import { useToast } from "../../../app/providers/ToastProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Badge } from "../../../shared/ui/Badge";
import { Modal } from "../../../shared/ui/Modal";
import { Switch } from "../../../shared/ui/Switch";
import { ConfirmationModal } from "../../../shared/ui/ConfirmationModal";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

// Constants from .env (reused or hardcoded if needed, best to import usually)
const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COL_COUPONS = import.meta.env.VITE_APPWRITE_COL_COUPONS;

export function TeacherCouponsManager({ courseId }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

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
  });

  useEffect(() => {
    loadCoupons();
  }, [courseId]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(DB_ID, COL_COUPONS, [
        Query.equal("courseId", courseId),
        Query.orderDesc("$createdAt"),
      ]);
      setCoupons(res.documents);
    } catch (e) {
      console.error("Failed to load coupons", e);
      showToast(t("teacher.errors.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
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
        ...formData,
        code: formData.code.toUpperCase().replace(/\s/g, ""),
        courseId,
        value: parseFloat(formData.value),
        maxUses: parseInt(formData.maxUses) || 0,
        // If empty string, send null or undefined? Appwrite might prefer null for nullable dates
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : null,
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
        showToast(t("teacher.coupons.updated"), "success");
      } else {
        const created = await databases.createDocument(
          DB_ID,
          COL_COUPONS,
          ID.unique(),
          payload,
        );
        setCoupons((prev) => [created, ...prev]);
        showToast(t("teacher.coupons.created"), "success");
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await databases.deleteDocument(DB_ID, COL_COUPONS, id);
      setCoupons((prev) => prev.filter((c) => c.$id !== id));
      showToast(t("teacher.coupons.deleted"), "success");
    } catch (e) {
      showToast(t("teacher.errors.deleteFailed"), "error");
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
      showToast(t("teacher.errors.updateFailed"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
            {t("teacher.coupons.title", "Cupones del Curso")}
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t(
              "teacher.coupons.subtitle",
              "Gestiona códigos de descuento para este curso",
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
            "teacher.coupons.emptyDesc",
            "Crea el primer código de descuento para atraer alumnos.",
          )}
          className="min-h-[50vh] animate-in fade-in zoom-in-95 duration-500"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon.$id} className="p-4 relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary))/0.2] bg-[rgb(var(--brand-primary))/0.05] px-2 py-0.5 rounded">
                    {coupon.code}
                  </span>
                  <Badge variant={coupon.enabled ? "success" : "secondary"}>
                    {coupon.enabled
                      ? t("common.active", "Activo")
                      : t("common.inactive", "Inactivo")}
                  </Badge>
                </div>
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

              <div className="space-y-1 mb-4">
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
                  {t("teacher.coupons.used", "Usado:")}{" "}
                  <strong>{coupon.usedCount}</strong> /{" "}
                  {coupon.maxUses > 0 ? coupon.maxUses : "∞"}
                </div>
                {coupon.expiresAt && (
                  <div className="text-xs text-[rgb(var(--text-secondary))]">
                    {t("teacher.coupons.expires", "Expira:")}{" "}
                    {new Date(coupon.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border-base))]">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {new Date(coupon.$createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
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
            ? t("teacher.coupons.edit")
            : t("teacher.coupons.create")
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("teacher.coupons.code", "Código")}
            </label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="E.g. BLACKFRIDAY2024"
              maxLength={20}
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: parseFloat(e.target.value),
                  })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value),
                  })
                }
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
