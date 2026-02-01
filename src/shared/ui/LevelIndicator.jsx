import React from "react";
import { BarChart } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * LevelIndicator - Displays course difficulty level with colored bars
 *
 * @param {string} level - "beginner" | "intermediate" | "advanced"
 * @param {boolean} showText - Whether to show the level text (default: true)
 * @param {boolean} showIcon - Whether to show the bar chart icon (default: false)
 * @param {string} size - "sm" | "md" | "lg" (default: "md")
 * @param {string} className - Additional CSS classes
 */
export function LevelIndicator({
  level = "beginner",
  showText = true,
  showIcon = false,
  size = "md",
  className = "",
}) {
  const { t } = useTranslation();

  // Normalize level to lowercase
  const normalizedLevel = (level || "beginner").toLowerCase();

  // Level configuration
  const levelConfig = {
    beginner: {
      bars: 1,
      color: "bg-emerald-500",
      inactiveColor: "bg-gray-300 dark:bg-gray-600",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    intermediate: {
      bars: 2,
      color: "bg-amber-500",
      inactiveColor: "bg-gray-300 dark:bg-gray-600",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    advanced: {
      bars: 3,
      color: "bg-red-500",
      inactiveColor: "bg-gray-300 dark:bg-gray-600",
      textColor: "text-red-600 dark:text-red-400",
    },
  };

  const config = levelConfig[normalizedLevel] || levelConfig.beginner;

  // Size configuration
  const sizeConfig = {
    sm: {
      barWidth: "w-1",
      barHeights: ["h-2", "h-3", "h-4"],
      gap: "gap-0.5",
      text: "text-[10px]",
      iconSize: "h-3 w-3",
    },
    md: {
      barWidth: "w-1.5",
      barHeights: ["h-2.5", "h-3.5", "h-4.5"],
      gap: "gap-0.5",
      text: "text-xs",
      iconSize: "h-3.5 w-3.5",
    },
    lg: {
      barWidth: "w-2",
      barHeights: ["h-3", "h-4", "h-5"],
      gap: "gap-1",
      text: "text-sm",
      iconSize: "h-4 w-4",
    },
  };

  const sizeConf = sizeConfig[size] || sizeConfig.md;

  // Get translated level text
  const levelText =
    t(`courses.levels.${normalizedLevel}`) ||
    normalizedLevel.charAt(0).toUpperCase() + normalizedLevel.slice(1);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && (
        <BarChart className={`${sizeConf.iconSize} ${config.textColor}`} />
      )}

      {/* Level bars */}
      <div className={`flex items-end ${sizeConf.gap}`}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`
              ${sizeConf.barWidth} 
              ${sizeConf.barHeights[index]} 
              rounded-sm
              transition-colors
              ${index < config.bars ? config.color : config.inactiveColor}
            `}
          />
        ))}
      </div>

      {showText && (
        <span className={`${sizeConf.text} font-medium ${config.textColor}`}>
          {levelText}
        </span>
      )}
    </div>
  );
}

export default LevelIndicator;
