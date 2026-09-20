import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
// Format conversion only: generated pixels are not enlarged, cropped or reconstructed.
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const records = [];
try {
  for (const id of ["cat-walk", "bag-open"]) {
    const path = `design/tabby/motion/${id}-master.png`;
    const source = await readFile(path);
    const result = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = image.naturalWidth;
      c.height = image.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i] === 0) transparent++;
      return {
        width: c.width,
        height: c.height,
        transparent,
        webp: c.toDataURL("image/webp", 0.9).split(",")[1],
      };
    }, source.toString("base64"));
    if (!result.transparent) throw new Error(`${id}: no real Alpha`);
    const bytes = Buffer.from(result.webp, "base64");
    const runtime = `assets/game/tabby/${id}.webp`;
    await writeFile(`public/${runtime}`, bytes);
    records.push({
      id,
      path: runtime,
      width: result.width,
      height: result.height,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      alpha: true,
      type: "image/webp",
      purpose:
        id === "cat-walk"
          ? "Four-frame tabby walk; 2x2 native cells; identity and locator not mirrored"
          : "Opened backpack counterpart",
      version: "tabby-motion-v1",
      review: "PENDING",
      source:
        "Built-in imagegen 2026-09-20; approved tabby/prop reference; model and seed not exposed; native-size Canvas WebP conversion at quality 0.9",
      master: {
        path,
        width: result.width,
        height: result.height,
        bytes: source.length,
        sha256: createHash("sha256").update(source).digest("hex"),
        alpha: true,
      },
      displayMax: id === "cat-walk" ? 220 : 150,
      motion:
        id === "cat-walk"
          ? {
              columns: 2,
              rows: 2,
              cellWidth: result.width / 2,
              cellHeight: result.height / 2,
              frames: 4,
              fps: 8,
              groundAnchor: [0.6, 0.93],
              headAnchor: [0.69, 0.27],
              mirror: false,
            }
          : { frames: 1, groundAnchor: [0.5, 0.84], mouthAnchor: [0.5, 0.36] },
      transparentPixels: result.transparent,
    });
  }
} finally {
  await browser.close();
}
await writeFile(
  "design/tabby/motion/metadata.json",
  JSON.stringify(records, null, 2) + "\n",
);
console.log(
  records.map(({ id, width, height, bytes, transparentPixels }) => ({
    id,
    width,
    height,
    bytes,
    transparentPixels,
  })),
);
