import { STEPS } from "../content/story.ts";
import { FEEDBACK } from "../content/feedback.ts";
import type { Session } from "./session.ts";
export function repairs(session: Session) {
  const done = new Set(
    session.events.filter((e) => e.correct).map((e) => e.stepId),
  );
  return [1, 2, 3].map((act) => {
    const steps = STEPS.filter((s) => s.act === act);
    return {
      act,
      complete: steps.every((s) => done.has(s.id)),
      items: steps.map((s) => ({
        label: FEEDBACK[s.id].repaired,
        complete: done.has(s.id),
        stepId: s.id,
      })),
    };
  });
}
export function summarize(session: Session) {
  const groups = new Map<
    string,
    {
      word: string;
      type: string;
      attempts: number;
      errors: number;
      teaching: number;
      independent: number;
      assisted: number;
      demo: number;
      unverified: number;
      replays: number;
      revisit: string[];
    }
  >();
  const confusions = new Map<string, number>();
  const seen = new Map<string, string>();
  for (const e of session.events) {
    const s = STEPS.find((s) => s.id === e.stepId)!;
    const key = `${s.word}/${e.taskType}`;
    const g = groups.get(key) ?? {
      word: s.word,
      type: e.taskType,
      attempts: 0,
      errors: 0,
      teaching: 0,
      independent: 0,
      assisted: 0,
      demo: 0,
      unverified: 0,
      replays: 0,
      revisit: [],
    };
    g.attempts++;
    if (!e.correct && e.taskType !== "interaction") g.errors++;
    if (e.correct) {
      if (e.presentationMode === "teaching") g.teaching++;
      else if (e.outcome === "demonstrated") g.demo++;
      else if (e.outcome === "independent-correct") g.independent++;
      else if (e.outcome === "unverified-correct") g.unverified++;
      else if (e.taskType !== "interaction") g.assisted++;
      if (seen.has(s.word) && seen.get(s.word) !== s.id) g.revisit.push(s.id);
      if (!seen.has(s.word)) seen.set(s.word, s.id);
    }
    // Replays are cumulative per step; count only once per step, never as errors.
    groups.set(key, g);
    if (!e.correct && e.taskType !== "interaction") {
      const value = e.submitted.word
        ? `${s.word} → ${e.submitted.word}`
        : `${s.word}：${e.errorKind}`;
      confusions.set(value, (confusions.get(value) ?? 0) + 1);
    }
  }
  for (const g of groups.values())
    g.replays = STEPS.filter((s) => s.word === g.word).reduce(
      (n, s) =>
        n +
        Math.max(
          0,
          ...session.events
            .filter((e) => e.stepId === s.id && e.taskType === g.type)
            .map((e) => e.replays),
        ),
      0,
    );
  return {
    groups: [...groups.values()],
    confusions: [...confusions],
    pages: repairs(session),
  };
}
