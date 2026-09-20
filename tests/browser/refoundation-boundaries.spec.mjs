import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { initialAdventure } from "../../src/game/adventure.ts";
import { encodeAdventure } from "../../src/platform/adventure-save.ts";
const click = (p, name) => p.getByRole("button", { name, exact: true }).click();
const entity = (p, id) => p.locator(`[data-entity="${id}"]`);
async function start(p) {
  await p.goto("/");
  await click(p, "开始冒险 →");
}
const snapshot = (p) =>
  p.evaluate(() => {
    const raw = localStorage.getItem("xueli.quest.v6");
    return raw ? JSON.parse(raw).projection : null;
  });
async function center(locator) {
  const r = await locator.boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
async function createBox(p) {
  await click(p, "✧ 拼词造物");
  await click(p, "先认识这个词");
  await click(p, "✧ 拼词造物");
  await p.getByLabel("我的字母", { exact: true }).fill("box");
  await click(p, "施法造物");
}
test("G06 touch cancel, second pointer, lost capture, rotation and keyboard have equivalent commands", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    hasTouch: true,
  });
  const p = await context.newPage();
  await start(p);
  await createBox(p);
  const cdp = await context.newCDPSession(p);
  const a = await center(entity(p, "craft-box")),
    b = await center(p.locator('[data-node="step"]'));
  const before = await snapshot(p);
  async function down() {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...a, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: a.x + 15, y: a.y + 15, id: 1 }],
    });
  }
  await down();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  expect(await snapshot(p)).toEqual(before);
  await down();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: a.x + 15, y: a.y + 15, id: 1 },
      { x: a.x + 25, y: a.y + 25, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await snapshot(p)).toEqual(before);
  await down();
  await entity(p, "craft-box").dispatchEvent("lostpointercapture", {
    pointerId: 2,
  });
  await p.keyboard.press("Escape");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await snapshot(p)).toEqual(before);
  await down();
  await p.setViewportSize({ width: 640, height: 360 });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await snapshot(p)).toEqual(before);
  await p.setViewportSize({ width: 360, height: 640 });
  await entity(p, "craft-box").focus();
  await p.keyboard.press("Enter");
  await p.locator('[data-node="step"]').focus();
  await p.keyboard.press("Enter");
  await expect(entity(p, "craft-box")).toHaveAttribute(
    "data-place",
    "node:step",
  );
  await p.getByRole("button", { name: "撤销世界行动" }).click();
  const from = await center(entity(p, "craft-box")),
    to = await center(p.locator('[data-node="step"]'));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...from, id: 4 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...to, id: 4 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(entity(p, "craft-box")).toHaveAttribute(
    "data-place",
    "node:step",
  );
  const scene = await p.locator(".quest-scene").boundingBox(),
    drawer = await p.locator(".context-tool").boundingBox();
  expect(scene.y + scene.height).toBeLessThanOrEqual(drawer.y + 2);
  expect(b.x).toBeGreaterThan(a.x);
  await context.close();
});
test("G05 repeated tokens reorder, blocked sentence retains draft, audio and resource recovery", async ({
  page: p,
}) => {
  let failAsset = true;
  await p.route("**/assets/game/rescue/box.svg", (route) =>
    failAsset ? route.abort() : route.continue(),
  );
  await p.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak() {
          throw new Error("test audio failure");
        },
        cancel() {},
      },
    });
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await start(p);
  await createBox(p);
  await expect(
    p.getByText("部分插画加载失败，已提供文字替代。进度保留，可以继续。"),
  ).toBeVisible();
  await p.getByLabel("我的字母", { exact: true }).fill("b");
  await click(p, "重试资源");
  await expect(p.getByLabel("我的字母", { exact: true })).toHaveValue("b");
  failAsset = false;
  await click(p, "重试资源");
  await expect(
    p.getByText("部分插画加载失败，已提供文字替代。进度保留，可以继续。"),
  ).toHaveCount(0);
  await click(p, "听一听");
  await expect(p.locator(".app-footer")).toContainText("失败");
  await click(p, "说一句话");
  const bank = p.getByLabel("可用词块");
  for (const word of ["Put", "the", "cat", "on", "the", "box"])
    await bank
      .getByRole("button", { name: word, exact: true })
      .filter({ visible: true })
      .locator(":scope:not(:disabled)")
      .first()
      .click();
  await expect(p.locator(".sentence-line button")).toHaveCount(6);
  await click(p, "说出这句话");
  await expect(entity(p, "cat-companion")).toHaveAttribute(
    "data-place",
    "on:craft-box",
  );
  await click(p, "重新组句");
  for (const word of ["Open", "the", "door"])
    await bank
      .getByRole("button", { name: word, exact: true })
      .locator(":scope:not(:disabled)")
      .first()
      .click();
  await click(p, "说出这句话");
  await expect(p.getByRole("status")).toContainText("英语表达成立");
  await expect(p.locator(".sentence-line button")).toHaveCount(3);
  const before = await snapshot(p);
  await p.getByRole("button", { name: "句子第3块 door" }).click();
  await p.getByRole("button", { name: "词块左移" }).click();
  await expect(p.getByLabel("我的句子")).toContainText("Opendoorthe");
  expect(await snapshot(p)).toEqual(before);
  await p.getByRole("button", { name: "关闭工具" }).click();
  await expect(
    p.getByRole("button", { name: "说一句话", exact: true }),
  ).toBeFocused();
});
test("G08 legacy/corrupt/future bytes survive verified backup, export and storage failure", async ({
  browser,
}) => {
  for (const raw of [
    encodeAdventure(initialAdventure("historical")),
    "{broken-json",
    JSON.stringify({ schema: 99, journal: [], completed: true }),
  ]) {
    const context = await browser.newContext();
    const p = await context.newPage();
    const key = raw.startsWith('{"schema":4')
      ? "xueli.adventure.v4"
      : "xueli.quest.v6";
    await p.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    });
    await p.goto("/");
    await expect(p.getByRole("alert")).toBeVisible();
    const download = p.waitForEvent("download");
    await p.getByRole("button", { name: "导出记录", exact: true }).click();
    const downloaded = await download;
    expect(downloaded.suggestedFilename()).toBe("xueli-records.json");
    await click(p, "保留旧档，开始新冒险 →");
    await entity(p, "cat-companion").click();
    await click(p, "small");
    const preserved = await p.evaluate(
      ({ key, raw }) =>
        Object.keys(localStorage).some(
          (k) =>
            k.startsWith(key + ".backup.") && localStorage.getItem(k) === raw,
        ),
      { key, raw },
    );
    expect(preserved).toBe(true);
    await expect(
      p.getByRole("heading", { name: "围栏那边的篮子" }),
    ).toBeVisible();
    await context.close();
  }
  const context = await browser.newContext();
  const p = await context.newPage();
  await p.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "xueli.quest.v6")
        throw new DOMException("Quota", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await start(p);
  await entity(p, "cat-companion").click();
  await click(p, "small");
  await expect(p.getByRole("alert")).toContainText("保存失败");
  await expect(entity(p, "cat-companion")).toHaveAttribute(
    "data-size",
    "small",
  );
  await context.close();
});
test("G09 workshop teaching, independent exercise, demonstration, word book and refresh", async ({
  page: p,
}) => {
  await start(p);
  await click(p, "魔法工坊");
  await click(p, "独立指令");
  await expect(p.getByRole("status")).toContainText("先认识");
  await click(p, "词义小样");
  for (const word of ["apple", "box", "put", "in"])
    await p
      .locator(".meaning-tabs")
      .getByRole("button", { name: word, exact: true })
      .click();
  await click(p, "独立指令");
  await p.getByText("也可以打字", { exact: true }).click();
  await p
    .getByLabel("输入句子", { exact: true })
    .fill("Put the apple in the box.");
  await click(p, "提交句子");
  let state = await snapshot(p);
  expect(state.events.at(-1).evidence).toBe("independent");
  await expect(entity(p, "apple-main")).toHaveAttribute(
    "data-place",
    "in:box-main",
  );
  await click(p, "看一次示范");
  await p.getByRole("button", { name: "撤销世界行动" }).click();
  await click(p, "提交句子");
  state = await snapshot(p);
  expect(state.events.at(-1).evidence).toBe("demonstrated");
  await click(p, "词语册");
  await expect(p.getByRole("heading", { name: /apple 苹果/ })).toBeVisible();
  await click(p, "魔法工坊");
  await p.reload();
  await click(p, "继续冒险 →");
  await expect(
    p.getByRole("heading", { name: "词语的魔法工坊" }),
  ).toBeVisible();
});
test("G10 responsive surfaces, reduced motion and assets on real HTTP", async ({
  page: p,
}) => {
  const errors = [],
    images = new Set();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("response", (r) => {
    if (r.url().includes("/assets/game/")) {
      expect([200, 304]).toContain(r.status());
      images.add(r.url().split("/assets/game/")[1]);
    }
  });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await start(p);
  await createBox(p);
  await entity(p, "craft-box").click();
  await click(p, "big");
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
  ]) {
    await p.setViewportSize(viewport);
    await expect(p.locator("body")).toHaveJSProperty(
      "scrollWidth",
      viewport.width,
    );
    await expect(entity(p, "craft-box")).toHaveAttribute("data-size", "big");
    await p.screenshot({
      path: `docs/evidence/gameplay-refoundation-06/viewport-${viewport.width}.png`,
      fullPage: true,
    });
  }
  await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await p.reload();
  await click(p, "继续冒险 →");
  await expect(entity(p, "craft-box")).toHaveAttribute("data-size", "big");
  expect(errors).toEqual([]);
  writeFileSync(
    "docs/evidence/gameplay-refoundation-06/http-assets.json",
    JSON.stringify({ images: [...images].sort(), errors }, null, 2) + "\n",
  );
});
test("G06 sentence pointer insertion/return and interrupted motion cannot commit twice", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 1440, height: 1000 });
  await start(p);
  await createBox(p);
  await click(p, "说一句话");
  const bank = p.getByLabel("可用词块"),
    line = p.getByLabel("我的句子");
  const drag = async (source, target) => {
    const a = await center(source),
      b = await center(target);
    await p.mouse.move(a.x, a.y);
    await p.mouse.down();
    await p.mouse.move(b.x, b.y, { steps: 8 });
    await p.mouse.up();
  };
  await drag(bank.getByRole("button", { name: "Open", exact: true }), line);
  await expect(line.locator("button")).toHaveCount(1);
  await bank.getByRole("button", { name: "the", exact: true }).first().click();
  await bank.getByRole("button", { name: "box", exact: true }).click();
  await drag(
    line.getByRole("button", { name: "句子第3块 box" }),
    line.getByRole("button", { name: "句子第1块 Open" }),
  );
  await expect(line).toContainText("boxOpenthe");
  await drag(line.getByRole("button", { name: "句子第1块 box" }), bank);
  await expect(line.locator("button")).toHaveCount(2);
  await entity(p, "cat-companion").click();
  await click(p, "small");
  await p.locator('[data-node="inside"]').click();
  const at = await snapshot(p);
  await p.getByRole("button", { name: "撤销世界行动" }).click();
  await p.getByRole("button", { name: "暂停与设置" }).click();
  await p.getByLabel("减少动画").check();
  await click(p, "返回");
  await expect(entity(p, "cat-companion")).toHaveAttribute(
    "data-place",
    "node:home",
  );
  const undone = await snapshot(p);
  expect(undone.revision).toBe(at.revision + 1);
  await p.reload();
  await click(p, "继续冒险 →");
  await expect(entity(p, "cat-companion")).toHaveAttribute(
    "data-place",
    "node:home",
  );
  expect((await snapshot(p)).revision).toBe(undone.revision);
});
