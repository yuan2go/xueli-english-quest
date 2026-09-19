import type { AudioAsset } from "./resource-contract.ts";
export { VISUAL_ASSETS as IMAGES } from "./visual-assets.ts";

export const AUDIO: AudioAsset[] = [
  "cat", "bag", "map", "mat", "hat", "cap",
  "Put the cap in the bag.", "Put the hat on the mat.", "Find the map.", "Put the cat on the mat.",
].map((text, i) => ({
  id: `voice-${i + 1}`, text, path: null as string | null, sha256: null as string | null,
  bytes: null as number | null, review: "PENDING", locale: "en-US", version: "speech-dev-v1",
  source: "Browser speech development substitute; no phonemes; reviewed recording missing",
  type: "audio/mpeg", durationMs: null,
}));
