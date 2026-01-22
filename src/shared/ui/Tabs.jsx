import React from "react";
import { motion } from "framer-motion";
import { cn } from "./cn";

export function Tabs({ value, onChange, children, className = "" }) {
  return (
    <div
      className={cn(
        "scrollbar-hide flex gap-2 overflow-x-auto py-1",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child, {
          active: child.props.value === value,
          onSelect: () => onChange?.(child.props.value),
        });
      })}
    </div>
  );
}

export function Tab({ label, active, onSelect, className = "" }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold",
        "border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))]",
        "active:scale-[0.98] transition",
        className
      )}
    >
      {active ? (
        <motion.span
          layoutId="tab-pill"
          className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgb(var(--brand-primary)),rgb(var(--brand-secondary)))]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      ) : null}
      <span className={cn("relative", active ? "text-white" : "")}>{label}</span>
    </button>
  );
}
