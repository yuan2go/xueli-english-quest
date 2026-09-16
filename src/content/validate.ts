import { STEPS } from "./story.ts";
import { instructionIssue } from "./instructions.ts";
import { correctInput, initialSession, run } from "../game/session.ts";
import { isWord, singleLetterChange } from "../domain/world.ts";
import type { Step } from "./story.ts";
import { letterLayout, sceneTargets } from "../game/interaction.ts";
import { IMAGES, AUDIO } from "./manifest.ts";
import { FEEDBACK, FEEDBACK_KINDS } from "./feedback.ts";
import { validateResources } from "./resource-contract.ts";

function exact(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join() === [...keys].sort().join()
  );
}
const identifier = (v: unknown) =>
  typeof v === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(v);
function location(v: unknown): boolean {
  if (exact(v, ["kind"])) return v.kind === "stage";
  if (exact(v, ["kind", "id"])) return v.kind === "zone" && v.id === "ink-road";
  return (
    exact(v, ["kind", "relation", "targetId"]) &&
    v.kind === "relation" &&
    ["in", "on"].includes(String(v.relation)) &&
    identifier(v.targetId)
  );
}
function effect(v: unknown): boolean {
  if (exact(v, ["type", "entity"])) {
    const e = v.entity;
    return (
      v.type === "spawn" &&
      exact(e, ["id", "word", "kind", "location"]) &&
      identifier(e.id) &&
      typeof e.word === "string" &&
      isWord(e.word) &&
      ["actor", "object", "token"].includes(String(e.kind)) &&
      location(e.location)
    );
  }
  if (exact(v, ["type", "sourceId", "to"]))
    return (
      v.type === "transform" &&
      identifier(v.sourceId) &&
      typeof v.to === "string" &&
      isWord(v.to)
    );
  return (
    exact(v, ["type", "sourceId", "target"]) &&
    v.type === "place" &&
    identifier(v.sourceId) &&
    location(v.target)
  );
}

