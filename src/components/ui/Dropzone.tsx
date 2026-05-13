"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  label?: string;
  hint?: string;
};

export function Dropzone({
  accept = "application/pdf",
  multiple = false,
  onFiles,
  className,
  label = "Drop your PDF here",
  hint = "or click to browse",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [hover, setHover] = React.useState(false);

  function pickedFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        pickedFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer",
        hover
          ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
        <UploadCloud size={28} />
      </div>
      <div>
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          pickedFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
