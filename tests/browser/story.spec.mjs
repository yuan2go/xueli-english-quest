import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const evidence = "docs/evidence/playable-story";
const KEY = "wordspell.story.v1";
const button = (p, name) => p.getByRole("button", { name, exact: true });
async function start(p) {
  await p.goto("/");
  await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "开始冒险" }).click();
  await button(p, "我来试试").click();
}
async function at(p, id) {
  await expect(p.locator(".game-layout")).toHaveAttribute("data-step", id);
}
async function spell(p, word) {
  for (const c of word) await button(p, `字母 ${c}`).tap();
  await p.getByRole("button", { name: "施法" }).tap();
}
async function transform(p, from, to) {
  await button(p, `第3格 ${from}`).tap();
  await button(p, `字母 ${to}`).tap();
  await p.getByRole("button", { name: "施法" }).tap();
}
async function help(p) {
  await button(p, "文字辅助").click();
}
async function reload(p, id) {
  await p.reload();
  await p.getByRole("button", { name: "继续故事" }).click();
  await at(p, id);
}
async function noOverflow(p) {
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
}
async function screenshot(p, name) {
  await p.evaluate(async () => {
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {})),
    );
  });
  await p.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}
async function touchDrag(p, source, target, cancel = false, multi = false) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const a = await source.boundingBox(),
    b = await target.boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const point = (x, y, id = 1) => ({
    x,
    y,
    id,
    radiusX: 3,
    radiusY: 3,
    force: 1,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(a.x + a.width / 2, a.y + a.height / 2)],
  });
  if (multi) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        point(a.x + a.width / 2, a.y + a.height / 2),
        point(10, 10, 2),
      ],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      point(b.x + b.width / 2, b.y + b.height / 2),
      ...(multi ? [point(10, 10, 2)] : []),
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
}
test('LAN HTTP capability fallback starts without randomUUID or SubtleCrypto', async ({ browser }) => {
  const c = await browser.newContext({ hasTouch: true });
  await c.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined });
    Object.defineProperty(crypto, 'subtle', { value: undefined });
  });
  const p = await c.newPage(); await start(p); await spell(p, 'cat'); await at(p, 's02');
  await expect(p.getByRole('alert')).toHaveCount(0); await c.close();
});
test("phone: normal entrance, true letter interaction, ink boundaries, all thirteen actions, records", async ({
  browser,
}) => {
  await mkdir(evidence, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  const errors = [],
    failed = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  p.on("response", (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await start(p);
  await at(p, "s01");
  await expect(p.getByRole("button", { name: "施法" })).toBeDisabled();
  await button(p, "字母 a").tap();
  await button(p, "字母 c").tap();
  // Real touch swap of occupied slots, then return a letter to the bank.
  await touchDrag(p, button(p, "第1格 a"), button(p, "第2格 c"));
  await expect(button(p, "第1格 c")).toBeVisible();
  await expect(button(p, "第2格 a")).toBeVisible();
  await p.waitForTimeout(360);
  await button(p, "第2格 a").tap();
  await button(p, "字母 a").tap();
  await button(p, "字母 t").tap();
  await p.getByRole("button", { name: "施法" }).tap();
  await at(p, "s02");
  await help(p);
  await spell(p, "bag");
  await at(p, "s03");
  await spell(p, "mat");
  await at(p, "s03");
  await expect(p.locator(".projection")).toBeVisible();
  await expect(p.locator('[data-entity="picnic-mat"]')).toHaveCount(0);
  await button(p, "给我一点提示").tap();
  await help(p);
  await button(p, "第3格 t").tap();
  await button(p, "字母 p").tap();
  await p.getByRole("button", { name: "施法" }).tap();
  await at(p, "s04a");
  await expect(p.locator(".projection")).toHaveCount(0);
  await screenshot(p, "phone-transform");
  await transform(p, "p", "t");
  await at(p, "s04b");
  await reload(p, "s04b");
  await expect(p.getByText("已完成 3 / 12", { exact: true })).toBeVisible();
  const before = await p.evaluate((key) => localStorage.getItem(key), KEY);
  await touchDrag(
    p,
    p.locator('[data-entity="route-sheet"]'),
    button(p, "湿墨小径"),
    true,
    true,
  );
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    before,
  );
  await touchDrag(
    p,
    p.locator('[data-entity="route-sheet"]'),
    button(p, "湿墨小径"),
  );
  await at(p, "s05");
  await reload(p, "s05");
  await expect(p.getByText("✓ 已走过的小径")).toBeVisible();
  await transform(p, "t", "p");
  await at(p, "s06");
  await button(p, "暂停").tap();
  await button(p, "静音").tap();
  await button(p, "继续故事").tap();
  await expect(p.locator(".audio-note")).toContainText("静音");
  await help(p);
  await spell(p, "hat");
  await at(p, "s07");
  await expect(button(p, "小猫纸偶")).toBeVisible();
  await expect(button(p, "小猫")).toBeVisible();
  await transform(p, "t", "p");
  await at(p, "s08");
  await help(p);
  await spell(p, "mat");
  await at(p, "s09");
  await screenshot(p, "phone-placement");
  await help(p);
  await button(p, "鸭舌帽").tap();
  await button(p, "背包上面").tap();
  await at(p, "s09");
  await button(p, "鸭舌帽").tap();
  await button(p, "背包里面").tap();
  await at(p, "s10");
  await help(p);
  await button(p, "宽檐帽").tap();
  await button(p, "垫子上面").tap();
  await at(p, "s11");
  await help(p);
  await button(p, "地图").tap();
  await at(p, "s12");
  await help(p);
  await button(p, "小猫").tap();
  await button(p, "垫子上面").tap();
  await expect(p.getByRole("heading", { name: "野餐开始啦。" })).toBeVisible();
  await noOverflow(p);
  await screenshot(p, "phone-ending");
  await button(p, "回顾本次练习").tap();
  await expect(p.locator(".records li")).toHaveCount(15);
  await expect(p.locator(".records")).toContainText("辅助完成");
  await expect(p.locator(".records")).toContainText("铺路操作");
  await p.reload();
  await p.getByRole("button", { name: "继续故事" }).click();
  await expect(p.getByRole("heading", { name: "野餐开始啦。" })).toBeVisible();
  await button(p, "再读一次故事").click();
  await button(p, "返回").click();
  await expect(p.getByRole("heading", { name: "野餐开始啦。" })).toBeVisible();
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  await context.close();
});
test("audio replacement, stale callbacks, leaving page and volume use one service", async ({
  browser,
}) => {
  const context = await browser.newContext({ hasTouch: true });
  await context.addInitScript(() => {
    window.audioProbe = { spoken: [], cancels: 0 };
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {
          window.audioProbe.cancels++;
        },
        speak(u) {
          window.audioProbe.spoken.push(u);
          u.onstart?.();
        },
      },
    });
  });
  const p = await context.newPage();
  await start(p);
  await button(p, "▷ 重听任务").click();
  await button(p, "▷ 重听任务").click();
  expect(
    await p.evaluate(() => window.audioProbe.spoken.map((u) => u.text)),
  ).toEqual(["cat", "cat", "cat"]);
  await p.evaluate(() => window.audioProbe.spoken[0].onerror?.());
  await expect(p.locator(".audio-note")).toContainText("正在播放");
  await spell(p, "cat");
  await at(p, "s02");
  expect(await p.evaluate(() => window.audioProbe.spoken.at(-1).text)).toBe(
    "bag",
  );
  const n = await p.evaluate(() => window.audioProbe.cancels);
  await button(p, "暂停").click();
  expect(await p.evaluate(() => window.audioProbe.cancels)).toBeGreaterThan(n);
  await p.getByRole("slider", { name: "音量" }).fill("0.3");
  await button(p, "继续故事").click();
  expect(
    await p.evaluate(() => window.audioProbe.spoken.at(-1).volume),
  ).toBeCloseTo(0.3);
  await button(p, "暂停").click();
  await button(p, "返回首页").click();
  const left = await p.evaluate(() => window.audioProbe.cancels);
  await p.evaluate(() => window.audioProbe.spoken.at(-1).onerror?.());
  expect(await p.evaluate(() => window.audioProbe.cancels)).toBe(left);
  await context.close();
});
test("gesture cancellation on rotation and missed drop do not submit; focus stays in dialog", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const p = await context.newPage();
  await start(p);
  await touchDrag(p, button(p, "字母 c"), p.locator(".topbar"));
  await expect(button(p, "第1格 空")).toBeVisible();
  await expect(p.getByRole("button", { name: "施法" })).toBeDisabled();
  await p.waitForTimeout(360);
  const token = button(p, "字母 c");
  await token.scrollIntoViewIfNeeded();
  const box = await token.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.setViewportSize({ width: 844, height: 390 });
  await p.mouse.move(300, 200);
  await p.mouse.up();
  await expect(button(p, "第1格 空")).toBeVisible();
  await noOverflow(p);
  await button(p, "暂停").click();
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press("Tab");
    expect(
      await p.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await p.keyboard.press("Escape");
  await expect(button(p, "暂停")).toBeFocused();
  await context.close();
});
test("Pad and desktop: layout, keyboard, pointer cancellation, rotation, core slice", async ({
  browser,
}) => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
    { width: 360, height: 640 },
  ]) {
    const context = await browser.newContext({ viewport, hasTouch: true });
    const p = await context.newPage();
    await start(p);
    await noOverflow(p);
    const bounds = await button(p, "字母 c").boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(56);
    await button(p, "字母 c").focus();
    await p.keyboard.press("Enter");
    await button(p, "字母 a").click();
    await button(p, "字母 t").click();
    await p.getByRole("button", { name: "施法" }).click();
    await help(p);
    await spell(p, "bag");
    await help(p);
    await spell(p, "map");
    await transform(p, "p", "t");
    await at(p, "s04b");
    await screenshot(
      p,
      `${viewport.width === 1024 ? "pad" : viewport.width === 1440 ? "desktop" : "small-phone"}-crossing`,
    );
    await button(p, "垫子").click();
    await button(p, "湿墨小径").click();
    await transform(p, "t", "p");
    await at(p, "s06");
    await p.setViewportSize({ width: viewport.height, height: viewport.width });
    await noOverflow(p);
    await button(p, "暂停").click();
    await expect(p.getByRole("dialog")).toBeVisible();
    await p.keyboard.press("Escape");
    await expect(p.getByRole("dialog")).toHaveCount(0);
    await context.close();
  }
});
test("resource/audio/storage failures preserve playable fallback; corrupted saves require confirmation", async ({
  browser,
}) => {
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await c.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        speak(u) {
          u.onerror?.({ error: "synthesis-failed" });
        },
      },
    });
  });
  const p = await c.newPage();
  await p.route("**/art/cat.svg", (r) => r.abort());
  await start(p);
  await expect(p.getByRole("alert")).toContainText("插画加载失败");
  await expect(p.locator(".audio-note")).toContainText("失败");
  await button(p, "▷ 重听任务").click();
  await help(p);
  await spell(p, "cat");
  await at(p, "s02");
  await expect(p.locator(".art-fallback").first()).toBeVisible();
  await p.unroute("**/art/cat.svg");
  await button(p, "重试资源").click();
  await expect(p.locator(".art-fallback")).toHaveCount(0);
  await at(p, "s02");
  await p.evaluate((key) => localStorage.setItem(key, "{broken"), KEY);
  await p.reload();
  await expect(p.getByRole("alert").filter({ hasText: "存档" })).toContainText(
    "损坏",
  );
  await p.getByRole("button", { name: "开始冒险" }).click();
  await expect(p.getByRole("dialog")).toBeVisible();
  await button(p, "返回").click();
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    "{broken",
  );
  await button(p, "重新开始").click();
  await button(p, "确认重新开始").click();
  await button(p, "我来试试").click();
  await at(p, "s01");
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.previous.v1")),
  ).toBe("{broken");
  await button(p, "暂停").click();
  await button(p, "清除本地记录").click();
  await button(p, "返回").click();
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.previous.v1")),
  ).toBe("{broken");
  await button(p, "暂停").click();
  await button(p, "清除本地记录").click();
  await button(p, "确认清除").click();
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBeNull();
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.previous.v1")),
  ).toBeNull();
  await c.close();
  const blocked = await browser.newContext({ hasTouch: true });
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("denied");
    };
    Storage.prototype.setItem = () => {
      throw new Error("denied");
    };
  });
  const q = await blocked.newPage();
  await start(q);
  await spell(q, "cat");
  await at(q, "s02");
  await expect(q.getByRole("alert")).toContainText("进度可能不保留");
  await blocked.close();
});
