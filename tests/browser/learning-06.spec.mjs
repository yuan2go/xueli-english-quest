import { test, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import {
  start,
  word,
  button,
  object,
  toMeadow,
  snapshot,
  move,
  morph,
  bag,
  sentence,
  demo,
  helpText,
  finish,
  explore,
} from "./helpers.mjs";
const evidence = "docs/evidence/animated-play-learning-06";

test("normal-play motion samples: paper settles before cat crosses; hat stays attached; rapid replacement and cancellation settle latest commit", async ({
  browser,
}) => {
  await mkdir(evidence, { recursive: true });
  const c = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    recordVideo: {
      dir: `${evidence}/video`,
      size: { width: 1024, height: 768 },
    },
  });
  const p = await c.newPage();
  await start(p);
  await word(p, "wake", "cat");
  await word(p, "bag", "bag");
  await word(p, "map", "map", true);
  await word(p, "hat", "hat");
  await move(p, "hat-main", "戴在小猫头上");
  await button(p, "沿小径出发 →").click();
  await morph(p, "route-sheet", "t");
  await object(p, "route-sheet").click();
  await expect(button(p, "铺过湿墨")).toBeVisible();
  await p.screenshot({ path: `${evidence}/cross-before.png` });
  await button(p, "铺过湿墨").click();
  const samples = [];
  const origin = Date.now();
  for (const ms of [80, 350, 650, 950, 1450]) {
    await p.waitForTimeout(Math.max(0, ms - (Date.now() - origin)));
    samples.push(
      await p.evaluate(() => {
        const rect = (id) => {
          const b = document
            .querySelector(`[data-motion-id="${id}"]`)
            .getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        };
        return {
          at: performance.now(),
          pad: rect("route-sheet"),
          cat: rect("cat-companion"),
          hat: rect("hat-main"),
          actorMotion: document.querySelector(
            '[data-motion-id="cat-companion"]',
          ).dataset.motion,
          walkAnimation: document
            .querySelector(".walk-sheet")
            ?.getAnimations()
            .map((a) => a.playState),
          ids: [...document.querySelectorAll("[data-entity]")].map(
            (e) => e.dataset.entity,
          ),
        };
      }),
    );
    if ([350, 650, 1450].includes(ms))
      await p.screenshot({ path: `${evidence}/cross-${ms}.png` });
  }
  const settled = samples.slice(1);
  for (const sample of settled) {
    expect(Math.abs(sample.pad.x - settled[0].pad.x)).toBeLessThan(1);
    expect(Math.abs(sample.pad.y - settled[0].pad.y)).toBeLessThan(1);
    expect(new Set(sample.ids).size).toBe(sample.ids.length);
  }
  expect(samples[2].cat.x).toBeGreaterThan(samples[1].cat.x + 5);
  expect(samples[3].cat.x).toBeGreaterThan(samples[2].cat.x + 5);
  for (const sample of samples)
    expect((sample.hat.x - sample.cat.x) / sample.cat.width).toBeGreaterThan(
      0.2,
    );
  expect(samples[2].actorMotion).toBe("walk");
  expect(samples[2].walkAnimation).toContain("running");
  await expect(p.locator(".motion-object")).toHaveCount(0);
  const saved = await snapshot(p);
  expect(saved.projection.story.world.flags).toContain("crossed-ink");
  expect(
    saved.journal.filter(
      (x) => x.action === "place" && x.target?.kind === "zone",
    ),
  ).toHaveLength(1);
  await writeFile(
    `${evidence}/crossing-samples.json`,
    JSON.stringify(
      {
        condition:
          "Chromium headless 1024x768, normal animations, normal homepage commands; milliseconds are scheduled offsets, at is actual browser clock",
        samples,
        world: saved.projection.story.world,
      },
      null,
      2,
    ),
  );
  await bag(p);
  await move(p, "hat-main", "背包里面 · in");
  await p.waitForTimeout(70);
  const h = await object(p, "hat-main").boundingBox();
  await p.mouse.click(h.x + h.width / 2, h.y + h.height * 0.6);
  await button(p, "戴在小猫头上").click();
  await button(p, "暂停").click();
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  expect(
    (await snapshot(p)).projection.story.world.entities["hat-main"].location
      .kind,
  ).toBe("worn");
  await button(p, "继续冒险").click();
  await move(p, "hat-main", "背包里面 · in");
  const packed = (await snapshot(p)).projection.story.world;
  const bagBounds = await object(p, "bag-main").boundingBox();
  await p.mouse.move(
    bagBounds.x + bagBounds.width / 2,
    bagBounds.y + bagBounds.height / 2,
  );
  await p.mouse.down();
  await p.mouse.move(bagBounds.x + 90, bagBounds.y + 20, { steps: 4 });
  await expect(
    p.locator('.drag-ghost [data-ghost-entity="hat-main"]'),
  ).toHaveCount(1);
  await expect(p.locator('[data-motion-id="bag-main"]')).toHaveAttribute(
    "data-drag-origin",
    "true",
  );
  await p.keyboard.press("Escape");
  await p.mouse.up();
  expect((await snapshot(p)).projection.story.world).toEqual(packed);
  await bag(p, false);
  await expect(object(p, "hat-main")).toHaveCount(0);
  await bag(p);
  await expect(object(p, "hat-main")).toHaveCount(1);
  await move(p, "hat-main", "戴在小猫头上");
  await p.emulateMedia({ reducedMotion: "reduce" });
  await move(p, "route-sheet", "放回地面 / 取出 / 摘下");
  await morph(p, "route-sheet", "p");
  await expect(p.locator("[data-moving]")).toHaveCount(0);
  const end = await snapshot(p);
  await p.reload();
  await button(p, "继续冒险").click();
  expect((await snapshot(p)).projection.story.world).toEqual(
    end.projection.story.world,
  );
  await c.close();
});