/** Runs the production command path. This is reachability, never teaching approval. */
export function validateStory(steps: Step[] = STEPS): void {
  validateResources(IMAGES, AUDIO);
  if (
    !Array.isArray(steps) ||
    steps.length !== 13 ||
    new Set(steps.map((s) => s.id)).size !== 13
  )
    throw new Error("关卡数量或编号不正确");
  const fields = [
    "id",
    "challenge",
    "act",
    "title",
    "story",
    "type",
    "mode",
    "word",
    "prompt",
    "letters",
    "hints",
    "source",
    "from",
    "target",
    "effect",
    "enter",
    "requires",
    "editable",
  ];
  let state = initialSession("validation");
  steps.forEach((s, index) => {
    if (s && instructionIssue(s, state.world))
      throw new Error(instructionIssue(s, state.world)!);
    if (
      !s ||
      Object.keys(s).some((k) => !fields.includes(k)) ||
      !/^s\d{2}[ab]?$/.test(s.id) ||
      !Number.isInteger(s.challenge) ||
      s.challenge < 1 ||
      s.challenge > 12 ||
      ![1, 2, 3].includes(s.act) ||
      !["spell", "transform", "select", "place"].includes(s.type) ||
      !["teaching", "guided", "independent", "interaction"].includes(s.mode) ||
      !isWord(s.word) ||
      ![s.title, s.story, s.prompt, s.letters].every(
        (v) => typeof v === "string" && v.length < 200,
      ) ||
      !Array.isArray(s.hints) ||
      s.hints.length !== 2 ||
      s.hints.some((h) => typeof h !== "string" || h.length > 150)
    )
      throw new Error(`关卡结构错误 ${index}`);
    if (
      (s.effect && !effect(s.effect)) ||
      (s.enter && !effect(s.enter)) ||
      (s.target && !location(s.target)) ||
      (s.source && !identifier(s.source)) ||
      (s.requires && s.requires !== "crossed-ink")
    )
      throw new Error(`非法效果 ${s.id}`);
    if (
      s.type === "spell" &&
      (s.effect?.type !== "spawn" || s.effect.entity.word !== s.word)
    )
      throw new Error("拼词效果不匹配");
    if (
      s.type === "transform" &&
      (s.effect?.type !== "transform" ||
        s.effect.sourceId !== s.source ||
        s.effect.to !== s.word)
    )
      throw new Error("换字效果不匹配");
    if (
      s.type === "place" &&
      (s.effect?.type !== "place" ||
        s.effect.sourceId !== s.source ||
        JSON.stringify(s.effect.target) !== JSON.stringify(s.target))
    )
      throw new Error("放置效果不匹配");
    if (
      s.type === "select" &&
      (s.effect || state.world.entities[s.source!]?.word !== s.word)
    )
      throw new Error("选择目标不匹配");
    if (s.type === "spell") {
      const letters = [...s.letters];
      for (const c of s.word) {
        const i = letters.indexOf(c);
        if (i < 0) throw new Error("字母不足");
        letters.splice(i, 1);
      }
    }
    if (
      s.type === "transform" &&
      (!s.from || !singleLetterChange(s.from, s.word))
    )
      throw new Error("换字规则错误");
    if (
      !IMAGES.some((a) => a.id === s.word) ||
      !AUDIO.some((a) => a.text === s.prompt) ||
      !FEEDBACK[s.id]
    )
      throw new Error(`资源或反馈引用缺失 ${s.id}`);
    if ((s.type === "spell" || s.type === "transform") && s.prompt !== s.word)
      throw new Error("任务语音与目标不一致");
    if (
      s.source &&
      state.world.entities[s.source]?.word !==
        (s.type === "transform" ? s.from : s.word)
    )
      throw new Error(`来源词形不一致 ${s.id}`);
    if (s.type === "spell" || s.type === "transform") {
      const { editable } = letterLayout(s);
      if (
        !editable.length ||
        new Set(editable).size !== editable.length ||
        editable.some((i) => !Number.isInteger(i) || i < 0 || i > 2)
      )
        throw new Error("可编辑位置错误");
      const bank = [...s.letters];
      for (let i = 0; i < 3; i++) {
        if (!editable.includes(i)) {
          if (s.from?.[i] !== s.word[i]) throw new Error("目标位置被锁定");
        } else {
          const n = bank.indexOf(s.word[i]);
          if (n < 0) throw new Error("操作字母不足");
          bank.splice(n, 1);
          if (s.type === "transform" && !s.letters.includes(s.from![i]))
            throw new Error("来源字母不足");
        }
      }
    }
    if (s.type === "place") {
      const input = correctInput(s);
      if (
        !sceneTargets(state.world, s.act).some(
          (t) => t.id === `${input.target}:${input.relation}`,
        )
      )
        throw new Error("场景目标不可达");
    }
    if (
      (s.type === "place" || s.type === "select") &&
      state.world.entities[s.source!]?.location.kind !== "stage"
    )
      throw new Error("来源不能通过场景选择");
    const result = run(
      state,
      {
        sessionId: state.id,
        stepId: s.id,
        attemptId: `validate-${index}`,
        expectedRevision: state.revision,
        type: "submit",
        input: correctInput(s),
      },
      steps,
    );
    if (result.outcome !== "success") throw new Error(`不可达步骤 ${s.id}`);
    const feedback = FEEDBACK[s.id];
    if (
      !FEEDBACK_KINDS.includes(feedback.kind) ||
      !result.session.world.entities[feedback.entityId] ||
      ![feedback.title, feedback.response, feedback.repaired].every(
        (v) => typeof v === "string" && v.length > 0 && v.length < 160,
      )
    )
      throw new Error(`结果表现绑定无效 ${s.id}`);
    state = result.session;
  });
  if (
    state.world.entities["route-sheet"]?.word !== "map" ||
    state.world.entities["picnic-mat"]?.word !== "mat" ||
    !state.world.flags.includes("crossed-ink") ||
    state.world.entities["cat-companion"]?.location.kind !== "relation"
  )
    throw new Error("结局状态错误");
}
