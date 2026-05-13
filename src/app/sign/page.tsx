"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2, PenLine, FileText } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { SignaturePad } from "@/components/SignaturePad";
import { PdfPagePicker } from "@/components/PdfPagePicker";
import { PdfPagePlacer, type PlacementRect } from "@/components/PdfPagePlacer";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";

type SigMode = "draw" | "type" | "upload";

export default function SignPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [data, setData] = React.useState<Uint8Array | null>(null);
  const [pages, setPages] = React.useState(0);
  const [selectedPage, setSelectedPage] = React.useState(1);
  const [rect, setRect] = React.useState<PlacementRect>({
    x: 60,
    y: 60,
    width: 180,
    height: 70,
  });
  const [mode, setMode] = React.useState<SigMode>("draw");
  const [drawData, setDrawData] = React.useState<string | null>(null);
  const [typedName, setTypedName] = React.useState("");
  const [uploadedData, setUploadedData] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function pickFile(files: File[]) {
    setError(null);
    const f = files[0];
    if (!f) return;
    try {
      const bytes = await readFileAsUint8Array(f);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setFile(f);
      setData(bytes);
      setPages(doc.getPageCount());
      setSelectedPage(1);
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF.");
    }
  }

  async function uploadSignatureImage(files: File[]) {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedData(reader.result as string);
    reader.readAsDataURL(f);
  }

  const signaturePreview =
    mode === "draw" ? drawData : mode === "upload" ? uploadedData : null;
  const signatureText = mode === "type" ? typedName : "";

  async function sign() {
    if (!file || !data) return;
    if (mode === "draw" && !drawData) {
      setError("Draw a signature first.");
      return;
    }
    if (mode === "type" && !typedName.trim()) {
      setError("Type your name first.");
      return;
    }
    if (mode === "upload" && !uploadedData) {
      setError("Upload a signature image first.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const out = await PDFDocument.load(data, { ignoreEncryption: true });
      const page = out.getPage(selectedPage - 1);
      const { height: pageHeight } = page.getSize();
      const flipY = pageHeight - rect.y - rect.height;

      if (mode === "type") {
        const font = await out.embedFont("Helvetica-Oblique" as any);
        page.drawText(typedName, {
          x: rect.x + 6,
          y: flipY + rect.height / 4,
          size: Math.max(10, rect.height * 0.6),
          font,
        });
      } else {
        const dataUrl = mode === "draw" ? drawData! : uploadedData!;
        const base64 = dataUrl.split(",")[1];
        const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const img =
          dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")
            ? await out.embedJpg(bin)
            : await out.embedPng(bin);
        page.drawImage(img, {
          x: rect.x,
          y: flipY,
          width: rect.width,
          height: rect.height,
        });
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${stripExt(file.name)}-signed.pdf`,
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to sign PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Sign PDF"
        description="Draw, type, or upload a signature and place it on any page."
        icon={PenLine}
        accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
      />

      {!file ? (
        <Dropzone onFiles={pickFile} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
          <div className="space-y-4">
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
                      setData(null);
                      setPages(0);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Choose another
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {pages} pages &middot; {formatBytes(file.size)}
                </p>
              </CardHeader>
              <CardBody>
                <PdfPagePlacer
                  data={data}
                  page={selectedPage}
                  imageDataUrl={signaturePreview}
                  text={signatureText}
                  rect={rect}
                  onRectChange={setRect}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardBody>
                <PdfPagePicker
                  data={data}
                  selected={selectedPage}
                  onSelect={setSelectedPage}
                />
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your signature</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(["draw", "type", "upload"] as SigMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`rounded-lg border px-2 py-2 font-medium capitalize ${
                        mode === m
                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {mode === "draw" && <SignaturePad onChange={setDrawData} />}
                {mode === "type" && (
                  <div className="space-y-2">
                    <Label htmlFor="typed">Type your name</Label>
                    <Input
                      id="typed"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="John Doe"
                      className="font-serif italic"
                      style={{ fontFamily: "serif", fontStyle: "italic" }}
                    />
                  </div>
                )}
                {mode === "upload" && (
                  <div className="space-y-2">
                    <Label>Upload image (PNG/JPG)</Label>
                    <Dropzone
                      accept="image/png,image/jpeg"
                      onFiles={uploadSignatureImage}
                      label="Drop an image"
                      hint="PNG or JPG"
                    />
                    {uploadedData && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadedData} alt="Signature" className="max-h-24 mx-auto" />
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}

            <Button onClick={sign} disabled={busy} className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {busy ? "Signing..." : "Download signed PDF"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
