import type { Quest } from "../game/quest.ts";
import { LEXICON } from "../content/quest.ts";
import { Visual } from "./Art.tsx";
export function WordBook({
  session,
  speak,
}: {
  session: Quest;
  speak: (text: string) => void;
}) {
  const words = new Set(Object.values(session.boards).flatMap((b) => b.taught));
  session.events.forEach((e) => {
    if (e.word) words.add(e.word);
  });
  return (
    <main className="word-book">
      <span className="eyebrow">我的纸上足迹</span>
      <h1>词语册</h1>
      <p>记录见过和用过的词，不把一次成功当作永久掌握。</p>
      {LEXICON.filter((l) => words.has(l.word)).map((l) => {
        const events = session.events.filter((e) => e.word === l.word);
        return (
          <article key={l.word}>
            <Visual id={l.asset} label={l.zh} />
            <div>
              <h2>
                {l.word} <small>{l.zh}</small>
              </h2>
              <p>{l.meaning}</p>
              <p lang="en">{l.example}</p>
              <button onClick={() => speak(l.word)}>听词语</button>
              <small>
                见过 / 使用观察 {events.length} 次 ·{" "}
                {events.some((e) => e.evidence === "independent")
                  ? "有本次独立练习"
                  : "尚无独立练习"}{" "}
                ·{" "}
                {events.some((e) => e.evidence === "revisit")
                  ? "有回访观察"
                  : "尚无回访观察"}
              </small>
            </div>
          </article>
        );
      })}
      {!words.size && <p>去场景认识一个词，它就会来到这里。</p>}
    </main>
  );
}
