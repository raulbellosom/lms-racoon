import { motion } from "framer-motion";
import appIcon from "../../resources/icon.svg";

/**
 * Premium loading screen with animated logo
 * Used for initial app load and page transitions
 */
export function LoadingScreen({ message = "" }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[rgb(var(--bg-base))]">
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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]"
          >
            <img
              src={appIcon}
              alt="Racoon LMS"
              className="h-12 w-12 object-contain"
            />
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
 * Loading content block with logo for component areas (Tabs, Cards, etc.)
 */
export function LoadingContent({ className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <div className="relative mb-6">
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
              "0 0 0 10px rgb(var(--brand-primary) / 0)",
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]"
        >
          <img
            src={appIcon}
            alt="Racoon LMS"
            className="h-10 w-10 object-contain"
          />
        </motion.div>
      </div>

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
  );
}

/**
 * Smaller inline loading spinner
 */
export function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const borderClasses = {
    sm: "border-2",
    md: "border-3",
    lg: "border-4",
    xl: "border-4",
  };

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {/* Outer spinning dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 rounded-full border-dashed border-[rgb(var(--brand-primary))] opacity-40 ${borderClasses[size]}`}
        style={{
          borderTopColor: "transparent",
          borderLeftColor: "transparent",
        }}
      />

      {/* Inner spinning ring (faster, opposite direction) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 rounded-full border-dotted border-[rgb(var(--brand-primary))] ${borderClasses[size]}`}
        style={{
          borderBottomColor: "transparent",
          borderRightColor: "transparent",
        }}
      />
    </div>
  );
}
