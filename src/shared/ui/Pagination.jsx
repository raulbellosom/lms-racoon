import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination Component
 * @param {number} currentPage - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback(pageNumber)
 * @param {number} totalItems - Optional: Total number of items to show text
 * @param {number} itemsPerPage - Optional: Limit per page
 * @param {boolean} disabled - Disable all controls
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  disabled = false,
}) {
  if (totalPages <= 1 && !totalItems) return null;

  // Generate page numbers to show (e.g., 1, 2, 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // simplified logic

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first, last, and current neighbors
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[rgb(var(--border-base))] px-6 py-4 gap-4">
      {totalItems !== undefined && (
        <div className="text-sm text-[rgb(var(--text-secondary))]">
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
          - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}{" "}
          resultados
        </div>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-sm text-[rgb(var(--text-secondary))]"
            >
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "primary" : "ghost"}
              size="sm"
              onClick={() => onPageChange(p)}
              disabled={disabled}
              className={`h-8 w-8 p-0 ${p === currentPage ? "pointer-events-none" : ""}`}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || disabled}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
