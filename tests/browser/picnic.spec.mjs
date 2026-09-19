import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const button = (p, name) => p.getByRole("button", { name, exact: true });
const entity = (p, id) => p.locator(`[data-entity="${id}"]`);
async function drag(p, source, target, cancel = false) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const a = await source.boundingBox(),
    b = await target.boundingBox();
  const c = await p.context().newCDPSession(p);
  const point = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 });
  await c.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(a)],
  });
  await c.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(b)],
  });
  await c.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd",
    touchPoints: [],
  });
  await c.detach();
}
async function finish(p) {
  const b = button(p, "收好这一页");
  if (await b.isVisible()) await b.click();
}
async function spell(p, word) {
  for (const c of word) await button(p, `字母 ${c}`).tap();
  await p.getByRole("button", { name: "施法" }).tap();
}
async function change(p, from, to) {
  await button(p, `第3格 ${from}`).tap();
  await button(p, `字母 ${to}`).tap();
  await p.getByRole("button", { name: "施法" }).tap();
}
async function story(p) {
  await p.goto("/");
  await p.getByRole("button", { name: "开始冒险" }).click();
  await button(p, "我来试试").click();
  for (const w of ["cat", "bag", "map"]) {
    await spell(p, w);
    await finish(p);
  }
  await change(p, "p", "t");
  await expect(entity(p, "route-sheet")).toHaveAttribute("data-word", "map");
  await finish(p);
  await entity(p, "route-sheet").tap();
  await button(p, "湿墨小径").tap();
  await finish(p);
  await change(p, "t", "p");
  await finish(p);
  await spell(p, "hat");
  await finish(p);
  await change(p, "t", "p");
  await finish(p);
  await spell(p, "mat");
  await finish(p);
  for (const [source, target] of [
    ["cat-card", "bag-main"],
    ["hat-main", "picnic-mat"],
  ]) {
    await entity(p, source).tap();
    await entity(p, target).tap();
    await finish(p);
  }
  await entity(p, "route-sheet").tap();
  await finish(p);
  await entity(p, "cat-companion").tap();
  await entity(p, "picnic-mat").tap();
  await finish(p);
  await expect(p.getByRole("heading", { name: "野餐开始啦。" })).toBeVisible();
  await p.getByRole("button", { name: "继续野餐 →" }).tap();
}
async function choose(p, id) {
  if ((await entity(p, id).getAttribute("aria-pressed")) !== "true") {
    if (await button(p, "取消选择").isVisible())
      await button(p, "取消选择").tap();
    await entity(p, id).tap();
  }
}
async function morph(p, id, from, to) {
  await choose(p, id);
  await button(p, "换字魔法").tap();
  await change(p, from, to);
  await expect(p.locator(".play-morph")).toBeVisible();
  await expect(entity(p, id)).toHaveAttribute(
    "data-word",
    id === "route-sheet"
      ? from === "p"
        ? "map"
        : "mat"
      : from === "p"
        ? "cap"
        : "cat",
  );
  await button(p, "跳过演出").click();
}
async function put(p, source, target) {
  await choose(p, source);
  await entity(p, target).tap();
}
test("normal story → reversible picnic → all three activities → isolated resume and real replay variant", async ({
  browser,
}) => {
  test.setTimeout(180000);
  await mkdir("docs/evidence/playful-game", { recursive: true });
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p = await c.newPage();
  p.setDefaultTimeout(6000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await story(p);
  const main = await p.evaluate(() =>
    localStorage.getItem("wordspell.story.v1"),
  );
  await p.getByRole("button", { name: /打开背包/ }).tap();
  await entity(p, "cat-card").tap();
  await button(p, "拿到草地").tap();
  await button(p, "给小猫戴帽").tap();
  await expect(button(p, "摘下鸭舌帽")).toBeVisible();
  const beforeDrop = await p.evaluate(() =>
    localStorage.getItem("wordspell.play.v1.free"),
  );
  await drag(p, entity(p, "hat-main"), button(p, "给小猫戴帽"), true);
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.play.v1.free")),
  ).toBe(beforeDrop);
  await drag(p, entity(p, "hat-main"), p.locator(".topbar"));
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.play.v1.free")),
  ).toBe(beforeDrop);
  await drag(p, entity(p, "hat-main"), button(p, "给小猫戴帽"));
  await expect(button(p, "摘下宽檐帽")).toBeVisible();
  await expect(entity(p, "cat-card")).toBeVisible();
  await p.waitForTimeout(360);
  await morph(p, "cat-card", "p", "t");
  await expect(entity(p, "cat-card")).toHaveAttribute("data-word", "cat");
  await button(p, "换字魔法").tap();
  await change(p, "t", "p");
  await button(p, "跳过演出").tap();
  await put(p, "cat-card", "bag-main");
  await morph(p, "route-sheet", "p", "t");
  await put(p, "cat-companion", "route-sheet");
  await entity(p, "route-sheet").tap();
  await button(p, "换字魔法").tap();
  await change(p, "t", "p");
  await expect(p.locator(".play-response")).toContainText("先把上面的物品");
  await button(p, "收起字母").tap();
  await entity(p, "cat-companion").tap();
  await button(p, "拿到草地").tap();
  await morph(p, "route-sheet", "t", "p");
  await p.screenshot({
    path: "docs/evidence/playful-game/phone-picnic.png",
    fullPage: true,
  });
  const free = await p.evaluate(() =>
    localStorage.getItem("wordspell.play.v1.free"),
  );
  await button(p, "帽子搭配").tap();
  await entity(p, "cat-card").tap();
  await button(p, "换字魔法").tap();
  await change(p, "t", "p");
  await button(p, "跳过演出").tap();
  await choose(p, "cat-card");
  await button(p, "给小猫戴帽").tap();
  await put(p, "hat-main", "bag-main");
  await expect(p.getByText("小委托完成啦！", { exact: true })).toBeVisible();
  await button(p, "继续我的野餐").tap();
  await button(p, "背包找物").tap();
  const seed = Number(
    await p.locator(".picnic-page").getAttribute("data-seed"),
  );
  const wanted = seed % 2 ? "hat-main" : "cat-card";
  await p.getByRole("button", { name: /打开背包/ }).tap();
  await entity(p, wanted).tap();
  await button(p, "拿到草地").tap();
  await put(p, wanted, "picnic-mat");
  await expect(p.getByText("小委托完成啦！", { exact: true })).toBeVisible();
  await button(p, "再玩一次").tap();
  expect(
    Number(await p.locator(".picnic-page").getAttribute("data-seed")) % 2,
  ).not.toBe(seed % 2);
  await button(p, "返回我的野餐").tap();
  await button(p, "野餐小帮手").tap();
  const helperSeed = Number(
    await p.locator(".picnic-page").getAttribute("data-seed"),
  );
  await put(p, "cat-card", "bag-main");
  await morph(p, "route-sheet", "p", "t");
  await put(p, helperSeed % 2 ? "hat-main" : "cat-companion", "route-sheet");
  await expect(p.getByText("小委托完成啦！", { exact: true })).toBeVisible();
  await button(p, "继续我的野餐").tap();
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.play.v1.free")),
  ).toBe(free);
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.story.v1")),
  ).toBe(main);
  await p.reload();
  await p.getByRole("button", { name: "继续故事" }).click();
  await button(p, "继续野餐 →").tap();
  await expect(button(p, "摘下宽檐帽")).toBeVisible();
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.play.v1.free")),
  ).toBe(free);
  await p.setViewportSize({ width: 1024, height: 768 });
  await expect(entity(p, "route-sheet")).toBeVisible();
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await p.screenshot({
    path: "docs/evidence/playful-game/pad-picnic.png",
    fullPage: true,
  });
  await choose(p, "cat-card");
  await button(p, "拿到草地").tap();
  await button(p, "给小猫戴帽").tap();
  await expect(button(p, "摘下鸭舌帽")).toBeVisible();
  await button(p, "摘下鸭舌帽").tap();
  await put(p, "cat-card", "bag-main");
  await button(p, "暂停").tap();
  await button(p, "继续野餐").tap();
  await p.getByText("我们刚才做过的魔法", { exact: true }).tap();
  const beforeReset = await p.evaluate(() =>
    localStorage.getItem("wordspell.play.v1.free"),
  );
  await button(p, "恢复初始布置").tap();
  await button(p, "返回").tap();
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.play.v1.free")),
  ).toBe(beforeReset);
  await button(p, "恢复初始布置").tap();
  await button(p, "确认恢复布置").tap();
  expect(
    await p.evaluate(() =>
      localStorage.getItem("wordspell.play.v1.free.previous"),
    ),
  ).toBe(beforeReset);
  expect(
    await p.evaluate(() => localStorage.getItem("wordspell.story.v1")),
  ).toBe(main);
  await expect(button(p, "摘下鸭舌帽")).toHaveCount(0);
  await button(p, "故事回顾").tap();
  await expect(p.getByRole("heading", { name: "野餐开始啦。" })).toBeVisible();
  expect(errors).toEqual([]);
  await c.close();
});
