"use client";

import * as React from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { Scissors, Loader2, Download, FileText } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { downloadBlob, formatBytes, parsePageRanges, stripExt } from "@/lib/utils";
import { readFileAsArrayBuffer } from "@/lib/pdf/io";

type Mode = "extract" | "individual";

export default function SplitPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [mode, setMode] = React.useState<Mode>("extract");
  const [ranges, setRanges] = React.useState("1");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function pickFile(files: File[]) {
    setError(null);
    const f = files[0];
    if (!f) return;
    try {
      const buf = await readFileAsArrayBuffer(f);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setFile(f);
      setTotalPages(doc.getPageCount());
      setRanges(`1-${doc.getPageCount()}`);
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF. It may be corrupted or password-protected.");
    }
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });

      if (mode === "extract") {
        const pages = parsePageRanges(ranges, src.getPageCount());
        if (pages.length === 0) {
          setError("No valid pages selected.");
          setBusy(false);
          return;
        }
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, pages.map((p) => p - 1));
        copied.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${stripExt(file.name)}-extracted.pdf`);
      } else {
        const zip = new JSZip();
        for (let i = 0; i < src.getPageCount(); i++) {
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          const bytes = await out.save();
          zip.file(`${stripExt(file.name)}-page-${String(i + 1).padStart(3, "0")}.pdf`, bytes);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${stripExt(file.name)}-pages.zip`);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to split PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Split PDF"
        description="Extract specific pages or split a PDF into individual files."
        icon={Scissors}
        accent="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
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
                  setTotalPages(0);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Choose another
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {totalPages} pages &middot; {formatBytes(file.size)}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("extract")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "extract"
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Extract pages</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Pick a range like 1-3, 5, 8-10 and merge them into one PDF.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode("individual")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === "individual"
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">One file per page</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Save every page as its own PDF, downloaded together in a ZIP.
                </p>
              </button>
            </div>

            {mode === "extract" && (
              <div className="space-y-1.5">
                <Label htmlFor="ranges">Pages to extract</Label>
                <Input
                  id="ranges"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="1-3, 5, 8-10"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Use commas to separate ranges and single pages. Max page: {totalPages}.
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
            {busy ? "Splitting..." : mode === "extract" ? "Extract & download" : "Split into ZIP"}
          </Button>
        </div>
      )}
    </div>
  );
}
