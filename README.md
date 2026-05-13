# PDF Studio

A complete in-browser PDF toolkit. Edit, merge, split, sign, fill, compress, and
convert PDF files **without uploading them anywhere** — every byte stays on
your device.

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**,
[`pdf-lib`](https://pdf-lib.js.org/) for manipulation, and
[`pdfjs-dist`](https://mozilla.github.io/pdf.js/) for rendering.

## Features

| Tool | What it does |
| ---- | ------------ |
| **Editor** | Reorder, rotate, delete pages. Add text, images, and signatures with drag-and-resize overlays. |
| **Merge** | Combine many PDFs into one, with drag-to-reorder. |
| **Split** | Extract a page range as a single PDF, or split into one-PDF-per-page (zipped). |
| **Sign** | Draw, type, or upload a signature. Place and resize it on any page. |
| **Fill Form** | Fill out AcroForm text fields, checkboxes, radio groups, dropdowns, and lists. Optionally flatten. |
| **Compress** | Re-render pages as JPEG at a chosen quality to shrink large PDFs. |
| **PDF → Image** | Export every page as PNG or JPG, packaged in a ZIP. |
| **PDF → Word** | Extract text from each page into an editable `.docx`. |
| **PDF → Excel** | Extract text into one worksheet per page (`.xlsx`). |

## Privacy

The app is a pure client-side bundle. Files are processed locally in the
browser using `pdf-lib` and `pdfjs-dist`. Nothing is sent to a server.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (next lint)
- `npm run typecheck` — `tsc --noEmit`
