/** Finite authored geometry; coordinates are presentation only. */
export type Size = 'small' | 'normal' | 'big';
export type Place = { kind: 'node'; id: string } | { kind: 'in' | 'on'; id: string };
export interface Thing { id: string; word: string; size: Size; place: Place; open: boolean }
export interface SpatialWorld { rules: 'rescue-1'; revision: number; entities: Record<string, Thing>; created: string[] }
export interface Archetype {
  actor?: boolean; fixed?: boolean; resize: boolean; container?: boolean; support?: boolean;
  capacity?: [number, number, number]; height?: [number, number, number]; bearing?: [number, number, number];
}
export interface Node { id: string; label: string; x: number; y: number; clearance: number }
export interface Edge { a: string; b: string; clearance: number; door?: string; enabled: boolean }
export interface SpatialRules {
  nodes: Node[]; edges: Edge[]; types: Record<string, Archetype>;
  handles: { door: string; node: string; height: number }[];
  quotas: { id: string; word: string; node: string }[];
}
export type Action =
  | { type: 'move'; source: string; to: Place }
  | { type: 'resize'; source: string; size: Size }
  | { type: 'open'; source: string; open: boolean }
  | { type: 'create'; word: string };
export interface Motion { id: string; nodes: string[] }
export class RuleError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; this.name = 'RuleError'; }
}
function fail(code: string, message: string): never { throw new RuleError(code, message); }
export const extent = (size: Size) => ({ small: 1, normal: 2, big: 3 })[size];
const value = (table: [number, number, number] | undefined, size: Size) => table?.[extent(size) - 1] ?? 0;
export function thing(w: SpatialWorld, id: string): Thing {
  return Object.hasOwn(w.entities, id) ? w.entities[id] : fail('REFERENCE', '这个物品已经不在这里了。');
}
export function nodeOf(w: SpatialWorld, id: string, visited = new Set<string>()): string {
  if (visited.has(id)) return fail('CYCLE', '物品不能装进自己里面。');
  visited.add(id);
  const e = thing(w, id);
  return e.place.kind === 'node' ? e.place.id : nodeOf(w, e.place.id, visited);
}
export function children(w: SpatialWorld, id: string): Thing[] {
  return Object.values(w.entities).filter(e => e.place.kind !== 'node' && e.place.id === id);
}
export function visible(w: SpatialWorld, id: string): boolean {
  const e = thing(w, id);
  if (e.place.kind === 'node') return true;
  const parent = thing(w, e.place.id);
  return (e.place.kind !== 'in' || parent.open) && visible(w, parent.id);
}
export function path(w: SpatialWorld, rules: SpatialRules, from: string, to: string, clearance: number): string[] | undefined {
  const queue = [[from]], visited = new Set([from]);
  while (queue.length) {
    const route = queue.shift()!, at = route.at(-1)!;
    if (at === to) return route;
    for (const edge of rules.edges) {
      const next = edge.a === at ? edge.b : edge.b === at ? edge.a : undefined;
      if (!next || visited.has(next) || !edge.enabled || clearance > edge.clearance ||
        (edge.door && !thing(w, edge.door).open) || clearance > rules.nodes.find(n => n.id === next)!.clearance) continue;
      visited.add(next); queue.push([...route, next]);
    }
  }
}
function requirePath(w: SpatialWorld, r: SpatialRules, from: string, to: string, clearance: number) {
  return path(w, r, from, to, clearance) ?? fail('PATH', '这里过不去：看看门、洞口，以及小猫和物品的大小。');
}
function type(r: SpatialRules, e: Thing) {
  return Object.hasOwn(r.types, e.word) ? r.types[e.word] : fail('TYPE', '这里还没有这种词语工具。');
}
function relation(w: SpatialWorld, r: SpatialRules, e: Thing) {
  if (e.place.kind === 'node') {
    const n = r.nodes.find(n => n.id === e.place.id);
    if (!n || extent(e.size) > n.clearance) fail('CLEARANCE', '这里太窄，先换个地方再改变大小。');
    return;
  }
  nodeOf(w, e.id);
  const p = thing(w, e.place.id), a = type(r, p);
  if (e.place.kind === 'in') {
    if (!a.container || type(r, e).actor) fail('CONTAINER', '这个对象不能这样装进去。');
    const load = children(w, p.id).filter(c => c.place.kind === 'in').reduce((n, c) => n + extent(c.size), 0);
    if (load > value(a.capacity, p.size)) fail('CAPACITY', '装不下了：试试改变物品或容器的大小。');
  } else {
    if (!a.support || extent(e.size) > value(a.bearing, p.size)) fail('SUPPORT', '这个支撑太小，托不住。先调整大小。');
  }
}
export function assertSpatial(w: SpatialWorld, r: SpatialRules) {
  if (w.rules !== 'rescue-1' || !Number.isSafeInteger(w.revision) || w.revision < 0) fail('WORLD', '世界版本无效。');
  if (new Set(w.created).size !== w.created.length || w.created.some(id => !r.quotas.some(q => q.id === id))) fail('QUOTA', '制作记录无效。');
  let actors = 0;
  for (const [id, e] of Object.entries(w.entities)) {
    if (id !== e.id || !/^[a-z][a-z0-9-]{0,63}$/.test(id) || !['small', 'normal', 'big'].includes(e.size) || typeof e.open !== 'boolean') fail('WORLD', '物品记录无效。');
    if (type(r, e).actor) { actors++; if (id !== 'cat-companion') fail('IDENTITY', '伙伴只有这一只。'); }
    relation(w, r, e);
  }
  if (actors !== 1) fail('IDENTITY', '伙伴身份必须保持。');
}
/** Called only by domain.transition. Validates a complete draft before publishing any effect. */
export function applySpatial(w: SpatialWorld, action: Action, r: SpatialRules): { world: SpatialWorld; motions: Motion[] } {
  assertSpatial(w, r);
  const next = structuredClone(w), motions: Motion[] = [];
  const cat = thing(next, 'cat-companion');
  if (action.type === 'create') {
    const quota = r.quotas.find(q => q.word === action.word);
    if (!quota || type(r, { word: action.word } as Thing).actor) fail('QUOTA', '这里不能制作这个物品。');
    if (next.entities[quota.id]) fail('QUOTA', '这个物品已经在场景里了。');
    // An undone creation may restore the same reserved identity, never a fresh quota.
    if (!next.created.includes(quota.id)) next.created.push(quota.id);
    next.entities[quota.id] = { id: quota.id, word: quota.word, size: 'normal', open: true, place: { kind: 'node', id: quota.node } };
  } else {
    const e = thing(next, action.source), a = type(r, e);
    if (!visible(next, e.id)) fail('CLOSED', '物品还在关闭的容器里。先打开它。');
    if (action.type === 'resize') {
      if (!a.resize) fail('FIXED', '这个物品固定在场景中，不能改变大小。');
      if (children(next, e.id).some(c => c.place.kind === 'on')) fail('OCCUPIED', '上面还有东西。先下来或搬开，再改变大小。');
      e.size = action.size;
    } else if (action.type === 'open') {
      const handles = r.handles.filter(h => h.door === e.id);
      if (!a.container && !handles.length) fail('OPEN', '这个物品没有可以打开的部分。');
      const from = nodeOf(next, cat.id);
      if (handles.length) {
        const candidates = handles.map(h => {
          const route = path(next, r, from, h.node, extent(cat.size));
          const support = cat.place.kind === 'on' && from === h.node ? thing(next, cat.place.id) : undefined;
          const height = extent(cat.size) + (support ? value(type(r, support).height, support.size) : 0);
          return { h, route, height };
        });
        const allowed = candidates.find(c => c.route && c.height >= c.h.height);
        if (!allowed) fail('HANDLE', '小猫够不到把手。高处需要支撑，另一侧也许有办法。');
        if (from !== allowed.h.node) cat.place = { kind: 'node', id: allowed.h.node };
        motions.push({ id: cat.id, nodes: allowed.route! });
      } else {
        const target = nodeOf(next, e.id), route = requirePath(next, r, from, target, extent(cat.size));
        cat.place = { kind: 'node', id: target }; motions.push({ id: cat.id, nodes: route });
      }
      e.open = action.open;
    } else if (action.type === 'move') {
      if (a.fixed) fail('FIXED', '它固定在这里，小猫可以走过去操作。');
      const target = action.to.kind === 'node' ? action.to.id : nodeOf(next, action.to.id);
      if (!r.nodes.some(n => n.id === target)) fail('REFERENCE', '这里没有落点。');
      if (action.to.kind !== 'node') {
        if (action.to.id === e.id) fail('CYCLE', '物品不能放进自己。');
        const parent = thing(next, action.to.id);
        if (!visible(next, parent.id) || (action.to.kind === 'in' && !parent.open)) fail('CLOSED', '先打开容器，再放进去。');
      }
      const from = nodeOf(next, cat.id), source = nodeOf(next, e.id);
      const approach = requirePath(next, r, from, source, extent(cat.size));
      if (!a.actor && extent(e.size) > extent(cat.size) + 1) fail('CARRY', '现在的小猫搬不动这么大的物品。');
      if (children(next, e.id).some(c => c.place.kind === 'on')) fail('OCCUPIED', '上面还有东西，先移开再搬运。');
      const route = requirePath(next, r, source, target, Math.max(extent(cat.size), extent(e.size)));
      e.place = structuredClone(action.to);
      if (!a.actor) cat.place = { kind: 'node', id: target };
      motions.push({ id: cat.id, nodes: [...approach, ...route.slice(1)] });
      if (!a.actor) motions.push({ id: e.id, nodes: route });
    } else fail('ACTION', '不支持这个行动。');
  }
  next.revision++;
  assertSpatial(next, r);
  return { world: next, motions };
}
