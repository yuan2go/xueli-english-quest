import test from "node:test";
import assert from "node:assert/strict";
import {
  initialSession,
  run,
  correctInput,
  helpFor,
} from "../src/game/session.ts";
import { STEPS } from "../src/content/story.ts";
import { AUDIO } from "../src/content/manifest.ts";
import { validateStory } from "../src/content/validate.ts";
import { sceneTargets } from "../src/game/interaction.ts";
import { repairs, summarize } from "../src/game/summary.ts";
import { encode, decode } from "../src/platform/save.ts";
const send = (
  s,
  type = "submit",
  input = correctInput(STEPS[s.step]),
  stepId = STEPS[s.step]?.id,
) =>
  run(s, {
    sessionId: s.id,
    stepId,
    attemptId: `e-${s.revision}`,
    expectedRevision: s.revision,
    type,
    input,
  });
const next = (s) => send(s).session;
test("derived repairs, natural scene targets, first-error help, summary and restored assistance share real events", () => {
  let s = initialSession("summary");
  s = next(next(s));
  assert.equal(repairs(s)[0].complete, false);
  s = send(s, "submit", { word: "mat" }).session;
  s = send(s, "demo", {}).session;
  s = decode(encode(s));
  s = next(s);
  assert.equal(repairs(s)[0].complete, true);
  while (s.step < 9) s = next(s);
  assert.deepEqual(
    sceneTargets(s.world, 3).map((t) => t.id),
    ["bag-main:in", "picnic-mat:on"],
  );
  const old = structuredClone(s.world);
  s = send(s, "submit", {
    source: "hat-main",
    target: "picnic-mat",
    relation: "on",
  }).session;
  assert.equal(s.events.at(-1).errorKind, "source");
  s = send(s, "submit", {
    source: "cat-card",
    target: "picnic-mat",
    relation: "on",
  }).session;
  assert.equal(s.events.at(-1).errorKind, "target");
  assert.match(helpFor(s, STEPS[s.step]), /物品没问题/);
  assert.deepEqual(s.world, old);
  while (s.step < 13) s = next(s);
  assert.equal(repairs(s).filter((p) => p.complete).length, 3);
  const summary = summarize(s);
  assert.equal(
    summary.groups.find((g) => g.word === "map" && g.type === "spelling").demo,
    1,
  );
  assert.deepEqual(summary.confusions[0], ["map → mat", 1]);
  assert.equal(
    summary.groups.find((g) => g.word === "mat" && g.type === "interaction")
      .errors,
    0,
  );
  assert.deepEqual(decode(encode(s)), s);
});
test("audio observations bind resource version, task and request; no playback cannot earn independent listening", () => {
  let s = next(next(initialSession("audio")));
  const a = AUDIO.find((a) => a.text === "map");
  const base = {
    requestId: "voice-a",
    assetId: a.id,
    version: a.version,
    stepId: "s03",
    purpose: "task",
    eventId: "",
    source: "development-speech",
    status: "loading",
  };
  const observe = (o) =>
    send(s, "observe", { observation: JSON.stringify(o) }, o.stepId);
  assert.equal(observe({ ...base, version: "old" }).outcome, "stale");
  s = observe(base).session;
  s = observe({ ...base, requestId: "voice-b" }).session;
  assert.equal(observe({ ...base, status: "completed" }).session, s);
  s = observe({ ...base, requestId: "voice-b", status: "failed" }).session;
  s = decode(encode(s));
  s = next(s);
  assert.equal(s.events.at(-1).outcome, "unverified-correct");
  assert.equal(s.events.at(-1).audio.at(-1).status, "failed");
  assert.equal(observe({ ...base, status: "playing" }).session, s);
  const event = s.events.at(-1);
  const success = {
    ...base,
    requestId: "result",
    purpose: "success",
    eventId: event.eventId,
  };
  s = observe(success).session;
  s = observe({ ...success, status: "completed" }).session;
  assert.equal(s.step, 3);
  assert.deepEqual(decode(encode(s)), s);
});
test("operability validation rejects inaccessible source, missing replacement and locked target position", () => {
  for (const mutate of [
    (s) => (s[3].letters = "pp"),
    (s) => (s[3].editable = [0]),
    (s) => (s[5].from = "map"),
    (s) => (s[9].word = "hat"),
    (s) => (s[3].editable = [2, 2]),
  ]) {
    const steps = structuredClone(STEPS);
    mutate(steps);
    assert.throws(() => validateStory(steps));
  }
});
