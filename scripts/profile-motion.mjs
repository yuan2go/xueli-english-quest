import { chromium } from '@playwright/test';
import { start, word, object } from '../tests/browser/helpers.mjs';
import { writeFile } from 'node:fs/promises';

// A reproducible engineering sample, not a physical-device FPS or release gate.
const [baseURL = 'http://127.0.0.1:4186', output, label = 'working-tree'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
const runs = [];
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, baseURL });
    try {
      const p = await context.newPage();
      const cdp = await context.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await start(p);
      await word(p, 'wake', 'cat');
      await word(p, 'bag', 'bag');
      await p.waitForTimeout(2700);
      await cdp.send('Performance.enable');
      await p.evaluate(() => {
        window.__sample = { frames: [], styles: 0, moves: 0 };
        let prev = performance.now();
        window.__frame = requestAnimationFrame(function tick(t) {
          window.__sample.frames.push(t - prev);
          prev = t;
          window.__frame = requestAnimationFrame(tick);
        });
        window.__observer = new MutationObserver(ms => {
          window.__sample.styles += ms.filter(m => m.type === 'attributes' && m.attributeName === 'style').length;
        });
        window.__observer.observe(document.querySelector('.quest-scene'), { attributes: true, subtree: true, attributeFilter: ['style'] });
        window.__move = () => window.__sample.moves++;
        window.addEventListener('pointermove', window.__move);
      });
      const before = await cdp.send('Performance.getMetrics');
      const a = await object(p, 'bag-main').boundingBox();
      const x = a.x + a.width / 2, y = a.y + a.height * .65;
      await p.mouse.move(x, y);
      await p.mouse.down();
      for (let i = 0; i < 120; i++)
        await p.mouse.move(x + Math.sin(i / 119 * Math.PI * 4) * 65, y - 40 - Math.sin(i / 119 * Math.PI * 2) * 30);
      await p.keyboard.press('Escape');
      await p.mouse.up();
      const after = await cdp.send('Performance.getMetrics');
      const sample = await p.evaluate(() => {
        cancelAnimationFrame(window.__frame);
        window.__observer.disconnect();
        window.removeEventListener('pointermove', window.__move);
        return window.__sample;
      });
      const delta = {};
      for (const name of ['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'])
        delta[name] = after.metrics.find(m => m.name === name).value - before.metrics.find(m => m.name === name).value;
      const frames = sample.frames.slice(1).sort((a, b) => a - b);
      runs.push({ run, ...delta, pointerMoves: sample.moves, styleMutations: sample.styles,
        frames: frames.length, frameMedian: frames[Math.floor(frames.length * .5)],
        frameP95: frames[Math.floor(frames.length * .95)], framesOver33ms: frames.filter(x => x > 33.4).length });
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const report = { label, environment: 'Chromium headless, 390x844, CDP CPU 4x; actual normal entry wake+bag then 120 pointer moves and Escape; engineering measurement, not physical-device FPS', runs };
if (output) await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
