import test from "node:test";
import assert from "node:assert/strict";
import { initialPicnic, play, picnicComplete } from "../src/game/picnic.ts";
import { encodePicnic, decodePicnic } from "../src/platform/picnic-save.ts";
import { STEPS } from "../src/content/story.ts";
import { initialSession, run, correctInput } from "../src/game/session.ts";
import { validateStory } from "../src/content/validate.ts";
import { matchesFormat } from "../src/content/resource-contract.ts";
import { summarize } from "../src/game/summary.ts";
import { encode, decode } from "../src/platform/save.ts";
const stage = { kind: "stage" },
  inside = { kind: "relation", relation: "in", targetId: "bag-main" },
  head = { kind: "worn", targetId: "cat-companion" };
const on = (targetId) => ({ kind: "relation", relation: "on", targetId });
const cmd = (s, input) => ({
  ...input,
  mode: s.mode,
  sessionId: s.id,
  revision: s.revision,
  attemptId: `p-${s.revision}`,
});
const act = (s, action, source, target) =>
  play(
    s,
    cmd(s, {
      action,
      source,
      ...(typeof target === "string" ? { word: target } : { target }),
    }),
  );
const move = (s, source, target) => act(s, "place", source, target).session;
test("picnic reuses six identities; reversible transforms, wearable uniqueness, extraction and occupied supports", () => {
  let s = initialPicnic("free", "free", 42);
  const count = Object.keys(s.world.entities).length;
  for (const word of ["cat", "bag", "map", "mat", "hat", "cap"]) {
    s = act(s, "spell", undefined, word).session;
    assert.equal(Object.keys(s.world.entities).length, count);
  }
  s = move(s, "hat-main", head);
  assert.equal(s.world.entities["hat-main"].location.kind, "worn");
  s = move(s, "cat-card", head);
  assert.equal(s.world.entities["hat-main"].location.kind, "stage");
  assert.equal(act(s, "transform", "cat-card", "cat").session, s);
  s = move(s, "cat-card", stage);
  s = act(s, "transform", "cat-card", "cat").session;
  assert.equal(s.world.entities["cat-companion"].kind, "actor");
  s = act(s, "transform", "cat-card", "cap").session;
  s = move(s, "cat-card", inside);
  assert.equal(act(s, "transform", "cat-card", "cat").session, s);
  s = act(s, "transform", "route-sheet", "mat").session;
  s = move(s, "cat-companion", on("route-sheet"));
  assert.equal(act(s, "transform", "route-sheet", "map").session, s);
  assert.equal(act(s, "place", "route-sheet", inside).session, s);
  s = move(s, "cat-companion", stage);
  s = act(s, "transform", "route-sheet", "map").session;
  assert.equal(s.world.entities["route-sheet"].word, "map");
  assert.equal(act(s, "transform", "cat-companion", "cap").session, s);
  assert.equal(act(s, "transform", "hat-main", "cap").session, s);
  const duplicate = cmd(s, { action: "bag" }),
    result = play(s, duplicate);
  assert.equal(play(result.session, duplicate).session, result.session);
  assert.deepEqual(decodePicnic(encodePicnic(s), "free"), s);
  assert.throws(() => decodePicnic(encodePicnic(s), "dress"));
  assert.equal(
    play(s, { ...cmd(s, { action: "bag" }), mode: "dress" }).session,
    s,
  );
});
test("all three activities have reachable 3-action goals; dress and helper accept different choices/orders; seeds persist", () => {
  for (const seed of [0, 1]) {
    let s = initialPicnic("dress", "dress", seed);
    s = act(s, "transform", "cat-card", "cap").session;
    const hat = seed ? "hat-main" : "cat-card",
      other = seed ? "cat-card" : "hat-main";
    s = move(s, hat, head);
    s = move(s, other, inside);
    assert.ok(picnicComplete(s));
    assert.equal(s.journal.length, 3);
    let f = initialPicnic("find", "find", seed);
    f = act(f, "bag").session;
    const wanted = seed ? "hat-main" : "cat-card";
    f = move(f, wanted, stage);
    f = move(f, wanted, on("picnic-mat"));
    assert.ok(picnicComplete(f));
    assert.equal(f.journal.length, 3);
    let h = initialPicnic("helper", "helper", seed);
    if (seed) h = move(h, "cat-card", inside);
    h = act(h, "transform", "route-sheet", "mat").session;
    h = move(h, seed ? "hat-main" : "cat-companion", on("route-sheet"));
    if (!seed) h = move(h, "cat-card", inside);
    assert.ok(picnicComplete(h));
    assert.equal(h.journal.length, 3);
    assert.deepEqual(decodePicnic(encodePicnic(h), "helper"), h);
  }
});
test("registered but semantically wrong instructions fail both validation and production commands", () => {
  for (const [id, prompt] of [
    ["s09", "Put the hat on the mat."],
    ["s11", "Put the cat on the mat."],
  ]) {
    const steps = structuredClone(STEPS);
    steps.find((s) => s.id === id).prompt = prompt;
    assert.throws(() => validateStory(steps), /INSTRUCTION_MISMATCH/);
    let s = initialSession("semantic");
    while (STEPS[s.step].id !== id)
      s = run(s, {
        sessionId: s.id,
        stepId: STEPS[s.step].id,
        attemptId: `s-${s.revision}`,
        expectedRevision: s.revision,
        type: "submit",
        input: correctInput(STEPS[s.step]),
      }).session;
    assert.equal(
      run(
        s,
        {
          sessionId: s.id,
          stepId: id,
          attemptId: "bad",
          expectedRevision: s.revision,
          type: "submit",
          input: correctInput(STEPS[s.step]),
        },
        steps,
      ).session,
      s,
    );
  }
});
test("RIFF offsets remain bytes when size contains C2 A9; short/corrupt headers rejected", () => {
  const wav = new Uint8Array(43466);
  const marker = (offset, s) => wav.set(new TextEncoder().encode(s), offset);
  marker(0, "RIFF");
  new DataView(wav.buffer).setUint32(4, 43458, true); // C2 A9 00 00: valid length, UTF-8 collapses two bytes.
  marker(8, "WAVE");
  marker(12, "fmt ");
  new DataView(wav.buffer).setUint32(16, 16, true);
  new DataView(wav.buffer).setUint16(20, 1, true);
  new DataView(wav.buffer).setUint16(22, 1, true);
  new DataView(wav.buffer).setUint32(24, 22050, true);
  new DataView(wav.buffer).setUint32(28, 44100, true);
  new DataView(wav.buffer).setUint16(32, 2, true);
  new DataView(wav.buffer).setUint16(34, 16, true);
  marker(36, "data");
  new DataView(wav.buffer).setUint32(40, wav.length - 44, true);
  assert.equal(wav[4], 0xc2);
  assert.equal(wav[5], 0xa9);
  assert.ok(matchesFormat(wav, "audio/wav"));
  marker(8, "WEBP");
  assert.ok(matchesFormat(wav, "image/webp"));
  assert.equal(matchesFormat(wav, "audio/wav"), false);
  assert.equal(matchesFormat(wav.slice(0, 11), "image/webp"), false);
});
test("first map is not a revisit; later forms keep task type; exact prior story log migrates without losing help", () => {
  let s = initialSession("old");
  while (s.step < 13)
    s = run(s, {
      sessionId: s.id,
      stepId: STEPS[s.step].id,
      attemptId: `s-${s.revision}`,
      expectedRevision: s.revision,
      type: "submit",
      input: correctInput(STEPS[s.step]),
    }).session;
  const groups = summarize(s).groups;
  assert.deepEqual(
    groups.find((g) => g.word === "map" && g.type === "spelling").revisit,
    [],
  );
  assert.deepEqual(
    groups.find((g) => g.word === "map" && g.type === "substitution").revisit,
    ["s05"],
  );
  const old = JSON.parse(encode(s));
  old.pack = "3.0.0-dev";
  old.content =
    "a6bf55d43c1e7bda54ce71c42980260e73d395b8ae257aebc3faef0f474e4854";
  assert.deepEqual(decode(JSON.stringify(old)), s);
});
