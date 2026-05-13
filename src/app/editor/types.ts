export type OverlayType = "text" | "image";

export type OverlayRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Overlay =
  | {
      id: string;
      type: "text";
      rect: OverlayRect;
      text: string;
      fontSize: number;
      color: string;
    }
  | {
      id: string;
      type: "image";
      rect: OverlayRect;
      dataUrl: string;
      mime: "image/png" | "image/jpeg";
    };

export type EditorPage = {
  id: string;
  sourcePageIndex: number;
  rotation: 0 | 90 | 180 | 270;
  thumbDataUrl: string;
  width: number;
  height: number;
  overlays: Overlay[];
};
