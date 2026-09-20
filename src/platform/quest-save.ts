import { validCommand } from "../game/quest-command.ts";
import { initialQuest, runQuest, QUEST_PACK } from "../game/quest.ts";
import type { Quest, QuestCommand } from "../game/quest.ts";
export const QUEST_KEY = "xueli.quest.v6";
const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function fail(): never {
  throw new Error(
    "存档格式或版本不同，原始记录已保留。可导出后明确开始新冒险。",
  );
}
const fields = (v: Record<string, unknown>, allowed: string[]) => {
  if (Object.keys(v).some((k) => !allowed.includes(k))) fail();
};
const str = (v: unknown, max = 200): v is string =>
  typeof v === "string" && v.length <= max;
function projection(s: Quest) {
  return {
    active: s.active,
    story: s.story,
    boards: s.boards,
    events: s.events,
    revision: s.revision,
  };
}
export function encodeQuest(s: Quest): string {
  return JSON.stringify({
    schema: 6,
    pack: QUEST_PACK,
    id: s.id,
    seed: s.seed,
    journal: s.journal,
    projection: projection(s),
  });
}
export function decodeQuest(raw: string): Quest {
  if (raw.length > 4_000_000) fail();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    fail();
  }
  if (!isRecord(data)) fail();
  fields(data, ["schema", "pack", "id", "seed", "journal", "projection"]);
  if (
    data.schema !== 6 ||
    JSON.stringify(data.pack) !== JSON.stringify(QUEST_PACK) ||
    !str(data.id, 100) ||
    !/^[\w-]+$/.test(data.id) ||
    !Number.isSafeInteger(data.seed) ||
    Number(data.seed) < 0 ||
    Number(data.seed) > 0xffffffff ||
    !Array.isArray(data.journal) ||
    data.journal.length > 6000
  )
    fail();
  let s = initialQuest(data.id, Number(data.seed));
  for (const c of data.journal) {
    if (!isRecord(c)) fail();
    fields(c, ["sessionId", "revision", "board", "attemptId", "intent"]);
    if (
      !str(c.sessionId, 100) ||
      !str(c.board, 40) ||
      !str(c.attemptId, 100) ||
      !/^[\w-]+$/.test(c.attemptId) ||
      !Number.isSafeInteger(c.revision) ||
      !validCommand(c)
    )
      fail();
    const r = runQuest(s, c as unknown as QuestCommand);
    if (r.session === s) fail();
    s = r.session;
  }
  if (JSON.stringify(projection(s)) !== JSON.stringify(data.projection)) fail();
  return s;
}
export const belongs = (key: string) =>
  key.startsWith("wordspell.") ||
  key.startsWith("xueli.adventure.") ||
  key.startsWith("xueli.quest.");
export function backupRaw(storage: Storage, key: string) {
  const raw = storage.getItem(key);
  if (raw === null) return;
  let hash = 2166136261;
  for (const c of raw) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  const dest = `${key}.backup.${(hash >>> 0).toString(16)}`,
    previous = storage.getItem(dest);
  if (previous !== null && previous !== raw)
    throw new Error("备份冲突，原档保留。请导出。");
  storage.setItem(dest, raw);
  if (storage.getItem(dest) !== raw)
    throw new Error("备份读回失败，原档保留。");
}
export function loadQuest(storage: Storage): {
  session?: Quest;
  warning: string;
  blocked: boolean;
} {
  try {
    const raw = storage.getItem(QUEST_KEY);
    if (raw !== null) {
      try {
        return { session: decodeQuest(raw), warning: "", blocked: false };
      } catch (e) {
        return { warning: (e as Error).message, blocked: true };
      }
    }
    const old = Array.from(
      { length: storage.length },
      (_, i) => storage.key(i)!,
    ).filter((k) => belongs(k) && !k.includes(".backup."));
    if (old.length) {
      for (const key of old) backupRaw(storage, key);
      return {
        warning:
          "发现旧故事记录，已原文备份。新章节不会继承旧通关，请明确开始新冒险。",
        blocked: true,
      };
    }
    return { warning: "", blocked: false };
  } catch {
    return {
      warning: "存储不可用或备份失败。可以导出记录，或仅在本次内存中游玩。",
      blocked: true,
    };
  }
}
export function saveQuest(s: Quest, storage: Storage): string {
  try {
    const raw = encodeQuest(s);
    if (raw.length > 4_000_000 || s.journal.length > 6000)
      return "记录已达保存上限，请导出本局。";
    storage.setItem(QUEST_KEY, raw);
    if (storage.getItem(QUEST_KEY) !== raw) throw new Error("readback");
    return "";
  } catch {
    return "保存失败，本次进度仅在内存中。请导出本局记录。";
  }
}
export function exportQuest(s: Quest, storage?: Storage) {
  const stored: Record<string, string> = {};
  try {
    if (storage)
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)!;
        if (belongs(k)) stored[k] = storage.getItem(k)!;
      }
  } catch {
    /* Memory export remains available. */
  }
  return JSON.stringify(
    { current: JSON.parse(encodeQuest(s)), stored },
    null,
    2,
  );
}
