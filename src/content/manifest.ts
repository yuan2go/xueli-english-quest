import type { WordId } from "../domain/world.ts";
import type { ImageAsset, AudioAsset } from "./resource-contract.ts";

/** Original temporary vectors. No image-generation service was invoked. */
export const IMAGES: ImageAsset[] = [
  [
    "cat",
    601,
    "77669336d363a14464dd80a4a8cab1703854824e1d0f4bedb9ca8a180e62c1a0",
  ],
  [
    "bag",
    444,
    "86de2b8a49b807464d8bdfc79559d02cc8a0951c0e31f753b78e8dd804686b58",
  ],
  [
    "map",
    497,
    "200443bec43a869d28d22e24e6c2be9be7ac88599268b822fca9b848c8b7c866",
  ],
  [
    "mat",
    472,
    "6e77def8a3e11e6f0c04b31ed90cc56f48a5df53587ed4da34d0a1ad1203ac48",
  ],
  [
    "hat",
    367,
    "f6b6fef0d1c96d049f7792db3eee8c0fb95ba98a61b4dd11ae470287c3685bed",
  ],
  [
    "cap",
    386,
    "3a266184405d59f0868b426304358abf838b5ac16cebce6e10630598e45c0f3c",
  ],
].map(([word, bytes, sha256]) => ({
  id: word as WordId,
  path: `art/${word}.svg`,
  bytes: bytes as number,
  sha256: sha256 as string,
  width: 136,
  height: 136,
  alpha: true,
  type: "image/svg+xml",
  purpose: `Story entity / ${word}`,
  version: "paper-placeholder-v1",
  review: "TEMPORARY_PENDING_ART_REVIEW",
  source: "Original SVG authored in this work package; not GPT Image output",
}));
export const AUDIO: AudioAsset[] = [
  "cat",
  "bag",
  "map",
  "mat",
  "hat",
  "cap",
  "Put the cap in the bag.",
  "Put the hat on the mat.",
  "Find the map.",
  "Put the cat on the mat.",
].map((text, i) => ({
  id: `voice-${i + 1}`,
  text,
  path: null as string | null,
  sha256: null as string | null,
  bytes: null as number | null,
  review: "PENDING",
  locale: "en-US",
  version: "speech-dev-v1",
  source:
    "Browser speech development substitute; no phonemes; reviewed recording missing",
  type: "audio/mpeg",
  durationMs: null,
}));
