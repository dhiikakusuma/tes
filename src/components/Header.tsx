import Link from "next/link";
import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
            <FileText size={20} />
          </span>
          <span className="text-lg">PDF Studio</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/editor"
            className="rounded-full px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Editor
          </Link>
          <Link
            href="/merge"
            className="rounded-full px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Merge
          </Link>
          <Link
            href="/split"
            className="rounded-full px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Split
          </Link>
          <Link
            href="/sign"
            className="rounded-full px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Sign
          </Link>
        </nav>
      </div>
    </header>
  );
}
