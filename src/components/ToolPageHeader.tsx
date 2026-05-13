import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  accent?: string;
};

export function ToolPageHeader({
  title,
  description,
  icon: Icon,
  accent = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
}: Props) {
  return (
    <div className="mb-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} /> Back to tools
      </Link>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl ${accent}`}
        >
          <Icon size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
