import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: { duration: 0.15 },
  },
};

/**
 * Dropdown menu component with trigger and animated menu
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - The element that triggers the dropdown
 * @param {React.ReactNode} props.children - Dropdown menu content
 * @param {'left' | 'right'} [props.align='left'] - Menu alignment
 * @param {'top' | 'bottom'} [props.side='bottom'] - Menu opening direction
 * @param {string} [props.className] - Additional classes for menu
 */
export function Dropdown({
  trigger,
  children,
  align = "left",
  side = "bottom",
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // ... (keep existing effects)

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger */}
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute z-50 min-w-[180px] rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-1 shadow-lg",
              align === "left" ? "left-0" : "right-0",
              side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Dropdown menu item
 */
export function DropdownItem({
  children,
  onClick,
  icon: Icon,
  danger = false,
  disabled = false,
  className,
}) {
  return (
    <button
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
        danger
          ? "text-[rgb(var(--error))] hover:bg-[rgb(var(--error-soft))]"
          : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-muted))]",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/**
 * Dropdown divider
 */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-[rgb(var(--border-base))]" />;
}

/**
 * Dropdown section label
 */
export function DropdownLabel({ children }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
      {children}
    </div>
  );
}

/**
 * Select-style dropdown with icon
 */
export function Select({
  value,
  options = [],
  onChange,
  placeholder = "Seleccionar...",
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-4 py-2.5 text-left text-sm transition",
          "hover:border-[rgb(var(--border-hover))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.3)]",
        )}
      >
        <span
          className={!selectedOption ? "text-[rgb(var(--text-muted))]" : ""}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[rgb(var(--text-muted))] transition",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Options */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-1 shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
                  option.value === value
                    ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                    : "hover:bg-[rgb(var(--bg-muted))]",
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
