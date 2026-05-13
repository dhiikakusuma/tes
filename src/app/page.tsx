import Link from "next/link";
import {
  Combine,
  Scissors,
  PenLine,
  FormInput,
  Archive,
  Image as ImageIcon,
  FileType2,
  Sheet,
  LayoutGrid,
  ShieldCheck,
  Zap,
  EyeOff,
} from "lucide-react";

type Tool = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  iconColor: string;
};

const tools: Tool[] = [
  {
    href: "/editor",
    title: "Editor",
    description:
      "Reorder, rotate, and delete pages. Add text, images, and signatures.",
    icon: LayoutGrid,
    color: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    href: "/merge",
    title: "Merge PDF",
    description: "Combine multiple PDF files into a single document.",
    icon: Combine,
    color: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/split",
    title: "Split PDF",
    description:
      "Extract specific pages or split a PDF into individual files.",
    icon: Scissors,
    color: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/sign",
    title: "Sign PDF",
    description: "Draw, type, or upload a signature and place it on any page.",
    icon: PenLine,
    color: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/fill-form",
    title: "Fill PDF Form",
    description: "Fill out PDF AcroForm fields and download the completed file.",
    icon: FormInput,
    color: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/compress",
    title: "Compress PDF",
    description: "Reduce PDF file size with smart re-rendering of pages.",
    icon: Archive,
    color: "bg-indigo-50 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    href: "/convert/image",
    title: "PDF → Image",
    description: "Export every page as PNG or JPG, packaged as a ZIP.",
    icon: ImageIcon,
    color: "bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    href: "/convert/word",
    title: "PDF → Word",
    description: "Extract text into an editable .docx document.",
    icon: FileType2,
    color: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    href: "/convert/excel",
    title: "PDF → Excel",
    description: "Pull every line of text into an .xlsx spreadsheet per page.",
    icon: Sheet,
    color: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          <ShieldCheck size={14} /> 100% private &mdash; runs in your browser
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Every PDF tool you need, <span className="text-rose-600">in one place</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
          Edit, merge, split, sign, fill, compress, and convert PDF files
          without uploading them anywhere. Everything happens locally in your
          browser.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-rose-800"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tool.color}`}
            >
              <span className={tool.iconColor}>
                <tool.icon size={24} />
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {tool.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Feature
          icon={EyeOff}
          title="Private by design"
          body="Files are processed locally in your browser. Nothing is uploaded to any server."
        />
        <Feature
          icon={Zap}
          title="Fast & free"
          body="No sign-ups, no watermarks, no waiting in upload queues."
        />
        <Feature
          icon={LayoutGrid}
          title="All-in-one"
          body="9 powerful tools cover the full PDF editing workflow."
        />
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon size={20} />
      </div>
      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h4>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}
