import type {
  SpatialRules,
  SpatialWorld,
  Thing,
  Place,
} from "../domain/spatial.ts";
export const QUEST_PACK = {
  id: "paper-rescue",
  version: "6.0.0-dev.2",
  rulesVersion: "rescue-1",
  review: "PENDING",
} as const;
const lexicalDefinitions = [
  {
    word: "cat",
    zh: "小猫",
    meaning: "我们的伙伴；大小会变，还是同一只小猫。",
    example: "The cat is small.",
    asset: "cat",
  },
  {
    word: "box",
    zh: "箱子",
    meaning: "能装东西，也能托住东西。",
    example: "Open the box.",
    asset: "box",
  },
  {
    word: "door",
    zh: "门",
    meaning: "打开后，小猫和物品才可以通过。",
    example: "Open the door.",
    asset: "door",
  },
  {
    word: "basket",
    zh: "篮子",
    meaning: "把野餐的东西带在一起。",
    example: "The apple is in the basket.",
    asset: "basket",
  },
  {
    word: "apple",
    zh: "苹果",
    meaning: "今天要送给朋友的水果。",
    example: "Put the apple in the bag.",
    asset: "apple",
  },
  {
    word: "bag",
    zh: "背包",
    meaning: "打开袋口，才可以放入或取出。",
    example: "Open the bag.",
    asset: "bag",
  },
  {
    word: "mat",
    zh: "垫子",
    meaning: "平铺在地上，东西可以放在上面。",
    example: "Put the basket on the mat.",
    asset: "mat",
  },
  {
    word: "small",
    zh: "小的",
    meaning: "同一个物品变小；更容易通过窄处或装进去。",
    example: "Make the box small.",
    asset: "box",
  },
  {
    word: "big",
    zh: "大的",
    meaning: "同一个物品变大；更高，也更占地方。",
    example: "Make the box big.",
    asset: "box",
  },
  {
    word: "open",
    zh: "打开",
    meaning: "打开一个有门或开口的物品。",
    example: "Open the box.",
    asset: "box",
  },
  {
    word: "close",
    zh: "关上",
    meaning: "关上后，里面的物品还在，但不能直接取出。",
    example: "Close the bag.",
    asset: "bag",
  },
  {
    word: "in",
    zh: "在里面",
    meaning: "放进容器的内部。",
    example: "Put the apple in the box.",
    asset: "box",
  },
  {
    word: "on",
    zh: "在上面",
    meaning: "由下面的物品托住。",
    example: "Put the apple on the box.",
    asset: "box",
  },
  {
    word: "put",
    zh: "放",
    meaning: "这是请小猫行动的指令。",
    example: "Put the apple on the mat.",
    asset: "apple",
  },
  {
    word: "is",
    zh: "是 / 在",
    meaning: "说出眼前的情况，物品不会因此移动。",
    example: "The box is small.",
    asset: "box",
  },
] as const;
export const LEXICON = lexicalDefinitions.map((l) => ({
  ...l,
  id: `rescue-word-${l.word}`,
  review: "PENDING" as const,
  reviewer: null,
  reviewedAt: null,
  contentVersion: QUEST_PACK.version,
}));
export const lexeme = (word: string) => LEXICON.find((l) => l.word === word);
export const TYPES: SpatialRules["types"] = {
  cat: { actor: true, resize: true },
  box: {
    resize: true,
    container: true,
    support: true,
    capacity: [1, 3, 5],
    height: [0.5, 1, 2],
    bearing: [1, 2, 3],
  },
  basket: { resize: true, container: true, capacity: [1, 2, 4] },
  bag: { resize: true, container: true, capacity: [1, 2, 4] },
  apple: { resize: true },
  mat: { resize: true, support: true, height: [0, 0, 0], bearing: [1, 2, 3] },
  door: { fixed: true, resize: false },
};
export type Goal =
  | { type: "at"; id: string; node: string }
  | { type: "relation"; id: string; kind: "in" | "on"; target: string }
  | { type: "delivered"; id: string; node: string; containers: string[] };
