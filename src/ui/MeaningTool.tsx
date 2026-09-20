import type { Intent, QuestBoard } from "../game/quest.ts";
import { lexeme } from "../content/quest.ts";
import type { Puzzle } from "../content/quest.ts";
import { Visual } from "./Art.tsx";
export function MeaningTool({
  board: b,
  spec,
  word,
  teach,
  send,
  speak,
  onTry,
}: {
  board: QuestBoard;
  spec: Puzzle;
  word: string;
  teach: (word: string) => void;
  send: (intent: Intent) => void;
  speak: (text: string) => void;
  onTry: () => void;
}) {
  const sampleTarget =
    Object.values(b.world.entities).find((e) => e.word === word)?.id ??
    (b.world.entities["craft-box"] ? "craft-box" : "cat-companion");

  return (
    <>
      <div className="meaning-tabs">
        {spec.words.map((w) => (
          <button key={w} aria-pressed={word === w} onClick={() => teach(w)}>
            {w}
          </button>
        ))}
      </div>
      <div className="meaning-sample">
        <Visual
          id={lexeme(word)?.asset ?? "box"}
          label={lexeme(word)?.zh ?? word}
        />
        <div>
          <h3>
            {word} · {lexeme(word)?.zh}
          </h3>
          <p>{lexeme(word)?.meaning}</p>
          <button onClick={() => speak(word)}>听词语</button>
        </div>
      </div>
      {["small", "big"].includes(word) && (
        <div className="meaning-comparison">
          <span>
            <Visual id={lexeme(word)?.asset ?? "box"} label="小的示意" />
            <b>small</b>
          </span>
          <span>
            <Visual id={lexeme(word)?.asset ?? "box"} label="大的示意" />
            <b>big</b>
          </span>
        </div>
      )}
      {["small", "big"].includes(word) && (
        <button
          onClick={() =>
            send({
              kind: "world",
              action: {
                type: "resize",
                source: sampleTarget,
                size: word as "small" | "big",
              },
            })
          }
        >
          在场景试试 {word}
        </button>
      )}
      {["open", "close"].includes(word) && (
        <button
          onClick={() =>
            send({
              kind: "world",
              action: {
                type: "open",
                source: b.world.entities["box-main"]
                  ? "box-main"
                  : b.world.entities["bag-main"]
                    ? "bag-main"
                    : "gate",
                open: word === "open",
              },
            })
          }
        >
          在场景试试 {word}
        </button>
      )}
      {["in", "on"].includes(word) &&
        b.world.entities["apple-main"] &&
        b.world.entities["box-main"] && (
          <button
            onClick={() =>
              send({
                kind: "world",
                action: {
                  type: "move",
                  source: "apple-main",
                  to: { kind: word as "in" | "on", id: "box-main" },
                },
              })
            }
          >
            在场景试试 {word}
          </button>
        )}
      <p>Open / Put / Make 请伙伴行动；The … is … 说眼前的情况。</p>
      {["put", "is"].includes(word) && (
        <div className="grammar-lesson">
          <p>指令：Open the box. → 请打开箱子。</p>
          <p>描述：The box is open. → 箱子现在开着。</p>
          <p>只说「现在开着」，箱子不会自己打开。去场景看看两种话的结果。</p>
        </div>
      )}
      <button
        className="primary"
        onClick={() => {
          onTry();
        }}
      >
        回到场景试一试
      </button>
    </>
  );
}
