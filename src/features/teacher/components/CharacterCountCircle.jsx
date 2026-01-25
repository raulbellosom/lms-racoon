import React from "react";

export function CharacterCountCircle({
  current,
  max,
  size = 20,
  strokeWidth = 2,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(current / max, 1);
  const offset = circumference - progress * circumference;

  let color = "text-[rgb(var(--brand-primary))]";
  if (current > max * 0.9) color = "text-orange-500";
  if (current >= max) color = "text-red-500";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Background Circle */}
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[rgb(var(--bg-muted))]"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-300 ${color}`}
        />
      </svg>
      {/* Optional: Text inside? usually too small for numbers unless size > 40 */}
    </div>
  );
}
