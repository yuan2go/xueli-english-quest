import { ALL_AUDIO } from "../content/manifest.ts";
import { validCommand } from "./quest-command.ts";
import { transition } from "../domain/world.ts";
import { nodeOf, visible, RuleError } from "../domain/spatial.ts";
import type { Action, Motion, SpatialWorld } from "../domain/spatial.ts";
import { puzzle, QUEST_PACK, lexeme, EXERCISES } from "../content/quest.ts";
import { parseLanguage, assembleTokens } from "./language.ts";
export type ResultStatus =
  | "done"
  | "valid"
  | "blocked"
  | "incomplete"
  | "structure"
  | "outside"
  | "ambiguous"
  | "mismatch"
  | "stale";
export interface Verdict {
  status: ResultStatus;
  message: string;
  language: "correct" | "incorrect" | "unassessed";
  task: "met" | "unmet" | "none";
  motions: Motion[];
}
export interface LearningEvent {
  board: string;
  window: number;
  word?: string;
  dimension: string;
  status: ResultStatus;
  language: Verdict["language"];
  task: Verdict["task"];
  evidence:
    | "exploration"
    | "guided"
    | "assisted"
    | "demonstrated"
    | "independent"
    | "revisit"
    | "audio-unverified";
  support: string[];
  text?: string;
}
export interface QuestBoard {
  level: string;
  variant: number;
  world: SpatialWorld;
  undo: SpatialWorld[];
  support: string[];
  window: number;
  taught: string[];
  practice: "exploration" | "assisted" | "independent";
  exercise: "command" | "description" | "spelling";
  history: boolean;
}
export type Intent =
  | { kind: "world"; action: Action }
  | {
      kind: "sentence";
      task: string;
      ids?: string[];
      text?: string;
      selected?: string;
    }
  | { kind: "spell"; word: string; answer: string }
  | { kind: "teach"; word: string }
  | { kind: "support"; value: "hint" | "text" | "demo" }
  | {
      kind: "audio";
      value: string;
      assetId: string;
      source: string;
      version: string;
    }
  | { kind: "undo" }
  | { kind: "next" }
  | { kind: "restart" }
  | { kind: "enter"; mode: "story" | "workshop" | "revisit" }
  | {
      kind: "practice";
      mode: "assisted" | "independent";
      exercise: "command" | "description" | "spelling";
    };
