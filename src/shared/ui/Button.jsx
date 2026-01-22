import React from "react";
import { cn } from "./cn";

export function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[rgb(var(--brand-primary))] text-white hover:bg-[rgb(var(--brand-accent))] shadow-soft",
    secondary:
      "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-base))]",
    ghost:
      "bg-transparent text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-muted))]",
    danger:
      "bg-[rgb(var(--error))] text-white hover:bg-[rgb(var(--error))/0.9]",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  return (
    <Comp
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
