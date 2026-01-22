import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary:", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[100dvh] grid place-items-center p-6">
        <div className="max-w-md w-full rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-5 shadow-soft">
          <div className="text-lg font-semibold">Ocurrió un error</div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Si el problema persiste, recarga la página.
          </div>
          <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-[rgb(var(--bg-muted))] p-3 text-xs text-[rgb(var(--text-secondary))]">
{String(this.state.error?.message || this.state.error || "Error")}
          </pre>
          <button
            className="mt-4 w-full rounded-xl bg-[rgb(var(--brand-primary))] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[rgb(var(--brand-accent))]"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

export function RenderErrorBoundary({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
