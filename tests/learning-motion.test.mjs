import test from "node:test";
import assert from "node:assert/strict";
import {
  initialAdventure,
  runAdventure,
  sentenceTasks,
} from "../src/game/adventure.ts";
import { SENTENCES, SENTENCE_AUDIO } from "../src/content/sentences.ts";
import { lessonFrames } from "../src/game/lesson.ts";
import { resolveTool, presentation } from "../src/game/shell.ts";
import {
  encodeAdventure,
  decodeAdventure,
  loadAdventure,
  ADVENTURE_KEY,
  PREVIOUS_ADVENTURE_KEY,
} from "../src/platform/adventure-save.ts";
import {
  initialAdventure as initialV4,
  runAdventure as runV4,
} from "../src/legacy/quest-v4/adventure.ts";
import {
  encodeAdventure as encodeV4,
  decodeAdventure as decodeV4,
} from "../src/legacy/quest-v4/save.ts";
import { learningFact } from "../src/game/learning.ts";
function send(s, intent) {
  return runAdventure(s, {
    ...intent,
    sessionId: s.id,
    mode: s.mode,
    revision: s.revision,
    attemptId: `e-${s.revision}`,
  });
}
function act(s, intent) {
  const r = send(s, intent);
  assert.ok(["valid", "done"].includes(r.kind), r.message);
  return r.session;
}
function meadow() {
  let s = initialAdventure("learning-v5", 0);
  for (const task of ["wake", "bag", "map", "hat"])
    s = act(s, { action: "word", task, word: task === "wake" ? "cat" : task });
  for (const i of [
    { action: "transform", source: "cat-card", word: "cap" },
    { action: "travel", value: "trail" },
    { action: "transform", source: "route-sheet", word: "mat" },
    {
      action: "place",
      source: "route-sheet",
      target: { kind: "zone", id: "ink-road" },
    },
    { action: "place", source: "route-sheet", target: { kind: "stage" } },
    { action: "transform", source: "route-sheet", word: "map" },
    { action: "travel", value: "meadow" },
    { action: "word", task: "mat", word: "mat" },
  ])
    s = act(s, i);
  return s;
}
function ids(task) {
  const used = new Set();
  return task.example
    .replace(".", "")
    .split(" ")
    .map((w) => {
      const t = task.tokens.find(
        (t) => t.text.toLowerCase() === w.toLowerCase() && !used.has(t.id),
      );
      used.add(t.id);
      return t.id;
    });
}
function demonstrate(s, task) {
  for (let step = 0; step < 4; step++)
    s = act(s, {
      action: "help",
      task,
      value: "demo",
      phase: "shown",
      step,
      request: "lesson",
    });
  return act(s, {
    action: "help",
    task,
    value: "demo",
    phase: "completed",
    step: 3,
    request: "lesson",
  });
}
function audio(s, task, status, request = "voice") {
  const resource = SENTENCE_AUDIO.find(
    (a) => a.text === SENTENCES[task].example,
  );
  return act(s, {
    action: "audio",
    task,
    value: status,
    request,
    assetId: resource.id,
    audioVersion: resource.version,
    audioSource: "development-speech",
  });
}
function taught() {
  let s = demonstrate(meadow(), "pack-cap");
  s = act(s, { action: "bag" });
  s = act(s, {
    action: "sentence",
    task: "pack-cap",
    ids: ids(SENTENCES["pack-cap"]),
  });
  s = act(s, {
    action: "place",
    source: "hat-main",
    target: { kind: "relation", relation: "on", targetId: "picnic-mat" },
  });
  s = audio(s, "describe-hat", "loading");
  s = audio(s, "describe-hat", "playing");
  s = audio(s, "describe-hat", "completed");
  return act(s, {
    action: "sentence",
    task: "describe-hat",
    ids: ids(SENTENCES["describe-hat"]),
  });
}

test("isolated teaching uses the same rules, keeps identity and never answers the player task", () => {
  const s = meadow(),
    raw = encodeAdventure(s),
    world = s.story.world;
  const frames = lessonFrames(s, { kind: "sentence", id: "pack-cap" });
  assert.equal(frames[0].world.entities["cat-card"].location.kind, "stage");
  assert.equal(
    frames[2].world.entities["cat-card"].location.targetId,
    "bag-main",
  );
  assert.equal(encodeAdventure(s), raw);
  assert.equal(world.entities["cat-card"].location.kind, "stage");
  assert.equal(
    send(s, {
      action: "sentence",
      task: "pack-cap",
      ids: ids(SENTENCES["pack-cap"]),
    }).kind,
    "blocked",
  );
  let partial = act(s, {
    action: "help",
    task: "pack-cap",
    value: "demo",
    phase: "shown",
    step: 0,
    request: "lesson",
  });
  partial = act(partial, {
    action: "help",
    task: "pack-cap",
    value: "demo",
    phase: "cancelled",
    step: 0,
    request: "lesson",
  });
  assert.equal(
    send(partial, {
      action: "help",
      task: "pack-cap",
      value: "demo",
      phase: "completed",
      step: 3,
      request: "lesson",
    }).kind,
    "blocked",
  );
  assert.equal(
    send(partial, {
      action: "sentence",
      task: "pack-cap",
      ids: ids(SENTENCES["pack-cap"]),
    }).kind,
    "blocked",
  );
  assert.equal(partial.story.facts.includes("sentence:pack-cap"), false);
  const morph = lessonFrames(s, { kind: "morph", id: "route-sheet" });
  assert.equal(morph[0].world.entities["route-sheet"].word, "map");
  assert.equal(morph[2].world.entities["route-sheet"].word, "mat");
  assert.equal(s.story.world.entities["route-sheet"].word, "map");
  assert.deepEqual(decodeAdventure(encodeAdventure(partial)), partial);
});

