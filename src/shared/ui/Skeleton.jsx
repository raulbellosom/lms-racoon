import { cn } from "./cn";

/**
 * Skeleton loading placeholder with shimmer animation
 * @param {Object} props
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.circle] - Whether to render as circle (for avatars)
 * @param {number} [props.lines] - Number of text lines to show
 * @param {string} [props.height] - Custom height
 * @param {string} [props.width] - Custom width
 */
export function Skeleton({
  className,
  circle = false,
  lines = 0,
  height,
  width,
}) {
  if (lines > 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-shimmer rounded-lg",
              i === lines - 1 ? "w-3/4" : "w-full", // Last line shorter
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-shimmer",
        circle ? "rounded-full" : "rounded-[var(--radius)]",
        className,
      )}
      style={{
        height: height || (circle ? "40px" : "20px"),
        width: width || (circle ? "40px" : "100%"),
      }}
    />
  );
}

/**
 * Card skeleton for course cards
 */
export function CardSkeleton({ className }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4",
        className,
      )}
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-video w-full" />

      {/* Content */}
      <div className="mt-4 space-y-3">
        <Skeleton height="24px" width="80%" />
        <Skeleton lines={2} />
        <div className="flex items-center gap-2">
          <Skeleton circle height="32px" width="32px" />
          <Skeleton height="16px" width="120px" />
        </div>
      </div>
    </div>
  );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4",
        className,
      )}
    >
      <Skeleton circle height="48px" width="48px" />
      <div className="flex-1 space-y-2">
        <Skeleton height="18px" width="60%" />
        <Skeleton height="14px" width="40%" />
      </div>
    </div>
  );
}

/**
 * Course grid skeleton (multiple cards)
 */
export function CourseGridSkeleton({ count = 6, className }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className={j === 0 ? "flex-1" : "flex-initial"}>
              <Skeleton
                width={j === 0 ? "60%" : "100px"}
                className={j > 1 ? "hidden md:block" : ""}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
