import type { WordId } from "../domain/world.ts";
import { AUDIO, IMAGES } from "./manifest.ts";
import { matchesFormat, validateResources } from "./resource-contract.ts";

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export function assetPathById(id: string): string {
  const lexical = IMAGES.find((asset) => asset.id === id);
  const path = lexical?.path;
  if (!path) throw new Error(`Unknown visual asset ${id}`);
  return withBase(path);
}

export const assetPath = (word: WordId) => assetPathById(word);

function dimensions(
  data: ArrayBuffer,
  type: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([data], { type }));
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      image.onload = null;
      image.onerror = null;
      if (ok)
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      else reject(new Error("decode"));
    };
    const timer = setTimeout(() => finish(false), 3000);
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = url;
  });
}

export async function checkAssets(
  ids = IMAGES.map((a) => a.id),
  signal?: AbortSignal,
  reload = false,
): Promise<string[]> {
  validateResources(IMAGES, AUDIO);
  const results = await Promise.all(
    IMAGES.filter((a) => ids.includes(a.id)).map(async (asset) => {
      try {
        const response = await fetch(withBase(asset.path), {
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
            : AbortSignal.timeout(8000),
          cache: reload ? "reload" : "default",
        });
        if (!response.ok) return asset.id;
        const data = await response.arrayBuffer();
        if (
          data.byteLength !== asset.bytes ||
          !matchesFormat(new Uint8Array(data), asset.type)
        )
          return asset.id;
        const size = await dimensions(data, asset.type);
        if (size.width !== asset.width || size.height !== asset.height)
          return asset.id;
        if (!crypto.subtle) return "";
        const hash = [
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
        ]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hash !== asset.sha256) return asset.id;
      } catch {
        return asset.id;
      }
      return "";
    }),
  );
  return results.filter(Boolean);
}
