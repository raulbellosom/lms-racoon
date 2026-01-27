import React from "react";
import { cn } from "./cn";

/**
 * Avatar component with image, fallback initials, and loading states
 * @param {Object} props
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt] - Alt text for the image
 * @param {string} [props.name] - Name to generate initials from (fallback)
 * @param {string} [props.size='md'] - Size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} [props.ring] - Whether to show a decorative ring
 * @param {string} [props.status] - Status indicator: 'online' | 'offline' | 'busy' | 'away'
 * @param {string} [props.shape='circle'] - Shape: 'circle' | 'square'
 * @param {string} [props.className] - Additional classes
 */
export function Avatar({
  src,
  alt,
  name,
  initials,
  size = "md",
  shape = "circle",
  ring = false,
  status,
  className,
}) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const getInitials = (name) => {
    if (initials) return initials;
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
    "2xl": "h-24 w-24 text-3xl",
  };

  const statusSizeClasses = {
    xs: "h-2 w-2 border",
    sm: "h-2.5 w-2.5 border",
    md: "h-3 w-3 border-2",
    lg: "h-4 w-4 border-2",
    xl: "h-5 w-5 border-2",
    "2xl": "h-6 w-6 border-2",
  };

  const statusColorClasses = {
    online: "bg-[rgb(var(--success))]",
    offline: "bg-[rgb(var(--text-muted))]",
    busy: "bg-[rgb(var(--error))]",
    away: "bg-[rgb(var(--warning))]",
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold text-[rgb(var(--text-secondary))]",
        shape === "circle" ? "rounded-full" : "rounded-2xl",
        (shape === "square" || shape === "circle") &&
          "bg-[rgb(var(--bg-muted))]",
        sizeClasses[size],
        ring && "avatar-ring",
        className,
      )}
    >
      {showFallback ? (
        <span>{getInitials(name)}</span>
      ) : (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[rgb(var(--bg-surface))]",
            statusSizeClasses[size],
            statusColorClasses[status],
          )}
        />
      )}
    </div>
  );
}

/**
 * Avatar group for showing multiple avatars stacked
 */
export function AvatarGroup({ avatars = [], max = 5, size = "md", className }) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapClasses = {
    xs: "-ml-2",
    sm: "-ml-2.5",
    md: "-ml-3",
    lg: "-ml-4",
    xl: "-ml-5",
  };

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((avatar, index) => (
        <div
          key={avatar.id || index}
          className={cn("relative", index > 0 && overlapClasses[size])}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt || avatar.name}
            size={size}
            ring
          />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 border-[rgb(var(--bg-surface))] bg-[rgb(var(--bg-muted))] text-xs font-semibold text-[rgb(var(--text-secondary))]",
            {
              xs: "h-6 w-6",
              sm: "h-8 w-8",
              md: "h-10 w-10",
              lg: "h-14 w-14",
              xl: "h-20 w-20",
            }[size],
            overlapClasses[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