test("help is observed, sentence audio demotes contextual independence, skills do not all become earned", () => {
  let s = taught();
  const described = s.events.at(-1);
  assert.equal(described.evidence, "listen-rebuild");
  assert.match(learningFact(described), /完整目标句播放完成后重组成功/);
  assert.ok(
    !described.observation.skills.some(
      (x) =>
        x.dimension === "full-spelling" || x.dimension === "world-operation",
    ),
  );
  assert.equal(
    resolveTool(s, { kind: "sentence", id: "invite-cat" }).reveal,
    false,
  );
  assert.equal(
    send(s, { action: "help", task: "invite-cat", value: "text" }).session,
    s,
  );
  const task = SENTENCES["invite-cat"];
  const independent = act(s, {
    action: "sentence",
    task: task.id,
    ids: ids(task),
  }).events.at(-1);
  assert.equal(independent.evidence, "independent");
  assert.equal(independent.observation.exercise, "scene-compose");
  assert.ok(
    !independent.observation.skills.some(
      (x) =>
        x.dimension === "listening" ||
        x.dimension === "full-spelling" ||
        x.dimension === "word-meaning",
    ),
  );
  s = audio(s, task.id, "loading");
  s = audio(s, task.id, "playing");
  s = audio(s, task.id, "cancelled");
  s = decodeAdventure(encodeAdventure(s));
  s = act(s, { action: "sentence", task: task.id, ids: ids(task) });
  assert.equal(s.events.at(-1).evidence, "assisted");
  assert.equal(
    s.events.at(-1).support.exposures.filter((x) => x.status === "playing")
      .length,
    1,
  );
  assert.equal(s.events.at(-1).support.audio, "cancelled");
  let failure = taught();
  failure = audio(failure, task.id, "failed", "failed-immediately");
  failure = act(failure, { action: "sentence", task: task.id, ids: ids(task) });
  assert.equal(failure.events.at(-1).evidence, "independent");
  assert.equal(failure.events.filter((e) => e.language === "adjust").length, 0);
});

test("old v4 remains exactly decodable and backed up without fabricating exposure or upgrading progress", () => {
  let old = initialV4("historical", 7);
  old = runV4(old, {
    sessionId: old.id,
    mode: old.mode,
    revision: 0,
    attemptId: "old-wake",
    action: "word",
    task: "wake",
    word: "cat",
  }).session;
  const raw = encodeV4(old);
  assert.deepEqual(decodeV4(raw), old);
  assert.throws(() => decodeAdventure(raw));
  const data = new Map([[PREVIOUS_ADVENTURE_KEY, raw]]);
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
  try {
    const r = loadAdventure();
    assert.equal(r.blocked, true);
    assert.equal(r.previousRaw, raw);
    assert.equal(data.has(ADVENTURE_KEY), false);
    assert.ok(
      [...data].some(
        ([k, v]) =>
          k.startsWith(PREVIOUS_ADVENTURE_KEY + ".backup.") && v === raw,
      ),
    );
  } finally {
    delete globalThis.localStorage;
  }
});

test("crossing separates stationary support, moving actor and worn attachment; activity experiments have reversible effects", () => {
  let s = initialAdventure("motion", 0);
  for (const task of ["wake", "bag", "map", "hat"])
    s = act(s, { action: "word", task, word: task === "wake" ? "cat" : task });
  s = act(s, {
    action: "place",
    source: "hat-main",
    target: { kind: "worn", targetId: "cat-companion" },
  });
  s = act(s, { action: "transform", source: "cat-card", word: "cap" });
  s = act(s, { action: "travel", value: "trail" });
  s = act(s, { action: "transform", source: "route-sheet", word: "mat" });
  const intent = {
      action: "place",
      source: "route-sheet",
      target: { kind: "zone", id: "ink-road" },
    },
    r = send(s, intent),
    cue = presentation(s, intent, r);
  assert.equal(cue.roles.find((x) => x.id === "route-sheet").role, "support");
  assert.equal(cue.roles.find((x) => x.id === "cat-companion").action, "walk");
  assert.equal(cue.roles.find((x) => x.id === "hat-main").role, "attachment");
  s = act(r.session, { action: "activity", value: "dress" });
  const story = structuredClone(s.story);
  s = act(s, {
    action: "place",
    source: "hat-main",
    target: { kind: "worn", targetId: "cat-companion" },
  });
  s = act(s, { action: "experiment", value: "breeze" });
  assert.equal(
    s.activities.dress.world.entities["hat-main"].location.kind,
    "stage",
  );
  s = act(s, {
    action: "place",
    source: "hat-main",
    target: { kind: "worn", targetId: "cat-companion" },
  });
  s = act(s, { action: "experiment", value: "sun" });
  assert.equal(
    s.activities.dress.world.entities["cat-companion"].location.targetId,
    "picnic-mat",
  );
  assert.deepEqual(s.story, story);
  assert.deepEqual(decodeAdventure(encodeAdventure(s)), s);
});
