import {
  transition,
  isWord,
  DomainError,
  assertWorld,
} from "../domain/world.ts";
import type { World, Effect, Location, WordId } from "../domain/world.ts";
export type PlayMode = "free" | "dress" | "find" | "helper";
export interface PlayCommand {
  sessionId: string;
  mode: PlayMode;
  revision: number;
  attemptId: string;
  action: "spell" | "transform" | "place" | "bag";
  source?: string;
  word?: string;
  target?: Location;
}
export interface PlayEvent {
  action: string;
  source: string;
  word: WordId;
  response: string;
}
export interface Picnic {
  id: string;
  mode: PlayMode;
  seed: number;
  revision: number;
  world: World;
  bagOpen: boolean;
  journal: PlayCommand[];
  events: PlayEvent[];
}
export const MODES: Record<PlayMode, string> = {
  free: "我的魔法野餐",
  dress: "帽子搭配",
  find: "背包找物",
  helper: "野餐小帮手",
};
const stage = { kind: "stage" } as const;
export function initialPicnic(
  id: string,
  mode: PlayMode,
  seed: number,
): Picnic {
  let world: World = { revision: 0, entities: {}, flags: ["crossed-ink"] };
  const items: [string, WordId, "actor" | "object" | "token"][] = [
    ["cat-companion", "cat", "actor"],
    ["bag-main", "bag", "object"],
    ["route-sheet", "map", "object"],
    ["hat-main", "hat", "object"],
    ["cat-card", mode === "dress" ? "cat" : "cap", "token"],
    ["picnic-mat", "mat", "object"],
  ];
  for (const [id, word, kind] of items)
    world = transition(world, {
      expectedRevision: world.revision,
      effect: { type: "spawn", entity: { id, word, kind, location: stage } },
    });
  if (mode === "find")
    for (const sourceId of ["hat-main", "cat-card"])
      world = transition(world, {
        mode: "picnic",
        expectedRevision: world.revision,
        effect: {
          type: "place",
          sourceId,
          target: { kind: "relation", relation: "in", targetId: "bag-main" },
        },
      });
  if (mode === "free")
    for (const [sourceId, targetId, relation] of [
      ["cat-card", "bag-main", "in"],
      ["hat-main", "picnic-mat", "on"],
      ["cat-companion", "picnic-mat", "on"],
    ] as const)
      world = transition(world, {
        mode: "picnic",
        expectedRevision: world.revision,
        effect: {
          type: "place",
          sourceId,
          target: { kind: "relation", relation, targetId },
        },
      });
  return {
    id,
    mode,
    seed: seed >>> 0,
    revision: 0,
    world,
    bagOpen: false,
    journal: [],
    events: [],
  };
}
export function picnicGoals(s: Picnic) {
  const e = s.world.entities;
  const inBag = (id: string) =>
    e[id]?.location.kind === "relation" &&
    e[id].location.relation === "in" &&
    e[id].location.targetId === "bag-main";
  const on = (id: string, target: string) =>
    e[id]?.location.kind === "relation" &&
    e[id].location.relation === "on" &&
    e[id].location.targetId === target;
  const worn = (id: string) => e[id]?.location.kind === "worn";
  const find = s.seed % 2 ? "hat-main" : "cat-card";
  const guest = s.seed % 2 ? "hat-main" : "cat-companion";
  if (s.mode === "dress")
    return [
      { label: "把纸偶变成 cap", done: e["cat-card"].word === "cap" },
      {
        label: "任选一顶帽子给小猫戴上",
        done: worn("hat-main") || worn("cat-card"),
      },
      {
        label: "把另一顶收进背包",
        done:
          (worn("hat-main") && inBag("cat-card")) ||
          (worn("cat-card") && inBag("hat-main")),
      },
    ];
  if (s.mode === "find")
    return [
      { label: "打开背包", done: s.bagOpen },
      {
        label: `找到 ${e[find].word} 并拿出来（文字线索）`,
        done:
          s.events.some((x) => x.action === "place" && x.source === find) &&
          !inBag(find),
      },
      {
        label: `把 ${e[find].word} 放在野餐垫上`,
        done: on(find, "picnic-mat"),
      },
    ];
  if (s.mode === "helper")
    return [
      {
        label: "把地图变成 mat，作为新座位",
        done: e["route-sheet"].word === "mat",
      },
      {
        label: `让 ${guest === "hat-main" ? "hat" : "cat"} 坐在这张新垫子上`,
        done: on(guest, "route-sheet"),
      },
      { label: "把 cap 收进背包；顺序由你决定", done: inBag("cat-card") },
    ];
  return [];
}
export const picnicComplete = (s: Picnic) =>
  s.mode !== "free" && picnicGoals(s).every((g) => g.done);
