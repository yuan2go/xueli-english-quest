import { test, expect } from "@playwright/test";
import {
  demo,
  start,
  word,
  object,
  button,
  snapshot,
  move,
  toMeadow,
  KEY,
} from "./helpers.mjs";

test("sprite motion follows committed entities; pause, resize and reduced motion never change saved outcomes", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await start(p);
  await toMeadow(p);
  await button(p, "帮背包收一件东西").click();
  await demo(p);
  await p.locator(".word-blocks button").filter({ hasText: /^Put$/i }).click();
  await expect(button(p, "句子第1块 Put")).toBeFocused();
  await p.keyboard.press("Escape");
  await move(p, "hat-main", "野餐垫上 · on");
  const stored = await p.evaluate((key) => localStorage.getItem(key), KEY);
  expect(
    (await snapshot(p)).projection.story.world.entities["hat-main"].location
      .targetId,
  ).toBe("picnic-mat");
  await expect(p.locator("[data-moving]").first()).toBeVisible();
  const nativeProperties = await p
    .locator("[data-moving]")
    .first()
    .evaluate((el) =>
      el
        .getAnimations()
        .flatMap((a) => a.effect.getKeyframes().flatMap(Object.keys)),
    );
  expect(nativeProperties).toContain("transform");
  expect(
    nativeProperties.filter((p) =>
      ["left", "top", "width", "height"].includes(p),
    ),
  ).toEqual([]);
  await button(p, "暂停").click();
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  expect(
    await p
      .locator(".quest-cat .cat-blink i")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("paused");
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    stored,
  );
  await p.keyboard.press("Escape");
  await move(p, "hat-main", "戴在小猫头上");
  const worn = await p.evaluate((key) => localStorage.getItem(key), KEY);
  await p.setViewportSize({ width: 844, height: 390 });
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBe(worn);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await move(p, "hat-main", "背包里面 · in");
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  expect(
    await p
      .locator(".quest-cat .character-sprite")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    (await snapshot(p)).projection.story.world.entities["hat-main"].location
      .targetId,
  ).toBe("bag-main");
  await p.reload();
  await button(p, "继续冒险").click();
  expect(
    (await snapshot(p)).projection.story.world.entities["hat-main"].location
      .targetId,
  ).toBe("bag-main");
});

test("continuous drag avoids a layout per pointer event and cancellation leaves no frame or save change", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await start(p);
  await word(p, "wake", "cat");
  await word(p, "bag", "bag");
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  const stored = await p.evaluate((key) => localStorage.getItem(key), KEY);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Performance.enable");
  const a = await object(p, "bag-main").boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2 + 16, a.y + a.height / 2 - 20);
  await expect(p.locator(".drag-ghost")).toBeVisible();
  const before = await cdp.send("Performance.getMetrics");
  for (let i = 0; i < 40; i++)
    await p.mouse.move(a.x + a.width / 2 + 16 + i, a.y + a.height / 2 - 20);
  const after = await cdp.send("Performance.getMetrics");
  const layouts =
    after.metrics.find((m) => m.name === "LayoutCount").value -
    before.metrics.find((m) => m.name === "LayoutCount").value;
  expect(layouts).toBeLessThan(8);
  expect(
    await p.locator(".drag-ghost").evaluate((el) => el.style.transform),
  ).toContain("translate3d");
  await p.keyboard.press("Escape");
  await p.mouse.up();
  await expect(p.locator(".drag-ghost")).toHaveCount(0);
  await p.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(p.locator(".drag-ghost")).toHaveCount(0);
  expect(await p.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    stored,
  );
  await word(p, "hat", "hat");
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  const beforeFast = await snapshot(p);
  // Burst within one task: a valid release must not depend on a ghost-render frame.
  await p.evaluate(() => {
    const source = document.querySelector('[data-entity="hat-main"]');
    const target = document.querySelector('[data-entity="cat-companion"]');
    const a = source.getBoundingClientRect(),
      b = target.getBoundingClientRect();
    const common = {
      bubbles: true,
      pointerId: 71,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
    };
    source.dispatchEvent(
      new PointerEvent("pointerdown", {
        ...common,
        buttons: 1,
        clientX: a.x + a.width / 2,
        clientY: a.y + a.height * 0.7,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        ...common,
        buttons: 1,
        clientX: b.x + b.width / 2,
        clientY: b.y + b.height * 0.7,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        ...common,
        buttons: 0,
        clientX: b.x + b.width / 2,
        clientY: b.y + b.height * 0.7,
      }),
    );
  });
  const afterFast = await snapshot(p);
  expect(
    afterFast.projection.story.world.entities["hat-main"].location.kind,
  ).toBe("worn");
  expect(afterFast.journal.length).toBe(beforeFast.journal.length + 1);
  await expect(p.locator(".drag-ghost")).toHaveCount(0);
  await expect(object(p, "hat-main")).toBeFocused();
  await button(p, "探索小路").focus();
  await p.keyboard.press("Enter");
  await expect(p.getByRole("dialog")).toBeVisible();
  await cdp.detach();
});
