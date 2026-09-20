import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("same-condition local pointer and semantic action measurement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Performance.enable");
  await page.goto("/");
  await page.getByRole("button", { name: "开始冒险 →" }).click();
  await page.evaluate(() => {
    window.observedLongTasks = [];
    new PerformanceObserver((list) => {
      window.observedLongTasks.push(
        ...list.getEntries().map((e) => e.duration),
      );
    }).observe({ type: "longtask", buffered: false });
  });
  const before = (await cdp.send("Performance.getMetrics")).metrics;
  const start = Date.now();
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-entity="cat-companion"]').click();
    await page.getByRole("button", { name: "small", exact: true }).click();
    await page.locator('[data-node="step"]').click();
    await page.getByRole("button", { name: "原来大小", exact: true }).click();
    const a = await page.locator('[data-entity="basket-main"]').boundingBox(),
      b = await page.locator('[data-node="home"]').boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 35 });
    await page.mouse.up();
  }
  const after = (await cdp.send("Performance.getMetrics")).metrics;
  const metric = (name) =>
    after.find((m) => m.name === name).value -
    before.find((m) => m.name === name).value;
  const report = {
    condition:
      "Chromium headless macOS, 390x844, CPU throttle 4, 3 identical cycles: resize/move/blocked drag 35 pointer samples",
    phase: process.env.MEASURE_PHASE ?? "final",
    sourceSHA: process.env.MEASURE_SHA ?? "unrecorded",
    wallMs: Date.now() - start,
    layoutCount: metric("LayoutCount"),
    layoutDurationMs: metric("LayoutDuration") * 1000,
    scriptDurationMs: metric("ScriptDuration") * 1000,
    longTasks: await page.evaluate(() => window.observedLongTasks),
  };
  writeFileSync(
    `docs/evidence/gameplay-refoundation-06/performance-${report.phase}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await expect(page.locator('[data-entity="basket-main"]')).toHaveAttribute(
    "data-place",
    "node:garden",
  );
});
