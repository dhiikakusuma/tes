"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorPage, Overlay, OverlayRect } from "./types";

type Props = {
  page: EditorPage;
  selectedOverlayId: string | null;
  onOverlayChange: (id: string, patch: Partial<Overlay>) => void;
  onSelectOverlay: (id: string | null) => void;
  onDeleteOverlay: (id: string) => void;
  maxWidth?: number;
};

export function PageCanvas({
  page,
  selectedOverlayId,
  onOverlayChange,
  onSelectOverlay,
  onDeleteOverlay,
  maxWidth = 720,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origin: OverlayRect;
  } | null>(null);

  const rotated = page.rotation % 180 !== 0;
  const baseW = rotated ? page.height : page.width;
  const baseH = rotated ? page.width : page.height;
  const scale = Math.min(maxWidth, baseW) / baseW;
  const dispW = baseW * scale;
  const dispH = baseH * scale;

  function toDisplay(rect: OverlayRect): OverlayRect {
    return {
      x: rect.x * scale,
      y: rect.y * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    };
  }

  function onPointerDown(
    e: React.PointerEvent,
    overlay: Overlay,
    mode: "move" | "resize",
  ) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onSelectOverlay(overlay.id);
    dragRef.current = {
      id: overlay.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...overlay.rect },
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    const o = d.origin;
    if (d.mode === "move") {
      const next: OverlayRect = {
        x: Math.max(0, Math.min(baseW - o.width, o.x + dx)),
        y: Math.max(0, Math.min(baseH - o.height, o.y + dy)),
        width: o.width,
        height: o.height,
      };
      onOverlayChange(d.id, { rect: next });
    } else {
      const newW = Math.max(20, Math.min(baseW - o.x, o.width + dx));
      const aspect = o.height / o.width;
      const newH = Math.max(12, Math.min(baseH - o.y, newW * aspect));
      onOverlayChange(d.id, { rect: { x: o.x, y: o.y, width: newW, height: newH } });
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div
      className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (e.target === containerRef.current) onSelectOverlay(null);
        }}
        className="relative mx-auto bg-white shadow"
        style={{
          width: dispW,
          height: dispH,
          maxWidth: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.thumbDataUrl}
          alt={`Page ${page.sourcePageIndex + 1}`}
          className="select-none"
          draggable={false}
          style={{
            position: "absolute",
            left: page.rotation === 90 ? dispW : page.rotation === 180 ? dispW : 0,
            top: page.rotation === 270 ? dispH : page.rotation === 180 ? dispH : 0,
            width: page.width * scale,
            height: page.height * scale,
            transform: `rotate(${page.rotation}deg)`,
            transformOrigin: "top left",
          }}
        />
        {page.overlays.map((overlay) => {
          const r = toDisplay(overlay.rect);
          const selected = overlay.id === selectedOverlayId;
          return (
            <div
              key={overlay.id}
              className={cn(
                "absolute cursor-move",
                selected ? "ring-2 ring-rose-500" : "ring-1 ring-rose-300/60",
              )}
              style={{
                left: r.x,
                top: r.y,
                width: r.width,
                height: r.height,
              }}
              onPointerDown={(e) => onPointerDown(e, overlay, "move")}
              onClick={(e) => {
                e.stopPropagation();
                onSelectOverlay(overlay.id);
              }}
            >
              {overlay.type === "text" ? (
                <div
                  className="flex h-full w-full items-center px-1"
                  style={{
                    color: overlay.color,
                    fontSize: overlay.fontSize * scale,
                    lineHeight: 1.1,
                    whiteSpace: "pre-wrap",
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  {overlay.text || "Text"}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={overlay.dataUrl}
                  alt=""
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
              )}
              {selected && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOverlay(overlay.id);
                    }}
                    className="absolute -right-3 -top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow"
                    aria-label="Delete element"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div
                    onPointerDown={(e) => onPointerDown(e, overlay, "resize")}
                    className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full bg-rose-600 ring-2 ring-white"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
