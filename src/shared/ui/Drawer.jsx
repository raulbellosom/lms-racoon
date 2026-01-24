import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "./cn";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  left: {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: { x: "-100%", transition: { duration: 0.2 } },
  },
  right: {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: { x: "100%", transition: { duration: 0.2 } },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: { y: "100%", transition: { duration: 0.2 } },
  },
};

/**
 * Drawer component for mobile navigation and side panels
 * @param {Object} props
 * @param {boolean} props.open - Whether the drawer is open
 * @param {function} props.onClose - Callback when drawer should close
 * @param {'left' | 'right' | 'bottom'} [props.side='left'] - Which side the drawer slides from
 * @param {string} [props.title] - Drawer title
 * @param {React.ReactNode} props.children - Drawer content
 * @param {string} [props.className] - Additional classes
 */
export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
  className,
}) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidePositionClasses = {
    left: "inset-y-0 left-0 h-full w-80 max-w-[85vw]",
    right: "inset-y-0 right-0 h-full w-80 max-w-[85vw]",
    bottom:
      "inset-x-0 bottom-0 w-full max-h-[90vh] rounded-t-[var(--radius-xl)]",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            variants={drawerVariants[side]}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute flex flex-col border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]",
              side === "left" && "border-r pt-safe",
              side === "right" && "border-l pt-safe",
              side === "bottom" && "border-t pb-safe",
              sidePositionClasses[side],
              className,
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between border-b border-[rgb(var(--border-base))] px-4 py-3">
                <h2 className="text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-[rgb(var(--text-muted))] transition hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Handle for bottom drawer */}
            {side === "bottom" && !title && (
              <div className="flex justify-center py-2">
                <div className="h-1 w-12 rounded-full bg-[rgb(var(--text-muted))]" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Drawer section for organizing content
 */
export function DrawerSection({ title, children, className }) {
  return (
    <div className={cn("px-4 py-4", className)}>
      {title && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
