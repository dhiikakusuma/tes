"use client";

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  const buf = await readFileAsArrayBuffer(file);
  return new Uint8Array(buf);
}
