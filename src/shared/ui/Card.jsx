import React from "react";
import { cn } from "./cn";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("p-4 pb-2", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("p-4 pt-2", className)} {...props} />;
}
