import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

export function parsePageRanges(input: string, total: number): number[] {
  const result = new Set<number>();
  const trimmed = input.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\s*,\s*/);
  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [aStr, bStr] = part.split("-");
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (isNaN(a) || isNaN(b)) continue;
      const lo = Math.max(1, Math.min(a, b));
      const hi = Math.min(total, Math.max(a, b));
      for (let i = lo; i <= hi; i++) result.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) result.add(n);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
