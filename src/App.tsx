import { useState } from 'react';
import { transition } from './domain/world.ts';
import type { Effect, World } from './domain/world.ts';

const operations: { title: string; effect: Effect }[] = [
  { title: '创建地图 map', effect: { type: 'spawn', entity: {
    id: 'route-sheet', word: 'map', kind: 'object', location: { kind: 'stage' },
  } } },
  { title: 'map → mat', effect: { type: 'transform', sourceId: 'route-sheet', to: 'mat' } },
  { title: '铺路并让小猫通过', effect: { type: 'place', sourceId: 'route-sheet', target: { kind: 'zone', id: 'ink-road' } } },
  { title: 'mat → map', effect: { type: 'transform', sourceId: 'route-sheet', to: 'map' } },
];
function initialWorld(): World {
  return { revision: 0, flags: [], entities: {
    'cat-companion': { id: 'cat-companion', word: 'cat', kind: 'actor', location: { kind: 'stage' } },
  } };
}
export default function App() {
  const [model, setModel] = useState(() => ({ world: initialWorld(), step: 0, error: '' }));
  const active = operations[model.step];
  function execute() {
    setModel(previous => {
      if (previous.world.revision !== model.world.revision || !active) return previous;
      try {
        const world = transition(previous.world, { expectedRevision: previous.world.revision, effect: active.effect });
        return { world, step: previous.step + 1, error: '' };
      } catch (error) {
        return { ...previous, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }
  return <main>
    <header><p className="eyebrow">WORDSPELL / 开发初始化</p>
      <h1>雪梨单词魔法师</h1><p>拼出单词，创造物品；改变字母，改变故事。</p>
    </header>
    <section className="notice" aria-label="当前实现范围">
      <strong>这是领域逻辑验证台，不是完整游戏。</strong>
      <p>当前按钮直接执行状态命令。字母拼写、触屏拖放、正式音频、存档和十二关由后续工作包实现。</p>
    </section>
    <section className="stage" aria-labelledby="scene-title">
      <h2 id="scene-title">小猫的野餐冒险 · 核心机制</h2>
      <div className="objects">{Object.values(model.world.entities).map(entity => <article key={entity.id}>
        <span lang="en" className="word">{entity.word}</span><small>{entity.id}</small>
        <p>{entity.location.kind === 'zone' ? '铺在湿墨上' : '操作区'}</p>
      </article>)}</div>
      <p role="status" aria-live="polite">{model.world.flags.includes('crossed-ink') ? '逻辑状态：已通过湿墨。' : '逻辑状态：尚未通过湿墨。'}</p>
    </section>
    <section className="controls" aria-label="开发验证操作">
      <button onClick={execute} disabled={!active}>{active?.title ?? '核心状态转换验证结束'}</button>
      <button className="secondary" onClick={() => setModel({ world: initialWorld(), step: 0, error: '' })}>重置验证台</button>
    </section>
    {model.error && <p role="alert">{model.error}</p>}
    <footer>下一步：docs/work-packages/WP-01.md。版本说明与未验证项见 docs/STATUS.md。</footer>
  </main>;
}
