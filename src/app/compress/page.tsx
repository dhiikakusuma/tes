"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { Archive, Loader2, Download, FileText } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";

type Level = "low" | "medium" | "high";

const presets: Record<
  Level,
  { quality: number; maxWidth: number; label: string; hint: string }
> = {
  low: {
    quality: 0.85,
    maxWidth: 2000,
    label: "Less compression",
    hint: "Best quality, larger file",
  },
  medium: {
    quality: 0.7,
    maxWidth: 1400,
    label: "Recommended",
    hint: "Balanced quality & size",
  },
  high: {
    quality: 0.5,
    maxWidth: 900,
    label: "More compression",
    hint: "Smallest file, lower quality",
  },
};

export default function CompressPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [level, setLevel] = React.useState<Level>("medium");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{
    originalSize: number;
    newSize: number;
    blob: Blob;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function pickFile(files: File[]) {
    setError(null);
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function compress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const preset = presets[level];
      const bytes = await readFileAsUint8Array(file);
      const pdfjsDoc = await loadPdfDocument(bytes);
      const out = await PDFDocument.create();

      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const view = page.getViewport({ scale: 1 });
        const scale = Math.min(1, preset.maxWidth / view.width);
        const canvas = await renderPageToCanvas(pdfjsDoc, i, { scale });

        const jpegBlob: Blob = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            preset.quality,
          ),
        );
        const jpegBuf = new Uint8Array(await jpegBlob.arrayBuffer());
        const img = await out.embedJpg(jpegBuf);
        const newPage = out.addPage([view.width, view.height]);
        newPage.drawImage(img, {
          x: 0,
          y: 0,
          width: view.width,
          height: view.height,
        });
        setProgress(i / pdfjsDoc.numPages);
      }

      pdfjsDoc.destroy();
      const outBytes = await out.save({ useObjectStreams: true });
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      setResult({ originalSize: file.size, newSize: blob.size, blob });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to compress.");
    } finally {
      setBusy(false);
    }
  }

  const reduction = result
    ? Math.max(0, 1 - result.newSize / result.originalSize)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Compress PDF"
        description="Re-render pages at a lower image quality to shrink the PDF."
        icon={Archive}
        accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
      />

      {!file ? (
        <Dropzone onFiles={pickFile} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} className="text-rose-600" /> {file.name}
                </span>
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Choose another
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {formatBytes(file.size)}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Label>Compression level</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(Object.keys(presets) as Level[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      level === l
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {presets[l].label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {presets[l].hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {busy && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Compressing... {Math.round(progress * 100)}%
                </p>
              </div>
            )}

            {result && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="font-semibold">
                  Saved {Math.round(reduction * 100)}% &middot;{" "}
                  {formatBytes(result.originalSize)} → {formatBytes(result.newSize)}
                </p>
                {reduction <= 0 && (
                  <p className="mt-1 text-xs">
                    This PDF was already heavily compressed. Try a higher
                    compression level.
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {file && (
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={compress} disabled={busy} variant={result ? "outline" : "primary"}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? "Compressing..." : result ? "Compress again" : "Compress PDF"}
          </Button>
          {result && (
            <Button
              onClick={() =>
                downloadBlob(result.blob, `${stripExt(file.name)}-compressed.pdf`)
              }
            >
              <Download size={16} /> Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
