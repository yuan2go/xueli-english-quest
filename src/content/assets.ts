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
        if (data.byteLength !== asset.bytes || !new TextDecoder().decode(data).includes('<svg')) return asset.id;
        // Asset tests verify SHA-256 unconditionally. LAN HTTP lacks SubtleCrypto;
        // still allow that preview with a structural/size check and image fallback.
        if (!crypto.subtle) return '';
        const hash = [
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
        ]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hash !== asset.sha256)
          return asset.id;
      } catch {
        return asset.id;
      }
      return "";
    }),
  );
  return results.filter(Boolean);
}
