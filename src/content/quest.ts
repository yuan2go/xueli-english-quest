import type { SpatialRules, SpatialWorld, Thing, Place } from '../domain/spatial.ts';
export const QUEST_PACK = { id: 'paper-rescue', version: '6.0.0-dev.1', rulesVersion: 'rescue-1', review: 'PENDING' } as const;
export const LEXICON = [
  { word: 'cat', zh: '小猫', meaning: '我们的伙伴；大小会变，还是同一只小猫。', example: 'The cat is small.', asset: 'cat' },
  { word: 'box', zh: '箱子', meaning: '能装东西，也能托住东西。', example: 'Open the box.', asset: 'box' },
  { word: 'door', zh: '门', meaning: '打开后，小猫和物品才可以通过。', example: 'Open the door.', asset: 'door' },
  { word: 'basket', zh: '篮子', meaning: '把野餐的东西带在一起。', example: 'The apple is in the basket.', asset: 'basket' },
  { word: 'apple', zh: '苹果', meaning: '今天要送给朋友的水果。', example: 'Put the apple in the bag.', asset: 'apple' },
  { word: 'bag', zh: '背包', meaning: '打开袋口，才可以放入或取出。', example: 'Open the bag.', asset: 'bag' },
  { word: 'mat', zh: '垫子', meaning: '平铺在地上，东西可以放在上面。', example: 'Put the basket on the mat.', asset: 'mat' },
  { word: 'small', zh: '小的', meaning: '同一个物品变小；更容易通过窄处或装进去。', example: 'Make the box small.', asset: 'box' },
  { word: 'big', zh: '大的', meaning: '同一个物品变大；更高，也更占地方。', example: 'Make the box big.', asset: 'box' },
  { word: 'open', zh: '打开', meaning: '打开一个有门或开口的物品。', example: 'Open the box.', asset: 'box' },
  { word: 'close', zh: '关上', meaning: '关上后，里面的物品还在，但不能直接取出。', example: 'Close the bag.', asset: 'bag' },
  { word: 'in', zh: '在里面', meaning: '放进容器的内部。', example: 'Put the apple in the box.', asset: 'box' },
  { word: 'on', zh: '在上面', meaning: '由下面的物品托住。', example: 'Put the apple on the box.', asset: 'box' },
  { word: 'put', zh: '放', meaning: '这是请小猫行动的指令。', example: 'Put the apple on the mat.', asset: 'apple' },
  { word: 'is', zh: '是 / 在', meaning: '说出眼前的情况，物品不会因此移动。', example: 'The box is small.', asset: 'box' },
] as const;
export const lexeme = (word: string) => LEXICON.find(l => l.word === word);
export const TYPES: SpatialRules['types'] = {
  cat: { actor: true, resize: true },
  box: { resize: true, container: true, support: true, capacity: [1, 3, 5], height: [0.5, 1, 2], bearing: [1, 2, 3] },
  basket: { resize: true, container: true, capacity: [1, 2, 4] },
  bag: { resize: true, container: true, capacity: [1, 2, 4] },
  apple: { resize: true },
  mat: { resize: true, support: true, height: [0, 0, 0], bearing: [1, 2, 3] },
  door: { fixed: true, resize: false },
};
export type Goal = { type: 'at'; id: string; node: string } | { type: 'relation'; id: string; kind: 'in' | 'on'; target: string } | { type: 'delivered'; id: string; node: string; containers: string[] };
export interface Puzzle {
  id: string; title: string; subtitle: string; invitation: string; goalText: string; rules: SpatialRules;
  initial: SpatialWorld; goals: Goal[]; words: string[]; hint: string; request?: string; requestRelation?: 'in' | 'on';
}
export const entity = (id: string, word: string, node: string, size: Thing['size'] = 'normal', open = true): Thing => ({ id, word, size, open, place: { kind: 'node', id: node } });
const initial = (entities: Thing[]): SpatialWorld => ({ rules: 'rescue-1', revision: 0, entities: Object.fromEntries(entities.map(e => [e.id, e])), created: [] });
const fenceRules: SpatialRules = {
  types: TYPES,
  nodes: [
    { id: 'home', label: '集合点', x: 14, y: 73, clearance: 3 },
    { id: 'step', label: '门外', x: 37, y: 57, clearance: 3 },
    { id: 'inside', label: '门内', x: 66, y: 57, clearance: 3 },
    { id: 'garden', label: '花园', x: 84, y: 75, clearance: 3 },
    { id: 'hole', label: '小洞', x: 51, y: 86, clearance: 1 },
  ],
  edges: [
    { a: 'home', b: 'step', clearance: 3, enabled: true },
    { a: 'step', b: 'inside', clearance: 3, enabled: true, door: 'gate' },
    { a: 'inside', b: 'garden', clearance: 3, enabled: true },
    { a: 'step', b: 'hole', clearance: 1, enabled: true },
    { a: 'hole', b: 'inside', clearance: 1, enabled: true },
  ],
  handles: [{ door: 'gate', node: 'step', height: 4 }, { door: 'gate', node: 'inside', height: 1 }],
  quotas: [{ id: 'craft-box', word: 'box', node: 'home' }],
};
export function puzzle(id: string, variant = 0): Puzzle {
  const rules = structuredClone(fenceRules);
  if (id === 'R1-R') rules.edges.filter(e => e.a === 'hole' || e.b === 'hole').forEach(e => { e.enabled = false; });
  return {
    id, title: id === 'R1-R' ? '再访 · 雨后的小花园' : '围栏那边的篮子', subtitle: '纸上小径 · 第一页',
    invitation: id === 'R1-R' ? '下雨后，小洞被纸叶堵住了。还能把篮子带回来吗？' : '篮子落在花园里了。小猫够不到门外的高把手，你会怎么办？',
    goalText: '把篮子和小猫带回集合点', rules,
    initial: initial([entity('cat-companion', 'cat', 'home'), entity('gate', 'door', 'step', 'normal', false), entity('basket-main', 'basket', 'garden')]),
    goals: [{ type: 'at', id: 'cat-companion', node: 'home' }, { type: 'at', id: 'basket-main', node: 'home' }],
    words: ['cat', 'basket', 'box', 'door', 'small', 'big', 'open', 'close'],
    hint: id === 'R1-R' ? '洞口堵住了。看看把手的高度和能托住小猫的物品。' : '门两边的把手不一样高。箱子能托住小猫，小洞只容得下很小的身体。',
    ...(variant < 0 ? {} : {}),
  };
}
export function relationIs(place: Place, kind: 'in' | 'on', id: string) { return place.kind === kind && place.id === id; }
export const QUEST_AUDIO = [...new Set([...LEXICON.flatMap(l => [l.word, l.example]), 'Put the apple in the basket.', 'Put the apple on the box.'])].map((text, i) => ({
  id: `rescue-voice-${i}`, text, path: null, sha256: null, bytes: null, review: 'PENDING' as const,
  locale: 'en-US', version: 'rescue-speech-dev-1', source: 'Browser development TTS; recording and teaching review PENDING', type: 'audio/mpeg' as const, durationMs: null,
}));
