import test from "node:test";
import assert from "node:assert/strict";
import {
  STEPS,
  CONTENT_SIGNATURE,
  CONTENT_HASH,
} from "../src/content/story.ts";
import { createHash } from "node:crypto";
import { validateStory } from "../src/content/validate.ts";
import {
  initialSession,
  run,
  correctInput,
  completedChallenges,
} from "../src/game/session.ts";
import { encode, decode } from "../src/platform/save.ts";
const command = (s, type = "submit", input = correctInput(STEPS[s.step])) => ({
  sessionId: s.id,
  stepId: STEPS[s.step].id,
  attemptId: `try-${s.revision}`,
  expectedRevision: s.revision,
  type,
  input,
});
const advance = (s) => run(s, command(s)).session;
test("full story uses production runner, distinct identities and exact evidence", () => {
  assert.equal(
    createHash("sha256").update(CONTENT_SIGNATURE).digest("hex"),
    CONTENT_HASH,
    "update content version/hash when authored data changes",
  );
  validateStory();
  let s = initialSession("test");
  while (s.step < 13) s = advance(s);
  assert.equal(completedChallenges(s), 12);
  assert.equal(s.events.length, 13);
  assert.equal(s.world.entities["route-sheet"].word, "map");
  assert.equal(s.world.entities["picnic-mat"].word, "mat");
  assert.equal(s.world.entities["cat-companion"].word, "cat");
  assert.equal(s.world.entities["cat-card"].word, "cap");
  assert.equal(s.world.entities["cat-card"].location.targetId, "bag-main");
  assert.equal(
    s.world.entities["cat-companion"].location.targetId,
    "picnic-mat",
  );
  assert.equal(s.events[0].outcome, "assisted-correct");
  assert.equal(s.events[4].taskType, "interaction");
  assert.deepEqual(decode(encode(s)), s);
});
test("map → mat → crossing → map and both saved boundaries cannot skip crossing", () => {
  let s = initialSession("slice");
  for (let i = 0; i < 3; i++) s = advance(s);
  s = advance(s);
  s = decode(encode(s));
  assert.equal(STEPS[s.step].id, "s04b");
  assert.equal(completedChallenges(s), 3);
  const bad = {
    ...command(s),
    stepId: "s05",
    input: { source: "route-sheet", word: "map" },
  };
  assert.equal(run(s, bad).outcome, "stale");
  assert.equal(s.world.flags.length, 0);
  s = decode(encode(advance(s)));
  assert.equal(STEPS[s.step].id, "s05");
  assert.deepEqual(s.world.flags, ["crossed-ink"]);
  s = advance(s);
  assert.equal(s.world.entities["route-sheet"].word, "map");
});
test("duplicates, conflicting attempts, old steps and revisions never repeat effects", () => {
  const s = initialSession("test");
  const c = command(s);
  const result = run(s, c);
  assert.equal(run(result.session, c).session, result.session);
  assert.equal(
    run(result.session, { ...c, input: { word: "bag" } }).outcome,
    "conflict",
  );
  assert.equal(
    run(result.session, { ...c, attemptId: "new" }).outcome,
    "stale",
  );
  assert.equal(
    run(result.session, { ...command(result.session), expectedRevision: 0 })
      .outcome,
    "stale",
  );
});
test("wrong known word creates no item; incomplete, drops and replay are not language mistakes", () => {
  let s = advance(advance(initialSession("test")));
  const world = structuredClone(s.world);
  const empty = run(s, command(s, "submit", { word: "ma" }));
  assert.equal(empty.session, s);
  s = run(s, command(s, "submit", { word: "mat" })).session;
  assert.deepEqual(s.world, world);
  assert.equal(s.step, 2);
  assert.equal(s.events.at(-1).correct, false);
  s = run(s, command(s, "hint", {})).session;
  s = run(s, command(s, "text", {})).session;
  s = run(s, command(s, "replay", {})).session;
  s = advance(s);
  assert.equal(s.events.at(-1).outcome, "assisted-correct");
  assert.equal(s.events.at(-1).hintLevel, 1);
  assert.equal(s.events.at(-1).inputMode, "text-assisted");
  assert.equal(s.events.at(-1).replays, 1);
  s = advance(s);
  const n = s.events.length;
  s = run(s, command(s, "submit", { source: "route-sheet" })).session;
  assert.equal(s.events.length, n);
});
test("damaged, future, forged order and unknown save fields are rejected without manufacturing progress", () => {
  assert.throws(() => decode("{"));
  let s = advance(initialSession("test"));
  for (const mutate of [
    (v) => (v.schema = 99),
    (v) => (v.extra = true),
    (v) => (v.journal[0].stepId = "s12"),
    (v) => (v.journal[0].input.extra = "bad"),
  ]) {
    const v = JSON.parse(encode(s));
    mutate(v);
    assert.throws(() => decode(JSON.stringify(v)));
  }
});
test("malformed content and unavailable letter targets are rejected", () => {
  const bad = structuredClone(STEPS);
  bad[2].letters = "cat";
  assert.throws(() => validateStory(bad));
  const unknown = structuredClone(STEPS);
  unknown[0].script = "bad";
  assert.throws(() => validateStory(unknown));
  const nested = structuredClone(STEPS);
  nested[0].effect.entity.script = "bad";
  assert.throws(() => validateStory(nested));
});
test("success after demonstration stays demonstrated; error escalation survives restore", () => {
  let s = advance(advance(initialSession("help")));
  for (let i = 0; i < 3; i++)
    s = run(s, command(s, "submit", { word: "mat" })).session;
  s = decode(encode(s));
  assert.equal(s.hint, 2);
  s = run(s, command(s, "demo", {})).session;
  s = advance(s);
  assert.equal(s.events.at(-1).outcome, "demonstrated");
  assert.equal(s.events.at(-1).answerVisible, true);
});

test("visual cutover replays prior 3.1 saves at both ink boundaries without losing evidence", () => {
  let s = initialSession("pre-tabby-save");
  for (let i = 0; i < 4; i++) s = advance(s);
  for (const expected of ["s04b", "s05"]) {
    const old = JSON.parse(encode(s));
    old.content = "0400c42731deac0c728566185d7c6a2fb2e3970a4b1e38a475e67462caeef7fb";
    const restored = decode(JSON.stringify(old));
    assert.deepEqual(restored, s);
    assert.equal(STEPS[restored.step].id, expected);
    assert.throws(() => decode(JSON.stringify({ ...old, content: "f".repeat(64) })));
    s = advance(s);
  }
});
