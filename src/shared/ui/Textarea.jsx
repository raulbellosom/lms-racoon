import React from "react";
import { cn } from "./cn";

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "w-full min-h-24 resize-y rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 py-3 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-secondary)/0.5)]",
        className
      )}
      {...props}
    />
  );
}
