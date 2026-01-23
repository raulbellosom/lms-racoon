import React from "react";
import { X } from "lucide-react";
import { cn } from "../../shared/ui/cn";

const ToastContext = React.createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const push = React.useCallback((toast) => {
    const id = ++idSeq;
    const item = {
      id,
      title: toast?.title ?? "",
      message: toast?.message ?? "",
      variant: toast?.variant ?? "default", // default | success | error
      timeout: toast?.timeout ?? 3000,
    };
    setToasts((prev) => [item, ...prev].slice(0, 3));
    if (item.timeout) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.timeout);
    }
    return id;
  }, []);

  const remove = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (message, variant = "default") => {
      push({ message, variant });
    },
    [push],
  );

  const api = React.useMemo(
    () => ({ push, remove, showToast }),
    [push, remove, showToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-50 top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 sm:w-[360px] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-fadeIn rounded-[var(--radius)] border p-3 shadow-soft backdrop-blur-soft",
              "bg-[rgb(var(--bg-surface))/0.92] border-[rgb(var(--border-base))]",
              t.variant === "success" && "border-[rgb(var(--success))]",
              t.variant === "error" && "border-[rgb(var(--error))]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {t.title ? (
                  <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    {t.title}
                  </div>
                ) : null}
                {t.message ? (
                  <div className="text-sm text-[rgb(var(--text-secondary))]">
                    {t.message}
                  </div>
                ) : null}
              </div>
              <button
                className="shrink-0 rounded-lg p-1 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]"
                onClick={() => remove(t.id)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
