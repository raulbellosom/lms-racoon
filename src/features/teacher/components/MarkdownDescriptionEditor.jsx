import React from "react";
import { useTranslation } from "react-i18next";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { Card } from "../../../shared/ui/Card";
import { Modal } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";

export function MarkdownDescriptionEditor({
  value,
  onChange,
  maxLength = 8000,
}) {
  const { t } = useTranslation();
  const [showMarkdownModal, setShowMarkdownModal] = React.useState(false);

  const options = React.useMemo(
    () => ({
      spellChecker: false,
      maxHeight: "400px",
      renderingConfig: {
        singleLineBreaks: false,
      },
      placeholder:
        t("teacher.form.descriptionPlaceholder") ||
        "Describe detalladamente qué aprenderán los estudiantes...",
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "preview",
        "|",
        {
          name: "guide",
          action: () => setShowMarkdownModal(true),
          className: "fa fa-question-circle",
          title: t("teacher.form.markdownSupported") || "Guía Markdown",
        },
      ],
      status: false, // Disable built-in status to avoid re-renders
    }),
    [t], // Only depend on translation function
  );

  const handleChange = (newValue) => {
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {t("teacher.courseDescription")}
          </h3>
          <button
            type="button"
            onClick={() => setShowMarkdownModal(true)}
            className="text-sm text-[rgb(var(--brand-primary))] hover:underline"
          >
            {t("teacher.form.markdownSupported")}
          </button>
        </div>

        <div className="markdown-editor-wrapper">
          <SimpleMDE value={value} onChange={handleChange} options={options} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className={`${value?.length > maxLength ? "text-red-500" : "text-[rgb(var(--text-secondary))]"}`}
          >
            {value?.length || 0} / {maxLength} caracteres
          </span>
        </div>

        {value?.length > maxLength && (
          <p className="mt-1 text-xs text-red-500">
            La descripción es demasiado larga.
          </p>
        )}
      </Card>

      {/* Markdown Info Modal */}
      <Modal
        open={showMarkdownModal}
        onClose={() => setShowMarkdownModal(false)}
        title={t("teacher.form.markdownModalTitle")}
      >
        <div className="space-y-4">
          <p className="text-[rgb(var(--text-secondary))]">
            {t("teacher.form.markdownModalContent")}
          </p>
          <div className="rounded-lg bg-[rgb(var(--bg-muted))] p-4">
            <p className="text-sm font-mono whitespace-pre-line text-[rgb(var(--text-secondary))]">
              {t("teacher.form.markdownModalExamples")}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowMarkdownModal(false)}>
              {t("common.close") || "Cerrar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
