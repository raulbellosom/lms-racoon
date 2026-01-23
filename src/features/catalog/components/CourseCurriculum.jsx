import React from "react";
import { ChevronDown, PlayCircle, FileText, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

function getIcon(kind) {
  switch (kind) {
    case "video":
      return <PlayCircle className="h-4 w-4" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4" />;
    case "article":
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function SectionItem({ section, defaultOpen = false }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-[rgb(var(--border-base))] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-[rgb(var(--bg-muted))] px-4 py-4 text-left transition hover:bg-[rgb(var(--bg-surface))]"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-5 w-5 text-[rgb(var(--text-muted))] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <span className="font-bold text-[rgb(var(--text-primary))]">
            {section.title}
          </span>
        </div>
        <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
          {section.lessons?.length || 0} lecciones
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[rgb(var(--bg-surface))]"
          >
            <div className="space-y-1 p-2">
              {section.lessons?.map((lesson) => (
                <div
                  key={lesson.$id}
                  className="flex items-center justify-between rounded-lg p-2 transition hover:bg-[rgb(var(--bg-muted))]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[rgb(var(--brand-primary))]">
                      {getIcon(lesson.kind)}
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                      {lesson.title}
                    </span>
                  </div>
                  {lesson.durationSec > 0 && (
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {Math.floor(lesson.durationSec / 60)}:
                      {(lesson.durationSec % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))}
              {(!section.lessons || section.lessons.length === 0) && (
                <div className="p-2 text-center text-xs text-[rgb(var(--text-muted))] italic">
                  Sin lecciones
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CourseCurriculum({ content = [] }) {
  const { t } = useTranslation();

  if (!content || content.length === 0) {
    return (
      <div className="py-8 text-center text-[rgb(var(--text-muted))]">
        No hay contenido disponible todavía.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
      {content.map((section, index) => (
        <SectionItem
          key={section.$id || index}
          section={section}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}
