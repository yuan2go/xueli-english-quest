import type { Effect, Location, WordId, World } from "../domain/world.ts";
import { IMAGES, AUDIO } from "./manifest.ts";
import { FEEDBACK } from "./feedback.ts";
import { INSTRUCTIONS } from "./instructions.ts";

export interface Step {
  id: string;
  challenge: number;
  act: number;
  title: string;
  story: string;
  type: "spell" | "transform" | "select" | "place";
  mode: "teaching" | "guided" | "independent" | "interaction";
  word: WordId;
  prompt: string;
  letters: string;
  hints: string[];
  source?: string;
  from?: WordId;
  target?: Location;
  effect?: Effect;
  enter?: Effect;
  requires?: string;
  editable?: number[];
}
const spawn = (
  id: string,
  word: WordId,
  kind: "actor" | "object" | "token" = "object",
): Effect => ({
  type: "spawn",
  entity: { id, word, kind, location: { kind: "stage" } },
});
const on = (targetId: string): Location => ({
  kind: "relation",
  relation: "on",
  targetId,
});
export const STEPS: Step[] = [
  {
    id: "s01",
    challenge: 1,
    act: 1,
    title: "唤醒纸上的小猫",
    story: "糊涂风吹走了绘本里的字。把小猫的名字拼回来，一起出发吧。",
    type: "spell",
    mode: "teaching",
    word: "cat",
    prompt: "cat",
    letters: "tac",
    hints: [
      "点字母，把它放进空格。点格子可以取回。",
      "按 c、a、t 的顺序拼写。",
    ],
    effect: spawn("cat-companion", "cat", "actor"),
  },
  {
    id: "s02",
    challenge: 2,
    act: 1,
    title: "准备出发",
    story: "野餐要带些什么？听一听，把旅行物品拼出来。",
    type: "spell",
    mode: "guided",
    word: "bag",
    prompt: "bag",
    letters: "gabt",
    hints: ["先听完整单词，再选字母。", "开头是 b，中间是 a。"],
    effect: spawn("bag-main", "bag"),
  },
  {
    id: "s03",
    challenge: 3,
    act: 1,
    title: "找到我们的路线",
    story: "小径伸向树林。听一听，我们还需要一件物品。",
    type: "spell",
    mode: "independent",
    word: "map",
    prompt: "map",
    letters: "tamp",
    hints: ["再听听单词末尾的声音。", "前两个字母是 m、a，末尾选 p。"],
    effect: spawn("route-sheet", "map"),
  },
  {
    id: "s04a",
    challenge: 4,
    act: 2,
    title: "地图也能变小垫子",
    story: "湿墨挡住了小径。把地图的最后一个字母换掉，变出一块垫子。",
    type: "transform",
    mode: "guided",
    word: "mat",
    prompt: "mat",
    letters: "pt",
    source: "route-sheet",
    from: "map",
    hints: ["前两个字母不动，只换最后一个。", "取回 p，换成 t。"],
    effect: { type: "transform", sourceId: "route-sheet", to: "mat" },
  },
  {
    id: "s04b",
    challenge: 4,
    act: 2,
    title: "把垫子铺过湿墨",
    story: "小猫在岸边等你。选中垫子，再点湿墨小径；也可以直接拖过去。",
    type: "place",
    mode: "interaction",
    word: "mat",
    prompt: "mat",
    letters: "",
    source: "route-sheet",
    target: { kind: "zone", id: "ink-road" },
    hints: ["先点垫子，再点湿墨。", "把垫子放在湿墨小径上。"],
    effect: {
      type: "place",
      sourceId: "route-sheet",
      target: { kind: "zone", id: "ink-road" },
    },
  },
  {
    id: "s05",
    challenge: 5,
    act: 2,
    title: "收起小路，找回地图",
    story: "小猫已经过河！把垫子变回地图，继续寻找野餐地。",
    type: "transform",
    mode: "guided",
    word: "map",
    prompt: "map",
    letters: "tp",
    source: "route-sheet",
    from: "mat",
    requires: "crossed-ink",
    hints: ["还是同一张纸，换回末尾字母。", "取回 t，换成 p。"],
    effect: { type: "transform", sourceId: "route-sheet", to: "map" },
  },
  {
    id: "s06",
    challenge: 6,
    act: 2,
    title: "树荫下的小礼物",
    story: "听一听这次要找的帽子名称。拼出来，就能带上它。",
    type: "spell",
    mode: "independent",
    word: "hat",
    prompt: "hat",
    letters: "athc",
    hints: ["重听这次的目标词。", "开头是 h，末尾是 t。"],
    effect: spawn("hat-main", "hat"),
  },
  {
    id: "s07",
    challenge: 7,
    act: 2,
    title: "纸偶的小魔法",
    story: "这张小猫纸偶可以变成另一顶帽子。我们的同伴仍在身边。",
    type: "transform",
    mode: "guided",
    word: "cap",
    prompt: "cap",
    letters: "tp",
    source: "cat-card",
    from: "cat",
    hints: ["只改变纸偶，不改变小猫。", "把末尾 t 换成 p。"],
    enter: spawn("cat-card", "cat", "token"),
    effect: { type: "transform", sourceId: "cat-card", to: "cap" },
  },
  {
    id: "s08",
    challenge: 8,
    act: 3,
    title: "铺开野餐时光",
    story: "终于到草地了！听一听，为野餐拼出一件新物品。",
    type: "spell",
    mode: "independent",
    word: "mat",
    prompt: "mat",
    letters: "pamt",
    hints: ["还记得小径上的那个单词吗？", "m、a 后面接 t。"],
    effect: spawn("picnic-mat", "mat"),
  },
  {
    id: "s09",
    challenge: 9,
    act: 3,
    title: "听一听，收一收",
    story: "点物品，再点放置区，或者把物品拖过去。in 表示在里面。",
    type: "place",
    mode: "guided",
    word: "cap",
    prompt: "Put the cap in the bag.",
    letters: "",
    source: "cat-card",
    target: { kind: "relation", relation: "in", targetId: "bag-main" },
    hints: ["先找语音里提到的物品。", "把 cap 放进 bag 里面。"],
    effect: {
      type: "place",
      sourceId: "cat-card",
      target: { kind: "relation", relation: "in", targetId: "bag-main" },
    },
  },
  {
    id: "s10",
    challenge: 10,
    act: 3,
    title: "整理野餐地",
    story: "再听一句。on 表示在上面。放稳了，就不会被风吹走。",
    type: "place",
    mode: "guided",
    word: "hat",
    prompt: "Put the hat on the mat.",
    letters: "",
    source: "hat-main",
    target: on("picnic-mat"),
    hints: ["听清楚要移动哪件物品。", "把 hat 放到 mat 上面。"],
    effect: { type: "place", sourceId: "hat-main", target: on("picnic-mat") },
  },
  {
    id: "s11",
    challenge: 11,
    act: 3,
    title: "听声音，找物品",
    story: "回家的路线还在吗？听清楚，再点选一件物品。",
    type: "select",
    mode: "independent",
    word: "map",
    prompt: "Find the map.",
    letters: "",
    source: "route-sheet",
    hints: ["可以重听，也可以选择文字辅助。", "找一找折起来的路线图。"],
  },
  {
    id: "s12",
    challenge: 12,
    act: 3,
    title: "最后一个小邀请",
    story: "野餐准备好了。听听最后一句，让故事圆满结束。",
    type: "place",
    mode: "independent",
    word: "cat",
    prompt: "Put the cat on the mat.",
    letters: "",
    source: "cat-companion",
    target: on("picnic-mat"),
    hints: ["先听要邀请谁，再听位置。", "把小猫放到野餐垫上。"],
    effect: {
      type: "place",
      sourceId: "cat-companion",
      target: on("picnic-mat"),
    },
  },
];
export const PACK = {
  id: "picnic",
  version: "3.1.0-dev",
  schema: 2,
  review: "PENDING",
  assetVersion: "paper-placeholder-v1",
  audioVersion: "speech-dev-v1",
} as const;
// The versioned save additionally binds to the exact authored data, not just an index.
export const CONTENT_SIGNATURE = JSON.stringify({
  pack: PACK,
  steps: STEPS,
  images: IMAGES,
  audio: AUDIO,
  feedback: FEEDBACK,
  instructions: INSTRUCTIONS,
});
export const CONTENT_HASH =
  "0400c42731deac0c728566185d7c6a2fb2e3970a4b1e38a475e67462caeef7fb";
export const INITIAL_WORLD: World = { revision: 0, entities: {}, flags: [] };
export const ACTS = [
  "家门口 · 出发之前",
  "树林里 · 湿墨小径",
  "草地上 · 野餐时光",
];
