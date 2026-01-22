import React from "react";
import { Download } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    try {
      deferred.prompt();
      await deferred.userChoice;
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 sm:left-auto sm:right-4 sm:w-[360px]">
      <div className="rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.92] p-3 shadow-soft backdrop-blur-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--brand-primary))/0.15]">
            <Download className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Instalar Racoon LMS</div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Accede más rápido como app (PWA).
            </div>
          </div>
          <button
            onClick={install}
            className="rounded-xl bg-[rgb(var(--brand-primary))] px-3 py-2 text-xs font-semibold text-white hover:bg-[rgb(var(--brand-accent))]"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
