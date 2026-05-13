"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCcw, RotateCw, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorPage } from "./types";

type Props = {
  pages: EditorPage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (pages: EditorPage[]) => void;
  onRotate: (id: string, delta: 90 | -90) => void;
  onDelete: (id: string) => void;
};

export function PageThumbStrip({
  pages,
  selectedId,
  onSelect,
  onReorder,
  onRotate,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = pages.findIndex((p) => p.id === active.id);
    const newIdx = pages.findIndex((p) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(pages, oldIdx, newIdx));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pages.map((page, idx) => (
            <ThumbCard
              key={page.id}
              page={page}
              index={idx}
              selected={page.id === selectedId}
              onSelect={() => onSelect(page.id)}
              onRotateLeft={() => onRotate(page.id, -90)}
              onRotateRight={() => onRotate(page.id, 90)}
              onDelete={() => onDelete(page.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ThumbCard({
  page,
  index,
  selected,
  onSelect,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: {
  page: EditorPage;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border-2 bg-white p-2 transition-colors dark:bg-zinc-950",
        selected
          ? "border-rose-500 ring-2 ring-rose-200 dark:ring-rose-900/50"
          : "border-zinc-200 hover:border-rose-300 dark:border-zinc-700",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.thumbDataUrl}
          alt={`Page ${index + 1}`}
          className="mx-auto block w-full"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      </button>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          #{index + 1}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            {...attributes}
            {...listeners}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Drag"
          >
            <GripVertical size={14} />
          </button>
          <button
            type="button"
            onClick={onRotateLeft}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Rotate left"
            title="Rotate left"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={onRotateRight}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Rotate right"
            title="Rotate right"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            aria-label="Delete page"
            title="Delete page"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
