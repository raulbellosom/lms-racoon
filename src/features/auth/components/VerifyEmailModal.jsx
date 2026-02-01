import React from "react";
import { useTranslation } from "react-i18next";
import { Mail, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Modal } from "../../../shared/ui/Modal";
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
        message: "Email de verificación reenviado",
        variant: "success",
      });
    } catch (err) {
      toast.push({
        title: t("common.error"),
        message: err.message || "Error al reenviar email",
        variant: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const title =
    mode === "register"
      ? "¡Cuenta creada con éxito!"
      : "Verifica tu correo electrónico";

  const description =
    mode === "register"
      ? `Hemos enviado un enlace de confirmación a ${email}. Por favor verifica tu cuenta para continuar.`
      : `Tu cuenta ${email} aún no ha sido verificada. Revisa tu bandeja de entrada.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--brand-primary)/0.1)] sm:mx-0 sm:h-10 sm:w-10">
          <Mail
            className="h-6 w-6 text-[rgb(var(--brand-primary))]"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-lg font-semibold leading-6 text-[rgb(var(--text-primary))]">
            {title}
          </h3>
          <div className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            <p>{description}</p>
            <p className="mt-4 text-xs font-medium">
              ¿No recibiste el correo? Revisa tu carpeta de Spam.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:flex sm:flex-row-reverse sm:gap-3">
        {mode === "login" ? (
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center sm:mt-0 sm:w-auto"
          >
            Entendido, revisar correo
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Ir a Iniciar Sesión
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={isSending || countdown > 0}
          className="mt-3 inline-flex w-full justify-center sm:mt-0 sm:w-auto"
        >
          {isSending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : countdown > 0 ? (
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {countdown > 0 ? `Reenviado en ${countdown}s` : "Reenviar correo"}
        </Button>
      </div>
    </Modal>
  );
}
