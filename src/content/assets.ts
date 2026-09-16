import type { WordId } from "../domain/world.ts";
import { IMAGES } from "./manifest.ts";
import { matchesFormat, validateResources } from "./resource-contract.ts";
import { AUDIO } from "./manifest.ts";
export const assetPath = (word: WordId) =>
  `${import.meta.env.BASE_URL}${IMAGES.find((asset) => asset.id === word)!.path}`;
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
export async function checkAssets(): Promise<string[]> {
  validateResources(IMAGES, AUDIO);
  const results = await Promise.all(
    IMAGES.map(async (asset) => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}${asset.path}`,
          {
            signal: AbortSignal.timeout(4000),
          },
        );
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
        // Asset tests verify SHA-256 unconditionally. LAN HTTP lacks SubtleCrypto;
        // still allow that preview with a structural/size check and image fallback.
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
