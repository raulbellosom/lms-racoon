import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";

/**
 * CoursePricingForm - Price and currency settings
 * @param {Object} formData - Form state object
 * @param {Function} setFormData - State setter function
 */
export function CoursePricingForm({ formData, setFormData }) {
  const { t } = useTranslation();

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFree = formData.priceCents === 0;

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="mb-4 text-lg font-bold">{t("teacher.pricing")}</h3>
      <div className="space-y-4">
        {/* Free toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => {
              if (e.target.checked) {
                updateField("priceCents", 0);
              }
            }}
            className="h-4 w-4 rounded border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--brand-primary))] focus:ring-[rgb(var(--brand-primary))]"
          />
          <span className="text-sm font-medium">
            {t("teacher.form.freeCourse")}
          </span>
        </label>

        {/* Price Input */}
        {!isFree && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.form.priceCents")}
            </label>
            <Input
              type="number"
              min="0"
              placeholder={t("teacher.form.pricePlaceholder")}
              value={formData.priceCents}
              onChange={(e) =>
                updateField("priceCents", parseInt(e.target.value) || 0)
              }
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
              {t("teacher.form.priceEquivalent")} $
              {(formData.priceCents / 100).toFixed(2)}{" "}
              {formData.currency || "MXN"}
            </p>
          </div>
        )}

        {/* Currency selector (for non-free courses) */}
        {!isFree && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("common.currency", "Moneda")}
            </label>
            <select
              className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm"
              value={formData.currency || "MXN"}
              onChange={(e) => updateField("currency", e.target.value)}
            >
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        )}
      </div>
    </Card>
  );
}
