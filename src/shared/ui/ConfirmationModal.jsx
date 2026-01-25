import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Standard confirmation modal with premium UI
 */
export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default",
  loading = false,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      showClose={!loading}
      // We do NOT pass title/desc here to control rendering ourselves
      className="text-center"
    >
      <div className="flex flex-col items-center justify-center p-2">
        {/* Icon with background */}
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            variant === "destructive"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {variant === "destructive" ? (
            <AlertTriangle className="h-7 w-7" />
          ) : (
            <Info className="h-7 w-7" />
          )}
        </div>

        {/* Content */}
        <h3 className="mb-2 text-xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
          {title}
        </h3>
        <p className="mb-8 max-w-[280px] text-center text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
          {description}
        </p>

        {/* Actions - Full width buttons for mobile friendliness */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[100px]"
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[140px] shadow-lg shadow-blue-500/20"
          >
            {confirmText || t("common.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
