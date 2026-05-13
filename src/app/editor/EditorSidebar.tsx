"use client";

import * as React from "react";
import { Type, Image as ImageIcon, PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignaturePad } from "@/components/SignaturePad";
import type { Overlay } from "./types";

type Props = {
  onAddText: () => void;
  onAddImage: (dataUrl: string, mime: "image/png" | "image/jpeg") => void;
  selectedOverlay: Overlay | null;
  onUpdate: (patch: Partial<Overlay>) => void;
};

export function EditorSidebar({
  onAddText,
  onAddImage,
  selectedOverlay,
  onUpdate,
}: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [showSig, setShowSig] = React.useState(false);

  function onPickImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
      onAddImage(url, mime);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add to page</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={onAddText}>
            <Type size={16} /> Add text
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon size={16} /> Add image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickImage(f);
              e.currentTarget.value = "";
            }}
          />
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowSig((v) => !v)}
          >
            <PenLine size={16} /> {showSig ? "Hide signature" : "Add signature"}
          </Button>
          {showSig && (
            <div className="pt-2">
              <SignaturePad
                onChange={(data) => {
                  if (data) {
                    onAddImage(data, "image/png");
                    setShowSig(false);
                  }
                }}
              />
              <p className="text-xs text-zinc-500">
                Draw above &mdash; it will be added to the page when you start drawing.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {selectedOverlay && selectedOverlay.type === "text" && (
        <Card>
          <CardHeader>
            <CardTitle>Text properties</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <Label htmlFor="ovl-text">Text</Label>
              <Input
                id="ovl-text"
                value={selectedOverlay.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="ovl-size">Size</Label>
                <Select
                  id="ovl-size"
                  value={selectedOverlay.fontSize}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) })}
                >
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="ovl-color">Color</Label>
                <input
                  id="ovl-color"
                  type="color"
                  value={selectedOverlay.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="mt-0 h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {selectedOverlay && selectedOverlay.type === "image" && (
        <Card>
          <CardHeader>
            <CardTitle>Image element</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Drag to move, drag the corner to resize. Click the trash icon to
              delete.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
