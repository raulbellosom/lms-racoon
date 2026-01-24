import React from "react";
import { Input } from "./Input";
import { Search } from "lucide-react";

/**
 * DataHeader Component
 * Standard header for data tables/lists with Search and Actions.
 *
 * @param {string} search - Current search value (controlled)
 * @param {Function} onSearchChange - Callback(value)
 * @param {string} placeholder - Search placeholder
 * @param {React.ReactNode} children - Action buttons (e.g. "Create New")
 * @param {string} className - Optional extra classes
 */
export function DataHeader({
  search,
  onSearchChange,
  placeholder = "Buscar...",
  children,
  className = "",
}) {
  return (
    <div
      className={`mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {children}
      </div>
    </div>
  );
}
