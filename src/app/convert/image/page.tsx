"use client";

import * as React from "react";
import JSZip from "jszip";
import {
  Image as ImageIcon,
  Loader2,
  Download,
  FileText,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label, Select } from "@/components/ui/Input";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";

type Format = "png" | "jpeg";
type Quality = "standard" | "high";

export default function ConvertImagePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<Format>("png");
  const [quality, setQuality] = React.useState<Quality>("standard");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  function pickFile(files: File[]) {
    setError(null);
    setFile(files[0] ?? null);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const scale = quality === "high" ? 2.5 : 1.5;
      const bytes = await readFileAsUint8Array(file);
      const doc = await loadPdfDocument(bytes);
      const zip = new JSZip();
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, { scale });
        const blob: Blob = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            format === "png" ? "image/png" : "image/jpeg",
            format === "jpeg" ? 0.92 : undefined,
          ),
        );
        const buf = await blob.arrayBuffer();
        zip.file(
          `${stripExt(file.name)}-page-${String(i).padStart(3, "0")}.${format}`,
          buf,
        );
        setProgress(i / doc.numPages);
      }
      doc.destroy();
      const out = await zip.generateAsync({ type: "blob" });
      downloadBlob(out, `${stripExt(file.name)}-images.zip`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to convert.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="PDF → Image"
        description="Render every page as a PNG or JPG, packaged as a ZIP archive."
        icon={ImageIcon}
        accent="bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400"
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
                onClick={() => setFile(null)}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Format</Label>
                <Select
                  className="mt-1"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as Format)}
                >
                  <option value="png">PNG (lossless)</option>
                  <option value="jpeg">JPG (smaller files)</option>
                </Select>
              </div>
              <div>
                <Label>Quality</Label>
                <Select
                  className="mt-1"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as Quality)}
                >
                  <option value="standard">Standard (1.5×)</option>
                  <option value="high">High (2.5×)</option>
                </Select>
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
                  Rendering... {Math.round(progress * 100)}%
                </p>
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
        <div className="mt-6 flex justify-end">
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {busy ? "Converting..." : "Convert & download ZIP"}
          </Button>
        </div>
      )}
    </div>
  );
}
