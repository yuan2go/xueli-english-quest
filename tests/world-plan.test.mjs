import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transition } from '../src/domain/world.ts';

const plan = JSON.parse(readFileSync(new URL('../content/drafts/picnic-world-plan.json', import.meta.url), 'utf8'));
// This verifies one authored world-state path, not the UI, all branches or content approval.
function replay(steps) {
  let state = structuredClone(plan.initialWorld);
  for (const step of steps) {
    for (const flag of step.requiresFlags ?? []) {
      assert.ok(state.flags.includes(flag), `Missing precondition ${flag} at ${step.id}`);
    }
    for (const effect of step.onEnter ?? []) {
      state = transition(state, { expectedRevision: state.revision, effect });
    }
    if (step.effect) state = transition(state, { expectedRevision: state.revision, effect: step.effect });
    if (step.selectEntityId) assert.equal(state.entities[step.selectEntityId]?.word, step.expectedWord);
  }
  return state;
}
test('draft twelve-challenge / thirteen-action world path is consistent', () => {
  assert.equal(plan.status, 'DRAFT_NOT_PLAYABLE');
  assert.equal(plan.steps.length, 13);
  assert.equal(new Set(plan.steps.map(step => step.challengeId)).size, 12);
  assert.equal(new Set(plan.steps.map(step => step.id)).size, 13);
  const state = replay(plan.steps);
  assert.equal(state.entities['route-sheet'].word, 'map');
  assert.equal(state.entities['picnic-mat'].word, 'mat');
  assert.equal(state.entities['cat-companion'].word, 'cat');
  assert.deepEqual(state.entities['cat-companion'].location, { kind: 'relation', relation: 'on', targetId: 'picnic-mat' });
  assert.deepEqual(state.entities['cat-card'].location, { kind: 'relation', relation: 'in', targetId: 'bag-main' });
});
test('authored plan cannot omit crossing before restoring the map', () => {
  assert.throws(() => replay(plan.steps.filter(step => step.id !== 's04b')), /crossed-ink/);
});