export function play(
  s: Picnic,
  c: PlayCommand,
): { session: Picnic; message: string; focus?: string } {
  const reply = (message: string, session = s, focus?: string) => ({
    session,
    message,
    focus,
  });
  const prior = s.journal.find((x) => x.attemptId === c.attemptId);
  if (prior)
    return reply(
      JSON.stringify(prior) === JSON.stringify(c)
        ? "这次动作已经完成。"
        : "这次动作已更新。",
    );
  if (c.sessionId !== s.id || c.mode !== s.mode || c.revision !== s.revision)
    return reply("场景已更新，请再选一次。");
  if (s.journal.length >= 2000)
    return reply("本局记录已满。可以导出布置，再确认恢复初始布置。");
  const n = structuredClone(s);
  const apply = (effect: Effect) => {
    n.world = transition(n.world, {
      mode: "picnic",
      expectedRevision: n.world.revision,
      effect,
    });
  };
  let focus = c.source ?? "bag-main",
    message = "";
  try {
    if (c.action === "bag") {
      n.bagOpen = !n.bagOpen;
      message = n.bagOpen
        ? "背包张开了嘴。里面的物品可以选中，再拿到草地上。"
        : "收好袋口，物品还在里面。";
    } else if (c.action === "spell") {
      if (!c.word || c.word.length !== 3) return reply("填好三个字母再施法。");
      if (!isWord(c.word))
        return reply("这个组合还没有收录。试试词卡里的六个词。");
      const existing = Object.values(n.world.entities).find(
        (e) => e.word === c.word && (c.word !== "cat" || e.kind === "actor"),
      );
      if (existing) {
        focus = existing.id;
        message = `${c.word} 就在这里。只有这一件，继续用它吧！`;
        if (
          existing.location.kind === "relation" &&
          existing.location.relation === "in"
        )
          n.bagOpen = true;
      } else
        return reply(
          c.word === "map"
            ? "地图正变成了垫子。选那张纸，先移走上面的物品，再换回 p。"
            : "纸偶可以变成 cap。选纸偶，把词尾换成 p。",
        );
    } else {
      const source = n.world.entities[c.source ?? ""];
      if (!source) return reply("先选一件物品。");
      if (
        source.location.kind === "relation" &&
        source.location.relation === "in" &&
        !n.bagOpen
      )
        return reply("先打开背包，再选择里面的物品。");
      if (c.action === "transform") {
        if (!c.word || !isWord(c.word))
          return reply("试试这张纸的另一个词尾。");
        apply({ type: "transform", sourceId: source.id, to: c.word });
        message =
          c.word === "map"
            ? "地图展开：小径在这里！"
            : c.word === "mat"
              ? "同一张纸铺开了，可以请小猫坐上来。"
              : c.word === "cat"
                ? "帽子变回小猫纸偶。同伴没有变，也没有多一只。"
                : "纸偶变成鸭舌帽，小猫等你挑选。";
      } else if (c.action === "place" && c.target) {
        if (c.target.kind === "zone")
          return reply("野餐时把物品放在草地、垫子或背包里。");
        if (c.target.kind === "worn") {
          if (!["hat", "cap"].includes(source.word))
            return reply(
              "小猫的头上适合 hat 或 cap。其他物品可以放在草地或垫子上。",
            );
          const old = Object.values(n.world.entities).find(
            (e) => e.location.kind === "worn" && e.id !== source.id,
          );
          if (old) apply({ type: "place", sourceId: old.id, target: stage });
        }
        apply({ type: "place", sourceId: source.id, target: c.target });
        message =
          c.target.kind === "worn"
            ? source.word === "hat"
              ? "帽檐遮住眼睛啦！小猫扶正帽子，喜欢这身搭配。"
              : "鸭舌帽戴好了，小猫向你点点头。"
            : c.target.kind === "stage"
              ? source.location.kind === "worn"
                ? "帽子摘下来了，可以收进背包。"
                : "拿到草地了，想放哪里都可以再调整。"
              : c.target.relation === "in"
                ? "咚，收进背包！打开袋口就能再找到。"
                : source.kind === "actor"
                  ? "小猫坐稳了，邀请你一起野餐。"
                  : "放稳了。还可以选中它，再搬回来。";
      } else return reply("选择草地、背包、垫子或小猫头顶。");
    }
    assertWorld(n.world);
  } catch (e) {
    if (!(e instanceof DomainError)) throw e;
    return reply(
      e.code === "TARGET_IN_USE"
        ? "先把上面的物品移到草地；收纳或戴着的物品要先取出/摘下，再变形。"
        : e.code === "PROTECTED_ACTOR"
          ? "同伴不会变形。可以选择小猫纸偶。"
          : "这里不适合这件物品。先放回草地，再选择背包、垫子或帽子位置。",
    );
  }
  const repeats = n.events.filter(
    (e) => e.action === c.action && e.source === focus,
  ).length;
  const placed = n.world.entities[focus]?.location;
  if (repeats === 1 && c.action === "place")
    message =
      placed.kind === "worn"
        ? n.world.entities[focus].word === "hat"
          ? "宽帽檐像一把小伞，小猫抬头看了看。"
          : "小猫把鸭舌帽扶正，准备出发！"
        : placed.kind === "stage"
          ? "回到草地了。小猫给你让出了位置。"
          : placed.kind === "relation" && placed.relation === "in"
            ? "背包把它收好了，袋口还可以打开。"
            : "小猫看看新布置，点了点头。";
  if (repeats > 1)
    message =
      c.action === "bag"
        ? n.bagOpen
          ? "背包打开了。"
          : "背包合上了。"
        : "布置好了，继续试试吧。";
  const stored = structuredClone(c);
  for (const key of ["source", "word", "target"] as const)
    if (stored[key] === undefined) delete stored[key];
  n.revision++;
  n.journal.push(stored);
  n.events.push({
    action: c.action,
    source: focus,
    word: n.world.entities[focus]?.word ?? "bag",
    response: message,
  });
  return reply(message, n, focus);
}
