"use client";

import * as React from "react";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import {
  Download,
  Loader2,
  LayoutGrid,
  FileText,
  AlertCircle,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";
import {
  loadPdfDocument,
  renderPageToDataUrl,
} from "@/lib/pdf/pdfjs";
import { PageThumbStrip } from "./PageThumbStrip";
import { PageCanvas } from "./PageCanvas";
import { EditorSidebar } from "./EditorSidebar";
import type { EditorPage, Overlay } from "./types";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m) return [0, 0, 0];
  const [r, g, b] = m.map((c) => parseInt(c, 16) / 255);
  return [r, g, b];
}

export default function EditorPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [sourceBytes, setSourceBytes] = React.useState<Uint8Array | null>(null);
  const [pages, setPages] = React.useState<EditorPage[]>([]);
  const [selectedPageId, setSelectedPageId] = React.useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadProgress, setLoadProgress] = React.useState(0);

  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null;
  const selectedOverlay = selectedPage
    ? selectedPage.overlays.find((o) => o.id === selectedOverlayId) ?? null
    : null;

  async function pickFile(files: File[]) {
    setError(null);
    const f = files[0];
    if (!f) return;
    setLoading(true);
    setLoadProgress(0);
    try {
      const bytes = await readFileAsUint8Array(f);
      const pdfDoc = await loadPdfDocument(bytes);
      const next: EditorPage[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const view = page.getViewport({ scale: 1 });
        const thumb = await renderPageToDataUrl(pdfDoc, i, { maxWidth: 800 });
        next.push({
          id: uid(),
          sourcePageIndex: i - 1,
          rotation: 0,
          thumbDataUrl: thumb,
          width: view.width,
          height: view.height,
          overlays: [],
        });
        setLoadProgress(i / pdfDoc.numPages);
      }
      pdfDoc.destroy();
      setFile(f);
      setSourceBytes(bytes);
      setPages(next);
      setSelectedPageId(next[0]?.id ?? null);
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF.");
    } finally {
      setLoading(false);
    }
  }

  function rotatePage(id: string, delta: 90 | -90) {
    setPages((prev) =>
      prev.map((p) =>
        p.id !== id
          ? p
          : { ...p, rotation: (((p.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270) },
      ),
    );
  }

  function deletePage(id: string) {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedPageId === id) setSelectedPageId(next[0]?.id ?? null);
      return next;
    });
  }

  function updateOverlay(id: string, patch: Partial<Overlay>) {
    setPages((prev) =>
      prev.map((p) =>
        p.id !== selectedPageId
          ? p
          : {
              ...p,
              overlays: p.overlays.map((o) =>
                o.id !== id ? o : ({ ...o, ...patch } as Overlay),
              ),
            },
      ),
    );
  }

  function deleteOverlay(id: string) {
    setPages((prev) =>
      prev.map((p) =>
        p.id !== selectedPageId
          ? p
          : { ...p, overlays: p.overlays.filter((o) => o.id !== id) },
      ),
    );
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  }

  function addText() {
    if (!selectedPage) return;
    const overlay: Overlay = {
      id: uid(),
      type: "text",
      rect: {
        x: selectedPage.width * 0.15,
        y: selectedPage.height * 0.15,
        width: selectedPage.width * 0.35,
        height: 40,
      },
      text: "New text",
      fontSize: 18,
      color: "#111111",
    };
    setPages((prev) =>
      prev.map((p) =>
        p.id !== selectedPage.id ? p : { ...p, overlays: [...p.overlays, overlay] },
      ),
    );
    setSelectedOverlayId(overlay.id);
  }

  function addImage(dataUrl: string, mime: "image/png" | "image/jpeg") {
    if (!selectedPage) return;
    const img = new Image();
    img.onload = () => {
      const aspect = img.height / img.width || 0.4;
      const width = Math.min(selectedPage.width * 0.4, 240);
      const overlay: Overlay = {
        id: uid(),
        type: "image",
        rect: {
          x: selectedPage.width * 0.2,
          y: selectedPage.height * 0.2,
          width,
          height: width * aspect,
        },
        dataUrl,
        mime,
      };
      setPages((prev) =>
        prev.map((p) =>
          p.id !== selectedPage.id ? p : { ...p, overlays: [...p.overlays, overlay] },
        ),
      );
      setSelectedOverlayId(overlay.id);
    };
    img.src = dataUrl;
  }

  async function save() {
    if (!file || !sourceBytes) return;
    if (pages.length === 0) {
      setError("Add at least one page before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const font = await out.embedFont("Helvetica" as any);
      const copied = await out.copyPages(
        src,
        pages.map((p) => p.sourcePageIndex),
      );
      for (let i = 0; i < pages.length; i++) {
        const conf = pages[i];
        const newPage = copied[i];
        newPage.setRotation(degrees(conf.rotation));
        out.addPage(newPage);
        const { width: pw, height: ph } = newPage.getSize();
        // Editor coordinates were captured at original (unrotated) page size.
        // Overlays are drawn on the underlying page using its untransformed
        // coordinate system, so we ignore rotation here — rotation applies as a
        // page-level transform on render and the overlays will appear correctly
        // when drawn in document order on the unrotated content stream.
        for (const ov of conf.overlays) {
          const x = ov.rect.x;
          const y = ph - ov.rect.y - ov.rect.height;
          if (ov.type === "text") {
            const [r, g, b] = hexToRgb(ov.color);
            newPage.drawText(ov.text, {
              x,
              y: y + ov.rect.height * 0.2,
              size: ov.fontSize,
              font,
              color: rgb(r, g, b),
              maxWidth: ov.rect.width,
            });
          } else {
            const base64 = ov.dataUrl.split(",")[1];
            const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const img =
              ov.mime === "image/jpeg"
                ? await out.embedJpg(bin)
                : await out.embedPng(bin);
            newPage.drawImage(img, {
              x,
              y,
              width: ov.rect.width,
              height: ov.rect.height,
            });
          }
        }
        // Silence unused variable warning for pw
        void pw;
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${stripExt(file.name)}-edited.pdf`,
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="PDF Editor"
        description="Reorder, rotate, and delete pages. Add text, images, and signatures."
        icon={LayoutGrid}
      />

      {!file ? (
        <div className="mx-auto max-w-2xl">
          <Dropzone onFiles={pickFile} />
          {loading && (
            <p className="mt-3 text-center text-sm text-zinc-500">
              Loading PDF... {Math.round(loadProgress * 100)}%
            </p>
          )}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} className="text-rose-600" /> {file.name}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setSourceBytes(null);
                      setPages([]);
                      setSelectedPageId(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Choose another
                  </button>
                  <Button onClick={save} disabled={busy || pages.length === 0}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {busy ? "Saving..." : "Download edited PDF"}
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {pages.length} page{pages.length === 1 ? "" : "s"} &middot;{" "}
                {formatBytes(file.size)}
              </p>
            </CardHeader>
          </Card>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={16} className="mt-0.5 flex-none" />
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr,320px]">
            <Card className="lg:sticky lg:top-20 lg:max-h-[80vh] lg:overflow-y-auto">
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardBody>
                <PageThumbStrip
                  pages={pages}
                  selectedId={selectedPageId}
                  onSelect={(id) => {
                    setSelectedPageId(id);
                    setSelectedOverlayId(null);
                  }}
                  onReorder={setPages}
                  onRotate={rotatePage}
                  onDelete={deletePage}
                />
              </CardBody>
            </Card>

            <div>
              {selectedPage ? (
                <PageCanvas
                  page={selectedPage}
                  selectedOverlayId={selectedOverlayId}
                  onSelectOverlay={setSelectedOverlayId}
                  onOverlayChange={updateOverlay}
                  onDeleteOverlay={deleteOverlay}
                />
              ) : (
                <Card>
                  <CardBody className="text-center text-sm text-zinc-500">
                    Select a page from the left to edit it.
                  </CardBody>
                </Card>
              )}
            </div>

            <EditorSidebar
              onAddText={addText}
              onAddImage={addImage}
              selectedOverlay={selectedOverlay}
              onUpdate={(patch) =>
                selectedOverlayId && updateOverlay(selectedOverlayId, patch)
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