export interface Puzzle {
  id: string;
  title: string;
  subtitle: string;
  invitation: string;
  goalText: string;
  rules: SpatialRules;
  initial: SpatialWorld;
  goals: Goal[];
  words: string[];
  hint: string;
  request?: string;
  requestRelation?: "in" | "on";
}
export const entity = (
  id: string,
  word: string,
  node: string,
  size: Thing["size"] = "normal",
  open = true,
): Thing => ({ id, word, size, open, place: { kind: "node", id: node } });
const initial = (entities: Thing[]): SpatialWorld => ({
  rules: "rescue-1",
  revision: 0,
  entities: Object.fromEntries(entities.map((e) => [e.id, e])),
  created: [],
});
const fenceRules: SpatialRules = {
  types: TYPES,
  nodes: [
    { id: "home", label: "集合点", x: 14, y: 73, clearance: 3 },
    { id: "step", label: "门外", x: 37, y: 57, clearance: 3 },
    { id: "inside", label: "门内", x: 66, y: 57, clearance: 3 },
    { id: "garden", label: "花园", x: 84, y: 75, clearance: 3 },
    { id: "hole", label: "小洞", x: 51, y: 86, clearance: 1 },
  ],
  edges: [
    { a: "home", b: "step", clearance: 3, enabled: true },
    { a: "step", b: "inside", clearance: 3, enabled: true, door: "gate" },
    { a: "inside", b: "garden", clearance: 3, enabled: true },
    { a: "step", b: "hole", clearance: 1, enabled: true },
    { a: "hole", b: "inside", clearance: 1, enabled: true },
  ],
  handles: [
    { door: "gate", node: "step", height: 4 },
    { door: "gate", node: "inside", height: 1 },
  ],
  quotas: [{ id: "craft-box", word: "box", node: "home" }],
};
export function puzzle(id: string, variant = 0): Puzzle {
  if (id === "R2")
    return {
      id,
      title: "装得下，也带得走",
      subtitle: "纸上小径 · 第二页",
      invitation:
        "苹果和小背包不太合适。调整它们，或做个箱子，把水果一起带到野餐路口。",
      goalText: "把苹果装进背包或箱子，带到野餐路口",
      rules: {
        types: TYPES,
        nodes: [
          { id: "home", label: "整理处", x: 19, y: 70, clearance: 3 },
          { id: "packing", label: "果树下", x: 42, y: 60, clearance: 3 },
          { id: "tunnel", label: "纸拱门", x: 63, y: 82, clearance: 2 },
          { id: "clearing", label: "野餐路口", x: 84, y: 59, clearance: 3 },
        ],
        edges: [
          { a: "home", b: "packing", clearance: 3, enabled: true },
          { a: "packing", b: "tunnel", clearance: 2, enabled: true },
          { a: "tunnel", b: "clearing", clearance: 2, enabled: true },
        ],
        handles: [],
        quotas: [{ id: "craft-box", word: "box", node: "home" }],
      },
      initial: initial([
        entity("cat-companion", "cat", "home"),
        entity("bag-main", "bag", "home", "small", false),
        entity("apple-main", "apple", "packing"),
      ]),
      goals: [
        {
          type: "delivered",
          id: "apple-main",
          node: "clearing",
          containers: ["bag-main", "craft-box"],
        },
        { type: "at", id: "cat-companion", node: "clearing" },
      ],
      words: [
        "apple",
        "bag",
        "box",
        "open",
        "close",
        "in",
        "on",
        "put",
        "is",
        "small",
        "big",
      ],
      hint: "里面要装得下，整件物品也要过得了纸拱门。大并不总是好办法。",
    };
  if (id === "R3") {
    const relation = variant % 2 === 0 ? "in" : "on";
    const target = relation === "in" ? "basket-main" : "box-main";
    const rules = structuredClone(fenceRules);
    rules.handles = [
      { door: "gate", node: "step", height: 2 },
      { door: "gate", node: "inside", height: 1 },
    ];
    rules.edges
      .filter((e) => e.a === "hole" || e.b === "hole")
      .forEach((e) => {
        e.enabled = false;
      });
    rules.nodes = rules.nodes.filter((n) => n.id !== "hole");
    rules.edges = rules.edges.filter((e) => e.a !== "hole" && e.b !== "hole");
    rules.quotas = [];
    return {
      id,
      title: "朋友的一句请求",
      subtitle: "纸上小径 · 第三页",
      invitation: "朋友说了一句英语。先听听它要什么，再决定放在哪里。",
      goalText: "按朋友的请求送好苹果，让小猫来到花园",
      rules,
      initial: initial([
        entity("cat-companion", "cat", "home"),
        entity("apple-main", "apple", "home"),
        entity("bag-main", "bag", "step"),
        entity("gate", "door", "step", "normal", false),
        entity("basket-main", "basket", "garden"),
        entity("box-main", "box", "inside"),
        entity("picnic-mat", "mat", "garden", "big"),
      ]),
      goals: [
        { type: "relation", id: "apple-main", kind: relation, target },
        { type: "at", id: "cat-companion", node: "garden" },
      ],
      words: [
        "apple",
        "basket",
        "box",
        "mat",
        "door",
        "open",
        "in",
        "on",
        "put",
        "is",
      ],
      hint: "听清 in 还是 on；一句是在里面，另一句是在上面。请先打开路。",
      request:
        relation === "in"
          ? "Put the apple in the basket."
          : "Put the apple on the box.",
      requestRelation: relation,
    };
  }
  if (id === "workshop")
    return {
      id,
      title: "词语的魔法工坊",
      subtitle: "纸上小径 · 随时来试试",
      invitation: "这里的物品可以反复试。带走的是你的发现，物品留在工坊。",
      goalText: "认识意义，然后用自己的句子试一试",
      rules: {
        types: TYPES,
        nodes: [
          { id: "home", label: "制作台", x: 18, y: 70, clearance: 3 },
          { id: "bench", label: "试验台", x: 51, y: 65, clearance: 3 },
          { id: "display", label: "展示处", x: 82, y: 72, clearance: 3 },
        ],
        edges: [
          { a: "home", b: "bench", clearance: 3, enabled: true },
          { a: "bench", b: "display", clearance: 3, enabled: true },
        ],
        handles: [],
        quotas: [
          { id: "craft-box", word: "box", node: "home" },
          { id: "craft-apple", word: "apple", node: "display" },
        ],
      },
      initial: initial([
        entity("cat-companion", "cat", "home"),
        entity("apple-main", "apple", "home"),
        entity("box-main", "box", "bench"),
        entity("bag-main", "bag", "display"),
        entity("picnic-mat", "mat", "display", "big"),
      ]),
      goals: [],
      words: LEXICON.map((l) => l.word),
      hint: "试试把苹果放进箱子，再用 The … is … 描述它。",
    };
  if (id !== "R1" && id !== "R1-R") throw new Error("Unknown authored puzzle");
  const rules = structuredClone(fenceRules);
  if (id === "R1-R")
    rules.edges
      .filter((e) => e.a === "hole" || e.b === "hole")
      .forEach((e) => {
        e.enabled = false;
      });
  return {
    id,
    title: id === "R1-R" ? "再访 · 雨后的小花园" : "围栏那边的篮子",
    subtitle: id === "R1-R" ? "纸上小径 · 雨后回访" : "纸上小径 · 第一页",
    invitation:
      id === "R1-R"
        ? "下雨后，小洞被纸叶堵住了。还能把篮子带回来吗？"
        : "篮子落在花园里了。小猫够不到门外的高把手，你会怎么办？",
    goalText: "把篮子和小猫带回集合点",
    rules,
    initial: initial([
      entity("cat-companion", "cat", "home"),
      entity("gate", "door", "step", "normal", false),
      entity("basket-main", "basket", "garden"),
    ]),
    goals: [
      { type: "at", id: "cat-companion", node: "home" },
      { type: "at", id: "basket-main", node: "home" },
    ],
    words: ["cat", "basket", "box", "door", "small", "big", "open", "close"],
    hint:
      id === "R1-R"
        ? "洞口堵住了。看看把手的高度和能托住小猫的物品。"
        : "门两边的把手不一样高。箱子能托住小猫，小洞只容得下很小的身体。",
  };
}
export const EXERCISES = {
  command: {
    id: "apple-in-box-command",
    meaning: {
      kind: "command",
      verb: "place",
      source: "apple",
      relation: "in",
      target: "box",
    },
    prompt: "请用一句指令，把苹果放进箱子。",
    example: "Put the apple in the box.",
    requires: ["apple", "box", "put", "in"],
    dimension: "grammar",
  },
  description: {
    id: "apple-in-box-description",
    meaning: {
      kind: "description",
      verb: "place",
      source: "apple",
      relation: "in",
      target: "box",
    },
    prompt: "先自己布置苹果在箱子里，再说出你看见的位置。描述不能移动物品。",
    example: "The apple is in the box.",
    requires: ["apple", "box", "is", "in"],
    dimension: "grammar",
  },
  spelling: {
    id: "create-box",
    prompt: "根据意思和发音，拼出「箱子」，做一个可以使用的物品。",
    example: "box",
    requires: ["box"],
    dimension: "spelling",
  },
} as const;
export function relationIs(place: Place, kind: "in" | "on", id: string) {
  return place.kind === kind && place.id === id;
}
export const QUEST_AUDIO = [
  ...new Set([
    ...LEXICON.flatMap((l) => [l.word, l.example]),
    "Put the apple in the basket.",
    "Put the apple on the box.",
    "The apple is in the box.",
  ]),
].map((text, i) => ({
  id: `rescue-voice-${i}`,
  text,
  path: null,
  sha256: null,
  bytes: null,
  review: "PENDING" as const,
  locale: "en-US",
  version: "rescue-speech-dev-1",
  source: "Browser development TTS; recording and teaching review PENDING",
  type: "audio/mpeg" as const,
  durationMs: null,
}));
