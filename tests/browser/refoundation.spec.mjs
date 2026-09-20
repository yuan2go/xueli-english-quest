import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const evidence = "docs/evidence/gameplay-refoundation-06";
const obj = (page, id) => page.locator(`[data-entity="${id}"]`);
async function select(page, id) {
  await obj(page, id).click();
}
async function action(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
}
async function node(page, id) {
  await page.locator(`[data-node="${id}"]`).click();
}
async function start(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "开始冒险 →", exact: true }).click();
}
export async function solve(page, method) {
  if (method === "step") {
    await action(page, "✧ 拼词造物");
    await action(page, "先认识这个词");
    await action(page, "✧ 拼词造物");
    await page.getByLabel("我的字母", { exact: true }).fill("box");
    await action(page, "施法造物");
    await select(page, "craft-box");
    await node(page, "step");
    await action(page, "big");
    await select(page, "cat-companion");
    await action(page, "on box · 放上");
    await select(page, "gate");
    await action(page, "Open · 打开");
  } else {
    await select(page, "cat-companion");
    await action(page, "small");
    await node(page, "inside");
    await select(page, "gate");
    await action(page, "Open · 打开");
    await select(page, "cat-companion");
    await action(page, "原来大小");
  }
  await select(page, "basket-main");
  await node(page, "home");
  await expect(page.locator(".goal-ribbon")).toContainText("✓");
  if (await page.locator('[data-level="R1"]').count())
    await expect(
      page.getByRole("button", { name: "沿小径继续 →" }),
    ).toBeVisible();
}
test("R1 real home: two mechanically distinct solutions, undo and refresh", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  await select(page, "basket-main");
  await node(page, "home");
  await expect(page.getByRole("status")).toContainText("过不去");
  await expect(obj(page, "basket-main")).toHaveAttribute(
    "data-place",
    "node:garden",
  );
  await solve(page, "step");
  await mkdir(evidence, { recursive: true });
  await page.getByRole("button", { name: "跳过动作" }).click();
  await page.screenshot({ path: `${evidence}/r1-step.png`, fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "继续冒险 →" }).click();
  await expect(obj(page, "basket-main")).toHaveAttribute(
    "data-place",
    "node:home",
  );
  await page.getByRole("button", { name: "暂停与设置" }).click();
  await action(page, "重开本关（保留尝试记录）");
  await solve(page, "hole");
  await page.getByRole("button", { name: "跳过动作" }).click();
  await page.screenshot({ path: `${evidence}/r1-hole.png`, fullPage: true });
  expect(errors).toEqual([]);
});
async function sentence(page, text) {
  await action(page, "说一句话");
  if (!(await page.getByLabel("输入句子", { exact: true }).isVisible()))
    await page.getByText("也可以打字", { exact: true }).click();
  await page.getByLabel("输入句子", { exact: true }).fill(text);
  await action(page, "提交句子");
}
test("G09 full mobile chapter, workshop/book, request, actual ending and changed revisit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await solve(page, "hole");
  await action(page, "沿小径继续 →");
  await expect(
    page.getByRole("heading", { name: "装得下，也带得走" }),
  ).toBeVisible();
  await select(page, "apple-main");
  await action(page, "in bag · 放入");
  await expect(page.getByRole("status")).toContainText("打开");
  await select(page, "bag-main");
  await action(page, "Open · 打开");
  await select(page, "apple-main");
  await action(page, "small");
  await action(page, "in bag · 放入");
  await select(page, "bag-main");
  await action(page, "Close · 关上");
  await node(page, "clearing");
  await expect(obj(page, "bag-main")).toHaveAttribute(
    "data-place",
    "node:clearing",
  );
  await action(page, "沿小径继续 →");
  await expect(
    page.getByRole("heading", { name: "朋友的一句请求" }),
  ).toBeVisible();
  await action(page, "看文字辅助");
  await sentence(page, "Open the door.");
  await sentence(page, "Put the apple on the box.");
  await expect(page.getByRole("status")).toContainText("另一种摆放");
  await sentence(page, "The apple is on the box.");
  await expect(page.getByRole("status")).toContainText("描述得对");
  await sentence(page, "Put the apple in the basket.");
  await expect(
    page.getByRole("heading", { name: "这一份心意，送到了。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过动作" }).click();
  await page.screenshot({
    path: `${evidence}/phone-ending.png`,
    fullPage: true,
  });
  await action(page, "魔法工坊");
  await expect(
    page.getByRole("heading", { name: "词语的魔法工坊" }),
  ).toBeVisible();
  await select(page, "cat-companion");
  await action(page, "big");
  await action(page, "去冒险");
  await expect(obj(page, "cat-companion")).toHaveAttribute(
    "data-size",
    "normal",
  );
  await action(page, "词语册");
  await expect(
    page.getByRole("heading", { name: "词语册", exact: true }),
  ).toBeVisible();
  await action(page, "去冒险");
  await action(page, "雨后，再回花园");
  await select(page, "cat-companion");
  await action(page, "small");
  await node(page, "inside");
  await expect(page.getByRole("status")).toContainText("过不去");
  await page.getByRole("button", { name: "暂停与设置" }).click();
  await action(page, "重开本关（保留尝试记录）");
  await solve(page, "step");
  await page.reload();
  await page.getByRole("button", { name: "继续冒险 →" }).click();
  await expect(
    page.getByRole("heading", { name: "再访 · 雨后的小花园" }),
  ).toBeVisible();
  await expect(obj(page, "basket-main")).toHaveAttribute(
    "data-place",
    "node:home",
  );
});
