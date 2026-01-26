import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";

/**
 * Animated Empty State Component
 * Uses framer-motion for smooth entrance animations
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[400px] ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-6 relative"
      >
        <div className="absolute inset-0 bg-linear-to-tr from-[rgb(var(--brand-primary))/0.2] to-blue-100 rounded-full blur-xl transform scale-150" />
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-[rgb(var(--border-base))]">
          <Icon className="h-10 w-10 text-[rgb(var(--brand-primary))]" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-xl font-bold mb-3"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-[rgb(var(--text-secondary))] max-w-md mb-8 leading-relaxed"
      >
        {description}
      </motion.p>

      {actionLabel && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button
            onClick={onAction}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
