"use client";

import * as React from "react";
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
} from "pdf-lib";
import {
  FormInput,
  Loader2,
  Download,
  FileText,
  AlertCircle,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { downloadBlob, formatBytes, stripExt } from "@/lib/utils";
import { readFileAsUint8Array } from "@/lib/pdf/io";

type FieldKind = "text" | "checkbox" | "radio" | "dropdown" | "options" | "unknown";

type FieldInfo = {
  name: string;
  kind: FieldKind;
  options?: string[];
  current: string;
  checked: boolean;
  selectedOptions: string[];
};

export default function FillFormPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [data, setData] = React.useState<Uint8Array | null>(null);
  const [fields, setFields] = React.useState<FieldInfo[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [flatten, setFlatten] = React.useState(false);

  async function pickFile(files: File[]) {
    setError(null);
    const f = files[0];
    if (!f) return;
    try {
      const bytes = await readFileAsUint8Array(f);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      const all = form.getFields();
      const infos: FieldInfo[] = all.map((field) => {
        const name = field.getName();
        if (field instanceof PDFTextField) {
          return {
            name,
            kind: "text",
            current: field.getText() ?? "",
            checked: false,
            selectedOptions: [],
          };
        }
        if (field instanceof PDFCheckBox) {
          return {
            name,
            kind: "checkbox",
            current: "",
            checked: field.isChecked(),
            selectedOptions: [],
          };
        }
        if (field instanceof PDFRadioGroup) {
          return {
            name,
            kind: "radio",
            options: field.getOptions(),
            current: field.getSelected() ?? "",
            checked: false,
            selectedOptions: [],
          };
        }
        if (field instanceof PDFDropdown) {
          return {
            name,
            kind: "dropdown",
            options: field.getOptions(),
            current: field.getSelected()[0] ?? "",
            checked: false,
            selectedOptions: [],
          };
        }
        if (field instanceof PDFOptionList) {
          return {
            name,
            kind: "options",
            options: field.getOptions(),
            current: "",
            checked: false,
            selectedOptions: field.getSelected(),
          };
        }
        return {
          name,
          kind: "unknown",
          current: "",
          checked: false,
          selectedOptions: [],
        };
      });
      setFile(f);
      setData(bytes);
      setFields(infos);
      if (infos.length === 0) {
        setError("This PDF does not contain any fillable form fields.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF.");
    }
  }

  function updateField(idx: number, patch: Partial<FieldInfo>) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function save() {
    if (!file || !data) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(data, { ignoreEncryption: true });
      const form = doc.getForm();
      for (const f of fields) {
        try {
          if (f.kind === "text") {
            form.getTextField(f.name).setText(f.current);
          } else if (f.kind === "checkbox") {
            const box = form.getCheckBox(f.name);
            if (f.checked) box.check();
            else box.uncheck();
          } else if (f.kind === "radio") {
            if (f.current) form.getRadioGroup(f.name).select(f.current);
          } else if (f.kind === "dropdown") {
            if (f.current) form.getDropdown(f.name).select(f.current);
          } else if (f.kind === "options") {
            form.getOptionList(f.name).select(f.selectedOptions);
          }
        } catch (innerErr) {
          console.warn("field error", f.name, innerErr);
        }
      }
      if (flatten) form.flatten();
      const bytes = await doc.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${stripExt(file.name)}-filled.pdf`,
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save filled form.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Fill PDF Form"
        description="Fill out AcroForm fields and download the completed PDF."
        icon={FormInput}
        accent="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
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
                  setData(null);
                  setFields([]);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Choose another
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {fields.length} field{fields.length === 1 ? "" : "s"} &middot;{" "}
              {formatBytes(file.size)}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {fields.length === 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertCircle size={16} className="mt-0.5 flex-none" />
                No fillable fields were detected. Try the Editor tool to add text manually.
              </div>
            )}
            {fields.map((f, idx) => (
              <div key={`${f.name}-${idx}`} className="space-y-1.5">
                <Label>{f.name}</Label>
                {f.kind === "text" && (
                  <Input
                    value={f.current}
                    onChange={(e) => updateField(idx, { current: e.target.value })}
                  />
                )}
                {f.kind === "checkbox" && (
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={f.checked}
                      onChange={(e) => updateField(idx, { checked: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 text-rose-600"
                    />
                    Checked
                  </label>
                )}
                {f.kind === "radio" && (
                  <div className="flex flex-wrap gap-2">
                    {f.options?.map((opt) => (
                      <label
                        key={opt}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                          f.current === opt
                            ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : "border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={f.name}
                          value={opt}
                          checked={f.current === opt}
                          onChange={() => updateField(idx, { current: opt })}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {f.kind === "dropdown" && (
                  <Select
                    value={f.current}
                    onChange={(e) => updateField(idx, { current: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                )}
                {f.kind === "options" && (
                  <select
                    multiple
                    value={f.selectedOptions}
                    onChange={(e) =>
                      updateField(idx, {
                        selectedOptions: Array.from(e.target.selectedOptions).map(
                          (o) => o.value,
                        ),
                      })
                    }
                    className="min-h-[6rem] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
                {f.kind === "unknown" && (
                  <p className="text-xs text-zinc-500">Unsupported field type</p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {file && (
        <div className="mt-6 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={flatten}
              onChange={(e) => setFlatten(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-rose-600"
            />
            Flatten form (lock fields, can no longer be edited)
          </label>
          <Button onClick={save} disabled={busy || fields.length === 0}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {busy ? "Saving..." : "Download filled PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
