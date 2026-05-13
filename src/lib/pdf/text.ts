"use client";

import { loadPdfDocument } from "@/lib/pdf/pdfjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export type PageLines = {
  page: number;
  lines: string[];
};

export async function extractTextByPage(
  data: Uint8Array,
  onProgress?: (n: number, total: number) => void,
): Promise<PageLines[]> {
  const doc = await loadPdfDocument(data);
  const out: PageLines[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const groups = new Map<number, { y: number; items: { x: number; str: string }[] }>();
      for (const it of tc.items as TextItem[]) {
        if (!("str" in it)) continue;
        const x = it.transform[4] as number;
        const y = it.transform[5] as number;
        const key = Math.round(y);
        const bucket = groups.get(key);
        if (bucket) {
          bucket.items.push({ x, str: it.str });
        } else {
          groups.set(key, { y, items: [{ x, str: it.str }] });
        }
      }
      const lines = Array.from(groups.values())
        .sort((a, b) => b.y - a.y)
        .map((g) =>
          g.items
            .sort((a, b) => a.x - b.x)
            .map((i) => i.str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter((l) => l.length > 0);
      out.push({ page: i, lines });
      onProgress?.(i, doc.numPages);
    }
  } finally {
    doc.destroy();
  }
  return out;
}
