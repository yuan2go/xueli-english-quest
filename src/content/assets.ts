import type { WordId } from "../domain/world.ts";
import { IMAGES } from "./manifest.ts";
export const assetPath = (word: WordId) =>
  `${import.meta.env.BASE_URL}${IMAGES.find((asset) => asset.id === word)!.path}`;
export async function checkAssets(): Promise<string[]> {
  const results = await Promise.all(
    IMAGES.map(async (asset) => {
      try {
        const response = await fetch(assetPath(asset.id), {
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) return asset.id;
        const data = await response.arrayBuffer();
        const hash = [
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
        ]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (data.byteLength !== asset.bytes || hash !== asset.sha256)
          return asset.id;
      } catch {
        return asset.id;
      }
      return "";
    }),
  );
  return results.filter(Boolean);
}
