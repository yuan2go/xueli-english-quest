import { test, expect } from "@playwright/test";
import {
  button,
  word,
  object,
  bag,
  snapshot,
  journal,
  shot,
} from "./helpers.mjs";

for (const [name, viewport] of [
  ["small-phone", { width: 360, height: 640 }],
  ["phone", { width: 390, height: 844 }],
  ["pad", { width: 1024, height: 768 }],
  ["desktop", { width: 1440, height: 1000 }],
  ["landscape", { width: 640, height: 360 }],
]) {
  test(`${name}: title, temporary tools, object actions and journal stay playable in one scene`, async ({
    page: p,
  }) => {
    await p.setViewportSize(viewport);
    await p.goto("/");
    await shot(p, `${name}-title`);
    await button(p, "开始冒险").click();
    const scene = p.getByRole("region", { name: "故事场景" });
    const bounds = await scene.boundingBox();
    expect(bounds).toMatchObject({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
    await button(p, "唤醒伙伴").click();
    for (const letter of "cat") await button(p, `字母 ${letter}`).click();
    const submit = button(p, "施法");
    await submit.scrollIntoViewIfNeeded();
    const area = await submit.boundingBox();
    expect(area.y).toBeGreaterThanOrEqual(0);
    expect(area.y + area.height).toBeLessThanOrEqual(viewport.height);
    await shot(p, `${name}-spelling`);
    await submit.click();
    await expect(
      p.getByRole("complementary", { name: "行动工具" }),
    ).toHaveCount(0);
    await expect(
      p.getByRole("complementary", { name: "物品行动" }),
    ).toHaveCount(0);
    // A completed spell must leave the next scene object directly reachable.
    await word(p, "bag", "bag");
    await object(p, "bag-main").click();
    await expect(
      p.getByRole("complementary", { name: "物品行动" }),
    ).toBeVisible();
    await button(p, "取消选择").click();
    await bag(p);
    await expect(
      p.getByRole("complementary", { name: "物品行动" }),
    ).toHaveCount(0);
    await shot(p, `${name}-exploring`);
    await button(p, "找回路线").click();
    await expect(p.locator(".answer")).toHaveCount(0);
    const before = (await snapshot(p)).projection.story.world;
    await button(p, "收起工具").click();
    expect((await snapshot(p)).projection.story.world).toEqual(before);
    await journal(p);
    await expect(
      p.getByRole("dialog").locator("[data-goal]").first(),
    ).toBeVisible();
    await button(p, "返回").click();
    await expect(button(p, "探险手记")).toBeFocused();
    expect(
      await p.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("short landscape completes the real paper crossing and sentence picnic", async ({
  page: p,
}) => {
  const { start, toMeadow, picnicLanguage, finish, viewportOK } = await import(
    "./helpers.mjs"
  );
  await p.setViewportSize({ width: 640, height: 360 });
  await start(p);
  await toMeadow(p);
  await picnicLanguage(p);
  await finish(p);
  await viewportOK(p);
  await shot(p, "landscape-ending");
});
