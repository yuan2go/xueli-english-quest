import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { IMAGES, AUDIO } from "../src/content/manifest.ts";
import { STEPS } from "../src/content/story.ts";
test("all referenced images exist, match manifest dimensions/bytes/hash, audio gaps stay explicit", () => {
  for (const asset of IMAGES) {
    assert.match(asset.path, /^art\/[a-z]+\.svg$/);
    const data = readFileSync(
      new URL(`../public/${asset.path}`, import.meta.url),
    );
    assert.equal(data.byteLength, asset.bytes);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    assert.match(data.toString(), /viewBox="0 0 136 136"/);
    assert.doesNotMatch(data.toString(), /<text|<script|<image/);
  }
  for (const step of STEPS) {
    assert.ok(IMAGES.some((a) => a.id === step.word));
    assert.ok(AUDIO.some((a) => a.text === step.prompt));
  }
  assert.ok(AUDIO.every((a) => a.path === null && a.review === "PENDING"));
});
