import { useEffect, useRef, useState } from "react";
import { current, goalSatisfied, taskId } from "../../game/quest.ts";
import type { Intent, Quest, Verdict } from "../../game/quest.ts";
import { puzzle, lexeme, EXERCISES } from "../../content/quest.ts";
import { tokensFor } from "../../game/language.ts";
import { Scene } from "../Scene.tsx";
import { SentenceBuilder } from "../SentenceBuilder.tsx";
import { MeaningTool } from "../MeaningTool.tsx";
export function GameShell({
  session,
  send,
  receipt,
  reduced,
  speak,
  cancelAudio,
}: {
  session: Quest;
  send: (i: Intent) => void;
  receipt?: Verdict;
  reduced: boolean;
  speak: (text: string) => void;
  cancelAudio: () => void;
}) {
  useEffect(() => () => cancelAudio(), [session.active]);
  const b = current(session),
    spec = puzzle(b.level, b.variant);
  const [selected, setSelected] = useState<string>();
  const [tool, setToolState] = useState<
    "object" | "spell" | "sentence" | "learn" | null
  >(null);
  const opener = useRef<HTMLElement | null>(null);
  function setTool(next: typeof tool) {
    opener.current = document.activeElement as HTMLElement;
    cancelAudio();
    setToolState(next);
  }
  const [word, setWord] = useState("box"),
    [answer, setAnswer] = useState(""),
    [sentence, setSentence] = useState("");
  const selectedEntity = selected ? b.world.entities[selected] : undefined;
  const choose = (id: string) => {
    setSelected(id);
    setTool("object");
  };
  function teach(w: string) {
    cancelAudio();
    setWord(w);
    setTool("learn");
    send({ kind: "teach", word: w });
  }
  function close() {
    cancelAudio();
    setToolState(null);
    const target = opener.current?.isConnected
      ? opener.current
      : document.querySelector<HTMLElement>(
          `[data-entity="${selected ?? "cat-companion"}"]`,
        );
    target?.focus();
  }
  const done = goalSatisfied(b);
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current) {
      cancelAudio();
      setToolState(null);
      document.querySelector<HTMLElement>(".chapter-arrival")?.focus();
    }
    wasDone.current = done;
  }, [done]);
  const exercise = EXERCISES[b.exercise];
  function practice(
    mode: "assisted" | "independent",
    type: "command" | "description" | "spelling",
  ) {
    setSentence("");
    send({ kind: "practice", mode, exercise: type });
    setTool(type === "spelling" ? "spell" : "sentence");
    setWord("box");
  }
  function demonstrate() {
    send({ kind: "support", value: "demo" });
    if (b.level === "workshop") {
      send({
        kind: "world",
        action: { type: "open", source: "box-main", open: true },
      });
      send({
        kind: "sentence",
        task: taskId(session),
        text: EXERCISES.command.example,
        selected: "box-main",
      });
    }
  }

  return (
    <main className={`game-shell ${tool ? "has-tool" : ""}`}>
      <div className="scene-heading">
        <div>
          <span className="eyebrow">{spec.subtitle}</span>
          <h1>{spec.title}</h1>
        </div>
        <button
          onClick={() => send({ kind: "undo" })}
          disabled={!b.undo.length}
          aria-label="撤销世界行动"
        >
          ↶ 撤销
        </button>
      </div>
      <p className="goal-ribbon">
        {done ? "✓ " : ""}
        {spec.goalText}
      </p>
      {spec.request && (
        <details className="request-slip" open={!tool}>
          <summary>朋友的请求</summary>
          <span>朋友的小纸条</span>
          <button onClick={() => speak(spec.request!)}>听朋友的请求</button>
          <button onClick={() => send({ kind: "support", value: "text" })}>
            看文字辅助
          </button>
          {b.support.includes("text") && <p lang="en">{spec.request}</p>}
          <small>开发语音未听审；可用文字继续，按辅助记录。</small>
        </details>
      )}
      <Scene
        board={b}
        selected={selected}
        select={choose}
        send={send}
        receipt={receipt}
        reduced={reduced}
        assessmentWord={
          b.practice === "independent" && tool === "spell" ? word : undefined
        }
      />
      {b.level === "workshop" && (
        <section className="workshop-choices" aria-label="工坊练习">
          <p>先认识意义，再挑一种方式试用</p>
          <div>
            {(["command", "description", "spelling"] as const).map((type) => (
              <span key={type}>
                <b>
                  {type === "command"
                    ? "句子行动"
                    : type === "description"
                      ? "观察描述"
                      : "拼写造物"}
                </b>
                <button onClick={() => practice("assisted", type)}>
                  辅助
                  {type === "command"
                    ? "指令"
                    : type === "description"
                      ? "描述"
                      : "拼写"}
                </button>
                <button onClick={() => practice("independent", type)}>
                  独立
                  {type === "command"
                    ? "指令"
                    : type === "description"
                      ? "描述"
                      : "拼写"}
                </button>
              </span>
            ))}
          </div>
        </section>
      )}
      <div className="tool-ribbon" aria-label="英语工具">
        <button
          onClick={() => {
            setWord(spec.rules.quotas[0]?.word ?? "box");
            setTool("spell");
          }}
        >
          ✧ 拼词造物
        </button>
        <button onClick={() => setTool("sentence")}>说一句话</button>
        <button onClick={() => teach("small")}>词义小样</button>
        <button onClick={() => send({ kind: "support", value: "hint" })}>
          给我提示
        </button>
      </div>
      <div
        className={`feedback ${receipt?.status ?? ""}`}
        role="status"
        aria-live="polite"
      >
        {receipt?.message ?? spec.invitation}
      </div>
      {done && b.level !== "workshop" && (
        <div className="chapter-arrival" tabIndex={-1}>
          {b.level === "R1" || b.level === "R2" ? (
            <button
              className="primary"
              onClick={() => {
                setTool(null);
                setSelected(undefined);
                send({ kind: "next" });
              }}
            >
              沿小径继续 →
            </button>
          ) : (
            <>
              <h2>这一份心意，送到了。</h2>
              <p>
                苹果
                {b.world.entities["apple-main"]?.place.kind === "in"
                  ? "在篮子里面"
                  : "在箱子上面"}
                ，小猫已经来到朋友身边。这是你实际留下的布置。
              </p>
              <button onClick={() => setTool("sentence")}>
                用描述回望布置
              </button>
              <button onClick={() => send({ kind: "enter", mode: "revisit" })}>
                雨后，再回花园
              </button>
            </>
          )}
        </div>
      )}
      {tool && (
        <aside
          className="context-tool"
          aria-label="英语工具抽屉"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <header>
            <h2>
              {tool === "spell"
                ? "WordSpell · 拼词造物"
                : tool === "sentence"
                  ? "让英语做点事情"
                  : tool === "learn"
                    ? "词义小样"
                    : selectedEntity
                      ? `${lexeme(selectedEntity.word)?.zh} · ${selectedEntity.word}`
                      : "选一个物品"}
            </h2>
            <button aria-label="关闭工具" onClick={close}>
              ×
            </button>
          </header>
          <div className="tool-scroll">
            {tool === "object" && selectedEntity && (
              <>
                <p>{lexeme(selectedEntity.word)?.meaning}</p>
                <div className="action-row">
                  {spec.rules.types[selectedEntity.word].resize && (
                    <>
                      {(["small", "normal", "big"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            send({
                              kind: "world",
                              action: {
                                type: "resize",
                                source: selectedEntity.id,
                                size,
                              },
                            })
                          }
                        >
                          {size === "normal" ? "原来大小" : size}
                        </button>
                      ))}
                    </>
                  )}
                </div>
                {(spec.rules.types[selectedEntity.word].container ||
                  selectedEntity.word === "door") && (
                  <div className="action-row">
                    <button
                      onClick={() =>
                        send({
                          kind: "world",
                          action: {
                            type: "open",
                            source: selectedEntity.id,
                            open: true,
                          },
                        })
                      }
                    >
                      Open · 打开
                    </button>
                    <button
                      onClick={() =>
                        send({
                          kind: "world",
                          action: {
                            type: "open",
                            source: selectedEntity.id,
                            open: false,
                          },
                        })
                      }
                    >
                      Close · 关上
                    </button>
                  </div>
                )}
                <p className="micro">
                  点场景中的地点来移动；放进或放上其他物品：
                </p>
                <div className="destinations">
                  {Object.values(b.world.entities)
                    .filter((e) => e.id !== selectedEntity.id)
                    .flatMap((e) =>
                      (["in", "on"] as const)
                        .filter((kind) =>
                          kind === "in"
                            ? spec.rules.types[e.word].container
                            : spec.rules.types[e.word].support,
                        )
                        .map((kind) => (
                          <button
                            key={`${kind}-${e.id}`}
                            onClick={() =>
                              send({
                                kind: "world",
                                action: {
                                  type: "move",
                                  source: selectedEntity.id,
                                  to: { kind, id: e.id },
                                },
                              })
                            }
                          >
                            {kind} {e.word} · {kind === "in" ? "放入" : "放上"}
                          </button>
                        )),
                    )}
                </div>
                <button
                  className="text-button"
                  onClick={() => teach(selectedEntity.word)}
                >
                  认识 {selectedEntity.word}
                </button>
              </>
            )}
            {tool === "learn" && (
              <MeaningTool
                board={b}
                spec={spec}
                word={word}
                teach={teach}
                send={send}
                speak={speak}
                onTry={() => {
                  setTool("object");
                  setSelected("cat-companion");
                }}
              />
            )}
            {tool === "spell" && (
              <>
                {b.level === "workshop" && b.practice === "assisted" && (
                  <p lang="en">参考词：{word}</p>
                )}
                <p>用字母做一个{lexeme(word)?.zh}，放在场景里自由使用。</p>
                <div className="action-row">
                  {spec.rules.quotas.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setWord(q.word);
                        setAnswer("");
                      }}
                    >
                      {lexeme(q.word)?.zh}
                    </button>
                  ))}
                </div>
                {!b.taught.includes(word) ? (
                  <button className="primary" onClick={() => teach(word)}>
                    先认识这个词
                  </button>
                ) : (
                  <>
                    <button onClick={() => speak(word)}>听一听</button>
                    <label className="spell-input">
                      我的字母
                      <input
                        aria-label="我的字母"
                        autoComplete="off"
                        autoCapitalize="none"
                        value={answer}
                        maxLength={20}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </label>
                    <div className="letter-bank">
                      {(b.practice === "independent"
                        ? [..."abcdefghijklmnopqrstuvwxyz"]
                        : [...new Set([...word, "a", "e", "t"])].sort()
                      ).map((c) => (
                        <button
                          key={c}
                          onClick={() => setAnswer((s) => s + c)}
                          lang="en"
                        >
                          {c}
                        </button>
                      ))}
                      <button onClick={() => setAnswer((s) => s.slice(0, -1))}>
                        取回
                      </button>
                    </div>
                    <button
                      className="primary"
                      disabled={answer.length < word.length}
                      onClick={() => send({ kind: "spell", word, answer })}
                    >
                      施法造物
                    </button>
                  </>
                )}
              </>
            )}
            {tool === "sentence" && (
              <>
                {b.level === "workshop" && b.practice !== "exploration" && (
                  <div className="exercise-request">
                    <p>{exercise.prompt}</p>
                    {b.practice === "assisted" && (
                      <p lang="en">{exercise.example}</p>
                    )}
                    <button onClick={demonstrate}>看一次示范</button>
                  </div>
                )}
                <p>选择指令或描述。含糊的 it 指向你当前选中的物品。</p>
                <SentenceBuilder
                  key={taskId(session)}
                  task={{
                    id: taskId(session),
                    tokens: tokensFor(taskId(session)),
                  }}
                  submit={(ids) =>
                    send({
                      kind: "sentence",
                      task: taskId(session),
                      ids,
                      selected,
                    })
                  }
                />
                <details>
                  <summary>也可以打字</summary>
                  <label>
                    我的句子
                    <input
                      aria-label="输入句子"
                      value={sentence}
                      maxLength={240}
                      onChange={(e) => setSentence(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() =>
                      send({
                        kind: "sentence",
                        task: taskId(session),
                        text: sentence,
                        selected,
                      })
                    }
                  >
                    提交句子
                  </button>
                </details>
              </>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}
