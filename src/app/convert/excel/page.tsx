"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Sheet, Loader2, Download, FileText } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";
import { extractTextByPage } from "@/lib/pdf/text";

export default function ConvertExcelPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const bytes = await readFileAsUint8Array(file);
      const pages = await extractTextByPage(bytes, (n, total) =>
        setProgress(n / total),
      );
      const wb = XLSX.utils.book_new();
      for (const pg of pages) {
        const rows: string[][] = pg.lines.length
          ? pg.lines.map((l) => l.split(/\s{2,}|\t/))
          : [["(no extractable text)"]];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, `Page ${pg.page}`.slice(0, 31));
      }
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `${stripExt(file.name)}.xlsx`);
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
        title="PDF → Excel"
        description="Pull text from each page into rows on its own worksheet."
        icon={Sheet}
        accent="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
      />

      {!file ? (
        <Dropzone onFiles={(f) => setFile(f[0] ?? null)} />
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
          <CardBody className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Each PDF page becomes one worksheet. Lines are split into columns
              by double-spaces (2+ spaces) when present, otherwise each line is
              one cell.
            </p>
            {busy && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Extracting... {Math.round(progress * 100)}%
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
            {busy ? "Converting..." : "Convert & download .xlsx"}
          </Button>
        </div>
      )}
    </div>
  );
}
