import type { WordId } from "../domain/world.ts";
import type { ImageAsset, AudioAsset } from "./resource-contract.ts";

/** Production visual assets used by the real game flow. */
export const IMAGES: ImageAsset[] = [
  {
    id: "cat" as WordId,
    path: "assets/game/cat-idle.webp",
    bytes: 7936,
    sha256: "5938f8c9ecae5abf67bb2dc5c1514cd6125758678ae9092835e4ff7c5d709888",
    width: 144,
    height: 176,
    alpha: true,
    type: "image/webp",
    purpose: "Companion cat / neutral runtime pose",
    version: "paper-trail-final-art-v1",
    review: "APPROVED",
    source: "Reviewed GPT Image runtime crop imported in PR #2",
  },
  { id: "bag" as WordId, path: "assets/game/bag.webp", bytes: 4498, sha256: "cc0d80a3ae5688a6932e04529bcb71873f45ad66c22a99b404d167a41a1d9c68", width: 128, height: 144, alpha: true, type: "image/webp", purpose: "Interactive backpack", version: "paper-trail-final-art-v1", review: "APPROVED", source: "Reviewed GPT Image runtime crop imported in PR #2" },
  { id: "map" as WordId, path: "assets/game/map.webp", bytes: 5490, sha256: "3252894519cb71a7c68252517aee654be966a87bd5358ca7c845214f97d402be", width: 144, height: 120, alpha: true, type: "image/webp", purpose: "route-sheet in map state", version: "paper-trail-final-art-v1", review: "APPROVED", source: "Reviewed GPT Image runtime crop imported in PR #2" },
  { id: "mat" as WordId, path: "assets/game/mat.webp", bytes: 5434, sha256: "9d03d2b5cbcfd54ed2fd188e2bd988dfce93b14f1dd8dc360173c0f0fe6fe675", width: 160, height: 128, alpha: true, type: "image/webp", purpose: "route-sheet / picnic mat state", version: "paper-trail-final-art-v1", review: "APPROVED", source: "Reviewed GPT Image runtime crop imported in PR #2" },
  { id: "hat" as WordId, path: "assets/game/hat.webp", bytes: 3478, sha256: "3015979ee68d0b48d3b45323c32fb6c0925c4306176fe2cd628e9e1cf722bb1e", width: 144, height: 112, alpha: true, type: "image/webp", purpose: "Interactive wide-brim hat", version: "paper-trail-final-art-v1", review: "APPROVED", source: "Reviewed GPT Image runtime crop imported in PR #2" },
  { id: "cap" as WordId, path: "assets/game/cap.webp", bytes: 2654, sha256: "2baab6224f1b37892083d9b59c02109e8eb29dab3db9289f0400c266e8ecde3d", width: 160, height: 112, alpha: true, type: "image/webp", purpose: "Interactive baseball cap", version: "paper-trail-final-art-v1", review: "APPROVED", source: "Reviewed GPT Image runtime crop imported in PR #2" },
];

/** Visual layers that are not lexical assets and therefore do not enter learning evidence. */
export const RUNTIME_ART: Record<string, string> = {
  "cat-happy": "assets/game/cat-content.webp",
  "scene-act-1": "assets/game/final/scenes/scene-act1.webp",
  "scene-act-2": "assets/game/final/scenes/scene-act2.webp",
  "scene-act-3": "assets/game/final/scenes/scene-act1.webp",
};

export const AUDIO: AudioAsset[] = [
  "cat", "bag", "map", "mat", "hat", "cap",
  "Put the cap in the bag.", "Put the hat on the mat.", "Find the map.", "Put the cat on the mat.",
].map((text, i) => ({
  id: `voice-${i + 1}`, text, path: null as string | null, sha256: null as string | null,
  bytes: null as number | null, review: "PENDING", locale: "en-US", version: "speech-dev-v1",
  source: "Browser speech development substitute; no phonemes; reviewed recording missing",
  type: "audio/mpeg", durationMs: null,
}));