test("teaching demo is observable and isolated, partial exposure persists, independent composition neither shows nor plays the complete answer", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await start(p);
  await toMeadow(p);
  const before = (await snapshot(p)).projection.story.world;
  await button(p, "帮背包收一件东西").click();
  await expect(p.locator('[data-lesson-step="0"]')).toBeVisible();
  await button(p, "看看下一步").click();
  await button(p, "看看下一步").click();
  await expect(p.locator('[data-lesson-entity="cat-card"]')).toHaveAttribute(
    "data-location",
    "in",
  );
  expect((await snapshot(p)).projection.story.world).toEqual(before);
  expect((await snapshot(p)).projection.story.facts).not.toContain(
    "sentence:pack-cap",
  );
  await expect(button(p, "看看下一步")).toBeEnabled();
  await p.screenshot({ path: `${evidence}/teaching-action.png` });
  await button(p, "先回去试试").click();
  expect(
    (await snapshot(p)).projection.story.help["pack-cap"].exposures.some(
      (x) => x.status === "cancelled",
    ),
  ).toBe(true);
  await p.reload();
  await button(p, "继续冒险").click();
  await button(p, "帮背包收一件东西").click();
  await demo(p);
  expect((await snapshot(p)).projection.story.world).toEqual(before);
  for (const part of "Put the cap in the bag".split(" "))
    await p
      .locator(".word-blocks button:enabled")
      .filter({ hasText: new RegExp(`^${part}$`, "i") })
      .first()
      .click();
  await button(p, "说出这句话").click();
  await move(p, "hat-main", "野餐垫上 · on");
  await sentence(p, "告诉小猫你看见了什么", "The hat is on the mat");
  await p.evaluate(() => {
    window.__spoken = [];
    const original = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => {
      window.__spoken.push(u.text);
      original(u);
    };
  });
  await button(p, "邀请朋友入座").click();
  await expect(p.locator(".answer")).toHaveCount(0);
  expect(await p.evaluate(() => window.__spoken)).toEqual([]);
  expect(
    (await snapshot(p)).projection.story.help["invite-cat"],
  ).toBeUndefined();
  await expect(p.locator('[data-target-ref="picnic-mat"]')).toBeVisible();
  for (const part of "Put the cat on the mat".split(" "))
    await p
      .locator(".word-blocks button:enabled")
      .filter({ hasText: new RegExp(`^${part}$`, "i") })
      .first()
      .click();
  await button(p, "说出这句话").click();
  const event = (await snapshot(p)).projection.events.findLast(
    (x) => x.task === "invite-cat",
  );
  expect(event.evidence).toBe("independent");
  await finish(p, true);
  await button(p, "回顾这次冒险").click();
  await expect(p.locator(".quest-records")).toContainText("看完示范后亲手完成");
  await expect(p.locator(".quest-records")).toContainText("未显示答案完成");
  await writeFile(
    `${evidence}/learning-example.json`,
    JSON.stringify(
      (await snapshot(p)).projection.events.filter((x) =>
        x.type.startsWith("sentence"),
      ),
      null,
      2,
    ),
  );
});

test("authored experiments change the isolated activity, not just a celebration", async ({
  page: p,
}) => {
  await start(p);
  await toMeadow(p);
  await sentence(p, "帮背包收一件东西", "Put the cap in the bag");
  await move(p, "hat-main", "野餐垫上 · on");
  await sentence(p, "告诉小猫你看见了什么", "The hat is on the mat");
  await sentence(p, "邀请朋友入座", "Put the cat on the mat");
  const story = (await snapshot(p)).projection.story;
  await explore(p, "帽子搭配");
  await move(p, "hat-main", "戴在小猫头上");
  await button(p, "试试吹小风").click();
  expect(
    (await snapshot(p)).projection.activities.dress.world.entities["hat-main"]
      .location.kind,
  ).toBe("stage");
  await move(p, "hat-main", "戴在小猫头上");
  await button(p, "试试晒太阳").click();
  expect(
    (await snapshot(p)).projection.activities.dress.world.entities[
      "cat-companion"
    ].location.targetId,
  ).toBe("picnic-mat");
  await explore(p, "返回故事");
  expect((await snapshot(p)).projection.story).toEqual(story);
});

