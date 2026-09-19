import { CONTENT_HASH, PACK } from "../content/story.ts";
import { initialSession, run } from "../game/session.ts";
import type { Command, Session } from "../game/session.ts";

export const SAVE_KEY = "wordspell.story.v1";
export const ARCHIVE_KEY = "wordspell.previous.v1";
// Exact prior headers only; all commands are still validated and replayed below.
const legacy = (v: Record<string, unknown>) =>
  (v.pack === "3.0.0-dev" && v.content === "a6bf55d43c1e7bda54ce71c42980260e73d395b8ae257aebc3faef0f474e4854") ||
  (v.pack === "3.1.0-dev" && v.content === "0400c42731deac0c728566185d7c6a2fb2e3970a4b1e38a475e67462caeef7fb");
export function encode(session: Session): string {
  return JSON.stringify({
    schema: 2,
    pack: PACK.version,
    content: CONTENT_HASH,
    id: session.id,
    journal: session.journal,
  });
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function decode(raw: string): Session {
  if (raw.length > 2_000_000) throw new Error("存档过大，无法安全恢复。");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("存档结构损坏，原始数据已保留。");
  }
  if (
    !record(value) ||
    value.schema !== 2 ||
    (!(value.pack === PACK.version && value.content === CONTENT_HASH) &&
      !legacy(value))
  )
    throw new Error("这是其他版本的存档，暂时无法恢复。原始数据已保留。");
  if (
    Object.keys(value).sort().join() !== "content,id,journal,pack,schema" ||
    typeof value.id !== "string" ||
    value.id.length > 100 ||
    !Array.isArray(value.journal) ||
    value.journal.length > 4000
  )
    throw new Error("存档结构损坏，原始数据已保留。");
  let state = initialSession(value.id);
  for (const item of value.journal) {
    if (
      !record(item) ||
      Object.keys(item).sort().join() !==
        "attemptId,expectedRevision,input,sessionId,stepId,type" ||
      typeof item.attemptId !== "string" ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(item.attemptId) ||
      typeof item.stepId !== "string" ||
      typeof item.sessionId !== "string" ||
      !Number.isSafeInteger(item.expectedRevision) ||
      !["submit", "hint", "text", "demo", "replay", "observe"].includes(
        String(item.type),
      ) ||
      !record(item.input) ||
      Object.entries(item.input).some(
        ([k, v]) =>
          !["word", "source", "target", "relation", "observation"].includes(
            k,
          ) ||
          typeof v !== "string" ||
          v.length > (k === "observation" ? 1200 : 64),
      )
    )
      throw new Error("存档操作损坏，原始数据已保留。");
    const result = run(state, item as Command);
    if (result.session === state)
      throw new Error("存档步骤顺序不正确，原始数据已保留。");
    state = result.session;
  }
  return state;
}
export type Loaded = { session?: Session; warning: string; blocked: boolean };
export function load(): Loaded {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { warning: "", blocked: false };
    try {
      const session = decode(raw);
      const migrated = legacy(JSON.parse(raw));
      if (migrated) {
        const backup = `${SAVE_KEY}.legacy.${session.id}`;
        const existing = localStorage.getItem(backup);
        if (existing !== null && existing !== raw)
          throw new Error("旧存档备份位置已有另一份记录，请先导出；原始存档保留。");
        localStorage.setItem(backup, raw);
      }
      return {
        session,
        warning: migrated
          ? "旧版主线日志已逐条验证续接，原始存档另存保留。"
          : "",
        blocked: false,
      };
    } catch (e) {
      return {
        warning: e instanceof Error ? e.message : "存档损坏，原始数据已保留。",
        blocked: true,
      };
    }
  } catch {
    return {
      warning: "本次进度可能不保留：浏览器不允许本地存储。",
      blocked: false,
    };
  }
}
export function save(session: Session): string {
  try {
    localStorage.setItem(SAVE_KEY, encode(session));
    return "";
  } catch {
    return "本次进度可能不保留：保存失败。可在练习记录中导出本局存档。";
  }
}
export function archiveCurrent(): void {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) localStorage.setItem(ARCHIVE_KEY, raw);
}
