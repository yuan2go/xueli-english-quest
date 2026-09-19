import type { Step } from "./story.ts";
import type { World, WordId } from "../domain/world.ts";
import { AUDIO } from "./manifest.ts";
type Instruction =
  | { action: "word" | "find" | "cross"; word: WordId }
  | { action: "place"; word: WordId; relation: "in" | "on"; target: WordId };
export const INSTRUCTIONS: Record<string, Instruction> = {
  s01: { action: "word", word: "cat" },
  s02: { action: "word", word: "bag" },
  s03: { action: "word", word: "map" },
  s04a: { action: "word", word: "mat" },
  s04b: { action: "cross", word: "mat" },
  s05: { action: "word", word: "map" },
  s06: { action: "word", word: "hat" },
  s07: { action: "word", word: "cap" },
  s08: { action: "word", word: "mat" },
  s09: { action: "place", word: "cap", relation: "in", target: "bag" },
  s10: { action: "place", word: "hat", relation: "on", target: "mat" },
  s11: { action: "find", word: "map" },
  s12: { action: "place", word: "cat", relation: "on", target: "mat" },
};
export function instructionText(i: Instruction) {
  return i.action === "place"
    ? `Put the ${i.word} ${i.relation} the ${i.target}.`
    : i.action === "find"
      ? `Find the ${i.word}.`
      : i.word;
}
/** The same finite semantic contract guards author validation and live commands. */
export function instructionIssue(step: Step, world: World): string | null {
  const i = INSTRUCTIONS[step.id];
  if (
    !i ||
    step.word !== i.word ||
    step.prompt !== instructionText(i) ||
    !AUDIO.some((a) => a.text === instructionText(i))
  )
    return `${step.id}.prompt: INSTRUCTION_MISMATCH`;
  if (i.action === "word") {
    if (!["spell", "transform"].includes(step.type))
      return `${step.id}.type: ACTION_MISMATCH`;
    if (
      step.type === "spell" &&
      (step.effect?.type !== "spawn" || step.effect.entity.word !== i.word)
    )
      return `${step.id}.effect: WORD_MISMATCH`;
    if (
      step.type === "transform" &&
      (world.entities[step.source!]?.word !== step.from ||
        step.effect?.type !== "transform" ||
        step.effect.sourceId !== step.source ||
        step.effect.to !== i.word)
    )
      return `${step.id}.source: FORM_MISMATCH`;
  } else {
    if (world.entities[step.source!]?.word !== i.word)
      return `${step.id}.source: WORD_MISMATCH`;
    if (i.action === "find" && (step.type !== "select" || step.effect))
      return `${step.id}.type: ACTION_MISMATCH`;
    if (
      i.action === "cross" &&
      (step.type !== "place" ||
        step.target?.kind !== "zone" ||
        step.target.id !== "ink-road" ||
        step.mode !== "interaction")
    )
      return `${step.id}.target: CROSS_MISMATCH`;
    if (
      i.action === "place" &&
      (step.type !== "place" ||
        step.target?.kind !== "relation" ||
        step.target.relation !== i.relation ||
        world.entities[step.target.targetId]?.word !== i.target)
    )
      return `${step.id}.target: RELATION_MISMATCH`;
    if (
      step.type === "place" &&
      (step.effect?.type !== "place" ||
        step.effect.sourceId !== step.source ||
        JSON.stringify(step.effect.target) !== JSON.stringify(step.target))
    )
      return `${step.id}.effect: EFFECT_MISMATCH`;
  }
  return null;
}
