"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  pdfjsLib = lib;
  return lib;
}

export async function loadPdfDocument(
  data: ArrayBuffer | Uint8Array,
): Promise<PDFDocumentProxy> {
  const lib = await getPdfjs();
  const buf =
    data instanceof Uint8Array ? data.slice().buffer : data.slice(0);
  const task = lib.getDocument({ data: buf });
  return await task.promise;
}

export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  options: { maxWidth?: number; scale?: number } = {},
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale =
    options.scale ??
    (options.maxWidth ? options.maxWidth / viewport.width : 1.5);
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(scaled.width);
  canvas.height = Math.ceil(scaled.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  return canvas;
}

export async function renderPageToDataUrl(
  doc: PDFDocumentProxy,
  pageNumber: number,
  options: { maxWidth?: number; scale?: number; mime?: string; quality?: number } = {},
): Promise<string> {
  const canvas = await renderPageToCanvas(doc, pageNumber, options);
  return canvas.toDataURL(options.mime ?? "image/png", options.quality ?? 0.92);
}
