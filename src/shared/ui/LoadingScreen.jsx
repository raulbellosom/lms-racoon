import { motion } from "framer-motion";

/**
 * Premium loading screen with animated logo
 * Used for initial app load and page transitions
 */
export function LoadingScreen({ message = "" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(var(--bg-base))]">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-primary)/0.15),transparent_70%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border-2 border-dashed border-[rgb(var(--brand-primary)/0.3)]"
          />

          {/* Inner glow */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgb(var(--brand-primary) / 0.4)",
                "0 0 0 20px rgb(var(--brand-primary) / 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]"
          >
            <span className="text-3xl font-black text-white">R</span>
          </motion.div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-xl font-extrabold tracking-tight">
            Racoon LMS
          </div>
          {message && (
            <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              {message}
            </div>
          )}
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full bg-[rgb(var(--brand-primary))]"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Smaller inline loading spinner
 */
export function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={`animate-spin text-[rgb(var(--brand-primary))] ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
