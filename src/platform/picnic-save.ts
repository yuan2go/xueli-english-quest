import { initialPicnic, play, MODES } from "../game/picnic.ts";
import type { Picnic, PlayMode, PlayCommand } from "../game/picnic.ts";
export const picnicKey = (mode: PlayMode) => `wordspell.play.v1.${mode}`;
export const encodePicnic = (s: Picnic) =>
  JSON.stringify({
    version: 1,
    id: s.id,
    mode: s.mode,
    seed: s.seed,
    journal: s.journal,
  });
export function decodePicnic(raw: string, mode: PlayMode): Picnic {
  if (raw.length > 1500000) throw new Error("布置存档过大，原档保留。");
  const v = JSON.parse(raw);
  if (
    !v ||
    Object.keys(v).sort().join() !== "id,journal,mode,seed,version" ||
    v.version !== 1 ||
    v.mode !== mode ||
    !Object.hasOwn(MODES, v.mode) ||
    typeof v.id !== "string" ||
    v.id.length > 100 ||
    !Number.isSafeInteger(v.seed) ||
    v.seed < 0 ||
    v.seed > 4294967295 ||
    !Array.isArray(v.journal) ||
    v.journal.length > 2000
  )
    throw new Error("布置版本不兼容，原档保留。");
  let s = initialPicnic(v.id, mode, v.seed);
  for (const c of v.journal) {
    if (
      !c ||
      typeof c !== "object" ||
      Object.keys(c).some(
        (k) =>
          ![
            "sessionId",
            "mode",
            "revision",
            "attemptId",
            "action",
            "source",
            "word",
            "target",
          ].includes(k),
      ) ||
      typeof c.attemptId !== "string" ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(c.attemptId) ||
      ![c.sessionId, c.mode, c.action, c.source ?? "", c.word ?? ""].every(
        (x) => typeof x === "string" && x.length < 101,
      ) ||
      !Number.isSafeInteger(c.revision)
    )
      throw new Error("布置记录损坏，原档保留。");
    if (
      c.target &&
      (typeof c.target !== "object" ||
        Object.keys(c.target).some(
          (k) => !["kind", "relation", "targetId"].includes(k),
        ) ||
        !Object.values(c.target).every(
          (x) => typeof x === "string" && x.length < 65,
        ))
    )
      throw new Error("布置位置损坏，原档保留。");
    const result = play(s, c as PlayCommand);
    if (result.session === s) throw new Error("布置顺序无效，原档保留。");
    s = result.session;
  }
  return s;
}
