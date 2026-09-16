import test from 'node:test';
import assert from 'node:assert/strict';
import { transition, assertWorld, DomainError, singleLetterChange } from '../src/domain/world.ts';

const entity = (id, word, kind = 'object') => ({ id, word, kind, location: { kind: 'stage' } });
const world = (...entities) => ({ revision: 0, flags: [], entities: Object.fromEntries(entities.map(e => [e.id, e])) });
const run = (state, effect) => transition(state, { expectedRevision: state.revision, effect });
const rejects = (fn, code) => assert.throws(fn, error => error instanceof DomainError && error.code === code);

test('map → mat → crossing → map preserves identity and input immutability', () => {
  const initial = world(entity('route-sheet', 'map'), entity('cat-companion', 'cat', 'actor'));
  const frozenCopy = structuredClone(initial);
  const mat = run(initial, { type: 'transform', sourceId: 'route-sheet', to: 'mat' });
  const crossed = run(mat, { type: 'place', sourceId: 'route-sheet', target: { kind: 'zone', id: 'ink-road' } });
  const restored = run(crossed, { type: 'transform', sourceId: 'route-sheet', to: 'map' });
  assert.deepEqual(initial, frozenCopy);
  assert.equal(mat.entities['route-sheet'].word, 'mat');
  assert.equal(restored.entities['route-sheet'].word, 'map');
  assert.deepEqual(restored.entities['route-sheet'].location, { kind: 'stage' });
  assert.deepEqual(restored.flags, ['crossed-ink']);
  assert.equal(Object.keys(restored.entities).length, 2);
  assert.equal(restored.revision, 3);
});
test('protects companion; only the separate paper token becomes cap', () => {
  const state = world(entity('cat-companion', 'cat', 'actor'), entity('cat-card', 'cat', 'token'));
  rejects(() => run(state, { type: 'transform', sourceId: 'cat-companion', to: 'cap' }), 'PROTECTED_ACTOR');
  const result = run(state, { type: 'transform', sourceId: 'cat-card', to: 'cap' });
  assert.equal(result.entities['cat-companion'].word, 'cat');
  assert.equal(result.entities['cat-card'].word, 'cap');
});
test('rejects stale revisions and duplicate creation', () => {
  const initial = world();
  const command = { expectedRevision: 0, effect: { type: 'spawn', entity: entity('bag-main', 'bag') } };
  const created = transition(initial, command);
  rejects(() => transition(created, command), 'STALE_REVISION');
  rejects(() => run(created, command.effect), 'DUPLICATE_ENTITY');
  assert.equal(Object.keys(created.entities).length, 1);
});
test('spawn does not retain mutable references to command data', () => {
  const value = entity('bag-main', 'bag');
  const created = run(world(), { type: 'spawn', entity: value });
  value.word = 'hat';
  assert.equal(created.entities['bag-main'].word, 'bag');
});
test('rejects a missing transformation source', () => {
  rejects(() => run(world(), { type: 'transform', sourceId: 'missing', to: 'map' }), 'MISSING_ENTITY');
});
test('hat to cap is not a single-letter change or an approved transform', () => {
  assert.equal(singleLetterChange('hat', 'cap'), false);
  assert.equal(singleLetterChange('cat', 'cap'), true);
  assert.equal(singleLetterChange('map', 'map'), false);
  rejects(() => run(world(entity('hat-main', 'hat')), { type: 'transform', sourceId: 'hat-main', to: 'cap' }), 'INVALID_TRANSFORM');
});
test('a map cannot cover the ink road', () => {
  rejects(() => run(world(entity('route-sheet', 'map')), { type: 'place', sourceId: 'route-sheet', target: { kind: 'zone', id: 'ink-road' } }), 'INVALID_TARGET');
});
test('cap in bag and cat on mat retain separate entities', () => {
  let state = world(entity('cat-card', 'cap', 'token'), entity('bag-main', 'bag'), entity('picnic-mat', 'mat'), entity('cat-companion', 'cat', 'actor'));
  state = run(state, { type: 'place', sourceId: 'cat-card', target: { kind: 'relation', relation: 'in', targetId: 'bag-main' } });
  state = run(state, { type: 'place', sourceId: 'cat-companion', target: { kind: 'relation', relation: 'on', targetId: 'picnic-mat' } });
  assert.equal(Object.keys(state.entities).length, 4);
  assert.equal(state.entities['cat-card'].location.targetId, 'bag-main');
  assert.equal(state.entities['cat-companion'].location.targetId, 'picnic-mat');
});
test('rejects transforming a support with contents', () => {
  let state = world(entity('picnic-mat', 'mat'), entity('hat-main', 'hat'));
  state = run(state, { type: 'place', sourceId: 'hat-main', target: { kind: 'relation', relation: 'on', targetId: 'picnic-mat' } });
  rejects(() => run(state, { type: 'transform', sourceId: 'picnic-mat', to: 'map' }), 'TARGET_IN_USE');
});
test('rejects self-containment and cyclic containment', () => {
  let state = world(entity('bag-one', 'bag'), entity('bag-two', 'bag'));
  rejects(() => run(state, { type: 'place', sourceId: 'bag-one', target: { kind: 'relation', relation: 'in', targetId: 'bag-one' } }), 'INVALID_TARGET');
  state = run(state, { type: 'place', sourceId: 'bag-one', target: { kind: 'relation', relation: 'in', targetId: 'bag-two' } });
  rejects(() => run(state, { type: 'place', sourceId: 'bag-two', target: { kind: 'relation', relation: 'in', targetId: 'bag-one' } }), 'INVALID_TARGET');
});
test('rejects missing destinations and incorrect relation targets', () => {
  const state = world(entity('hat-main', 'hat'), entity('route-sheet', 'map'));
  rejects(() => run(state, { type: 'place', sourceId: 'hat-main', target: { kind: 'relation', relation: 'on', targetId: 'missing' } }), 'MISSING_ENTITY');
  rejects(() => run(state, { type: 'place', sourceId: 'hat-main', target: { kind: 'relation', relation: 'in', targetId: 'route-sheet' } }), 'INVALID_TARGET');
});
test('does not count another mat as the authored road-crossing effect', () => {
  const result = run(world(entity('picnic-mat', 'mat')), { type: 'place', sourceId: 'picnic-mat', target: { kind: 'zone', id: 'ink-road' } });
  assert.deepEqual(result.flags, []);
});
test('rejects invalid typed-state invariants', () => {
  rejects(() => assertWorld({ revision: -1, entities: {}, flags: [] }), 'INVALID_WORLD');
  rejects(() => assertWorld(world(entity('cat-companion', 'cap', 'actor'))), 'INVALID_WORLD');
  rejects(() => assertWorld({ revision: 0, entities: {}, flags: ['not-approved'] }), 'INVALID_WORLD');
});

test('rejects unsafe entity IDs before object assignment', () => {
  rejects(() => run(world(), { type: 'spawn', entity: entity('__proto__', 'map') }), 'INVALID_WORLD');
});
