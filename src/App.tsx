import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACTS, STEPS } from "./content/story.ts";
import { validateStory } from "./content/validate.ts";
import { checkAssets } from "./content/assets.ts";
import {
  completedChallenges,
  initialSession,
  run,
  helpFor,
} from "./game/session.ts";
import type { Command, Input, Session } from "./game/session.ts";
import {
  ARCHIVE_KEY,
  SAVE_KEY,
  archiveCurrent,
  decode,
  encode,
  load,
  save,
} from "./platform/save.ts";
import { StoryAudio } from "./platform/audio.ts";
import { localId } from "./platform/id.ts";
import { Letters } from "./ui/Letters.tsx";
import { Art, AssetContext, Scene } from "./ui/Scene.tsx";
import { isWord, WORDS } from "./domain/world.ts";
import type { WordId } from "./domain/world.ts";
import type { Step } from "./content/story.ts";
import type { AudioObservation } from "./game/audio-evidence.ts";
import { FEEDBACK } from "./content/feedback.ts";
import {
  RepairPages,
  PracticeSummary,
  Demonstration,
} from "./ui/Experience.tsx";
import "./experience.css";

function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const focusable = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input, a[href]",
          ) ?? []),
        ].filter((el) => el.offsetParent !== null);
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button className="secondary" onClick={close}>
        返回
      </button>
    </dialog>
  );
}
const taskNames: Record<string, string> = {
  spelling: "拼写",
  substitution: "换字",
  "lexical-listening": "听词选择",
  "sentence-placement": "听句摆物",
  interaction: "铺路操作",
};
const outcomes: Record<string, string> = {
  "independent-correct": "无提示完成（音频来源见明细）",
  "assisted-correct": "辅助完成",
  demonstrated: "演示后复现",
  incorrect: "调整后再试",
  "interaction-complete": "操作完成",
  "unverified-correct": "完成（未确认任务音频）",
};
function Records({ session }: { session: Session }) {
  return (
    <div className="records">
      <PracticeSummary session={session} />
      <p>
        仅记录这次真实操作，保存在当前浏览器。开发语音未经审核，这些记录不代表学习提升或正式听力测评。
      </p>
      <button
        className="secondary"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([encode(session)], { type: "application/json" }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "wordspell-practice.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        导出本局存档
      </button>
      {session.events.length === 0 ? (
        <p>还没有提交过练习。</p>
      ) : (
        <ol>
          {session.events.map((e) => (
            <li key={e.eventId}>
              <strong>
                {e.stepId} · {taskNames[e.taskType]}
              </strong>
              <p lang="en">{e.target}</p>
              <span>
                {outcomes[e.outcome]} · 提示 {e.hintLevel} 级 · 重听 {e.replays}{" "}
                次
              </span>
              <small>
                {e.answerVisible ? "答案/文字辅助可见" : "未显示完整答案"} ·
                本题第 {e.priorAttempts + 1} 次提交
                {" · "}
                {e.inputMode} · 音频观察 {e.audio.length} 条
              </small>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
function Preview() {
  return (
    <main>
      <header className="topbar">
        <a href="#">返回故事</a>
        <span>设计预览 · 复用正式组件</span>
      </header>
      <h1>纸上小径 / 操作样张</h1>
      <p>临时插画、组件与异常状态检查；不包含另一套判题。</p>
      <div className="preview-art">
        {WORDS.map((word) => (
          <div key={word}>
            <Art word={word} />
            <span lang="en">{word}</span>
          </div>
        ))}
        <Art word="map" fail />
      </div>
      <Letters step={STEPS[0]} submit={() => {}} />
      <Scene
        session={initialSession("preview")}
        step={STEPS[0]}
        submit={() => {}}
        onMiss={() => {}}
      />
      <div className="preview-states">
        <button>默认</button>
        <button className="selected">已选中 ✓</button>
        <button disabled>处理中…</button>
        <p className="feedback success">✓ 正确，故事向前走了一步。</p>
        <p className="feedback incorrect">再听一次，可以调整后重新试。</p>
        <p className="notice">资源加载失败，可重试或使用文字。</p>
      </div>
    </main>
  );
}
export default function App() {
  const [loaded] = useState(load);
  const [session, setSession] = useState(
    () => loaded.session ?? initialSession(localId()),
  );
  const current = useRef(session);
  const canSave = useRef(!loaded.blocked);
  const [screen, setScreen] = useState<"home" | "game" | "end" | "records">(
    "home",
  );
  const [modal, setModal] = useState<
    "pause" | "restart" | "clear" | "tutorial" | null
  >(null);
  const [warning, setWarning] = useState(loaded.warning);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [assetEpoch, setAssetEpoch] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [projection, setProjection] = useState<{
    word: WordId;
    rest: boolean;
    repeated: boolean;
    eventId: string;
  } | null>(null);
  const [cue, setCue] = useState<{ step: Step; eventId: string } | null>(null);
  const [phase, setPhase] = useState(0);
  const [audioMessage, setAudioMessage] =
    useState("开发语音未经审核；可选择文字辅助。");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [archive, setArchive] = useState<Session | null>(null);
  const [preview, setPreview] = useState(location.hash === "#design");
  const audio = useRef(new StoryAudio()).current;
  const step = cue?.step ?? STEPS[session.step];
  const activeRef = useRef(false);
  const playingRef = useRef(false);
  playingRef.current = screen === "game" && !modal;
  activeRef.current = screen === "game" && !modal && !cue;
  function observe(o: AudioObservation, owner: string) {
    const before = current.current;
    if (before.id !== owner) return;
    const result = run(before, {
      sessionId: before.id,
      stepId: o.stepId,
      attemptId: localId(),
      expectedRevision: before.revision,
      type: "observe",
      input: { observation: JSON.stringify(o) },
    });
    if (result.session !== before) {
      current.current = result.session;
      setSession(result.session);
      if (canSave.current) {
        const message = save(result.session);
        if (message) setWarning(message);
      }
    }
  }
  function playTask(s: Step) {
    const owner = current.current.id;
    audio.play(s.prompt, setAudioMessage, {
      stepId: s.id,
      purpose: "task",
      eventId: "",
      observe: (o) => observe(o, owner),
    });
  }
  useEffect(() => {
    let live = true;
    try {
      validateStory();
    } catch {
      setFatal("故事内容校验失败，请刷新或联系维护者。");
      return;
    }
    checkAssets().then((failed) => {
      if (live) {
        setMissing(failed);
        setReady(true);
      }
    });
    const hash = () => setPreview(location.hash === "#design");
    window.addEventListener("hashchange", hash);
    return () => {
      live = false;
      audio.stop();
      window.removeEventListener("hashchange", hash);
    };
  }, [audio]);
  useEffect(() => {
    const stop = (event: Event) => {
      if (!document.hidden && event.type !== "pagehide") return;
      audio.stop();
      setCue(null);
      setProjection(null);
      setModal((m) => m ?? (playingRef.current ? "pause" : null));
    };
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [audio]);
  useEffect(() => {
    audio.stop();
    if (screen === "game" && !modal && !cue && !preview && step) playTask(step);
    return () => audio.stop();
  }, [session.step, screen, modal, audio, cue, preview]);
  useEffect(() => {
    if (!cue) return;
    setPhase(0);
    const voice = setTimeout(() => {
      setPhase(1);
      const owner = current.current.id;
      audio.play(
        cue.step.word,
        setAudioMessage,
        {
          stepId: cue.step.id,
          purpose: "success",
          eventId: cue.eventId,
          observe: (o) => observe(o, owner),
        },
        2400,
      );
    }, 450);
    const response = setTimeout(() => setPhase(2), 1400);
    const finish = setTimeout(() => setCue(null), 3600);
    return () => {
      clearTimeout(voice);
      clearTimeout(response);
      clearTimeout(finish);
      audio.stop();
    };
  }, [cue, audio]);
  useEffect(() => {
    if (modal || screen !== "game" || preview) {
      setCue(null);
      setProjection(null);
      audio.stop();
    }
    if (screen === "game" && !cue && session.step === STEPS.length)
      setScreen("end");
  }, [modal, screen, cue, session.step, preview, audio]);
  useEffect(() => {
    if (!projection) return;
    const t = setTimeout(
      () => setProjection(null),
      projection.repeated ? 1400 : 4500,
    );
    return () => clearTimeout(t);
  }, [projection]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [session.step, screen]);
  function send(type: Command["type"], input: Input = {}) {
    const before = current.current;
    const s = STEPS[before.step];
    if (
      !s ||
      !activeRef.current ||
      before.id !== session.id ||
      before.step !== session.step
    )
      return;
    const result = run(before, {
      sessionId: before.id,
      stepId: s.id,
      attemptId: localId(),
      expectedRevision: before.revision,
      type,
      input,
    });
    current.current = result.session;
    setSession(result.session);
    setFeedback(result.message);
    setFeedbackType(result.outcome);
    if (result.session !== before && canSave.current) {
      const message = save(result.session);
      if (message) setWarning(message);
    }
    if (result.outcome === "incorrect") {
      if (input.word && isWord(input.word))
        setProjection({
          word: input.word,
          rest: s.id === "s03" && input.word === "mat",
          repeated: before.events.some(
            (e) => e.stepId === s.id && e.submitted.word === input.word,
          ),
          eventId: result.session.events.at(-1)!.eventId,
        });
      else setProjection(null);
      playTask(s);
    }
    if (result.outcome === "success" && result.session !== before) {
      setProjection(null);
      setCue({ step: s, eventId: result.session.events.at(-1)!.eventId });
    }
  }
  function enter() {
    audio.unlock();
    setScreen(session.step === 13 ? "end" : "game");
    if (session.step === 0 && session.journal.length === 0)
      setModal("tutorial");
  }
  function restart() {
    let safe = true;
    try {
      archiveCurrent();
    } catch {
      safe = false;
      setWarning(
        "旧存档未能备份。将临时游玩新故事，不覆盖旧数据；可导出新记录。",
      );
    }
    canSave.current = safe;
    const fresh = initialSession(localId());
    current.current = fresh;
    setSession(fresh);
    setFeedback("");
    setArchive(null);
    if (safe) setWarning(save(fresh));
    audio.unlock();
    setScreen("game");
    setModal("tutorial");
  }
  function clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(ARCHIVE_KEY);
      canSave.current = true;
      const fresh = initialSession(localId());
      current.current = fresh;
      setSession(fresh);
      setArchive(null);
      setWarning("");
      setScreen("home");
      setModal(null);
    } catch {
      setWarning("无法清除本地记录，原数据可能仍保留。");
      setModal(null);
    }
  }
  if (preview) return <Preview />;
  const answerVisible =
    session.text ||
    session.demo ||
    step?.mode === "teaching" ||
    session.hint >= 2;
  return (
    <AssetContext.Provider value={{ failed: missing, epoch: assetEpoch }}>
      <main>
        <header className="topbar">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              audio.stop();
              setScreen("home");
            }}
          >
            雪梨 <span>WORDSPELL</span>
          </a>
          <span className="edition">纸上小径 · 小猫的野餐冒险</span>
          {screen === "game" && (
            <button className="quiet" onClick={() => setModal("pause")}>
              暂停
            </button>
          )}
        </header>
        {warning && (
          <div className="notice" role="alert">
            {warning}
            <button
              className="quiet"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(SAVE_KEY);
                  const previous = localStorage.getItem(ARCHIVE_KEY);
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify({ current: raw, previous })], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "wordspell-original-saves.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch {
                  setWarning(
                    "无法访问本地原档。当前会话仍可在练习记录中导出。",
                  );
                }
              }}
            >
              导出原始存档
            </button>
          </div>
        )}
        {missing.length > 0 && (
          <div className="notice" role="alert">
            部分插画加载失败，已提供文字替代。
            <button
              className="quiet"
              onClick={() =>
                checkAssets().then((failed) => {
                  setMissing(failed);
                  setAssetEpoch((n) => n + 1);
                })
              }
            >
              重试资源
            </button>
          </div>
        )}
        {screen === "home" && (
          <section className="cover">
            <div className="cover-copy">
              <p className="eyebrow">一本等你写完的冒险绘本</p>
              <h1>
                小猫的
                <br />
                野餐冒险<span className="title-dot">。</span>
              </h1>
              <p className="cover-intro">
                拼出单词，创造物品。
                <br />
                换一个字母，让故事继续。
              </p>
              {fatal ? (
                <p role="alert">{fatal}</p>
              ) : (
                <button
                  className="primary"
                  disabled={!ready}
                  onClick={() =>
                    loaded.blocked && !canSave.current
                      ? setModal("restart")
                      : enter()
                  }
                >
                  {!ready
                    ? "正在检查故事资源…"
                    : session.step || session.journal.length
                      ? "继续故事 →"
                      : "开始冒险 →"}
                </button>
              )}
              {(session.journal.length > 0 || loaded.blocked) && (
                <button className="quiet" onClick={() => setModal("restart")}>
                  重新开始
                </button>
              )}
              <p className="micro">三页绘本 · 十二个挑战 · 随时暂停</p>
            </div>
            <div className="cover-picture" aria-hidden="true">
              <div className="cover-path" />
              <div className="cover-cat">
                <Art word="cat" />
              </div>
              <div className="cover-map">
                <Art word="map" />
              </div>
              <span className="cover-caption">带着一张地图，出发。</span>
            </div>
            <footer className="cover-footer">
              <button
                className="quiet"
                onClick={() => {
                  setArchive(null);
                  setScreen("records");
                }}
              >
                本地练习记录
              </button>
              <span>开发体验版 · 临时插画 / 语音与内容待审核</span>
              <a href="#design">设计预览</a>
            </footer>
          </section>
        )}
        {screen === "game" && step && (
          <>
            <RepairPages session={session} />
            <div className="chapter">
              <p>{ACTS[step.act - 1]}</p>
              <span>已完成 {completedChallenges(session)} / 12</span>
              <div
                className="progress"
                aria-label={`已完成 ${completedChallenges(session)} 个挑战`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <i
                    key={i}
                    className={
                      i < completedChallenges(session)
                        ? "done"
                        : i === step.challenge - 1
                          ? "current"
                          : ""
                    }
                  />
                ))}
              </div>
            </div>
            <div
              className="game-layout"
              data-step={cue ? undefined : step.id}
              data-feedback={cue?.step.id}
              data-phase={phase}
            >
              <Scene
                key={`${step.id}-${assetEpoch}`}
                session={session}
                step={step}
                submit={(input) => send("submit", input)}
                onMiss={() => {
                  setFeedback("没有放稳，再试一次。落空不计答错。");
                  setFeedbackType("interaction");
                }}
                reveal={answerVisible}
                cue={cue ? FEEDBACK[cue.step.id] : undefined}
                projection={projection}
                disabled={!!cue}
              />
              <section className="task-panel" aria-labelledby="task-title">
                {cue ? (
                  <div className="result-story" role="status">
                    <p className="eyebrow">
                      {cue.step.type === "transform"
                        ? "同一件物品，新的用途"
                        : "这一页发生了变化"}
                    </p>
                    <h1 id="task-title">{FEEDBACK[cue.step.id].title}</h1>
                    {cue.step.type === "transform" && (
                      <p className="word-change" lang="en">
                        {cue.step.from?.slice(0, 2)}
                        <del>{cue.step.from?.[2]}</del> →{" "}
                        {cue.step.word.slice(0, 2)}
                        <strong>{cue.step.word[2]}</strong>
                      </p>
                    )}
                    <p className="result-word" lang="en">
                      {cue.step.word}
                    </p>
                    <p>{FEEDBACK[cue.step.id].response}</p>
                    <p className="audio-note">{audioMessage}</p>
                    <button
                      className="secondary"
                      onClick={() => {
                        audio.stop();
                        setCue(null);
                      }}
                    >
                      收好这一页
                    </button>
                    <small>
                      结果已经保存。可跳过演出，继续亲手完成下一个任务。
                    </small>
                  </div>
                ) : (
                  <>
                    <p className="eyebrow">
                      第 {String(step.challenge).padStart(2, "0")} 个挑战
                      {step.id.startsWith("s04")
                        ? ` · ${step.id === "s04a" ? "换字" : "铺路"}`
                        : ""}
                    </p>
                    <h1 id="task-title">{step.title}</h1>
                    <p className="story-line">{step.story}</p>
                    <div className="audio-row">
                      <button
                        className="listen"
                        onClick={() => {
                          audio.unlock();
                          send("replay");
                          playTask(step);
                        }}
                      >
                        ▷ 重听任务
                      </button>
                      <button className="quiet" onClick={() => send("text")}>
                        文字辅助
                      </button>
                    </div>
                    <p className="audio-note" role="status">
                      {audioMessage}
                    </p>
                    {answerVisible && (
                      <div className="answer" lang="en">
                        {step.prompt}
                        <small lang="zh-CN">
                          {session.demo
                            ? "示范：照着操作，再亲手完成"
                            : "文字辅助 · 本题如实记录"}
                        </small>
                      </div>
                    )}
                    {session.hint > 0 && (
                      <p className="hint">
                        提示 {session.hint}：{helpFor(session, step)}
                      </p>
                    )}
                    {session.demo && (
                      <Demonstration key={step.id} step={step} />
                    )}
                    {step.type === "spell" || step.type === "transform" ? (
                      <Letters
                        key={step.id}
                        step={step}
                        submit={(word) =>
                          send("submit", {
                            word,
                            ...(step.source ? { source: step.source } : {}),
                          })
                        }
                      />
                    ) : (
                      <p className="interaction-guide">
                        {step.type === "select"
                          ? "听清楚后，点选场景中的物品。"
                          : "先点物品，再点放置区；也可拖动。"}
                      </p>
                    )}
                    <div className="help-row">
                      <button className="quiet" onClick={() => send("hint")}>
                        给我一点提示
                      </button>
                      {session.hint >= 2 && (
                        <button className="quiet" onClick={() => send("demo")}>
                          看示范
                        </button>
                      )}
                    </div>
                    <p
                      className={`feedback ${feedbackType}`}
                      role="status"
                      aria-live="polite"
                    >
                      {feedback || "慢慢来，故事会等你。"}
                    </p>
                  </>
                )}
              </section>
            </div>
          </>
        )}
        {screen === "end" && (
          <section className="ending">
            <p className="eyebrow">三页绘本，已经写完</p>
            <h1>野餐开始啦。</h1>
            <p>你唤醒了小猫，走过湿墨小径，把野餐地布置好了。</p>
            <Scene
              session={session}
              submit={() => {}}
              onMiss={() => {}}
              reveal
            />
            <RepairPages session={session} expanded />
            <div className="word-cards">
              {WORDS.map((w) => (
                <button
                  key={w}
                  lang="en"
                  onClick={() => {
                    audio.unlock();
                    audio.play(w, setAudioMessage);
                  }}
                  aria-label={`重听单词 ${w}`}
                >
                  {w}
                </button>
              ))}
            </div>
            <p className="audio-note" role="status">
              {audioMessage}
            </p>
            <p>
              本局完成 {completedChallenges(session)}{" "}
              个挑战。每一次提示和尝试，都在练习记录里。
            </p>
            <button
              className="quiet"
              onClick={() => {
                setArchive(null);
                setScreen("records");
              }}
            >
              陪伴者：回顾本次练习
            </button>
            <button className="primary" onClick={() => setModal("restart")}>
              再读一次故事
            </button>
          </section>
        )}
        {screen === "records" && (
          <section className="record-page">
            <h1>这一次，走过的路</h1>
            <button
              className="quiet"
              onClick={() => {
                setArchive(null);
                setScreen("home");
              }}
            >
              返回首页
            </button>
            <button
              className="quiet"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(ARCHIVE_KEY);
                  if (raw) setArchive(decode(raw));
                  else setWarning("还没有上一局记录。");
                } catch {
                  setWarning("上一局记录暂时无法读取，原始数据仍保留。");
                }
              }}
            >
              查看上一局
            </button>
            {archive && (
              <p>
                正在查看上一局{" "}
                <button className="quiet" onClick={() => setArchive(null)}>
                  回到本局
                </button>
              </p>
            )}
            <Records session={archive ?? session} />
            <button className="quiet" onClick={() => setModal("clear")}>
              清除本地记录
            </button>
          </section>
        )}
        {modal === "tutorial" && (
          <Modal title="用字母，把故事叫醒" close={() => setModal(null)}>
            <p>从三个字母开始，把小猫叫醒。操作区会陪你试放、取回和施法。</p>
            <p className="notice">
              语音是未经审核的浏览器开发替代。听不清时可选「文字辅助」，不影响完成故事。
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              我来试试
            </button>
          </Modal>
        )}
        {modal === "pause" && (
          <Modal title="让故事歇一会儿" close={() => setModal(null)}>
            <p>已完成的步骤会保留，回到故事后可以继续。</p>
            <label className="volume">
              音量
              <input
                aria-label="音量"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  audio.volume = v;
                  audio.stop();
                }}
              />
            </label>
            <button
              className="secondary"
              aria-pressed={muted}
              onClick={() => {
                audio.muted = !muted;
                setMuted(!muted);
                audio.stop();
              }}
            >
              {muted ? "取消静音" : "静音"}
            </button>
            <button className="primary" onClick={() => setModal(null)}>
              继续故事
            </button>
            <button
              className="quiet"
              onClick={() => {
                setModal(null);
                setScreen("home");
              }}
            >
              返回首页
            </button>
            <button className="quiet" onClick={() => setModal("clear")}>
              清除本地记录
            </button>
          </Modal>
        )}
        {modal === "restart" && (
          <Modal title="重新翻开这本故事？" close={() => setModal(null)}>
            <p>
              当前存档会备份为上一局；更早的上一局将被替换。需要保留时请先在练习记录中导出。无法备份时只临时游玩，不覆盖旧数据。
            </p>
            <button className="primary" onClick={restart}>
              确认重新开始
            </button>
          </Modal>
        )}
        {modal === "clear" && (
          <Modal title="清除这台浏览器的记录？" close={() => setModal(null)}>
            <p>
              本局与上一局记录都会删除。此操作无法撤销，可先返回练习详情导出。
            </p>
            <button className="primary" onClick={clear}>
              确认清除
            </button>
          </Modal>
        )}
      </main>
    </AssetContext.Provider>
  );
}
