import type { Adventure, Intent, Learning, Support } from "./adventure.ts";
import type { SentenceTask } from "../content/sentences.ts";
import { parseSentence, sameMeaning } from "./sentences.ts";

export const EVIDENCE_VERSION = "learning-observation-v2";
export type HelpKind =
  | "attention"
  | "meaning"
  | "partial"
  | "text"
  | "demo"
  | "audio"
  | "feedback";
export type Exposure = {
  id: string;
  request: string;
  kind: HelpKind;
  channel: "visual" | "audio";
  status:
    | "shown"
    | "loading"
    | "playing"
    | "completed"
    | "cancelled"
    | "failed"
    | "muted";
  answer: "none" | "partial" | "full";
  step?: number;
};
export type Dimension =
  | "word-meaning"
  | "listening"
  | "full-spelling"
  | "letter-change"
  | "word-order-grammar"
  | "situation-semantics"
  | "world-operation";
export type Observation = {
  version: typeof EVIDENCE_VERSION;
  objective: string;
  exercise: SentenceTask["exercise"] | "word" | "operation";
  sourceId?: string;
  targetId?: string;
  skills: {
    dimension: Dimension;
    result: "observed" | "adjust" | "unassessed";
  }[];
  taskMatch: "matched" | "mismatch" | "unassessed";
  world: "allowed" | "blocked" | "observation" | "unassessed";
  revisitOf?: string;
};
export function audioStarted(s: Support) {
  return s.exposures.some((x) => x.kind === "audio" && x.status === "playing");
}
export function demoCompleted(s: Support) {
  return s.exposures.some((x) => x.kind === "demo" && x.status === "completed");
}
export function answerExposed(s: Support) {
  return s.exposures.some(
    (x) =>
      x.answer !== "none" &&
      ["shown", "playing", "completed"].includes(x.status),
  );
}
export function evidenceFor(
  type: Learning["type"],
  practice: Learning["practice"],
  support: Support,
  task?: SentenceTask,
): Learning["evidence"] {
  if (practice === "exploration") return "exploration";
  if (demoCompleted(support)) return "demonstrated";
  if (support.demo) return "demo-partial";
  if (task?.exercise === "listen-rebuild")
    return support.text || support.hint
      ? "assisted"
      : audioStarted(support)
        ? "listen-rebuild"
        : "audio-unverified";
  if (practice === "teaching") return "guided";
  if (
    support.text ||
    support.hint ||
    support.exposures.some((x) => x.kind !== "audio" && x.status === "shown")
  )
    return "assisted";
  // A complete sentence is an answer in a scene task, but word audio is the listening stimulus.
  if (task && answerExposed(support)) return "assisted";
  if (type === "spelling" || type === "listening")
    return audioStarted(support) ? "independent" : "audio-unverified";
  return "independent";
}
export function observeLearning(
  s: Adventure,
  intent: Intent,
  event: Learning,
  task?: SentenceTask,
): Observation {
  const success = ["valid", "done"].includes(event.result);
  const assessed =
    event.language === "correct"
      ? "observed"
      : event.language === "adjust"
        ? "adjust"
        : "unassessed";
  const skills: Observation["skills"] = [];
  const add = (
    dimension: Dimension,
    result: "observed" | "adjust" | "unassessed" = assessed,
  ) => skills.push({ dimension, result });
  let taskMatch: Observation["taskMatch"] = success ? "matched" : "unassessed";
  if (event.type === "spelling") add("full-spelling");
  if (event.type === "substitution") add("letter-change");
  if (task) {
    add("word-order-grammar");
    const parsed = parseSentence(event.submitted);
    taskMatch =
      parsed.status === "valid"
        ? sameMeaning(parsed.meaning, task.target)
          ? "matched"
          : "mismatch"
        : "unassessed";
    add(
      "situation-semantics",
      success
        ? "observed"
        : event.result === "mismatch"
          ? "adjust"
          : "unassessed",
    );
  }
  if (
    ["listening", "spelling"].includes(event.type) ||
    task?.exercise === "listen-rebuild"
  ) {
    add(
      "listening",
      event.support.exposures.some(
        (x) => x.kind === "audio" && x.status === "completed",
      ) &&
        !event.support.text &&
        !event.support.hint &&
        !event.support.demo
        ? assessed
        : "unassessed",
    );
  }
  if (event.type === "listening") add("word-meaning");
  if (event.type === "operation" || task?.mapping === "place")
    add("world-operation", success ? "observed" : "unassessed");
  const origin =
    task?.revisitOf ??
    (event.task === "mat"
      ? "morph:route-sheet"
      : event.task === "find-map"
        ? "map"
        : undefined);
  const previous =
    origin &&
    [...s.events]
      .reverse()
      .find((e) => e.task === origin && ["valid", "done"].includes(e.result));
  return {
    version: EVIDENCE_VERSION,
    objective: event.task || intent.action,
    exercise:
      task?.exercise ?? (event.type === "operation" ? "operation" : "word"),
    sourceId: task?.sourceId ?? intent.source,
    targetId: task?.targetId,
    skills,
    taskMatch,
    world:
      event.result === "blocked"
        ? "blocked"
        : task?.mapping === "observe"
          ? "observation"
          : success
            ? "allowed"
            : "unassessed",
    ...(previous ? { revisitOf: previous.id } : {}),
  };
}
export function learningFact(event: Learning): string {
  const success = ["valid", "done"].includes(event.result);
  if (!success)
    return event.result === "blocked"
      ? "表达已提交，世界条件受阻"
      : "本次仍在调整";
  if (event.evidence === "demonstrated") return "看完示范后亲手完成";
  if (event.evidence === "demo-partial") return "看过部分示范后完成";
  if (
    event.observation?.exercise === "listen-rebuild" &&
    audioStarted(event.support)
  ) {
    const complete = event.support.exposures.some(
      (x) => x.kind === "audio" && x.status === "completed",
    );
    return (
      (complete
        ? "完整目标句播放完成后重组成功"
        : "目标句已开始播放后重组成功（未确认完整播放）") +
      (event.support.text
        ? "；另显示过答案"
        : event.support.hint
          ? "；使用过线索"
          : "")
    );
  }
  if (event.evidence === "assisted")
    return answerExposed(event.support)
      ? "答案或部分答案曝光后完成"
      : "使用情境帮助后完成";
  if (event.evidence === "audio-unverified")
    return "完成操作，未确认任务音频开始播放";
  if (event.evidence === "guided") return "引导学习中完成";
  if (event.evidence === "exploration") return "自由探索操作";
  return "未显示答案完成";
}
