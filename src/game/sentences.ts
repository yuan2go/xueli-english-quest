import { isWord } from "../domain/world.ts";
import type { Meaning, SentenceTask } from "../content/sentences.ts";
import { parseLanguage } from "./language.ts";
export type Parsed =
  | { status: "valid"; meaning: Meaning }
  | { status: "incomplete" | "structure" | "outside"; message: string };
/** Read-only historical task adapter to the single authored grammar. */
export function parseSentence(text: string): Parsed {
  if (/\b(please|a|it|open|close|make|small|big|closed)\b/i.test(text))
    return { status: "outside", message: "此表达未收录在历史规则版本。" };
  const parsed = parseLanguage(text);
  if (parsed.status !== "valid") return parsed;
  const m = parsed.meaning;
  if (m.verb !== "place" || !isWord(m.source) || !isWord(m.target))
    return { status: "outside", message: "这个表达超出了旧活动范围。" };
  return {
    status: "valid",
    meaning: {
      kind: m.kind,
      source: m.source,
      relation: m.relation,
      target: m.target,
    },
  };
}
export function assemble(
  task: SentenceTask,
  ids: string[],
): string | undefined {
  if (new Set(ids).size !== ids.length) return;
  const selected = ids.map((id) => task.tokens.find((t) => t.id === id));
  if (selected.some((t) => !t)) return;
  return selected.map((t) => t!.text).join(" ");
}
export function sameMeaning(a: Meaning, b: Meaning): boolean {
  return (
    a.kind === b.kind &&
    a.source === b.source &&
    a.relation === b.relation &&
    a.target === b.target
  );
}
