export const FEEDBACK_KINDS = [
  "wake",
  "pack",
  "unfold",
  "morph",
  "cross",
  "navigate",
  "try-hat",
  "spread",
  "store",
  "settle",
  "arrive",
  "picnic",
] as const;
export interface FeedbackDefinition {
  id: string;
  entityId: string;
  kind: (typeof FEEDBACK_KINDS)[number];
  title: string;
  response: string;
  repaired: string;
}
export const FEEDBACK: Record<string, FeedbackDefinition> = Object.fromEntries(
  [
    [
      "s01",
      "cat-companion",
      "wake",
      "小猫醒来了",
      "小猫伸了个懒腰，向你招招手：一起出发吧。",
      "小猫",
    ],
    [
      "s02",
      "bag-main",
      "pack",
      "背包准备好了",
      "小猫检查空背包：准备好了，路上可以收纳物品。",
      "出发准备",
    ],
    [
      "s03",
      "route-sheet",
      "unfold",
      "地图展开了",
      "折页展开，一条通向树林的小径出现了。第一页修复！",
      "路线",
    ],
    [
      "s04a",
      "route-sheet",
      "morph",
      "一张纸的新用途",
      "地图变成了垫子，能铺在湿墨上。还是同一张纸。",
      "纸张魔法",
    ],
    [
      "s04b",
      "route-sheet",
      "cross",
      "小径接通了",
      "垫子盖住湿墨，小猫沿着它走到对岸。",
      "湿墨小径",
    ],
    [
      "s05",
      "route-sheet",
      "navigate",
      "地图又回来了",
      "小猫已经过路，收起垫子恢复地图。箭头指向树荫。",
      "下一站",
    ],
    [
      "s06",
      "hat-main",
      "try-hat",
      "试戴一下",
      "小猫扶着宽檐帽试了试，再把帽子收回。",
      "树荫礼物",
    ],
    [
      "s07",
      "cat-card",
      "morph",
      "纸偶变成了帽子",
      "小猫向纸偶变出的鸭舌帽挥挥手。第二页修复！",
      "纸偶魔法",
    ],
    [
      "s08",
      "picnic-mat",
      "spread",
      "野餐垫铺开了",
      "新垫子铺在草地上。地图仍然是那张地图。",
      "野餐地",
    ],
    [
      "s09",
      "cat-card",
      "store",
      "帽子收进背包了",
      "鸭舌帽在背包里面，打开的袋口还能看到它。",
      "收纳",
    ],
    [
      "s10",
      "hat-main",
      "settle",
      "帽子放稳了",
      "宽檐帽安稳地放在垫子上，小猫点点头。",
      "布置",
    ],
    [
      "s11",
      "route-sheet",
      "arrive",
      "我们到了",
      "地图上的终点亮起来：野餐地就在这里。",
      "到达标记",
    ],
    [
      "s12",
      "cat-companion",
      "picnic",
      "野餐开始啦",
      "小猫坐上垫子。三页绘本都回来了，谢谢你一起走过这条路。",
      "小猫入座",
    ],
  ].map(([id, entityId, kind, title, response, repaired]) => [
    id,
    {
      id: `result-${id}`,
      entityId,
      kind: kind as FeedbackDefinition["kind"],
      title,
      response,
      repaired,
    },
  ]),
);
// Chinese captions are authored text pending review, not claimed recorded narration.
export const FEEDBACK_REVIEW = "PENDING";
