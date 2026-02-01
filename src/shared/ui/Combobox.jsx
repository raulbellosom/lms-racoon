import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Search,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "./cn";

/**
 * Advanced Combobox component with search, icons, images, and validation
 *
 * @param {Object} props
 * @param {Array} props.options - Array of { value, label, icon?, image?, disabled? }
 * @param {any} props.value - Selected value
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.label] - Label text
 * @param {string} [props.helperText] - Helper text below input
 * @param {string} [props.error] - Error message
 * @param {string} [props.success] - Success message
 * @param {boolean} [props.searchable] - Enable search filtering
 * @param {boolean} [props.clearable] - Show clear button
 * @param {boolean} [props.disabled] - Disable the combobox
 * @param {boolean} [props.required] - Mark as required
 * @param {boolean} [props.multiple] - Allow multiple selection
 * @param {string} [props.size] - Size: 'sm' | 'md' | 'lg'
 */
export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  helperText,
  error,
  success,
  searchable = true,
  clearable = true,
  disabled = false,
  required = false,
  multiple = false,
  size = "md",
  className,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef(null);
  const triggerRef = React.useRef(null);

  // Update position when opening
  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      // If portal is used, we need to check if click is in container OR in the portal-ed dropdown
      // Actually, since we'll render in a Portal, we need to be careful.
      // Easiest is to check if click is inside containerRef OR if it's inside any element with a specific data attribute
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest("[data-combobox-dropdown]")
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower),
    );
  }, [options, search]);

  // Get selected option(s)
  const selectedOptions = React.useMemo(() => {
    if (!value) return [];
    if (multiple && Array.isArray(value)) {
      return options.filter((opt) => value.includes(opt.value));
    }
    return options.filter((opt) => opt.value === value);
  }, [options, value, multiple]);

  const selectedOption = selectedOptions[0];

  // Handle selection
  const handleSelect = (option) => {
    if (option.disabled) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];
      onChange?.(newValues);
    } else {
      onChange?.(option.value);
      setOpen(false);
      setSearch("");
    }
  };

  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : null);
    setSearch("");
  };

  // Size classes
  const sizes = {
    sm: "h-9 text-sm px-3",
    md: "h-11 text-sm px-4",
    lg: "h-12 text-base px-4",
  };

  // State classes
  const hasValue = multiple ? selectedOptions.length > 0 : !!selectedOption;
  const hasError = !!error;
  const hasSuccess = !!success;

  const dropdownContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          data-combobox-dropdown
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="mt-1 overflow-hidden rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shadow-lg"
        >
          {/* Search input */}
          {searchable && (
            <div className="border-b border-[rgb(var(--border-base))] p-2">
              <div className="flex items-center gap-2 rounded-lg bg-[rgb(var(--bg-muted))] px-3 py-2 border border-transparent focus-within:border-[rgb(var(--brand-primary))] focus-within:ring-2 focus-within:ring-[rgb(var(--brand-primary)/0.2)] transition-all">
                <Search className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgb(var(--text-muted))]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[rgb(var(--text-muted))]">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multiple
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                      option.disabled
                        ? "cursor-not-allowed opacity-50"
                        : isSelected
                          ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                          : "hover:bg-[rgb(var(--bg-muted))]",
                    )}
                  >
                    {/* Image */}
                    {option.image && (
                      <img
                        src={option.image}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                    )}

                    {/* Icon */}
                    {option.icon && !option.image && (
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-[rgb(var(--brand-primary)/0.1)]"
                            : "bg-[rgb(var(--bg-muted))]",
                        )}
                      >
                        <option.icon
                          className={cn(
                            "h-4 w-4",
                            isSelected
                              ? "text-[rgb(var(--brand-primary))]"
                              : "text-[rgb(var(--text-muted))]",
                          )}
                        />
                      </div>
                    )}

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{option.label}</div>
                      {option.description && (
                        <div className="truncate text-xs text-[rgb(var(--text-muted))]">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {/* Check mark */}
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Label */}
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
          {label}
          {required && (
            <span className="ml-0.5 text-[rgb(var(--error))]">*</span>
          )}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-[rgb(var(--bg-surface))] transition-all",
          sizes[size],
          disabled && "cursor-not-allowed opacity-50",
          hasError
            ? "border-[rgb(var(--error))] focus:ring-2 focus:ring-[rgb(var(--error)/0.2)]"
            : hasSuccess
              ? "border-[rgb(var(--success))] focus:ring-2 focus:ring-[rgb(var(--success)/0.2)]"
              : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))] focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.2)]",
          open &&
            "border-[rgb(var(--brand-primary))] ring-2 ring-[rgb(var(--brand-primary)/0.2)]",
        )}
        {...props}
      >
        {/* Selected value display */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {selectedOption?.image && (
            <img
              src={selectedOption.image}
              alt=""
              className="h-5 w-5 shrink-0 rounded-md object-cover"
            />
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]" />
          )}
          <span
            className={cn(
              "truncate",
              hasValue
                ? "text-[rgb(var(--text-primary))]"
                : "text-[rgb(var(--text-muted))]",
            )}
          >
            {multiple && selectedOptions.length > 0
              ? `${selectedOptions.length} seleccionados`
              : selectedOption?.label || placeholder}
          </span>
        </div>

        {/* Right icons */}
        <div className="flex shrink-0 items-center gap-1">
          {clearable && hasValue && !disabled && (
            <div
              role="button"
              onClick={handleClear}
              className="rounded p-0.5 transition hover:bg-[rgb(var(--bg-muted))]"
            >
              <X className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[rgb(var(--text-muted))] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Dropdown - Portaled */}
      {typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}

      {/* Helper/Error/Success text */}
      {(helperText || error || success) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {error && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-[rgb(var(--error))]" />
              <span className="text-[rgb(var(--error))]">{error}</span>
            </>
          )}
          {success && !error && (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-[rgb(var(--success))]" />
              <span className="text-[rgb(var(--success))]">{success}</span>
            </>
          )}
          {helperText && !error && !success && (
            <span className="text-[rgb(var(--text-muted))]">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
}
