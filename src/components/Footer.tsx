import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-6 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          PDF Studio &mdash; an all-in-one browser PDF editor.
        </p>
        <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck size={14} className="text-emerald-600" />
          100% private &mdash; files never leave your browser.
        </p>
      </div>
    </footer>
  );
}
