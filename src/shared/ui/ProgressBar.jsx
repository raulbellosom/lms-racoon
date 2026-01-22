import React from "react";
import { cn } from "./cn";

export function ProgressBar({ value = 0, className = "" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full rounded-full bg-[rgb(var(--bg-muted))]", className)}>
      <div
        className="h-2 rounded-full bg-[rgb(var(--brand-primary))] transition-[width] duration-300"
        style={{ width: pct + "%" }}
      />
    </div>
  );
}
