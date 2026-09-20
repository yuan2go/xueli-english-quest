export type Meaning =
  | { kind: "command"; verb: "open" | "close"; source: string }
  | { kind: "command"; verb: "resize"; source: string; size: "small" | "big" }
  | {
      kind: "command" | "description";
      verb: "place";
      source: string;
      relation: "in" | "on";
      target: string;
    }
  | {
      kind: "description";
      verb: "property";
      source: string;
      property: "small" | "big" | "open" | "closed";
    };
export type ParsedLanguage =
  | { status: "valid"; meaning: Meaning }
  | { status: "incomplete" | "structure" | "outside"; message: string };
const nouns = [
  "cat",
  "box",
  "door",
  "basket",
  "apple",
  "bag",
  "mat",
  "map",
  "hat",
  "cap",
];
export const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[.,!?，。！？]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
/** Authored syntax, not general English judgement. Legacy relation grammar uses this same parser. */
export function parseLanguage(text: string): ParsedLanguage {
  const line = normalize(text),
    words = line.split(" ").filter(Boolean);
  if (!line) return { status: "incomplete", message: "先把想说的话放进来。" };
  if (
    words.some(
      (w) =>
        ![
          ...nouns,
          "the",
          "a",
          "it",
          "please",
          "put",
          "open",
          "close",
          "make",
          "is",
          "in",
          "on",
          "small",
          "big",
          "closed",
        ].includes(w),
    )
  )
    return {
      status: "outside",
      message: "这种表达还没有收录。可以用这里的词块试试。",
    };
  const ref = "(?:the |a )?(" + nouns.join("|") + "|it)";
  let m: RegExpExecArray | null;
  const cleaned = line.replace(/^please /, "").replace(/ please$/, "");
  if ((m = new RegExp("^(open|close) " + ref + "$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "command",
        verb: m[1] as "open" | "close",
        source: m[2],
      },
    };
  if ((m = new RegExp("^make " + ref + " (small|big)$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "command",
        verb: "resize",
        source: m[1],
        size: m[2] as "small" | "big",
      },
    };
  if ((m = new RegExp("^put " + ref + " (in|on) " + ref + "$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "command",
        verb: "place",
        source: m[1],
        relation: m[2] as "in" | "on",
        target: m[3],
      },
    };
  if ((m = new RegExp("^(in|on) " + ref + " put " + ref + "$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "command",
        verb: "place",
        source: m[3],
        relation: m[1] as "in" | "on",
        target: m[2],
      },
    };
  if ((m = new RegExp("^" + ref + " is (in|on) " + ref + "$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "description",
        verb: "place",
        source: m[1],
        relation: m[2] as "in" | "on",
        target: m[3],
      },
    };
  if ((m = new RegExp("^(in|on) " + ref + " is " + ref + "$").exec(cleaned)))
    return {
      status: "valid",
      meaning: {
        kind: "description",
        verb: "place",
        source: m[3],
        relation: m[1] as "in" | "on",
        target: m[2],
      },
    };
  if (
    (m = new RegExp("^" + ref + " is (small|big|open|closed)$").exec(cleaned))
  )
    return {
      status: "valid",
      meaning: {
        kind: "description",
        verb: "property",
        source: m[1],
        property: m[2] as "small" | "big" | "open" | "closed",
      },
    };
  // Only valid prefixes are incomplete. A short but finished invalid order is a structure result.
  if (
    /^(open|close|make|put|the|a)$/.test(cleaned) ||
    /\b(the|a|in|on|is)$/.test(cleaned) ||
    /^(put|make) (the |a )?\w+$/.test(cleaned)
  )
    return { status: "incomplete", message: "这句话还没说完，继续放入词块。" };
  return {
    status: "structure",
    message: "调整词序：行动用 Open / Put / Make 开头，描述用 The … is …。",
  };
}
export interface Token {
  id: string;
  text: string;
}
export function tokensFor(task: string): Token[] {
  return [
    "the",
    "Open",
    "box",
    "in",
    "Put",
    "apple",
    "the",
    "on",
    "basket",
    "is",
    "small",
    "big",
    "Make",
    "door",
    "bag",
    "cat",
    "mat",
    "Close",
    "closed",
    "it",
    "Please",
    ".",
  ].map((text, i) => ({ id: `${task}:${i}`, text }));
}
export function assembleTokens(
  task: string,
  ids: string[],
): string | undefined {
  if (ids.length > 24 || new Set(ids).size !== ids.length) return;
  const bank = tokensFor(task),
    selected = ids.map((id) => bank.find((t) => t.id === id));
  if (selected.some((t) => !t)) return;
  return selected.map((t) => t!.text).join(" ");
}
