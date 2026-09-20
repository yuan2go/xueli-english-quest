import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { IMAGES, AUDIO } from "../src/content/manifest.ts";
import { STEPS } from "../src/content/story.ts";
import {
  validateResources,
  matchesFormat,
} from "../src/content/resource-contract.ts";
test("all referenced images exist, match manifest dimensions/bytes/hash, audio gaps stay explicit", () => {
  for (const asset of IMAGES) {
    const data = readFileSync(
      new URL(`../public/${asset.path}`, import.meta.url),
    );
    assert.equal(data.byteLength, asset.bytes);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    assert.ok(matchesFormat(data, asset.type));
    if (asset.type === "image/svg+xml")
      assert.doesNotMatch(data.toString(), /<text|<script|<image/);
  }
  for (const step of STEPS) {
    assert.ok(IMAGES.some((a) => a.id === step.word));
    assert.ok(AUDIO.some((a) => a.text === step.prompt));
  }
  validateResources(IMAGES, AUDIO);
  for (const asset of AUDIO.filter((a) => a.path)) {
    const data = readFileSync(
      new URL(`../public/${asset.path}`, import.meta.url),
    );
    assert.equal(data.byteLength, asset.bytes);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    assert.ok(matchesFormat(data, asset.type));
  }
});
test("candidate release rejects missing/unreviewed resources, supports typed raster and recording metadata", () => {
  assert.throws(() => validateResources(IMAGES, AUDIO, "release"));
  const image = {
    ...IMAGES[0],
    type: "image/png",
    path: "art/cat.png",
    review: "APPROVED",
  };
  const audio = {
    ...AUDIO[0],
    path: "audio/cat.mp3",
    bytes: 100,
    sha256: "a".repeat(64),
    durationMs: 900,
    review: "APPROVED",
  };
  validateResources([image], [audio], "release");
  validateResources(
    [{ ...image, type: "image/webp", path: "art/cat.webp" }],
    [audio],
  );
  assert.throws(() =>
    validateResources([{ ...image, path: "../cat.png" }], [audio]),
  );
  assert.throws(() =>
    validateResources([image], [{ ...audio, durationMs: null }]),
  );
  assert.equal(
    matchesFormat(new TextEncoder().encode("<html>error</html>"), "image/png"),
    false,
  );
  assert.equal(
    matchesFormat(new TextEncoder().encode("RIFF1234WEBP"), "image/webp"),
    true,
  );
});

test("visual registry native masters retain bytes, dimensions and hashes independently of save content", () => {
  for (const asset of IMAGES) {
    if (!asset.master) continue;
    const data = readFileSync(new URL(`../${asset.master.path}`, import.meta.url));
    assert.equal(data.byteLength, asset.master.bytes);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.master.sha256);
    if (asset.master.path.endsWith('.svg')) {
      assert.ok(matchesFormat(data, "image/svg+xml"));
      assert.equal(Number(/width="(\d+)"/.exec(data.toString())[1]), asset.master.width);
      assert.equal(Number(/height="(\d+)"/.exec(data.toString())[1]), asset.master.height);
      assert.equal(asset.master.alpha, true);
      assert.doesNotMatch(data.toString(), /<image|<script|<foreignObject/i);
    } else {
      assert.ok(matchesFormat(data, "image/png"));
      assert.equal(data.readUInt32BE(16), asset.master.width);
      assert.equal(data.readUInt32BE(20), asset.master.height);
    }
    assert.ok(asset.master.width >= asset.width && asset.master.height >= asset.height);
  }
});
