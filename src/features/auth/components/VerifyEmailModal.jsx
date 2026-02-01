import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Mail, RefreshCw, Send, CheckCircle2, MailCheck } from "lucide-react";

import { Modal, ModalFooter } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { resendVerificationEmail } from "../../../shared/services/auth";
import { useToast } from "../../../app/providers/ToastProvider";

/**
 * Modal to prompt user to verify their email.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.email
 * @param {'register' | 'login'} props.mode - Context of the modal
 */
export function VerifyEmailModal({
  isOpen,
  onClose,
  email,
  mode = "register",
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Countdown effect
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (isSending || countdown > 0) return;

    setIsSending(true);
    try {
      await resendVerificationEmail(email);
      setSent(true);
      setCountdown(60); // 60s cooldown
      toast.push({
        title: t("common.success"),
        message: t("auth.verification.sent"),
        variant: "success",
      });
    } catch (err) {
      toast.push({
        title: t("common.error"),
        message: err.message || "Error",
        variant: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const descriptionKey =
    mode === "register"
      ? "auth.verification.registerDesc"
      : "auth.verification.loginDesc";

  return (
    <Modal open={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-primary)/0.1)]">
          <Mail
            className="h-6 w-6 text-[rgb(var(--brand-primary))]"
            aria-hidden="true"
          />
        </div>

        <div className="mt-4 text-center sm:mt-0 sm:text-left">
          <h3 className="text-lg font-semibold leading-6 text-[rgb(var(--text-primary))]">
            {t("auth.verification.title")}
          </h3>
          <div className="mt-2 space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            <p>
              <Trans
                i18nKey={descriptionKey}
                values={{ email }}
                components={{
                  strong: (
                    <strong className="font-semibold text-[rgb(var(--text-primary))]" />
                  ),
                }}
              />
            </p>
            <p className="text-xs font-medium text-[rgb(var(--text-muted))]">
              {t("auth.verification.spamHint")}
            </p>
          </div>
        </div>
      </div>

      <ModalFooter className="sm:justify-between">
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={isSending || countdown > 0}
          className="w-full sm:w-auto"
        >
          {isSending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : countdown > 0 ? (
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {countdown > 0
            ? t("auth.verification.countdown", { count: countdown })
            : t("auth.verification.resend")}
        </Button>

        {mode === "login" ? (
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            <MailCheck className="mr-2 h-4 w-4" />
            {t("auth.verification.checkEmail")}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t("auth.loginButton")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
