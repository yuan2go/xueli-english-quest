import test from "node:test";
import assert from "node:assert/strict";
import { initialAdventure, runAdventure } from "../src/game/adventure.ts";
import { sceneModel, resolveTool, presentation } from "../src/game/shell.ts";
import {
  encodeAdventure,
  decodeAdventure,
} from "../src/platform/adventure-save.ts";
function send(s, intent) {
  return runAdventure(s, {
    ...intent,
    sessionId: s.id,
    revision: s.revision,
    mode: s.mode,
    attemptId: `shell-${s.revision}`,
  });
}
function act(s, intent) {
  const r = send(s, intent);
  assert.ok(["valid", "done"].includes(r.kind), r.message);
  return r.session;
}
function trail() {
  let s = initialAdventure("shell", 12);
  for (const task of ["wake", "map", "bag"])
    s = act(s, { action: "word", task, word: task === "wake" ? "cat" : task });
  assert.equal(
    sceneModel(s).actions.find((a) => a.id === "travel").intent.value,
    "trail",
  );
  return act(s, { action: "travel", value: "trail" });
}
test("encounter affordances follow actual crossing and keep the current save byte-identical during UI projection", () => {
  let s = trail();
  const initial = encodeAdventure(s);
  assert.equal(
    sceneModel(s).actions.some((a) => a.id === "travel"),
    false,
  );
  const model = resolveTool(s, { kind: "morph", id: "route-sheet" });
  assert.equal(model.target, "mat");
  assert.equal(encodeAdventure(s), initial);
  s = act(s, {
    action: "transform",
    source: "route-sheet",
    word: "mat",
    task: model.id,
  });
  assert.equal(
    sceneModel(s).actions.some((a) => a.id === "travel"),
    false,
  );
  s = act(s, {
    action: "place",
    source: "route-sheet",
    target: { kind: "zone", id: "ink-road" },
  });
  s = act(s, {
    action: "place",
    source: "route-sheet",
    target: { kind: "stage" },
  });
  s = act(s, { action: "transform", source: "route-sheet", word: "map" });
  assert.equal(
    sceneModel(s).actions.find((a) => a.id === "travel").intent.value,
    "meadow",
  );
  assert.deepEqual(decodeAdventure(encodeAdventure(s)), s);
});
test("presentation consumes committed results without persisting transient state or turning a blocked transform into success", () => {
  let s = trail();
  const intent = { action: "transform", source: "route-sheet", word: "mat" };
  const r = send(s, intent),
    saved = encodeAdventure(r.session);
  const cue = presentation(s, intent, r);
  assert.equal(cue.kind, "transform");
  assert.equal(cue.entity, "route-sheet");
  assert.equal(cue.from, "map");
  assert.equal(cue.to, "mat");
  assert.equal(encodeAdventure(r.session), saved);
  s = r.session;
  const blockedIntent = {
    action: "transform",
    source: "route-sheet",
    word: "map",
  };
  const blocked = send(s, blockedIntent);
  assert.equal(presentation(s, blockedIntent, blocked).kind, "blocked");
  assert.deepEqual(blocked.session.story.world, s.story.world);
  const crossing = {
    action: "place",
    source: "route-sheet",
    target: { kind: "zone", id: "ink-road" },
  };
  const crossed = send(s, crossing);
  assert.equal(presentation(s, crossing, crossed).kind, "cross");
  assert.ok(
    decodeAdventure(
      encodeAdventure(crossed.session),
    ).story.world.flags.includes("crossed-ink"),
  );
});
test("context tools hide independent listening answers until explicit help, while cancellation does not create evidence", () => {
  const s = act(initialAdventure("listening"), {
    action: "word",
    task: "wake",
    word: "cat",
  });
  const saved = encodeAdventure(s);
  assert.equal(resolveTool(s, { kind: "word", id: "map" }).reveal, false);
  assert.equal(encodeAdventure(s), saved);
  const aided = act(s, {
    action: "help",
    task: "map",
    value: "text",
    phase: "shown",
  });
  assert.equal(resolveTool(aided, { kind: "word", id: "map" }).reveal, true);
  assert.equal(
    presentation(
      s,
      { action: "help" },
      { session: aided, kind: "valid", message: "" },
    ),
    null,
  );
});
