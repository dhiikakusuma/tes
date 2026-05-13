"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { loadPdfDocument, renderPageToDataUrl } from "@/lib/pdf/pdfjs";
import type { PDFDocumentProxy } from "pdfjs-dist";

export type PlacementRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  data: Uint8Array | null;
  page: number;
  imageDataUrl: string | null;
  rect: PlacementRect;
  onRectChange: (rect: PlacementRect) => void;
  text?: string;
  maxWidth?: number;
};

export function PdfPagePlacer({
  data,
  page,
  imageDataUrl,
  rect,
  onRectChange,
  text,
  maxWidth = 720,
}: Props) {
  const [bg, setBg] = React.useState<string | null>(null);
  const [bgSize, setBgSize] = React.useState({ width: 0, height: 0 });
  const [loading, setLoading] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    mode: "move" | "resize" | null;
    startX: number;
    startY: number;
    origin: PlacementRect;
  }>({ mode: null, startX: 0, startY: 0, origin: rect });

  React.useEffect(() => {
    if (!data) return;
    let active = true;
    let doc: PDFDocumentProxy | null = null;
    (async () => {
      setLoading(true);
      try {
        doc = await loadPdfDocument(data);
        const p = await doc.getPage(page);
        const v = p.getViewport({ scale: 1 });
        const url = await renderPageToDataUrl(doc, page, { maxWidth });
        if (!active) return;
        setBg(url);
        setBgSize({ width: v.width, height: v.height });
      } catch (err) {
        console.error(err);
      } finally {
        if (doc) doc.destroy();
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [data, page, maxWidth]);

  const displayScale = bgSize.width
    ? Math.min(maxWidth, bgSize.width) / bgSize.width
    : 1;
  const dispW = bgSize.width * displayScale;

  function onPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    mode: "move" | "resize",
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...rect },
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.mode) return;
    const dx = (e.clientX - dragRef.current.startX) / displayScale;
    const dy = (e.clientY - dragRef.current.startY) / displayScale;
    const o = dragRef.current.origin;
    if (dragRef.current.mode === "move") {
      onRectChange({
        x: Math.max(0, Math.min(bgSize.width - o.width, o.x + dx)),
        y: Math.max(0, Math.min(bgSize.height - o.height, o.y + dy)),
        width: o.width,
        height: o.height,
      });
    } else {
      const newW = Math.max(40, Math.min(bgSize.width - o.x, o.width + dx));
      const aspect = o.height / o.width;
      const newH = Math.max(20, Math.min(bgSize.height - o.y, newW * aspect));
      onRectChange({ x: o.x, y: o.y, width: newW, height: newH });
    }
  }

  function onPointerUp() {
    dragRef.current.mode = null;
  }

  if (!data) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Page {page} — drag the box to move it, drag the corner to resize</span>
        {loading && (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Loading...
          </span>
        )}
      </div>
      <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div
          ref={wrapperRef}
          className="relative mx-auto"
          style={{ width: dispW || "auto", maxWidth: "100%" }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {bg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bg}
              alt={`Page ${page}`}
              className="block w-full select-none rounded-md shadow"
              draggable={false}
            />
          )}
          {(imageDataUrl || text) && bgSize.width > 0 && (
            <div
              role="button"
              tabIndex={0}
              onPointerDown={(e) => onPointerDown(e, "move")}
              className="absolute cursor-move rounded border-2 border-rose-500/80 bg-rose-500/5"
              style={{
                left: rect.x * displayScale,
                top: rect.y * displayScale,
                width: rect.width * displayScale,
                height: rect.height * displayScale,
              }}
            >
              {imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageDataUrl}
                  alt="Overlay"
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
              )}
              {text && (
                <div
                  className="pointer-events-none flex h-full w-full items-center justify-center px-1 text-black"
                  style={{
                    fontSize: Math.max(8, rect.height * displayScale * 0.6),
                  }}
                >
                  {text}
                </div>
              )}
              <div
                onPointerDown={(e) => onPointerDown(e, "resize")}
                className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full bg-rose-600 ring-2 ring-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
