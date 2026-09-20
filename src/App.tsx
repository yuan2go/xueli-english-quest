import { learningFact } from "./game/learning.ts";
import { useEffect, useRef, useState } from "react";
import { WORD_TASKS } from "./content/adventure.ts";
import { SENTENCES } from "./content/sentences.ts";
import {
  board,
  goals,
  initialAdventure,
  runAdventure,
} from "./game/adventure.ts";
import type { Adventure, Intent } from "./game/adventure.ts";
import {
  ADVENTURE_KEY,
  backup,
  exportRecords,
  loadAdventure,
  saveAdventure,
} from "./platform/adventure-save.ts";
import { localId } from "./platform/id.ts";
import { useAssets } from "./platform/useAssets.ts";
import {
  Art,
  AssetContext,
  AssetNotice,
  CharacterArt,
  Visual,
} from "./ui/Art.tsx";
import { Modal } from "./ui/Modal.tsx";
import { GameShell } from "./ui/shell/GameShell.tsx";
import "./adventure.css";
const modeLabels = {
  teaching: "引导学习",
  assisted: "辅助练习",
  independent: "独立应用",
  exploration: "自由探索",
  revisit: "复习回访",
};
const evidenceLabels = {
  "demo-partial": "部分示范",
  "listen-rebuild": "听后识别 / 重组",
  guided: "引导学习",
  assisted: "使用了帮助",
  demonstrated: "看过示范",
  independent: "未显示答案",
  "audio-unverified": "语音未确认",
  exploration: "探索记录",
};
const resultLabels = {
  done: "当前目标完成",
  valid: "已提交",
  incomplete: "还未填完整",
  structure: "语序需要调整",
  outside: "范围外，未判对错",
  mismatch: "与本次目标或眼前情境不符",
  blocked: "世界条件限制",
  stale: "场景已更新",
};
const typeLabels = {
  spelling: "听音拼写",
  substitution: "换字",
  "sentence-command": "指令句",
  "sentence-description": "观察描述",
  listening: "听音找物",
  operation: "世界操作",
  exploration: "自由制作",
};
function taskLabel(id: string) {
  return (
    WORD_TASKS.find((t) => t.id === id)?.purpose ??
    Object.values(SENTENCES).find((t) => t.id === id)?.title ??
    (id === "recap"
      ? "回望自己的布置"
      : id === "find-map"
        ? "听声音找路线"
        : id.startsWith("morph:")
          ? "纸张变形"
          : "自由操作")
  );
}
export default function App() {
  const [loaded] = useState(loadAdventure);
  const [session, setSession] = useState(
    () =>
      loaded.session ??
      initialAdventure(localId(), Math.floor(Math.random() * 0xffffffff)),
  );
  const current = useRef(session),
    canSave = useRef(!loaded.blocked);
  const [screen, setScreen] = useState<"home" | "game" | "records">("home");
  const [modal, setModal] = useState<"pause" | "restart" | "help" | null>(null);
  const [warning, setWarning] = useState(loaded.warning);
  const [muted, setMuted] = useState(false),
    [volume, setVolume] = useState(0.8);
  const assets = useAssets(screen === "home" ? "home" : board(session).scene);
  const active = useRef(false);
  active.current = screen === "game" && !modal;
  const currentGoals = goals(session);
  useEffect(() => {
    if (!loaded.previousRaw) return;
    let cancelled = false;
    void import("./legacy/quest-v4/save.ts").then(({ decodeAdventure }) => {
      try {
        decodeAdventure(loaded.previousRaw!);
        if (!cancelled && !canSave.current)
          setWarning(
            "旧版冒险已验证并备份。历史曝光未知，不升级为独立证据；请导出，再明确开始新冒险。",
          );
      } catch {
        /* Original bytes remain backed up; no inferred migration. */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loaded]);
  function saving(s: Adventure) {
    current.current = s;
    setSession(s);
    if (canSave.current) {
      const error = saveAdventure(s);
      if (error) setWarning(error);
    }
  }
  function dispatch(intent: Intent) {
    const before = current.current;
    const result = runAdventure(before, {
      ...intent,
      sessionId: before.id,
      revision: before.revision,
      mode: before.mode,
      attemptId: localId(),
    });
    if (result.session !== before) saving(result.session);
    return result;
  }
  function start() {
    if (!canSave.current) setModal("restart");
    else setScreen("game");
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportRecords(current.current)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "xueli-quest-records.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function restart() {
    try {
      backup(ADVENTURE_KEY);
    } catch (e) {
      setWarning((e as Error).message);
      return;
    }
    canSave.current = true;
    saving(initialAdventure(localId(), Math.floor(Math.random() * 0xffffffff)));
    setWarning("原记录已保留；新故事从家门口开始。");
    setModal(null);
    setScreen("game");
  }
  useEffect(() => {
    const pause = () => {
      if (active.current) setModal("pause");
    };
    const hidden = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("pagehide", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pagehide", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  return (
    <AssetContext.Provider value={assets}>
      <main className={`quest-app ${screen === "game" ? "playing" : ""}`}>
        {screen !== "game" && (
          <header className="quest-header">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setScreen("home");
              }}
              className="quest-brand"
            >
              雪梨英语奇旅<small>XUELI ENGLISH QUEST</small>
            </a>
            <span className="chapter-name">小猫的野餐冒险</span>
          </header>
        )}
        <AssetNotice />
        {screen === "home" && assets.pending > 0 && (
          <p className="micro" role="status">
            正在准备插画…可以先开始，进度不会受影响。
          </p>
        )}
        {warning && (
          <div className="notice save-warning" role="alert">
            {warning}
          </div>
        )}
        {screen === "home" && (
          <section className="quest-cover">
            <div>
              <p className="eyebrow">一张纸，一次旅行，许多自己的办法。</p>
              <h1>
                小猫想去野餐。
                <br />
                你会怎么帮它？
              </h1>
              <p>寻找身边的东西，用单词改变用途，用一句话安排世界。</p>
              <button className="primary" onClick={start}>
                {session.revision > 0 ? "继续冒险" : "开始冒险"}
              </button>
              <button className="quiet" onClick={() => setScreen("records")}>
                本地记录
              </button>
              <p className="micro">
                无需账号 · 触屏、鼠标和键盘均可
                <br />
                图像与开发语音待审核；无声音时可选文字辅助。
              </p>
            </div>
            <div className="quest-cover-art">
              <Visual id="scene-act-1" label="家门口" />
              <CharacterArt />
              <Art word="map" />
            </div>
          </section>
        )}
        {screen === "game" && (
          <GameShell
            key={session.id}
            session={session}
            dispatch={dispatch}
            paused={!!modal}
            muted={muted}
            volume={volume}
            onPause={() => setModal("pause")}
            onHelp={() => setModal("help")}
            onReview={() => setScreen("records")}
            onMute={() => setMuted((v) => !v)}
          />
        )}
        {screen === "records" && (
          <section className="quest-records">
            <h1>这次真实发生了什么</h1>
            <p>
              按任务和帮助记录。探索不计练习成绩；无音频证明不记独立听音。一次组句不代表掌握语法。
            </p>
            <button onClick={download}>导出本局与旧记录</button>
            <button onClick={() => setScreen("game")}>返回冒险</button>
            <button onClick={() => setModal("restart")}>重新开始</button>
            <p>
              这些是本次事实，不代表永久掌握或学习效果。
              {session.events.some(
                (e) =>
                  e.practice === "revisit" &&
                  e.evidence === "independent" &&
                  ["valid", "done"].includes(e.result),
              )
                ? "已有未显示答案的回访；长期保持尚未验证。"
                : "尚无独立回访。"}
            </p>
            <details>
              <summary>实际帮助与音频过程</summary>
              {[session.story, ...Object.values(session.activities)].flatMap(
                (b, i) =>
                  Object.entries(b.help).map(([task, h]) => (
                    <div key={`${i}-${task}`}>
                      <b>{taskLabel(task)}</b>
                      <ul>
                        {h.exposures.map((x) => (
                          <li key={x.id}>
                            {x.channel === "audio"
                              ? "目标音频"
                              : x.kind === "demo"
                                ? `示范第 ${(x.step ?? 0) + 1} 步`
                                : "视觉帮助"}{" "}
                            ·{" "}
                            {
                              {
                                shown: "已显示",
                                partial: "部分呈现",
                                loading: "请求加载",
                                playing: "开始播放",
                                completed: "已完成",
                                cancelled: "已取消",
                                failed: "失败",
                                muted: "静音未播放",
                              }[x.status]
                            }{" "}
                            ·{" "}
                            {x.answer === "none"
                              ? "无答案曝光"
                              : x.answer === "partial"
                                ? "局部答案"
                                : "完整答案内容"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )),
              )}
            </details>
            <ol>
              {session.events.map((event) => (
                <li
                  key={event.id}
                  data-type={event.type}
                  data-evidence={event.evidence}
                >
                  <b>{taskLabel(event.task)}</b> · {modeLabels[event.practice]}{" "}
                  · {typeLabels[event.type]} · {evidenceLabels[event.evidence]}{" "}
                  · {resultLabels[event.result]}
                  <p>{learningFact(event)}</p>
                  {event.observation && (
                    <small>
                      观察维度：
                      {event.observation.skills
                        .map(
                          (s) =>
                            `${{ "word-meaning": "词义识别", listening: "听力", "full-spelling": "完整拼写", "letter-change": "换字", "word-order-grammar": "词序 / 语法", "situation-semantics": "情境语义", "world-operation": "世界操作" }[s.dimension]}（${s.result === "observed" ? "本次有观察" : s.result === "adjust" ? "仍需调整" : "未确认"}）`,
                        )
                        .join("、")}
                      {event.observation.revisitOf
                        ? " · 关联先前任务的回访"
                        : ""}
                    </small>
                  )}
                  {event.language === "correct" &&
                    event.result === "blocked" && <span>（语句成立）</span>}
                  {event.type !== "operation" && (
                    <span lang="en"> · {event.submitted}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
        {modal && (
          <Modal
            title={
              modal === "pause"
                ? "小猫在这里等你"
                : modal === "restart"
                  ? "保留记录，开始新冒险？"
                  : "试着观察，再行动"
            }
            close={() => setModal(null)}
          >
            {modal === "pause" ? (
              <>
                <button onClick={() => setModal(null)}>继续冒险</button>
                <button onClick={() => setMuted((v) => !v)}>
                  {muted ? "取消静音" : "静音"}
                </button>
                <label>
                  音量
                  <input
                    type="range"
                    aria-label="音量"
                    min="0"
                    max="1"
                    step=".1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                  />
                </label>
                <button
                  onClick={() => {
                    setModal(null);
                    setScreen("records");
                  }}
                >
                  本地记录与导出
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    setScreen("home");
                  }}
                >
                  返回首页
                </button>
              </>
            ) : modal === "restart" ? (
              <>
                <p>
                  旧记录会保留备份。新目标从家门口开始，不把旧步骤换算成新目标。
                </p>
                <button onClick={download}>先导出记录</button>
                <button className="primary" onClick={restart}>
                  确认开始新冒险
                </button>
              </>
            ) : (
              <>
                <p>
                  点物品展开行动；先点物品再点场景里的目标，或拖过去。键盘 Tab
                  选中、Enter 操作。
                </p>
                <p>
                  包里先开包；戴着先摘下；垫上有东西先移走。点“放回地面”总能找到可逆退路。
                </p>
                <p>
                  指令让物品行动；描述只核对眼前的布置。不会的地方可以重听、看文字或示范，会如实记为帮助。
                </p>
                <ul>
                  {currentGoals
                    .filter((g) => !g.done)
                    .map((g) => (
                      <li key={g.id}>{g.label}</li>
                    ))}
                </ul>
              </>
            )}
          </Modal>
        )}
      </main>
    </AssetContext.Provider>
  );
}
