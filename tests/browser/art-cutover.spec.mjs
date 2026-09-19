import { test, expect } from "@playwright/test";
import { IMAGES } from "../../src/content/manifest.ts";
const button = (p, name) => p.getByRole("button", { name, exact: true });
test("tabby assets decode; a late pose failure retries without losing draft, pause focus or committed progress", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await c.newPage();
  const requested = [], errors = [];
  p.on("request", (r) => { if (/\.(webp|svg|png)(\?|$)/.test(r.url())) requested.push(r.url()); });
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("/");
  await p.getByRole("button", { name: "开始冒险" }).click();
  await button(p, "我来试试").click();
  for (const letter of "cat") await button(p, `字母 ${letter}`).tap();
  await p.getByRole("button", { name: "施法" }).tap();
  if (await button(p, "收好这一页").isVisible()) await button(p, "收好这一页").click();
  await expect(p.locator(".game-layout")).toHaveAttribute("data-step", "s02");
  await expect(p.locator(".answer")).toHaveCount(0);
  await button(p, "字母 b").tap();
  await button(p, "暂停").tap();
  await button(p, "继续故事").click();
  await expect(button(p, "暂停")).toBeFocused();
  await expect(button(p, "第1格 b")).toBeVisible();
  // Preflight succeeded; the first rendered thinking pose now really fails over HTTP.
  await p.route("**/assets/game/tabby/cat-thinking.webp", (r) => r.abort());
  await button(p, "给我一点提示").click();
  await expect(p.getByRole("alert")).toContainText("插画加载失败");
  await expect(p.locator(".character-art.art-fallback")).toBeVisible();
  await expect(p.locator(".answer")).toHaveCount(0);
  const before = await p.evaluate(() => JSON.parse(localStorage.getItem("wordspell.story.v1")).journal.filter((e) => e.type === "submit"));
  await p.unroute("**/assets/game/tabby/cat-thinking.webp");
  await button(p, "重试资源").click();
  await expect(p.getByRole("alert")).toHaveCount(0);
  await expect(button(p, "第1格 b")).toBeVisible();
  expect(await p.evaluate(() => JSON.parse(localStorage.getItem("wordspell.story.v1")).journal.filter((e) => e.type === "submit"))).toEqual(before);
  for (const asset of IMAGES) {
    expect(requested.some((url) => url.endsWith(`/${asset.path}`)), asset.id).toBe(true);
  }
  const decoded = await p.evaluate(async (assets) => Promise.all(assets.map(async (a) => {
    const image = new Image(); image.src = a.path; await image.decode();
    return { id: a.id, width: image.naturalWidth, height: image.naturalHeight };
  })), IMAGES);
  expect(decoded).toEqual(IMAGES.map(({id, width, height}) => ({id, width, height})));
  expect(requested.every((url) => url.includes('/assets/game/tabby/'))).toBe(true);
  expect(errors).toEqual([]);
  await c.close();
});

test("prior 3.1 saves at both ink boundaries migrate through the real resume entrance", async ({ browser }) => {
  for (const boundary of ["s04b", "s05"]) {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const p = await c.newPage();
    const finish = async () => {
      if (await button(p, "收好这一页").isVisible()) await button(p, "收好这一页").click();
    };
    await p.goto("/");
    await p.getByRole("button", { name: "开始冒险" }).click();
    await button(p, "我来试试").click();
    for (const word of ["cat", "bag", "map"]) {
      for (const letter of word) await button(p, `字母 ${letter}`).tap();
      await p.getByRole("button", { name: "施法" }).tap();
      await finish();
    }
    await button(p, "第3格 p").tap();
    await button(p, "字母 t").tap();
    await p.getByRole("button", { name: "施法" }).tap();
    await finish();
    if (boundary === "s05") {
      await button(p, "垫子").tap();
      await button(p, "湿墨小径").tap();
      await finish();
    }
    // Cancel the real task audio first; its pagehide observation must not overwrite the fixture.
    await button(p, "暂停").click();
    await expect(p.getByRole("dialog")).toBeVisible();
    // Compatibility fixture: change only the prior envelope hash, never the earned journal.
    const old = await p.evaluate(() => {
      const key = "wordspell.story.v1";
      const save = JSON.parse(localStorage.getItem(key));
      save.content = "0400c42731deac0c728566185d7c6a2fb2e3970a4b1e38a475e67462caeef7fb";
      const raw = JSON.stringify(save);
      localStorage.setItem(key, raw);
      return { raw, id: save.id, submissions: save.journal.filter((e) => e.type === "submit") };
    });
    await p.reload();
    await expect(p.getByRole("alert")).toContainText("原始存档另存保留");
    expect(await p.evaluate((id) => localStorage.getItem(`wordspell.story.v1.legacy.${id}`), old.id)).toBe(old.raw);
    await p.getByRole("button", { name: "继续故事" }).click();
    await expect(p.locator(".game-layout")).toHaveAttribute("data-step", boundary);
    expect(await p.evaluate(() => JSON.parse(localStorage.getItem("wordspell.story.v1")).journal.filter((e) => e.type === "submit"))).toEqual(old.submissions);
    if (boundary === "s04b") await expect(button(p, "垫子")).toBeVisible();
    else await expect(p.locator(".scene")).toHaveClass(/crossed/);
    await c.close();
  }
});
