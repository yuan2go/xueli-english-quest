import { test, expect } from "@playwright/test";
import {
  start,
  word,
  button,
  object,
  morph,
  dragTo,
  snapshot,
  toMeadow,
  move,
  sentence,
  finish,
  shot,
  viewportOK,
  explore,
} from "./helpers.mjs";

test("persistent world, scoped touch/keyboard, sheet scrolling, focus and portrait/landscape recovery", async ({
  browser,
}) => {
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 768, height: 1024 },
  ]) {
    const c = await browser.newContext({
      viewport,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const p = await c.newPage();
    await start(p);
    const scene = await p.locator(".quest-scene").elementHandle();
    expect((await scene.boundingBox()).height).toBeGreaterThan(
      viewport.height * 0.7,
    );
    await expect(p.locator(".quest-tools")).toHaveCount(0);
    await button(p, "唤醒伙伴").click();
    const before = await scene.boundingBox();
    const source = button(p, "字母 c"),
      destination = button(p, "第1格 空");
    const a = await source.boundingBox(),
      z = await destination.boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await p.mouse.down();
    await p.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 3 });
    await source.evaluate((el) => {
      if (el.hasPointerCapture(1)) el.releasePointerCapture(1);
    });
    await p.mouse.up();
    await expect(button(p, "第1格 空")).toBeVisible();
    await expect(p.locator(".drag-ghost")).toHaveCount(0);
    const cdp = await c.newCDPSession(p);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: a.x + 20, y: a.y + 20, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: z.x + 20, y: z.y + 20, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: z.x + 20, y: z.y + 20, id: 1 },
        { x: 12, y: 12, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(button(p, "第1格 空")).toBeVisible();
    await expect(p.locator(".drag-ghost")).toHaveCount(0);
    await cdp.detach();

    for (const letter of "cat") {
      await button(p, `字母 ${letter}`).focus();
      await p.keyboard.press("Enter");
    }
    await p.getByRole("button", { name: /^施法/ }).click();
    await expect(object(p, "cat-companion")).toBeFocused();
    expect(await scene.evaluate((el) => el.isConnected)).toBe(true);
    await button(p, "找回路线").click();
    await expect(p.locator(".answer")).toHaveCount(0);
    const saved = (await snapshot(p)).projection;
    await button(p, "字母 m").click();
    await expect(button(p, "第1格 m")).toBeFocused();
    const surfaceBefore = await scene.boundingBox();
    await p
      .locator(".quest-tools")
      .evaluate((el) => (el.scrollTop = el.scrollHeight));
    expect(await scene.boundingBox()).toEqual(surfaceBefore);
    await p.keyboard.press("Escape");
    await expect(button(p, "找回路线")).toBeFocused();
    expect((await snapshot(p)).projection.story.world).toEqual(
      saved.story.world,
    );
    await word(p, "map", "map", true);
    await word(p, "bag", "bag");
    await button(p, "沿小径出发 →").click();
    await morph(p, "route-sheet", "t");
    await object(p, "route-sheet").click();
    const world = (await snapshot(p)).projection.story.world;
    const r = await object(p, "route-sheet").boundingBox();
    await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await p.mouse.down();
    await p.mouse.move(20, 20, { steps: 3 });
    await expect(p.locator(".object-ghost")).toBeVisible();
    await p.setViewportSize({ width: viewport.height, height: viewport.width });
    await p.mouse.up();
    await expect(p.locator(".object-ghost")).toHaveCount(0);
    expect((await snapshot(p)).projection.story.world).toEqual(world);
    await shot(p, `landscape-${viewport.width}`);
    await p.setViewportSize(viewport);
    await viewportOK(p);
    expect(before.height).toBeGreaterThan(200);
    await c.close();
  }
});

test("phone full adventure with dragged/reordered sentence tokens and reload during a committed crossing", async ({
  browser,
}) => {
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const p = await c.newPage();
  await start(p);
  await word(p, "wake", "cat");
  await word(p, "map", "map", true);
  await word(p, "bag", "bag");
  await word(p, "hat", "hat");
  await morph(p, "cat-card", "p");
  await button(p, "沿小径出发 →").click();
  await morph(p, "route-sheet", "t");
  await dragTo(p, object(p, "route-sheet"), button(p, "湿墨小径"));
  await expect(p.locator('[data-cue="cross"]')).toBeVisible();
  const crossed = (await snapshot(p)).projection.story.world;
  await p.reload();
  await button(p, "继续冒险").click();
  expect((await snapshot(p)).projection.story.world).toEqual(crossed);
  await expect(p.locator(".presentation")).toHaveCount(0);
  await move(p, "route-sheet", "放回地面 / 取出 / 摘下");
  await morph(p, "route-sheet", "p");
  await button(p, "跟着地图去草地 →").click();
  await word(p, "mat", "mat", true);
  await button(p, "帮背包收一件东西").click();
  for (const part of ["the", "Put", "cap", "in", "the", "bag"]) {
    const token = p
      .locator(".word-blocks button:enabled")
      .filter({ hasText: new RegExp(`^${part}$`, "i") })
      .first();
    await token.scrollIntoViewIfNeeded();
    await dragTo(p, token, p.getByLabel("句尾放词"));
  }
  await expect(p.locator(".sentence-line")).toHaveText("thePutcapinthebag");
  await dragTo(p, button(p, "句子第2块 Put"), button(p, "句子第1块 the"));
  await expect(p.locator(".sentence-line")).toHaveText("Putthecapinthebag");
  await button(p, "说出这句话").click();
  await expect(p.locator(".tool-result")).toContainText("打开袋口");
  expect(
    (await snapshot(p)).projection.story.world.entities["cat-card"].location
      .kind,
  ).toBe("stage");
  await button(p, "打开背包").click();
  await expect(p.locator(".sentence-line")).toHaveText("Putthecapinthebag");
  await button(p, "说出这句话").click();
  expect(
    (await snapshot(p)).projection.story.world.entities["cat-card"].location
      .targetId,
  ).toBe("bag-main");
  await move(p, "hat-main", "野餐垫上 · on");
  await sentence(p, "告诉小猫你看见了什么", "The hat is on the mat");
  await sentence(p, "邀请朋友入座", "Put the cat on the mat");
  await finish(p, true);
  await shot(p, "phone-dragged-ending");
  await c.close();
});

test("scene resource lifecycle defers future backgrounds; retry and pause preserve an in-progress draft", async ({
  page: p,
}) => {
  const requested = [];
  p.on("request", (r) => requested.push(r.url()));
  await p.route("**/assets/game/tabby/cat-idle.webp", (r) => r.abort());
  await start(p);
  expect(
    requested.some((url) => /scene-act-[23]|companion.webp/.test(url)),
  ).toBe(false);
  await button(p, "唤醒伙伴").click();
  await button(p, "字母 c").click();
  await p.unroute("**/assets/game/tabby/cat-idle.webp");
  await button(p, "重试资源").click();
  await expect(p.locator(".art-fallback")).toHaveCount(0);
  await expect(button(p, "第1格 c")).toBeVisible();
  await button(p, "暂停").click();
  await p.keyboard.press("Escape");
  await expect(button(p, "第1格 c")).toBeVisible();
  await button(p, "字母 a").click();
  await button(p, "字母 t").click();
  await p.getByRole("button", { name: /^施法/ }).click();
  const raw = await snapshot(p);
  expect(JSON.stringify(raw)).not.toMatch(
    /"cue"|"selected"|"ghost"|"openedTool"/,
  );
  await expect(object(p, "cat-companion")).toBeVisible();
});