export interface QuestCommand {
  sessionId: string;
  revision: number;
  board: string;
  attemptId: string;
  intent: Intent;
}
export interface Quest {
  id: string;
  seed: number;
  revision: number;
  active: string;
  story: string;
  boards: Record<string, QuestBoard>;
  journal: QuestCommand[];
  receipts: Record<string, { payload: string; verdict: Verdict }>;
  events: LearningEvent[];
}
const verdict = (
  status: ResultStatus,
  message: string,
  language: Verdict["language"] = "unassessed",
  task: Verdict["task"] = "none",
  motions: Motion[] = [],
): Verdict => ({ status, message, language, task, motions });
const boardFor = (level: string, variant = 0): QuestBoard => ({
  level,
  variant,
  world: puzzle(level, variant).initial,
  undo: [],
  support: [],
  window: 0,
  taught: [],
  practice: "exploration",
  exercise: "command",
  history: false,
});
export const current = (s: Quest) => s.boards[s.active];
export const taskId = (s: Quest) => `${s.active}-${current(s).window}`;
export function initialQuest(id: string, seed = 6): Quest {
  return {
    id,
    seed,
    revision: 0,
    active: "R1",
    story: "R1",
    boards: { R1: boardFor("R1") },
    journal: [],
    receipts: {},
    events: [],
  };
}
export function goalSatisfied(b: QuestBoard): boolean {
  const w = b.world;
  if (b.level === "workshop") return false;
  return puzzle(b.level, b.variant).goals.every((g) => {
    const e = w.entities[g.id];
    if (!e) return false;
    if (g.type === "at") return nodeOf(w, g.id) === g.node;
    if (g.type === "relation")
      return e.place.kind === g.kind && e.place.id === g.target;
    return (
      e.place.kind === "in" &&
      g.containers.includes(e.place.id) &&
      nodeOf(w, e.place.id) === g.node
    );
  });
}
function evidence(b: QuestBoard): LearningEvent["evidence"] {
  if (b.support.includes("demo")) return "demonstrated";
  if (b.support.length || b.practice === "assisted") return "assisted";
  if (b.level === "R1-R") return "revisit";
  return b.practice === "independent" ? "independent" : "exploration";
}
function resolve(
  w: SpatialWorld,
  word: string,
  selected?: string,
): string | undefined {
  if (word === "it")
    return selected && w.entities[selected] && visible(w, selected)
      ? selected
      : undefined;
  const found = Object.values(w.entities).filter(
    (e) => e.word === word && visible(w, e.id),
  );
  if (selected && found.some((e) => e.id === selected)) return selected;
  return found.length === 1 ? found[0].id : undefined;
}
function apply(b: QuestBoard, action: Action) {
  const before = b.world;
  const result = transition(before, {
    expectedRevision: before.revision,
    action,
    rules: puzzle(b.level, b.variant).rules,
  });
  b.undo.push(before);
  if (b.undo.length > 100) b.undo.shift();
  b.world = result.world;
  return result.motions;
}
function record(
  s: Quest,
  b: QuestBoard,
  v: Verdict,
  dimension: string,
  word?: string,
  text?: string,
) {
  s.events.push({
    board: s.active,
    window: b.window,
    word,
    dimension,
    status: v.status,
    language: v.language,
    task: v.task,
    evidence: evidence(b),
    support: [...b.support],
    text,
  });
}
export function runQuest(
  s: Quest,
  command: QuestCommand,
): { session: Quest; verdict: Verdict } {
  if (!validCommand(command))
    return {
      session: s,
      verdict: verdict("stale", "操作格式无效，请重新操作。"),
    };
  const payload = JSON.stringify(command),
    previous = Object.hasOwn(s.receipts, command.attemptId)
      ? s.receipts[command.attemptId]
      : undefined;
  if (previous)
    return {
      session: s,
      verdict:
        previous.payload === payload
          ? previous.verdict
          : verdict("stale", "这次操作编号已经使用，请重新操作。"),
    };
  if (
    command.sessionId !== s.id ||
    command.revision !== s.revision ||
    command.board !== s.active
  )
    return {
      session: s,
      verdict: verdict("stale", "场景已改变，请在当前画面重新操作。"),
    };
  if (s.journal.length >= 6000)
    return {
      session: s,
      verdict: verdict("blocked", "本局记录已满，请先导出记录，再开始新冒险。"),
    };
  const n: Quest = {
    ...s,
    boards: structuredClone(s.boards),
    journal: [...s.journal],
    events: [...s.events],
    receipts: { ...s.receipts },
  };
  const b = current(n),
    spec = puzzle(b.level, b.variant),
    i = command.intent;
  let v = verdict("valid", "可以继续探索。");
  try {
    switch (i.kind) {
      case "world": {
        const motions = apply(b, i.action);
        v = verdict(
          "valid",
          i.action.type === "resize"
            ? "同一个伙伴或物品，大小改变了。试试它现在能做什么。"
            : i.action.type === "open"
              ? i.action.open
                ? "打开了，路和里面的东西可以接触了。"
                : "关上了，里面的东西还在。"
              : "小猫沿着可走的路完成了行动。",
          "unassessed",
          "none",
          motions,
        );
        record(
          n,
          b,
          v,
          "world-semantics",
          i.action.type === "resize"
            ? i.action.size
            : i.action.type === "create"
              ? i.action.word
              : b.world.entities[i.action.source]?.word,
        );
        break;
      }
      case "sentence": {
        if (i.task !== taskId(n)) {
          v = verdict("stale", "这个词块属于上一次练习。");
          break;
        }
        const text = i.ids ? assembleTokens(i.task, i.ids) : i.text;
        if (text === undefined) {
          v = verdict("stale", "词块重复或不属于这次练习。");
          break;
        }
        const parsed = parseLanguage(text);
        if (parsed.status !== "valid") {
          v = verdict(
            parsed.status,
            parsed.message,
            parsed.status === "structure" ? "incorrect" : "unassessed",
          );
          if (parsed.status !== "incomplete")
            record(n, b, v, "grammar", undefined, text);
          break;
        }
        const m = parsed.meaning,
          source = resolve(b.world, m.source, i.selected);
        const target =
          m.verb === "place"
            ? resolve(b.world, m.target, i.selected)
            : undefined;
        if (!source || (m.verb === "place" && !target)) {
          v = verdict(
            "ambiguous",
            "选中你指的物品，再提交。关闭的容器内不能直接观察。",
            "correct",
          );
          record(n, b, v, "grammar", m.source, text);
          break;
        }
        const e = b.world.entities[source];
        const requested = spec.requestRelation;
        let task: Verdict["task"] = requested
          ? m.verb === "place" &&
            m.source === "apple" &&
            m.relation === requested &&
            m.target === (requested === "in" ? "basket" : "box")
            ? "met"
            : "unmet"
          : "none";
        if (b.level === "workshop" && b.practice !== "exploration")
          task =
            m.kind === b.exercise &&
            m.verb === "place" &&
            m.source === "apple" &&
            m.relation === "in" &&
            m.target === "box"
              ? "met"
              : "unmet";
        if (m.kind === "description") {
          const canOpen =
            spec.rules.types[e.word].container ||
            spec.rules.handles.some((h) => h.door === e.id);
          const matches =
            m.verb === "property"
              ? m.property === "open"
                ? canOpen && e.open
                : m.property === "closed"
                  ? canOpen && !e.open
                  : e.size === m.property
              : e.place.kind === m.relation && e.place.id === target;
          v = verdict(
            matches ? (task === "unmet" ? "mismatch" : "valid") : "mismatch",
            matches
              ? task === "unmet"
                ? "这句话描述得对，但朋友请求的是另一种摆放。"
                : "说得对，这正是眼前的布置。描述不会移动物品。"
              : "句子结构成立，但眼前还不是这样。看看实际位置或大小。",
            "correct",
            task,
          );
        } else {
          const action: Action =
            m.verb === "place"
              ? { type: "move", source, to: { kind: m.relation, id: target! } }
              : m.verb === "resize"
                ? { type: "resize", source, size: m.size }
                : { type: "open", source, open: m.verb === "open" };
          try {
            const motions = apply(b, action);
            v = verdict(
              task === "unmet" ? "mismatch" : "valid",
              task === "unmet"
                ? "指令成立，行动完成了；朋友请求的是另一种摆放。"
                : "听懂了！小猫完成了你的指令。",
              "correct",
              task,
              motions,
            );
          } catch (error) {
            if (!(error instanceof RuleError)) throw error;
            v = verdict(
              "blocked",
              `英语表达成立。${error.message}`,
              "correct",
              task,
            );
          }
        }
        record(n, b, v, "grammar", m.source, text);
        break;
      }
      case "spell": {
        if (
          !lexeme(i.word) ||
          !spec.rules.quotas.some((q) => q.word === i.word)
        ) {
          v = verdict("outside", "这里不能制作这个词的物品。");
          break;
        }
        if (!b.taught.includes(i.word)) {
          v = verdict("blocked", "先看看这个词的意思，再试着拼出来。");
          break;
        }
        if (i.answer.trim().length < i.word.length) {
          v = verdict("incomplete", "字母还没填满，可以继续调整。");
          break;
        }
        if (i.answer.toLowerCase().trim() !== i.word) {
          v = verdict(
            "structure",
            "再听一遍或调整字母；准备好后再施法。",
            "incorrect",
          );
        } else {
          try {
            v = verdict(
              "valid",
              "拼出来了！把新物品用在场景中吧。",
              "correct",
              "met",
              apply(b, { type: "create", word: i.word }),
            );
          } catch (error) {
            if (!(error instanceof RuleError)) throw error;
            v = verdict("blocked", `拼写正确。${error.message}`, "correct");
          }
        }
        record(n, b, v, "spelling", i.word);
        if (
          b.practice !== "independent" &&
          n.events.at(-1)!.evidence === "exploration"
        )
          n.events.at(-1)!.evidence = "assisted";
        break;
      }
      case "teach": {
        if (!lexeme(i.word)) {
          v = verdict("outside", "这个词还没有收录。");
          break;
        }
        if (!b.taught.includes(i.word)) b.taught.push(i.word);
        v = verdict("valid", lexeme(i.word)!.meaning);
        record(n, b, v, "meaning", i.word);
        n.events.at(-1)!.evidence = "guided";
        break;
      }
      case "support": {
        if (!b.support.includes(i.value)) b.support.push(i.value);
        v = verdict(
          "valid",
          i.value === "hint"
            ? spec.hint
            : i.value === "demo"
              ? "已看示范，这次会记为示范后尝试。"
              : "文字辅助已打开，这次不记为独立听力。",
        );
        record(n, b, v, "support");
        break;
      }
      case "audio": {
        if (
          !ALL_AUDIO.some((a) => a.id === i.assetId && a.version === i.version)
        )
          return {
            session: s,
            verdict: verdict("stale", "语音记录不属于当前内容版本。"),
          };
        v = verdict("valid", "语音记录已保留；重听不计语言错误。");
        record(
          n,
          b,
          v,
          "listening",
          undefined,
          `${i.assetId}|${i.source}|${i.version}|${i.value}`,
        );
        n.events.at(-1)!.evidence = "audio-unverified";
        break;
      }
      case "undo": {
        const previous = b.undo.pop();
        if (!previous) {
          v = verdict("blocked", "本关还没有可撤销的行动。");
          break;
        }
        const created = b.world.created;
        b.world = structuredClone(previous);
        b.world.revision = current(s).world.revision + 1;
        b.world.created = [...new Set([...b.world.created, ...created])];
        v = verdict("valid", "上一次世界行动已撤销，帮助和尝试记录仍然保留。");
        break;
      }
      case "restart": {
        const fresh = boardFor(b.level, b.variant);
        fresh.window = b.window + 1;
        fresh.support = [...b.support];
        fresh.taught = [...b.taught];
        fresh.history = b.history;
        n.boards[n.active] = fresh;
        v = verdict("valid", "本关重新开始，之前的尝试仍在词语册中。");
        break;
      }
      case "enter": {
        const key =
          i.mode === "story"
            ? n.story
            : i.mode === "workshop"
              ? "workshop"
              : "R1-R";
        if (key === "R1-R" && !n.boards.R3?.history) {
          v = verdict("blocked", "先把野餐的东西送到朋友身边，再来回访。");
          break;
        }
        n.boards[key] ??= boardFor(key, n.seed % 2);
        n.active = key;
        v = verdict("valid", puzzle(key, n.boards[key].variant).invitation);
        break;
      }
      case "practice": {
        if (b.level !== "workshop") {
          v = verdict("blocked", "到魔法工坊里试试这项练习。");
          break;
        }
        const missing = EXERCISES[i.exercise].requires.filter(
          (word) => !b.taught.includes(word),
        );
        if (missing.length) {
          v = verdict(
            "blocked",
            `先认识这些词的意义：${missing.join("、")}。点击词义小样来试试。`,
          );
          break;
        }
        b.practice = i.mode;
        b.exercise = i.exercise;
        b.window++;
        if (i.mode === "assisted" && !b.support.includes("text"))
          b.support.push("text");
        v = verdict("valid", "练习已准备好。可以随时请求帮助。");
        break;
      }
      case "next": {
        if (!goalSatisfied(b)) {
          v = verdict("blocked", "看看场景，目标还没有完成。");
          break;
        }
        const next =
          b.level === "R1" ? "R2" : b.level === "R2" ? "R3" : undefined;
        if (next) {
          n.boards[next] ??= boardFor(next, n.seed % 2);
          n.boards[next].taught = [
            ...new Set([...n.boards[next].taught, ...b.taught]),
          ];
          n.active = next;
          n.story = next;
          v = verdict("valid", puzzle(next, n.seed % 2).invitation);
        } else
          v = verdict(
            "done",
            "朋友收到了你的心意。继续看看布置，或者回花园试试新的条件。",
          );
        break;
      }
      default:
        return { session: s, verdict: verdict("stale", "操作格式无效。") };
    }
  } catch (error) {
    if (!(error instanceof RuleError)) throw error;
    v = verdict("blocked", error.message);
  }
  if (v.status === "stale") return { session: s, verdict: v };
  const active = current(n);
  if (goalSatisfied(active)) {
    active.history = true;
    if (v.status === "valid" && active.level !== "workshop")
      v = { ...v, status: "done", message: `${v.message} 目标达成！` };
  }
  n.revision++;
  n.journal.push(structuredClone(command));
  n.receipts[command.attemptId] = { payload, verdict: v };
  return { session: n, verdict: v };
}
export function issue(
  s: Quest,
  intent: Intent,
  attemptId = `action-${s.revision}`,
) {
  return runQuest(s, {
    sessionId: s.id,
    revision: s.revision,
    board: s.active,
    attemptId,
    intent,
  });
}
export { QUEST_PACK };
