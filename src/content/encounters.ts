import type { SceneId } from "./adventure.ts";
/** Presentation bindings only. Availability and completion still come from Adventure. */
export const ENCOUNTERS = {
  home: {
    id: "prepare-trip",
    invitation: "先叫醒伙伴，再挑选旅行要带的东西。",
    icon: "⌂",
  },
  trail: {
    id: "cross-ink",
    invitation: "这张纸能改变用途。把它亲手铺到湿墨上。",
    icon: "↝",
  },
  meadow: {
    id: "make-picnic",
    invitation: "摆一摆，试着用一句话安排你们的野餐。",
    icon: "♧",
  },
} satisfies Record<SceneId, { id: string; invitation: string; icon: string }>;
export const SENTENCE_ANCHORS: Record<string, string> = {
  "pack-cap": "bag-main",
  "describe-hat": "hat-main",
  "invite-cat": "cat-companion",
  "find-inside": "bag-main",
  "find-behind": "picnic-mat",
  "helper-seat": "route-sheet",
  "helper-pack": "bag-main",
  recap: "cat-companion",
};
export const ENTITY_REACTIONS: Record<string, string> = {
  "ink-road": "小猫收回爪子：湿墨还没干。点身边的纸，看看它能变成什么。",
  "cat-companion": "喵！我和你一起看看，哪件东西能帮上忙？",
  "bag-main": "袋口能开也能合。收好的东西，随时能再拿出来。",
};
