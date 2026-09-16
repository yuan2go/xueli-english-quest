import { isWord, transition } from "../domain/world.ts";
import type { World } from "../domain/world.ts";
import { INITIAL_WORLD, STEPS } from "../content/story.ts";
import type { Step } from "../content/story.ts";
import { AUDIO } from "../content/manifest.ts";
import { audioStatuses } from "./audio-evidence.ts";
import type { AudioObservation } from "./audio-evidence.ts";

export type Input = {
  word?: string;
  source?: string;
  target?: string;
  relation?: string;
  observation?: string;
};
export type Command = {
  sessionId: string;
  stepId: string;
  attemptId: string;
  expectedRevision: number;
  type: "submit" | "hint" | "text" | "demo" | "replay" | "observe";
  input: Input;
};
export type Outcome =
  | "success"
  | "incorrect"
  | "incomplete"
  | "interaction"
  | "stale"
  | "conflict"
  | "help"
  | "limit";
export interface Evidence {
  stepId: string;
  challenge: number;
  taskType: string;
  target: string;
  submitted: Input;
  correct: boolean;
  hintLevel: number;
  answerVisible: boolean;
  inputMode: string;
  presentationMode: string;
  outcome: string;
  priorAttempts: number;
  eventId: string;
  replays: number;
  audio: AudioObservation[];
  errorKind: "none" | "word" | "source" | "target" | "relation";
}
export interface Session {
  id: string;
  step: number;
  revision: number;
  world: World;
  events: Evidence[];
  journal: Command[];
  receipts: { key: string; fingerprint: string; outcome: Outcome }[];
  hint: number;
  text: boolean;
  demo: boolean;
  replays: number;
  audioLog: AudioObservation[];
}
export interface Result {
  session: Session;
  outcome: Outcome;
  message: string;
}
export const initialSession = (id: string): Session => ({
  id,
  step: 0,
  revision: 0,
  world: structuredClone(INITIAL_WORLD),
  events: [],
  journal: [],
  receipts: [],
  hint: 0,
  text: false,
  demo: false,
  replays: 0,
  audioLog: [],
});
export function correctInput(step: Step): Input {
  if (step.type === "spell" || step.type === "transform")
    return { word: step.word, ...(step.source ? { source: step.source } : {}) };
  if (step.type === "select") return { source: step.source };
  const t = step.target!;
  return {
    source: step.source,
    target: t.kind === "zone" ? t.id : t.kind === "relation" ? t.targetId : "",
    relation: t.kind === "relation" ? t.relation : "across",
  };
}
export function helpFor(session: Session, step: Step): string {
  const error = session.events
    .filter((e) => e.stepId === step.id && !e.correct)
    .at(-1)?.errorKind;
  if (session.hint === 1 && step.type === "place")
    return error === "target"
      ? "选中的物品没问题。重听句子最后的地点，再看背包内部与垫子表面。"
      : error === "relation"
        ? "再听位置词：in 是里面，on 是上面。"
        : "先关注要移动的物品，听清它的名字，再看要放的地点。";
  if (session.hint === 1 && step.type === "transform")
    return "看看变化的位置：前面保持不动，取回词尾，再听目标词。";
  return step.hints[
    Math.min(Math.max(session.hint - 1, 0), step.hints.length - 1)
  ];
}
export function run(session: Session, command: Command, steps = STEPS): Result {
  const response = (
    outcome: Outcome,
    message: string,
    next = session,
  ): Result => ({ session: next, outcome, message });
  const fingerprint = JSON.stringify(command);
  const receipt = session.receipts.find((r) => r.key === command.attemptId);
  if (receipt)
    return receipt.fingerprint === fingerprint
      ? response(receipt.outcome, "这次操作已经记录。")
      : response("conflict", "操作已更新，请再试一次。");
  const step = steps[session.step];
  // Success audio belongs to the just-committed event, including the ending.
  let observation: AudioObservation | undefined;
  if (command.type === "observe") {
    try {
      observation = JSON.parse(command.input.observation ?? "");
    } catch {
      return response("conflict", "音频观察无效");
    }
    const o = observation;
    const last = session.events.at(-1);
    const owner = steps.find((s) => s.id === o?.stepId);
    const asset = AUDIO.find((a) => a.id === o?.assetId);
    if (
      !o ||
      Object.keys(o).sort().join() !==
        "assetId,eventId,purpose,requestId,source,status,stepId,version" ||
      !Object.values(o).every(
        (v) => typeof v === "string" && v.length <= 100,
      ) ||
      !owner ||
      !asset ||
      asset.version !== o.version ||
      !audioStatuses.includes(o.status) ||
      !["recording", "development-speech", "unavailable"].includes(o.source) ||
      (o.source === "recording" && !asset.path) ||
      (o.source === "development-speech" && asset.path) ||
      !o.requestId ||
      (o.purpose === "task"
        ? step?.id !== o.stepId ||
          o.eventId !== "" ||
          asset.text !== owner.prompt
        : o.purpose !== "success" ||
          !last?.correct ||
          last.eventId !== o.eventId ||
          last.stepId !== o.stepId ||
          asset.text !== owner.word)
    )
      return response("stale", "忽略旧音频观察");
    const prior = session.audioLog
      .filter((a) => a.stepId === o.stepId && a.purpose === o.purpose)
      .at(-1);
    if (
      o.status !== "loading" &&
      o.status !== "muted" &&
      o.status !== "failed" &&
      (!prior || prior.requestId !== o.requestId)
    )
      return response("stale", "忽略旧播放回调");
    if (
      prior?.requestId === o.requestId &&
      (["completed", "failed", "cancelled", "muted"].includes(prior.status) ||
        prior.assetId !== o.assetId ||
        prior.source !== o.source)
    )
      return response("stale", "忽略已结束回调");
    if (
      prior &&
      prior.requestId !== o.requestId &&
      session.audioLog.some((a) => a.requestId === o.requestId)
    )
      return response("stale", "忽略被替换的播放");
  }
  if (
    (!step && !observation) ||
    command.sessionId !== session.id ||
    command.stepId !== (observation?.stepId ?? step?.id) ||
    command.expectedRevision !== session.revision
  )
    return response("stale", "这一页已经更新，请再试一次。");
  if (session.journal.length >= 4000)
    return response(
      "limit",
      "本局操作记录已满，请返回首页保存记录后重新开始。",
    );
  if (step?.requires && !session.world.flags.includes(step.requires))
    return response("stale", "先把垫子铺过湿墨。");
  const next = structuredClone(session);
  let outcome: Outcome = "help";
  let message = "";
  if (observation) {
    next.audioLog.push(observation);
  } else if (command.type === "hint") {
    next.hint = Math.min(3, next.hint + 1);
    message = helpFor(next, step);
  } else if (command.type === "text") {
    next.text = true;
    message = "已开启文字辅助，本题会如实记录。";
  } else if (command.type === "demo") {
    next.demo = true;
    next.hint = 3;
    next.text = true;
    message = "照着示范再操作一次，完成后记为演示练习。";
  } else if (command.type === "replay") {
    next.replays++;
    message = "重听不计错误。";
  } else if (command.type === "submit") {
    const input = command.input;
    if (
      (step.type === "spell" || step.type === "transform") &&
      (!input.word || input.word.length !== 3)
    )
      return response("incomplete", "先把三个位置填好，再施法。");
    if (
      (step.type === "place" && (!input.source || !input.target)) ||
      (step.type === "select" && !input.source)
    )
      return response("interaction", "先选择物品，再选择放置区。");
    const expected = correctInput(step);
    const correct = Object.entries(expected).every(
      ([key, value]) => input[key as keyof Input] === value,
    );
    if (
      correct &&
      step.type === "transform" &&
      session.world.entities[step.source!]?.word !== step.from
    )
      return response("stale", "物品状态已更新。");
    const answerVisible =
      next.text || next.demo || step.mode === "teaching" || next.hint >= 2;
    const assisted =
      answerVisible || next.hint > 0 || step.mode !== "independent";
    const taskType =
      step.mode === "interaction"
        ? "interaction"
        : {
            spell: "spelling",
            transform: "substitution",
            select: "lexical-listening",
            place: "sentence-placement",
          }[step.type];
    const heard = next.audioLog.filter(
      (a) => a.stepId === step.id && a.purpose === "task",
    );
    const latest = heard.at(-1);
    const delivered =
      latest && ["playing", "completed"].includes(latest.status);
    const errorKind = correct
      ? "none"
      : input.word
        ? "word"
        : input.source !== expected.source
          ? "source"
          : input.target !== expected.target
            ? "target"
            : "relation";
    next.events.push({
      stepId: step.id,
      challenge: step.challenge,
      taskType,
      target: step.prompt,
      submitted: input,
      correct,
      hintLevel: next.hint,
      answerVisible,
      inputMode: answerVisible
        ? "text-assisted"
        : latest
          ? `${latest.source}/${latest.status}`
          : "unplayed",
      audio: structuredClone(heard),
      errorKind,
      presentationMode: step.mode,
      outcome: correct
        ? next.demo
          ? "demonstrated"
          : step.mode === "interaction"
            ? "interaction-complete"
            : assisted
              ? "assisted-correct"
              : delivered
                ? "independent-correct"
                : "unverified-correct"
        : "incorrect",
      priorAttempts: next.events.filter((e) => e.stepId === step.id).length,
      eventId: command.attemptId,
      replays: next.replays,
    });
    outcome = correct ? "success" : "incorrect";
    if (correct) {
      if (step.effect)
        next.world = transition(next.world, {
          expectedRevision: next.world.revision,
          effect: step.effect,
        });
      next.step++;
      const entering = steps[next.step];
      if (entering?.enter)
        next.world = transition(next.world, {
          expectedRevision: next.world.revision,
          effect: entering.enter,
        });
      next.hint = 0;
      next.text = false;
      next.demo = false;
      next.replays = 0;
      message =
        step.id === "s04a"
          ? "✓ 垫子变好了，还要把它铺过去。"
          : step.id === "s04b"
            ? "✓ 小猫已经走过湿墨！"
            : "✓ 做到了，故事又向前走了一步。";
    } else {
      const wrongCount = next.events.filter(
        (e) => e.stepId === step.id && !e.correct,
      ).length;
      if (wrongCount >= 2)
        next.hint = Math.max(next.hint, Math.min(2, wrongCount - 1));
      message =
        input.word && isWord(input.word)
          ? "这也是一个单词。这次需要另一件物品，再听听吧。"
          : step.type === "place"
            ? input.source !== expected.source
              ? "先听清要移动哪件物品，再选一次。"
              : input.target !== expected.target
                ? "物品选对了，再听听要放在哪里。"
                : "再听听是里面，还是上面。"
            : input.word
              ? "这个组合还没有收录在故事里。再听一次，调整字母试试。"
              : "还差一点。再听一次，可以调整后重新试。";
    }
  } else return response("conflict", "无法识别这次操作。");
  next.revision++;
  next.journal.push(structuredClone(command));
  next.receipts.push({ key: command.attemptId, fingerprint, outcome });
  return response(outcome, message, next);
}
export function completedChallenges(session: Session): number {
  return new Set(
    STEPS.slice(0, session.step)
      .filter(
        (s) =>
          !STEPS.slice(session.step).some((p) => p.challenge === s.challenge),
      )
      .map((s) => s.challenge),
  ).size;
}
