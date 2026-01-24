import React from "react";
import { cn } from "./cn";

export function PageLayout({ children, className, title, subtitle, actions }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-between">
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 py-8 animate-in fade-in-50 duration-500",
          className,
        )}
      >
        {(title || subtitle || actions) && (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
