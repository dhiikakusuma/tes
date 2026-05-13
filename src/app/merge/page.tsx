"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Combine,
  GripVertical,
  Trash2,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { readFileAsArrayBuffer } from "@/lib/pdf/io";

type Item = { id: string; file: File };

export default function MergePage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addFiles(files: File[]) {
    setError(null);
    const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      setError("Only PDF files are supported.");
      return;
    }
    setItems((prev) => [
      ...prev,
      ...pdfs.map((file) => ({ id: `${file.name}-${Date.now()}-${Math.random()}`, file })),
    ]);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function merge() {
    if (items.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const out = await PDFDocument.create();
      for (const it of items) {
        const buf = await readFileAsArrayBuffer(it.file);
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, "merged.pdf");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to merge PDFs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Merge PDF"
        description="Combine multiple PDFs into a single document. Drag to reorder."
        icon={Combine}
        accent="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
      />

      <Dropzone
        multiple
        onFiles={addFiles}
        label="Drop your PDFs here"
        hint="or click to browse — add as many as you need"
      />

      {items.length > 0 && (
        <Card className="mt-6">
          <CardBody className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((it, idx) => (
                  <SortableRow
                    key={it.id}
                    item={it}
                    index={idx}
                    onRemove={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardBody>
        </Card>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} file{items.length === 1 ? "" : "s"} selected
        </p>
        <div className="flex gap-2">
          {items.length > 0 && (
            <Button variant="outline" onClick={() => setItems([])} disabled={busy}>
              Clear
            </Button>
          )}
          <Button onClick={merge} disabled={items.length < 2 || busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {busy ? "Merging..." : "Merge & download"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortableRow({
  item,
  index,
  onRemove,
}: {
  item: Item;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
        <FileText size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {index + 1}. {item.file.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatBytes(item.file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        aria-label="Remove"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
