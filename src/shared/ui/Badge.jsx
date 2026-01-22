import React from "react";
import { cn } from "./cn";

export function Badge({ variant = "default", className = "", ...props }) {
  const variants = {
    default: "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-base))]",
    brand: "bg-[rgb(var(--brand-primary))/0.14] text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary))/0.25]",
    success: "bg-[rgb(var(--success))/0.14] text-[rgb(var(--success))] border border-[rgb(var(--success))/0.25]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
