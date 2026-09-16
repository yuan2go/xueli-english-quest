import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { StoryAudio } from "../src/platform/audio.ts";
import { AUDIO } from "../src/content/manifest.ts";
test("recording boundary validates bytes, retries rejected playback, cancels stale callbacks and times out loading", async (t) => {
  // Browser codec/device sound is outside this deterministic adapter test.
  const original = {
    window: globalThis.window,
    Audio: globalThis.Audio,
    fetch: globalThis.fetch,
  };
  const asset = AUDIO[0],
    saved = { ...asset };
  const data = new TextEncoder().encode("ID3-test-boundary-fixture");
  Object.assign(asset, {
    path: "audio/cat.mp3",
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
    durationMs: 1000,
  });
  const instances = [];
  let rejectPlay = true;
  globalThis.window = {};
  globalThis.fetch = async () => new Response(data);
  globalThis.Audio = class {
    constructor() {
      instances.push(this);
    }
    pause() {
      this.paused = true;
    }
    play() {
      return rejectPlay
        ? Promise.reject(new Error("blocked"))
        : Promise.resolve();
    }
  };
  const audio = new StoryAudio();
  audio.unlock();
  t.after(() => {
    audio.stop();
    Object.assign(asset, saved);
    for (const [k, v] of Object.entries(original)) {
      if (v === undefined) delete globalThis[k];
      else globalThis[k] = v;
    }
  });
  const observations = [];
  const binding = {
    stepId: "s01",
    purpose: "task",
    eventId: "",
    observe: (o) => observations.push(o),
  };
  const until = async (status) => {
    for (let i = 0; i < 200 && observations.at(-1)?.status !== status; i++)
      await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(observations.at(-1)?.status, status);
  };
  audio.play("cat", () => {}, binding);
  await until("failed");
  assert.equal(observations.at(-1).status, "failed");
  assert.equal(observations.at(-1).source, "recording");
  rejectPlay = false;
  audio.play("cat", () => {}, binding);
  await until("playing");
  assert.equal(observations.at(-1).status, "playing");
  const ended = instances.at(-1).onended;
  audio.stop();
  assert.equal(observations.at(-1).status, "cancelled");
  const count = observations.length;
  ended();
  assert.equal(observations.length, count);
  globalThis.fetch = async () => new Response("corrupt");
  audio.play("cat", () => {}, binding);
  await until("failed");
  assert.equal(observations.at(-1).status, "failed");
  globalThis.fetch = () => new Promise(() => {});
  t.mock.timers.enable({ apis: ["setTimeout"] });
  audio.play("cat", () => {}, binding, 100);
  t.mock.timers.tick(101);
  assert.equal(observations.at(-1).status, "failed");
  audio.muted = true;
  audio.play("cat", () => {}, binding);
  assert.equal(observations.at(-1).status, "muted");
  audio.stop();
});
