import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, GripVertical, Layers3 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { SectionCard } from "./SectionCard";
import { LessonItem } from "./LessonItem";
import { EmptyState } from "../../../shared/components/EmptyState";

/**
 * SortableSectionItem - Wrapper for SectionCard to make it sortable
 */
function SortableSectionItem({ section, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.$id, data: { type: "SECTION", section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <SectionCard
        section={section}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: "0.5" },
    },
  }),
};

/**
 * CurriculumEditor - Full curriculum management for sections and lessons
 */
export function CurriculumEditor({
  sections = [],
  lessonsBySection = {},
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderSections,
  onReorderLessons,
  ...props
}) {
  const { t } = useTranslation();

  // Local state for DnD visual updates to avoid API spam on DragOver
  const [localSections, setLocalSections] = useState(sections);
  const [localLessons, setLocalLessons] = useState(lessonsBySection);
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  useEffect(() => {
    setLocalLessons(lessonsBySection);
  }, [lessonsBySection]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor),
  );

  const findSectionId = (id) => {
    if (localLessons[id]) return id;
    return Object.keys(localLessons).find((sectionId) =>
      localLessons[sectionId].find((l) => l.$id === id),
    );
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    // Determine active item type
    const isSection = localSections.find((s) => s.$id === active.id);
    if (isSection) {
      setActiveItem({ type: "SECTION", data: isSection });
    } else {
      const secId = findSectionId(active.id);
      const l = localLessons[secId]?.find((l) => l.$id === active.id);
      setActiveItem({ type: "LESSON", data: l });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = activeItem;
    const overId = over.id;

    if (!activeData || activeData.type === "SECTION") return;

    // Find containers
    const activeSectionId = findSectionId(active.id);
    const overSectionId = findSectionId(overId);

    if (!activeSectionId || !overSectionId) return;

    if (activeSectionId !== overSectionId) {
      setLocalLessons((prev) => {
        const activeItems = prev[activeSectionId];
        const overItems = prev[overSectionId];
        const activeIndex = activeItems.findIndex((l) => l.$id === active.id);
        const overIndex = overItems.findIndex((l) => l.$id === overId);

        let newIndex;
        if (overId === overSectionId) {
          // Dropped on a section card (empty container or container itself)
          newIndex = overItems.length + 1;
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          newIndex =
            overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        return {
          ...prev,
          [activeSectionId]: [
            ...prev[activeSectionId].filter((item) => item.$id !== active.id),
          ],
          [overSectionId]: [
            ...prev[overSectionId].slice(0, newIndex),
            activeItems[activeIndex],
            ...prev[overSectionId].slice(newIndex, prev[overSectionId].length),
          ],
        };
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (activeItem?.type === "SECTION") {
      if (active.id !== over?.id) {
        const oldIndex = localSections.findIndex((s) => s.$id === active.id);
        const newIndex = localSections.findIndex((s) => s.$id === over.id);
        const newOrder = arrayMove(localSections, oldIndex, newIndex);
        setLocalSections(newOrder); // Optimistic visual
        onReorderSections?.(newOrder); // Persist
      }
    } else if (activeItem?.type === "LESSON") {
      const activeSectionId = findSectionId(active.id);
      const overSectionId = findSectionId(over?.id);

      if (activeSectionId && overSectionId) {
        const activeItems = localLessons[activeSectionId];
        const overItems = localLessons[overSectionId];

        const activeIndex = activeItems.findIndex((l) => l.$id === active.id);
        const overIndex = overItems.findIndex((l) => l.$id === over.id);

        if (activeSectionId !== overSectionId) {
          // Moved between sections
          onReorderLessons?.(activeSectionId, localLessons[activeSectionId]);
          onReorderLessons?.(overSectionId, localLessons[overSectionId]);
        } else if (activeIndex !== overIndex) {
          // Same section reorder
          const newItems = arrayMove(overItems, activeIndex, overIndex);
          setLocalLessons((prev) => ({
            ...prev,
            [activeSectionId]: newItems,
          }));
          onReorderLessons?.(activeSectionId, newItems);
        }
      }
    }

    setActiveId(null);
    setActiveItem(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{t("teacher.curriculum.title")}</h3>
        <Button onClick={onAddSection} size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> {t("teacher.addSection")}
        </Button>
      </div>

      {localSections.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title={t("teacher.curriculum.emptyStateTitle")}
          description={t("teacher.curriculum.emptyStateDesc")}
          actionLabel={t("teacher.addSection")}
          onAction={onAddSection}
          className="min-h-[400px] bg-[rgb(var(--bg-muted))]/0.3 border-2 border-dashed border-[rgb(var(--border-base))] rounded-2xl"
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map((s) => s.$id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {localSections.map((section, index) => (
                <SortableSectionItem
                  key={section.$id}
                  section={section}
                  index={index}
                  lessons={localLessons[section.$id] || []}
                  onEditSection={onEditSection}
                  onDeleteSection={onDeleteSection}
                  onAddLesson={onAddLesson}
                  onEditLesson={onEditLesson}
                  onDeleteLesson={onDeleteLesson}
                  onPreviewLesson={props.onPreviewLesson}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? (
              activeItem.type === "SECTION" ? (
                <SectionCard
                  section={activeItem.data}
                  lessons={localLessons[activeItem.data.$id] || []}
                  index={0}
                /> // Visual clone
              ) : (
                <LessonItem lesson={activeItem.data} isDragging />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
