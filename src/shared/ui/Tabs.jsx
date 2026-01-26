import React, { createContext, useContext, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./cn";

const TabsContext = createContext(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const actualValue = value !== undefined ? value : localValue;

  const handleChange = (val) => {
    if (value === undefined) setLocalValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider
      value={{ value: actualValue, onChange: handleChange }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div
      className={cn(
        "scrollbar-hide flex gap-2 overflow-x-auto py-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }) {
  const { value: selectedValue, onChange } = useContext(TabsContext);
  const isActive = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold",
        "border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))]",
        "hover:text-[rgb(var(--text-primary))] active:scale-[0.98] transition-all",
        isActive && "text-white hover:text-white border-transparent",
        className,
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab"
          className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgb(var(--brand-primary)),rgb(var(--brand-secondary)))]"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const { value: selectedValue } = useContext(TabsContext);
  if (selectedValue !== value) return null;
  return (
    <div className={cn("mt-2 outline-none", className)} role="tabpanel">
      {children}
    </div>
  );
}
