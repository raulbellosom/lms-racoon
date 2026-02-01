import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { verifyEmail } from "../../shared/services/auth";
import { Button } from "../../shared/ui/Button";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    const doVerify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage(err.message || "No se pudo verificar el correo.");
      }
    };

    doVerify();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[rgb(var(--bg-base))] p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-8 shadow-xl"
      >
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[rgb(var(--brand-primary))]" />
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              Verificando correo...
            </h2>
            <p className="mt-2 text-[rgb(var(--text-muted))]">
              Por favor espera un momento.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              ¡Correo verificado!
            </h2>
            <p className="mt-2 text-[rgb(var(--text-muted))]">
              Tu cuenta ha sido activada correctamente. Ya puedes iniciar
              sesión.
            </p>
            <div className="mt-6 w-full">
              <Link to="/auth/login">
                <Button className="w-full justify-center">
                  Ir a Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="mb-4 h-16 w-16 text-red-500" />
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              Verificación fallida
            </h2>
            <p className="mt-2 text-[rgb(var(--text-muted))]">{message}</p>
            <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">
              El enlace podría haber expirado o ya fue utilizado.
            </p>
            <div className="mt-6 w-full">
              <Link to="/auth/login">
                <Button variant="outline" className="w-full justify-center">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer / Copyright */}
      <div className="mt-8 text-sm text-[rgb(var(--text-muted))]">
        &copy; {new Date().getFullYear()} Racoon LMS
      </div>
    </div>
  );
}
