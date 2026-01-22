import React from "react";
import { Star, Users } from "lucide-react";
import { Card } from "../../shared/ui/Card";
import { Badge } from "../../shared/ui/Badge";
import { cn } from "../../shared/ui/cn";
import { formatMoney } from "../../shared/utils/money";

export function CourseCard({ course, compact = false, className = "" }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        <img
          src={course.coverUrl}
          alt={course.title}
          className={cn("w-full object-cover", compact ? "h-28" : "h-40")}
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="brand">{course.level}</Badge>
          <Badge>{course.language?.toUpperCase?.() || "ES"}</Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm font-extrabold tracking-tight line-clamp-2">{course.title}</div>
        <div className="mt-1 text-xs text-[rgb(var(--text-secondary))] line-clamp-2">
          {course.subtitle}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
              <span className="font-semibold text-[rgb(var(--text-primary))]">
                {course.ratingAvg?.toFixed?.(1) ?? "—"}
              </span>
              <span className="text-[rgb(var(--text-muted))]">
                ({course.ratingCount ?? 0})
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.studentsCount ?? 0}
            </span>
          </div>

          <div className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
            {formatMoney(course.priceCents ?? 0, course.currency || "MXN")}
          </div>
        </div>
      </div>
    </Card>
  );
}
