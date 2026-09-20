import type { Adventure } from "./adventure.ts";
import { at, board } from "./adventure.ts";
/** A small projection of each authored situation, not a second quest engine. */
export function playfulState(s: Adventure) {
  const b = board(s),
    e = b.world.entities;
  if (s.mode === "dress") {
    const cap = at(b, "cat-card", "worn"),
      hat = at(b, "hat-main", "worn");
    return {
      scene: b.variant ? "breeze" : "sun",
      clue: b.variant
        ? "树叶动了。试试哪种帽檐更贴头。"
        : "在太阳下和树荫里，帽子各有什么用？",
      response: b.facts.includes("tried-breeze")
        ? cap
          ? "贴头帽稳稳的，小猫可以迈步出发。"
          : "风把大帽檐掀回了地上。喵，像一艘小船！可以换一顶。"
        : b.facts.includes("tried-sun")
          ? hat
            ? "宽帽檐投下树叶一样的影子，小猫坐下来歇脚。"
            : "小帽檐挡住一点光，小猫选了树荫，尾巴凉快啦。"
          : "",
      actions: [
        { value: "sun", label: "试试晒太阳" },
        { value: "breeze", label: "试试吹小风" },
      ],
    };
  }
  if (s.mode === "find")
    return {
      scene: "discovery",
      clue: b.variant
        ? "一角帽檐从包后露出来。包里那顶是另一个发现。"
        : "一顶在外面，另一顶会藏在哪里？试着开包，再比较。",
      response: b.variant
        ? at(b, "bag-main", "on", "picnic-mat")
          ? "遮挡还在。挪开背包，才能看清下面。"
          : "帽檐露出来了！现在能观察它和垫子的关系。"
        : b.bagOpen
          ? "袋口开了。里面和外面，各有一顶。"
          : "包合着，先找到能打开的地方。",
      actions: [],
    };
  if (s.mode === "helper")
    return {
      scene: "cooperate",
      clue: b.variant
        ? "同一张纸不能一边被压着，一边当路线。先安排物品，再决定何时出发。"
        : "原来的座位还在。路线纸展开，就能邀请朋友换到另一边。",
      response: b.facts.includes("departure-preview")
        ? "袋口合好，小猫站起来准备看路线。回来仍能继续布置。"
        : at(b, "cat-companion", "on", "route-sheet")
          ? "小猫真的换了一个座位，原来的垫子空出来了。"
          : e["route-sheet"]?.word === "map"
            ? "路线在纸上；展开后就变成座位。"
            : "纸张已展开。先看看上面有没有物品。",
      actions: b.variant
        ? [
            { value: "depart", label: "试试准备出发" },
            { value: "rest", label: "再歇一会儿" },
          ]
        : [],
    };
  return undefined;
}
