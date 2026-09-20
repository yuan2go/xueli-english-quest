import { test, expect, chromium, webkit } from '@playwright/test';
import { start, button, object, word, morph, move, snapshot, demo } from './helpers.mjs';

async function rejectsNativeGestures(locator) {
  const allowed = await locator.evaluate((element) => ({
    menu: element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
    drag: element.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true })),
  }));
  expect(allowed, 'game pieces must not yield to the native menu or HTML drag').toEqual({ menu: false, drag: false });
}

async function gameProgress(page) {
  const saved = await snapshot(page);
  // Audio receipts may complete while a finger is held. They are not a game attempt.
  return {
    world: saved.projection.story.world,
    facts: saved.projection.story.facts,
    events: saved.projection.events,
    commands: saved.journal.filter(command => command.action !== 'audio'),
  };
}

// Chromium supplies real touch packets; desktop WebKit exercises the same Pointer
// adapter with a mouse. Neither engine can verify an iPhone's native browser UI.
async function gesture(page, touch, source, destination, { cancel = false } = {}) {
  await source.scrollIntoViewIfNeeded();
  const a = await source.boundingBox();
  const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
  else { await page.mouse.move(from.x, from.y); await page.mouse.down(); }
  await page.waitForTimeout(750); // Exercise the hold-before-drag window, not just a fast flick.
  await rejectsNativeGestures(source);
  const b = await destination.boundingBox();
  const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...to, id: 1 }] });
  else await page.mouse.move(to.x, to.y, { steps: 6 });
  await expect(page.locator('.drag-ghost')).toBeVisible();
  if (touch) await touch.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  else { if (cancel) await page.keyboard.press('Escape'); await page.mouse.up(); }
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
  expect(await page.evaluate(() => getSelection().toString())).toBe('');
}

for (const engine of [chromium, webkit]) {
    test(`${engine.name()}: held art, letters and words keep game input; cancellation and records remain usable`, async ({ baseURL }) => {
      const browser = await engine.launch();
      try {
      const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      const p = await context.newPage();
      const touch = engine === chromium ? await p.context().newCDPSession(p) : null;
      await start(p);
      await rejectsNativeGestures(p.locator('.quest-background'));
      expect(await p.locator('.quest-background').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
      await button(p, '唤醒伙伴').tap();
      const initial = await gameProgress(p);
      await gesture(p, touch, button(p, '字母 c'), button(p, '第1格 空'), { cancel: true });
      await expect(button(p, '第1格 空')).toBeVisible();
      expect(await gameProgress(p)).toEqual(initial);
      await gesture(p, touch, button(p, '字母 c'), button(p, '第1格 空'));
      await expect(button(p, '第1格 c')).toBeFocused();
      for (const letter of 'at') { await button(p, `字母 ${letter}`).focus(); await p.keyboard.press('Enter'); }
      await p.getByRole('button', { name: /^施法/ }).click();
      await word(p, 'bag', 'bag');
      await word(p, 'hat', 'hat');
      await morph(p, 'cat-card', 'p');
      await word(p, 'map', 'map', true);
      await button(p, '沿小径出发 →').tap();
      await rejectsNativeGestures(p.locator('.quest-background'));
      await morph(p, 'route-sheet', 't');
      expect(await object(p, 'route-sheet').locator('.item-label').evaluate(el => getComputedStyle(el).webkitUserSelect)).toBe('none');
      await gesture(p, touch, object(p, 'route-sheet'), button(p, '湿墨小径'));
      await expect(p.locator('.quest-scene')).toHaveAttribute('data-crossed', 'true');
      const committed = (await snapshot(p)).projection.story.world;
      await p.reload();
      await button(p, '继续冒险').tap();
      expect((await snapshot(p)).projection.story.world).toEqual(committed);
      await move(p, 'route-sheet', '放回地面 / 取出 / 摘下');
      await morph(p, 'route-sheet', 'p');
      await button(p, '跟着地图去草地 →').tap();
      await word(p, 'mat', 'mat', true);
      await button(p, '帮背包收一件东西').tap();
      await demo(p);
      const beforeDraft = await gameProgress(p);
      const token = p.locator('.word-blocks button').filter({ hasText: /^Put$/ });
      await gesture(p, touch, token, p.getByLabel('句尾放词'));
      await expect(p.locator('.sentence-line')).toHaveText('Put');
      expect(await gameProgress(p)).toEqual(beforeDraft);
      await gesture(p, touch, button(p, '句子第1块 Put'), p.locator('.word-blocks'), { cancel: true });
      await expect(p.locator('.sentence-line')).toHaveText('Put');
      await button(p, '句子第1块 Put').focus();
      await p.keyboard.press('Enter');
      await button(p, '撤回词块').click();
      await expect(p.locator('.sentence-line button')).toHaveCount(0);
      await button(p, '暂停').tap();
      await button(p, '本地记录与导出').tap();
      const heading = p.locator('.quest-records h1');
      // The protection belongs to the game, not a document-wide listener/style.
      expect(await heading.evaluate(el => el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))).toBe(true);
      await heading.dblclick();
      expect(await p.evaluate(() => getSelection().toString().length)).toBeGreaterThan(0);
      if (touch) await touch.detach();
      } finally { await browser.close(); }
    });
}

test('touch scrolling of the tool remains native while the world stays visible', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
  const p = await context.newPage();
  await start(p);
  await button(p, '唤醒伙伴').tap();
  const scene = await p.locator('.quest-scene').boundingBox();
  const sheet = p.locator('.quest-tools');
  const box = await sheet.boundingBox();
  const touch = await context.newCDPSession(p);
  const x = box.x + box.width - 4;
  const y = box.y + box.height - 20;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  for (let d = 20; d <= 140; d += 20) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - d, id: 1 }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => sheet.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await p.locator('.quest-scene').boundingBox()).toEqual(scene);
  await expect(p.locator('.drag-ghost')).toHaveCount(0);
  await context.close();
});
