import { ACTIVITIES, SCENES } from "../content/adventure.ts";
import { ENCOUNTERS, SENTENCE_ANCHORS } from "../content/encounters.ts";
import type { Adventure, Intent, AdventureResult } from "./adventure.ts";
import {
  at,
  availableWords,
  board,
  complete,
  sentenceTasks,
} from "./adventure.ts";
import type { WordId } from "../domain/world.ts";
import type { LetterTask } from "./interaction.ts";
export type Tool = {
  kind: "word" | "morph" | "sentence" | "craft" | "find";
  id: string;
};
export type SceneAction = {
  id: string;
  label: string;
  anchor: string;
  tool?: Tool;
  intent?: Intent;
};
export function sceneModel(s: Adventure) {
  const b = board(s),
    ended = s.mode === "story" && b.facts.includes("ending");
  const activity =
    s.mode === "story" ? undefined : ACTIVITIES[s.mode].variants[b.variant];
  const actions: SceneAction[] = sentenceTasks(s)
    .filter((t) => !b.facts.includes(`sentence:${t.id}`))
    .map((t) => ({
      id: t.id,
      label: t.title,
      anchor: SENTENCE_ANCHORS[t.id],
      tool: { kind: "sentence", id: t.id },
    }));
  if (
    s.mode === "story" &&
    b.facts.includes("sentence:invite-cat") &&
    !b.facts.includes("found-map")
  )
    actions.push({
      id: "find-map",
      label: "听听小猫想找什么 →",
      anchor: "cat-companion",
      tool: { kind: "find", id: "find-map" },
    });
  if (s.mode === "story" && complete(s) && b.scene !== "meadow")
    actions.push({
      id: "travel",
      anchor: "exit",
      label: b.scene === "home" ? "沿小径出发 →" : "跟着地图去草地 →",
      intent: {
        action: "travel",
        value: b.scene === "home" ? "trail" : "meadow",
      },
    });
  if (s.mode === "story" && complete(s) && b.scene === "meadow" && !ended)
    actions.push({
      id: "finish",
      anchor: "cat-companion",
      label: "开始我们的野餐",
      intent: { action: "finish" },
    });
  return {
    id: activity ? `${s.mode}-${b.variant}` : ENCOUNTERS[b.scene].id,
    title: ended ? "野餐开始啦！" : (activity?.title ?? SCENES[b.scene].title),
    problem:
      activity?.problem ??
      (ended
        ? "这就是你们的野餐。还可以继续摆放、换帽子，或去小路上玩。"
        : ENCOUNTERS[b.scene].invitation),
    actions,
    ended,
    activityComplete: s.mode !== "story" && complete(s),
    ending: at(b, "hat-main", "worn")
      ? "你选了宽檐帽，小猫有了一把小伞。"
      : at(b, "cat-card", "worn")
        ? "你选了鸭舌帽，小猫准备好下一次探险。"
        : "你摘下了帽子，小猫自在地晒太阳。",
  };
}
export function resolveTool(s: Adventure, tool: Tool) {
  const b = board(s);
  const word =
    tool.kind === "word"
      ? availableWords(s).find((t) => t.id === tool.id)
      : undefined;
  const sentence =
    tool.kind === "sentence"
      ? sentenceTasks(s).find((t) => t.id === tool.id)
      : undefined;
  const morph = tool.kind === "morph" ? b.world.entities[tool.id] : undefined;
  const target = morph
    ? (
        { map: "mat", mat: "map", cat: "cap", cap: "cat" } as Partial<
          Record<WordId, WordId>
        >
      )[morph.word]
    : word?.word;
  const id =
    word?.id ??
    sentence?.id ??
    (morph
      ? `morph:${morph.id}`
      : tool.kind === "find"
        ? "find-map"
        : undefined);
  const teaching =
    word?.mode === "teaching" ||
    sentence?.mode === "teaching" ||
    (!!morph &&
      ((morph.id === "cat-card" && !b.facts.includes("morphed-card")) ||
        (morph.id === "route-sheet" &&
          !b.world.flags.includes("crossed-ink"))));
  const help = id ? b.help[id] : undefined;
  const reveal = (!!word && teaching) || !!help?.text;
  const letter: LetterTask | undefined = word
    ? {
        id: word.id,
        type: "spell",
        word: word.word,
        letters: word.letters,
        mode: word.mode,
      }
    : morph && target
      ? {
          id: `morph:${morph.id}`,
          type: "transform",
          word: target,
          from: morph.word,
          mode: "guided",
          letters: ["map", "mat"].includes(morph.word) ? "pt" : "tp",
        }
      : tool.kind === "craft"
        ? {
            id: "craft",
            type: "spell",
            word: "mat",
            letters: "mhat",
            mode: "exploration",
          }
        : undefined;
  return {
    word,
    sentence,
    morph,
    target,
    id,
    teaching,
    help,
    reveal,
    letter,
    mode:
      sentence?.mode ??
      word?.mode ??
      (teaching
        ? "teaching"
        : tool.kind === "find"
          ? "revisit"
          : "exploration"),
    prompt:
      sentence?.example ??
      target ??
      (tool.kind === "find" ? "Find the map." : ""),
    title:
      word?.purpose ??
      sentence?.title ??
      (morph
        ? "给纸张换一个词尾"
        : tool.kind === "find"
          ? "听声音，点场景中的物品"
          : "用拼词制作备用物品"),
    context:
      word?.meaning ??
      sentence?.context ??
      (morph
        ? morph.word === "map"
          ? "小猫需要一条干路。展开这张路线纸，试试能垫脚的新用途。"
          : morph.word === "mat"
            ? "不再用来垫脚时，收好纸张，再恢复能指路的用途。"
            : "这是纸偶。换个词尾，让它变成能戴的东西。"
        : tool.kind === "craft"
          ? "mat 做备用垫，hat 做备用帽；每种一件。"
          : "先听声音，再到场景中找。也可以开启文字辅助。"),
  };
}
export type Cue = {
  id: number;
  roles?: {
    id: string;
    role: "source" | "actor" | "support" | "attachment" | "displaced";
    action:
      | "walk"
      | "place"
      | "wear"
      | "store"
      | "take"
      | "transform"
      | "appear"
      | "open"
      | "close";
  }[];
  kind:
    | "appear"
    | "transform"
    | "move"
    | "cross"
    | "arrive"
    | "celebrate"
    | "observe"
    | "blocked";
  message: string;
  entity?: string;
  from?: WordId;
  to?: WordId;
  duration: number;
};
export function presentation(
  before: Adventure,
  intent: Intent,
  result: AdventureResult,
): Cue | null {
  if (["audio", "help", "replay"].includes(intent.action)) return null;
  const success = ["valid", "done"].includes(result.kind);
  const kind: Cue["kind"] = !success
    ? "blocked"
    : intent.action === "transform"
      ? "transform"
      : ["word", "craft"].includes(intent.action)
        ? "appear"
        : intent.action === "finish"
          ? "celebrate"
          : ["travel", "activity", "exit", "restart-activity"].includes(
                intent.action,
              )
            ? "arrive"
            : !board(before).world.flags.includes("crossed-ink") &&
                board(result.session).world.flags.includes("crossed-ink")
              ? "cross"
              : ["place", "sentence", "experiment"].includes(intent.action) &&
                  board(before).world.revision !==
                    board(result.session).world.revision
                ? "move"
                : "observe";
  const entity =
    result.focus ??
    (intent.action === "sentence"
      ? sentenceTasks(before).find((t) => t.id === intent.task)?.sourceId
      : intent.source);
  const prev = board(before),
    next = board(result.session);
  const roles: NonNullable<Cue["roles"]> = [];
  for (const e of Object.values(next.world.entities)) {
    const old = prev.world.entities[e.id];
    const changed =
      !old ||
      old.word !== e.word ||
      JSON.stringify(old.location) !== JSON.stringify(e.location);
    const actor = e.kind === "actor";
    if (changed || (actor && kind === "cross"))
      roles.push({
        id: e.id,
        role: actor
          ? "actor"
          : kind === "cross" && e.id === "route-sheet"
            ? "support"
            : e.id === entity
              ? "source"
              : "displaced",
        action: !old
          ? "appear"
          : old.word !== e.word
            ? "transform"
            : actor
              ? "walk"
              : e.location.kind === "worn"
                ? "wear"
                : e.location.kind === "relation" && e.location.relation === "in"
                  ? "store"
                  : old.location.kind !== "stage"
                    ? "take"
                    : "place",
      });
  }
  for (const e of Object.values(next.world.entities)) {
    if (
      e.location.kind === "worn" &&
      roles.some(
        (r) => r.id === (e.location as { targetId: string }).targetId,
      ) &&
      !roles.some((r) => r.id === e.id)
    )
      roles.push({ id: e.id, role: "attachment", action: "wear" });
  }
  if (intent.action === "bag")
    roles.push({
      id: "bag-main",
      role: "source",
      action: next.bagOpen ? "open" : "close",
    });
  return {
    id: result.session.revision,
    roles,
    kind,
    entity,
    message: result.message,
    from: entity ? board(before).world.entities[entity]?.word : undefined,
    to: entity ? board(result.session).world.entities[entity]?.word : undefined,
    duration: ["arrive", "celebrate", "cross"].includes(kind)
      ? 2400
      : kind === "transform"
        ? 1400
        : 1000,
  };
}
