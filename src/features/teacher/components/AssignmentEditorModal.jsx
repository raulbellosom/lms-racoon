import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { useToast } from "../../../app/providers/ToastProvider";

/**
 * AssignmentEditorModal - Create/edit an assignment
 * @param {boolean} open - Modal open state
 * @param {Function} onClose - Close callback
 * @param {Object} assignment - Assignment data (null for new)
 * @param {string} courseId - Parent course ID
 * @param {Function} onSave - Save callback
 */
export function AssignmentEditorModal({
  open,
  onClose,
  assignment,
  courseId,
  lessonId,
  onSave,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isNew = !assignment?.$id;

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    dueAt: "",
    pointsMax: 10,
  });

  const [saving, setSaving] = React.useState(false);

  // Load assignment data
  React.useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || "",
        description: assignment.description || "",
        dueAt: assignment.dueAt ? assignment.dueAt.split("T")[0] : "",
        pointsMax: assignment.pointsMax || 10,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueAt: "",
        pointsMax: 10,
      });
    }
  }, [assignment, open]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast(t("teacher.form.titleRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      const data = {
        courseId,
        lessonId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
        pointsMax: formData.pointsMax,
      };

      if (isNew) {
        await AssignmentService.create({ ...data, order: 0 });
      } else {
        await AssignmentService.update(assignment.$id, data);
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error("Failed to save assignment:", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isNew
          ? t("teacher.assignment.createAssignment")
          : t("teacher.assignment.editAssignment")
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.assignment.assignmentTitle")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={t("teacher.assignment.assignmentTitlePlaceholder")}
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.assignment.assignmentDescription")}
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
          />
        </div>

        {/* Due Date & Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.assignment.dueDate")}
            </label>
            <Input
              type="date"
              value={formData.dueAt}
              onChange={(e) => updateField("dueAt", e.target.value)}
            />
            {!formData.dueAt && (
              <span className="text-xs text-[rgb(var(--text-muted))]">
                {t("teacher.assignment.noDueDate")}
              </span>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.assignment.maxPoints")}
            </label>
            <Input
              type="number"
              min="0"
              max="1000"
              value={formData.pointsMax}
              onChange={(e) =>
                updateField("pointsMax", parseInt(e.target.value) || 10)
              }
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("teacher.form.saving") : t("common.save")}
        </Button>
      </div>
    </Modal>
  );
}
