"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadPdfDocument, renderPageToDataUrl } from "@/lib/pdf/pdfjs";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Props = {
  data: Uint8Array | null;
  selected: number;
  onSelect: (page: number) => void;
  className?: string;
};

export function PdfPagePicker({ data, selected, onSelect, className }: Props) {
  const [thumbs, setThumbs] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    let active = true;
    let doc: PDFDocumentProxy | null = null;
    (async () => {
      setLoading(true);
      setThumbs([]);
      try {
        doc = await loadPdfDocument(data);
        const urls: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const u = await renderPageToDataUrl(doc, i, { maxWidth: 220 });
          if (!active) return;
          urls.push(u);
          setThumbs([...urls]);
        }
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
  }, [data]);

  if (!data) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Page preview</span>
        {loading && (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Rendering...
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {thumbs.map((src, i) => {
          const pageNum = i + 1;
          const isSelected = pageNum === selected;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onSelect(pageNum)}
              className={cn(
                "group relative overflow-hidden rounded-lg border-2 bg-white p-1 transition-colors",
                isSelected
                  ? "border-rose-500 ring-2 ring-rose-200 dark:ring-rose-900/50"
                  : "border-zinc-200 hover:border-rose-300 dark:border-zinc-700",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Page ${pageNum}`} className="w-full" />
              <span
                className={cn(
                  "absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  isSelected
                    ? "bg-rose-600 text-white"
                    : "bg-zinc-900/70 text-white",
                )}
              >
                {pageNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