test("new worn and contained children preserve their first painted position while the desktop scene expands", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 1440, height: 1000 });
  await start(p);
  for (const [task, text] of [
    ["wake", "cat"],
    ["bag", "bag"],
    ["hat", "hat"],
  ])
    await word(p, task, text);
  await bag(p);
  const samples = [];
  for (const target of ["戴在小猫头上", "背包里面 · in"]) {
    await object(p, "hat-main").click();
    await expect(button(p, target)).toBeVisible();
    await p.evaluate((label) => {
      const rect = () => {
        const b = document
          .querySelector('[data-motion-id="hat-main"]')
          .getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      };
      window.__origin = null;
      const listen = (e) => {
        if (e.target.closest("button")?.textContent.trim() !== label) return;
        document.removeEventListener("click", listen, true);
        const from = rect();
        requestAnimationFrame(() => {
          window.__origin = { target: label, from, first: rect() };
        });
      };
      document.addEventListener("click", listen, true);
    }, target);
    await button(p, target).click();
    await expect.poll(() => p.evaluate(() => !!window.__origin)).toBe(true);
    const sample = await p.evaluate(() => window.__origin);
    samples.push(sample);
    for (const key of ["x", "y", "width", "height"])
      expect(
        Math.abs(sample.from[key] - sample.first[key]),
        `${target} ${key}`,
      ).toBeLessThan(3);
    await expect(
      p.locator('[data-motion-id="hat-main"][data-moving]'),
    ).toHaveCount(0);
  }
  await writeFile(
    `${evidence}/reparent-samples.json`,
    JSON.stringify(samples, null, 2),
  );
});

test("a failed teaching image cannot yield a completed demonstration; visible words remain recorded", async ({
  page: p,
}) => {
  await p.route("**/bag-open.webp", (route) => route.abort("failed"));
  await p.setViewportSize({ width: 390, height: 844 });
  await start(p);
  await toMeadow(p);
  await button(p, "帮背包收一件东西").click();
  await expect(p.getByRole("dialog")).toContainText("示范图像没有加载完成");
  await expect(button(p, "看看下一步")).toBeDisabled();
  const help = (await snapshot(p)).projection.story.help["pack-cap"];
  expect(
    help.exposures.some((x) => x.part === "action" && x.status === "failed"),
  ).toBe(true);
  expect(
    help.exposures.some((x) => x.part === "words" && x.status === "shown"),
  ).toBe(true);
  expect(help.exposures.some((x) => x.status === "completed")).toBe(false);
  await button(p, "先回去试试").click();
  expect((await snapshot(p)).projection.story.facts).not.toContain(
    "sentence:pack-cap",
  );
});

test("historical v4 bytes are verified and protected in the actual entry before explicit restart", async ({
  page: p,
}) => {
  // Compatibility fixture only: no mainline completion is injected or inferred.
  const { initialAdventure, runAdventure } = await import(
    "../../src/legacy/quest-v4/adventure.ts"
  );
  const { encodeAdventure } = await import("../../src/legacy/quest-v4/save.ts");
  const s = initialAdventure("historical-browser", 0);
  const raw = encodeAdventure(
    runAdventure(s, {
      sessionId: s.id,
      mode: s.mode,
      revision: 0,
      attemptId: "old-wake",
      action: "word",
      task: "wake",
      word: "cat",
    }).session,
  );
  await p.goto("/");
  await p.evaluate(
    (raw) => localStorage.setItem("xueli.adventure.v4", raw),
    raw,
  );
  await p.reload();
  await expect(p.getByRole("alert")).toContainText("旧版冒险已验证并备份");
  expect(
    await p.evaluate(() => localStorage.getItem("xueli.adventure.v5")),
  ).toBeNull();
  await button(p, "开始冒险").click();
  await button(p, "返回").click();
  expect(
    await p.evaluate(() => localStorage.getItem("xueli.adventure.v4")),
  ).toBe(raw);
  await button(p, "开始冒险").click();
  await button(p, "确认开始新冒险").click();
  expect((await snapshot(p)).projection.events).toEqual([]);
  expect(
    await p.evaluate(
      (raw) =>
        Object.keys(localStorage).some(
          (k) =>
            k.startsWith("xueli.adventure.v4.backup.") &&
            localStorage[k] === raw,
        ),
      raw,
    ),
  ).toBe(true);
  await word(p, "wake", "cat");
  await p.reload();
  await button(p, "继续冒险").click();
  await expect(object(p, "cat-companion")).toBeVisible();
});
