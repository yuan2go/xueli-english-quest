import { transition } from "../domain/world.ts";
import type { Effect, World, WordId } from "../domain/world.ts";
import type { Adventure } from "./adventure.ts";
import { resolveTool } from "./shell.ts";
import type { Tool } from "./shell.ts";

export type LessonFrame = {
  world: World;
  caption: string;
  chunks: string[];
  highlight: number;
  source: string;
  target?: string;
};
/** An isolated teaching world, with the same entity rules as play. No Adventure commands or facts. */
export function lessonFrames(session: Adventure, tool: Tool): LessonFrame[] {
  const model = resolveTool(session, tool);
  let world: World = { revision: 0, entities: {}, flags: [] };
  const apply = (effect: Effect) => {
    world = transition(world, {
      expectedRevision: world.revision,
      mode: "picnic",
      effect,
    });
  };
  const spawn = (id: string, word: WordId) =>
    apply({
      type: "spawn",
      entity: {
        id,
        word,
        kind:
          id === "cat-companion"
            ? "actor"
            : id === "cat-card"
              ? "token"
              : "object",
        location: { kind: "stage" },
      },
    });
  const frames: LessonFrame[] = [];
  const frame = (
    caption: string,
    chunks: string[],
    highlight: number,
    source: string,
    target?: string,
  ) =>
    frames.push({
      world: structuredClone(world),
      caption,
      chunks,
      highlight,
      source,
      target,
    });
  if (model.sentence) {
    const t = model.sentence;
    spawn(t.sourceId, t.target.source);
    spawn(t.targetId, t.target.target);
    const effect: Effect = {
      type: "place",
      sourceId: t.sourceId,
      target: {
        kind: "relation",
        relation: t.target.relation,
        targetId: t.targetId,
      },
    };
    if (t.mapping === "observe") apply(effect);
    const chunks =
      t.mapping === "place"
        ? [
            "Put",
            `the ${t.target.source}`,
            `${t.target.relation} the ${t.target.target}.`,
          ]
        : [
            `The ${t.target.source}`,
            "is",
            `${t.target.relation} the ${t.target.target}.`,
          ];
    frame(
      t.mapping === "place"
        ? "看看要行动的物品，和它要去的地方。"
        : "先看眼前位置。描述只告诉朋友，不搬东西。",
      [],
      -1,
      t.sourceId,
      t.targetId,
    );
    frame(
      t.mapping === "place"
        ? "Put：请它行动。先说要做什么。"
        : "The…is：说的是眼前这件物品。",
      [chunks[0]],
      0,
      t.sourceId,
      t.targetId,
    );
    if (t.mapping === "place") apply(effect);
    frame(
      t.target.relation === "in"
        ? "in：到了里面。对照开着的袋口。"
        : "on：在上面。看看它和垫子的接触位置。",
      chunks,
      2,
      t.sourceId,
      t.targetId,
    );
    frame(
      t.mapping === "place"
        ? "一句指令，让物品行动。接下来由你亲手试。"
        : "物品没有动，描述和画面一致。现在由你来说。",
      chunks,
      1,
      t.sourceId,
      t.targetId,
    );
  } else if (model.morph && model.target) {
    const id = model.morph.id;
    spawn(id, model.morph.word);
    frame(
      model.morph.word === "map"
        ? "这张纸上的路线可以指路。"
        : model.morph.word === "mat"
          ? "展开可以坐；收好才可以换用途。"
          : "这是纸偶，不是我们的伙伴。",
      [],
      -1,
      id,
    );
    frame(
      "前面两块字母留下，看看词尾。",
      [model.morph.word.slice(0, -1), model.morph.word.slice(-1)],
      1,
      id,
    );
    apply({ type: "transform", sourceId: id, to: model.target });
    frame(
      model.target === "mat"
        ? "换成 t，map 变 mat：铺开可以垫在脚下。"
        : model.target === "map"
          ? "换成 p，mat 变 map：收回路线可以指路。"
          : model.target === "cap"
            ? "换了词尾，纸偶变成能戴的帽子。"
            : "还是同一张纸，又变成纸偶。",
      [model.target.slice(0, -1), model.target.slice(-1)],
      1,
      id,
    );
    frame(
      "这里只演示用途。你的纸张还在原处，回去亲手换字。",
      [model.target],
      0,
      id,
    );
  } else {
    const word = model.target ?? "map";
    const id = model.word?.entity ?? "route-sheet";
    spawn(id, word);
    frame(
      word === "map"
        ? "看纸上的路线，它可以帮朋友认路。"
        : word === "mat"
          ? "铺开的垫子，让朋友有地方坐。"
          : word === "bag"
            ? "袋口打开，可以装进东西，再取出来。"
            : word === "cat"
              ? "这位伙伴有爪子、胡须和尾巴。"
              : "帽檐可以挡住太阳。",
      [],
      -1,
      id,
    );
    frame("字母按声音和顺序组成一个词。", [word[0]], 0, id);
    frame("一起看看完整的词和物品。", [...word], word.length - 1, id);
    frame("回到你的世界，亲手把字母排好。", [word], 0, id);
  }
  return frames;
}
