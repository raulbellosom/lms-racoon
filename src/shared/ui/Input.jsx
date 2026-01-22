import React from "react";
import { cn } from "./cn";

export const Input = React.forwardRef(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:border-[rgb(var(--brand-secondary))] focus:outline-none",
        className
      )}
      {...props}
    />
  );
});
