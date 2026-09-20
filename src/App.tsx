import { useEffect, useRef, useState } from "react";
import { ACTIVITIES, CRAFTS, SCENES, WORD_TASKS } from "./content/adventure.ts";
import type { ActivityId } from "./content/adventure.ts";
import type { Step } from "./content/story.ts";
import { SENTENCES } from "./content/sentences.ts";
import type { SentenceTask } from "./content/sentences.ts";
import {
  availableTargets,
  availableWords,
  at,
  board,
  complete,
  goals,
  initialAdventure,
  runAdventure,
  sentenceTasks,
  unlocked,
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
import { StoryAudio } from "./platform/audio.ts";
import { checkAssets } from "./content/assets.ts";
import { Art, AssetContext, AssetNotice, NAMES } from "./ui/Art.tsx";
import { Scene } from "./ui/Scene.tsx";
import { Letters } from "./ui/Letters.tsx";
import { SentenceBuilder } from "./ui/SentenceBuilder.tsx";
import { GameHud, GameIcon, TitleScreen } from "./ui/GameChrome.tsx";
import { Modal } from "./ui/Modal.tsx";
import type { Location, WordId } from "./domain/world.ts";
import "./adventure.css";
type Tool =
  | { kind: "word"; id: string }
  | { kind: "morph"; id: string }
  | { kind: "sentence"; id: string }
  | { kind: "craft"; id: string }
  | { kind: "find"; id: "find-map" }
  | null;
const modeLabels = {
  teaching: "引导学习",
  assisted: "辅助练习",
  independent: "独立应用",
  exploration: "自由探索",
  revisit: "复习回访",
};
const evidenceLabels = {
  guided: "引导学习",
  assisted: "使用了帮助",
  demonstrated: "看过示范",
  independent: "未使用帮助",
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
  const [modal, setModal] = useState<
    "pause" | "restart" | "help" | "journal" | null
  >(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [result, setResult] = useState("valid");
  const [warning, setWarning] = useState(loaded.warning);
  const [audioNote, setAudioNote] = useState("开发语音未审核；可用文字辅助。");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [failed, setFailed] = useState<string[]>([]),
    [epoch, setEpoch] = useState(0),
    [retrying, setRetrying] = useState(false);
  const audio = useRef(new StoryAudio()).current;
  const active = useRef(false);
  active.current = screen === "game" && !modal;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const b = board(session),
    entities = b.world.entities;
  const task =
    tool?.kind === "word"
      ? availableWords(session).find((t) => t.id === tool.id)
      : undefined;
  const sentence =
    tool?.kind === "sentence"
      ? sentenceTasks(session).find((t) => t.id === tool.id)
      : undefined;
  const morph = tool?.kind === "morph" ? entities[tool.id] : undefined;
  const targetWord: WordId | undefined = morph
    ? morph.word === "map"
      ? "mat"
      : morph.word === "mat"
        ? "map"
        : morph.word === "cat"
          ? "cap"
          : "cat"
    : task?.word;
  const taskId =
    task?.id ??
    sentence?.id ??
    (morph
      ? `morph:${morph.id}`
      : tool?.kind === "find"
        ? "find-map"
        : undefined);
  const help = taskId ? b.help[taskId] : undefined;
  const teaching =
    task?.mode === "teaching" ||
    sentence?.mode === "teaching" ||
    (!!morph && !b.facts.includes("morphed-card") && morph.id === "cat-card") ||
    (!!morph &&
      morph.id === "route-sheet" &&
      !b.world.flags.includes("crossed-ink"));
  const reveal =
    teaching ||
    sentence?.mode === "assisted" ||
    !!help?.text ||
    !!help?.demo ||
    !!help?.hint;
  const ended = session.story.facts.includes("ending");
  const activity =
    session.mode === "story" ? undefined : ACTIVITIES[session.mode];
  const currentGoals = goals(session);
  const saving = (s: Adventure) => {
    current.current = s;
    setSession(s);
    if (canSave.current) {
      const error = saveAdventure(s);
      if (error) setWarning(error);
    }
  };
  const send = (intent: Intent, silent = false) => {
    const before = current.current;
    const r = runAdventure(before, {
      ...intent,
      sessionId: before.id,
      revision: before.revision,
      mode: before.mode,
      attemptId: localId(),
    });
    if (r.session !== before) saving(r.session);
    if (!silent) {
      setMessage(r.message);
      setResponse(r.message);
      setResult(r.kind);
    }
    return r;
  };
  function stopTools() {
    audio.stop();
    setTool(null);
    setSelected(null);
  }
  function openTool(next: Tool) {
    audio.unlock();
    audio.stop();
    setTool(next);
    setMessage("");
    setSelected(null);
  }
  function start() {
    if (!canSave.current) {
      setModal("restart");
      return;
    }
    audio.unlock();
    setScreen("game");
  }
  function choose(id: string) {
    if (toolRef.current?.kind === "find") {
      const r = send({ action: "find", task: "find-map", source: id });
      if (r.kind === "valid" || r.kind === "done") {
        audio.stop();
        setTool(null);
      }
      return;
    }
    audio.stop();
    setTool(null);
    setSelected(id === selected ? null : id);
    setResponse(
      id === "ink-road"
        ? "小猫收回爪子：湿墨还没干。点身边的纸，看看它能变成什么。"
        : id === "cat-companion"
          ? "小猫抬头看着你，也看看身边的东西。"
          : id === "bag-main"
            ? "背包可以开合，里面的东西随时能拿出来。"
            : `${id === "cat-card" && entities[id].word === "cat" ? "纸偶" : NAMES[entities[id].word]}在这里。选个行动试试吧。`,
    );
  }
  function playTask(replay = false) {
    const s = current.current,
      t = toolRef.current;
    if (!t) return;
    const currentBoard = board(s);
    const wt =
      t.kind === "word"
        ? availableWords(s).find((x) => x.id === t.id)
        : undefined;
    const st =
      t.kind === "sentence"
        ? sentenceTasks(s).find((x) => x.id === t.id)
        : undefined;
    const object =
      t.kind === "morph" ? currentBoard.world.entities[t.id] : undefined;
    const id =
      wt?.id ??
      st?.id ??
      (object
        ? `morph:${object.id}`
        : t.kind === "find"
          ? "find-map"
          : undefined);
    const text =
      wt?.word ??
      st?.example ??
      (object
        ? object.word === "map"
          ? "mat"
          : object.word === "mat"
            ? "map"
            : object.word === "cat"
              ? "cap"
              : "cat"
        : t.kind === "find"
          ? "Find the map."
          : undefined);
    if (!id || !text) return;
    if (replay) send({ action: "replay", task: id }, true);
    const owner = s.id,
      mode = s.mode,
      toolKey = JSON.stringify(t);
    audio.play(text, setAudioNote, {
      stepId: id,
      purpose: "task",
      eventId: "",
      observe: (o) => {
        if (
          current.current.id === owner &&
          current.current.mode === mode &&
          JSON.stringify(toolRef.current) === toolKey &&
          active.current
        )
          send(
            {
              action: "audio",
              task: id,
              request: o.requestId,
              value: o.status,
              assetId: o.assetId,
              audioSource: o.source,
              audioVersion: o.version,
            },
            true,
          );
      },
    });
  }
  useEffect(() => {
    audio.muted = muted;
    audio.volume = volume;
  }, [audio, muted, volume]);
  useEffect(() => {
    if (screen === "game" && !modal && tool) playTask();
    return () => audio.stop();
  }, [tool, screen, modal]); // Binding owns callbacks; world commits never wait for audio.
  useEffect(() => {
    if (!response) return;
    const timer = setTimeout(() => setResponse(""), 6500);
    return () => clearTimeout(timer);
  }, [response]);
  useEffect(() => {
    const pause = () => {
      if (active.current) {
        audio.stop();
        setModal("pause");
        setResponse("");
      }
    };
    const hidden = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("pagehide", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pagehide", pause);
      document.removeEventListener("visibilitychange", hidden);
      audio.stop();
    };
  }, [audio]);
  const retry = async () => {
    setRetrying(true);
    try {
      setFailed(await checkAssets());
      setEpoch((n) => n + 1);
    } finally {
      setRetrying(false);
    }
  };
  const assetContext = {
    failed,
    epoch,
    retrying,
    report: (id: string) =>
      setFailed((old) => (old.includes(id) ? old : [...old, id])),
    retry,
  };
  function submitWord(word: string) {
    const r = send(
      tool?.kind === "craft"
        ? { action: "craft", word }
        : {
            action: morph ? "transform" : "word",
            task: taskId,
            word,
            ...(morph ? { source: morph.id } : {}),
          },
    );
    if (r.kind === "valid" || r.kind === "done") {
      audio.stop();
      setTool(null);
      setSelected(null);
    }
  }
  function submitSentence(ids: string[]) {
    const r = send({ action: "sentence", task: sentence!.id, ids });
    if (r.kind === "valid" || r.kind === "done") {
      audio.stop();
      setTool(null);
      setSelected(null);
    }
  }
  const performMove = (source: string, target: Location) => {
    send({ action: "place", source, target });
    setSelected(null);
  };
  const toolStep: Step | undefined = task
    ? {
        id: task.id,
        challenge: 0,
        act: SCENES[b.scene].act,
        title: task.purpose,
        story: task.meaning,
        type: "spell",
        mode: task.mode === "teaching" ? "teaching" : "independent",
        word: task.word,
        prompt: task.word,
        letters: task.letters,
        hints: [],
      }
    : morph && targetWord
      ? {
          id: `morph:${morph.id}`,
          challenge: 0,
          act: SCENES[b.scene].act,
          title: "纸张换字",
          story: "只换词尾，还是同一个物品。",
          type: "transform",
          mode: "guided",
          word: targetWord,
          prompt: targetWord,
          from: morph.word,
          letters: morph.word === "map" || morph.word === "mat" ? "pt" : "tp",
          hints: [],
        }
      : tool?.kind === "craft"
        ? {
            id: "craft",
            challenge: 0,
            act: 3,
            title: "自由制作",
            story: "",
            type: "spell",
            mode: "guided",
            word: "mat",
            prompt: "",
            letters: "mhat",
            hints: [],
          }
        : undefined;
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
    stopTools();
    const next = initialAdventure(
      localId(),
      Math.floor(Math.random() * 0xffffffff),
    );
    saving(next);
    setWarning("原记录已保留；新故事从家门口开始。");
    setModal(null);
    setScreen("game");
  }
  function toolHelp(value: string) {
    if (taskId) send({ action: "help", task: taskId, value });
  }
  const promptText =
    sentence?.example ??
    targetWord ??
    (tool?.kind === "find" ? "Find the map." : "");
  const actions = () => (
    <>
      {session.mode === "story" &&
        b.scene !== "meadow" &&
        complete(session) && (
          <button
            className="primary travel"
            onClick={() => {
              send({
                action: "travel",
                value: b.scene === "home" ? "trail" : "meadow",
              });
              stopTools();
            }}
          >
            {b.scene === "home" ? "沿小径出发 →" : "跟着地图去草地 →"}
          </button>
        )}
      {session.mode === "story" &&
        b.scene === "meadow" &&
        !ended &&
        complete(session) && (
          <button
            className="primary"
            onClick={() => {
              send({ action: "finish" });
              stopTools();
            }}
          >
            开始我们的野餐
          </button>
        )}
      {session.mode !== "story" && complete(session) && (
        <p className="activity-success">✓ 小问题解决了！小猫记得你的帮助。</p>
      )}
      {sentenceTasks(session)
        .filter((t) => !b.facts.includes(`sentence:${t.id}`))
        .map((t) => (
          <button
            key={t.id}
            className="task-action"
            onClick={() => openTool({ kind: "sentence", id: t.id })}
          >
            {t.title} <span>用一句话 →</span>
          </button>
        ))}
      {session.mode === "story" &&
        b.facts.includes("sentence:invite-cat") &&
        !b.facts.includes("found-map") && (
          <button
            className="task-action"
            onClick={() => openTool({ kind: "find", id: "find-map" })}
          >
            听听小猫想找什么 →
          </button>
        )}
    </>
  );
  return (
    <AssetContext.Provider value={assetContext}>
      <main
        className={`quest-app screen-${screen} ${screen === "game" ? "playing" : ""}`}
      >
        <div className="game-notices">
          <AssetNotice />
          {warning && (
            <div className="notice save-warning" role="alert">
              {warning}
            </div>
          )}
        </div>
        {screen === "home" && (
          <TitleScreen
            continuing={session.revision > 0}
            start={start}
            settings={() => setModal("pause")}
          />
        )}
        {screen === "game" && (
          <>
            <GameHud
              act={SCENES[b.scene].act}
              activity={activity?.title}
              title={
                ended && session.mode === "story"
                  ? "野餐开始啦！"
                  : activity
                    ? activity.variants[b.variant].title
                    : SCENES[b.scene].title
              }
              muted={muted}
              mute={() => {
                audio.stop();
                setMuted((v) => !v);
                setAudioNote(
                  muted ? "声音已开启，可以重听。" : "已静音，可选择文字辅助。",
                );
              }}
              pause={() => {
                audio.stop();
                setModal("pause");
              }}
            />
            <div
              className={`quest-layout ${tool ? "with-tool" : ""}`}
              data-tool={tool?.kind}
            >
              <Scene
                actions={
                  selected && entities[selected] ? (
                    <>
                      <div className="action-heading">
                        <h2>
                          {selected === "cat-card" &&
                          entities[selected].word === "cat"
                            ? "小猫纸偶"
                            : NAMES[entities[selected].word]}
                        </h2>
                        <button
                          className="icon-button"
                          aria-label="取消选择"
                          onClick={() => setSelected(null)}
                        >
                          <GameIcon name="close" />
                        </button>
                      </div>
                      <div className="context-actions">
                        {selected === "bag-main" && (
                          <button
                            onClick={() => {
                              send({ action: "bag" });
                              setSelected(null);
                            }}
                          >
                            {b.bagOpen ? "合上背包" : "打开背包"}
                          </button>
                        )}
                        {["cat-card", "route-sheet"].includes(selected) && (
                          <button
                            onClick={() =>
                              openTool({ kind: "morph", id: selected })
                            }
                          >
                            试试换字
                          </button>
                        )}
                        {availableTargets(session, selected).map((t) => (
                          <button
                            key={t.key}
                            onClick={() => performMove(selected, t.target)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null
                }
                session={session}
                selected={selected}
                onSelect={choose}
                onWord={(id) => openTool({ kind: "word", id })}
                onMove={performMove}
                onMiss={() => {
                  setMessage(
                    "没有放到合适的位置，物品留在原处。可以重新选择。",
                  );
                  setResponse(
                    "小猫歪头看看：再试一次，先点物品再点目的地也可以。",
                  );
                  setResult("blocked");
                }}
                response={response}
                pose={
                  result === "blocked" || result === "mismatch"
                    ? "thinking"
                    : response
                      ? "action"
                      : ended
                        ? "happy"
                        : "idle"
                }
                disabled={!!modal}
              />

              {tool && (
                <aside className="quest-tools" aria-label="行动工具">
                  <div className="tool-heading">
                    <span>
                      {tool.kind === "craft"
                        ? "自由探索"
                        : modeLabels[
                            sentence?.mode ??
                              task?.mode ??
                              (teaching
                                ? "teaching"
                                : tool.kind === "find"
                                  ? "revisit"
                                  : "exploration")
                          ]}
                    </span>
                    {taskId && (
                      <>
                        <button onClick={() => playTask(true)}>重听</button>
                        <button onClick={() => toolHelp("text")}>
                          文字辅助
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        audio.stop();
                        setTool(null);
                      }}
                    >
                      收起工具
                    </button>
                  </div>
                  <div className="tool-body">
                    <div className="tool-story">
                      <h2>
                        {task?.purpose ??
                          sentence?.title ??
                          (morph
                            ? "给纸张换一个词尾"
                            : tool.kind === "find"
                              ? "听声音，点场景中的物品"
                              : "用拼词制作备用物品")}
                      </h2>
                      <p className="tool-context">
                        {task?.meaning ??
                          sentence?.context ??
                          (morph
                            ? "先取出、摘下或移走上面的东西。换字不会复制物品。"
                            : tool.kind === "craft"
                              ? "mat 做一张备用垫，hat 做一顶备用帽；每种一件。"
                              : "这次先听声音。需要时可开启文字辅助。")}
                      </p>
                      {reveal && promptText && (
                        <p className="answer" lang="en">
                          {promptText}
                          {help?.demo && (
                            <small>
                              {sentence
                                ? "示范：按句子顺序逐块选择；两块 the 都要用。"
                                : "示范：先选择字母填入空格；换字时先取回词尾，再放入新字母。"}
                            </small>
                          )}
                        </p>
                      )}
                      {morph && teaching && (
                        <div className="meaning-pair">
                          <Art word={morph.word} />
                          <span>
                            {morph.word} → {targetWord}
                          </span>
                          <Art word={targetWord!} />
                        </div>
                      )}
                    </div>
                    <div className="tool-input">
                      {toolStep && (
                        <Letters
                          key={`${toolStep.id}-${morph?.word ?? ""}`}
                          step={toolStep}
                          disabled={!!modal}
                          submit={submitWord}
                        />
                      )}
                      {sentence && (
                        <SentenceBuilder
                          key={sentence.id}
                          task={sentence as SentenceTask}
                          submit={submitSentence}
                        />
                      )}
                    </div>
                  </div>
                  {taskId && (
                    <div className="tool-help">
                      <button onClick={() => toolHelp("hint")}>提示</button>
                      <button onClick={() => toolHelp("demo")}>看示范</button>
                    </div>
                  )}
                  {taskId && <p className="audio-note">{audioNote}</p>}

                  {message && (
                    <p className={`quest-feedback ${result}`} role="status">
                      {message}
                    </p>
                  )}
                </aside>
              )}
              {!tool && (
                <div className="scene-missions">
                  <div className="world-actions">{actions()}</div>
                  {session.mode !== "story" && (
                    <div className="activity-exit">
                      <button
                        onClick={() => {
                          stopTools();
                          send({ action: "exit" });
                        }}
                      >
                        返回故事
                      </button>
                      <button
                        onClick={() => {
                          stopTools();
                          send({ action: "restart-activity" });
                        }}
                      >
                        换个情境重玩
                      </button>
                    </div>
                  )}
                  {ended && session.mode === "story" && (
                    <div className="ending-choice">
                      <p>
                        {at(b, "hat-main", "worn")
                          ? "你选了宽檐帽，小猫有了一把小伞。"
                          : at(b, "cat-card", "worn")
                            ? "你选了鸭舌帽，小猫准备好下一次探险。"
                            : "你摘下了帽子，小猫自在地晒太阳。"}
                      </p>
                      <button onClick={() => setScreen("records")}>
                        回顾这次冒险
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <nav
              className={`adventure-controls ${tool ? "tool-open" : ""}`}
              aria-label="冒险菜单"
            >
              <button
                className="journal-control"
                aria-label="探险手记"
                onClick={() => setModal("journal")}
              >
                <GameIcon name="book" />
                <span>探险手记</span>
              </button>
              {!tool && (
                <span className="explore-hint">
                  {selected
                    ? "试试一个行动，也可以拖动物品"
                    : "点点伙伴和道具，发现下一步"}
                </span>
              )}
              <button
                className="round-control"
                aria-label="帮助"
                onClick={() => setModal("help")}
              >
                <GameIcon name="help" />
              </button>
            </nav>
          </>
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
                  : modal === "journal"
                    ? "我的探险手记"
                    : "试着观察，再行动"
            }
            close={() => setModal(null)}
          >
            {modal === "pause" ? (
              <>
                <button className="primary" onClick={() => setModal(null)}>
                  {screen === "home" ? "返回标题" : "继续冒险"}
                </button>
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
            ) : modal === "journal" ? (
              <>
                <p className="journal-scene">
                  {activity
                    ? activity.variants[b.variant].problem
                    : SCENES[b.scene].problem}
                </p>
                <div className="quest-goals">
                  {currentGoals.map((g) => (
                    <p key={g.id} data-goal={g.id} data-done={g.done}>
                      <span aria-hidden="true">{g.done ? "✓" : "○"}</span>{" "}
                      {g.label}
                    </p>
                  ))}
                </div>
                <h3>林间小插曲</h3>
                <nav className="activity-doors" aria-label="短活动">
                  {(Object.keys(ACTIVITIES) as ActivityId[])
                    .filter((id) => unlocked(session, id))
                    .map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          setModal(null);
                          stopTools();
                          send({ action: "activity", value: id });
                        }}
                      >
                        {ACTIVITIES[id].title}
                        <span aria-hidden="true"> →</span>
                      </button>
                    ))}
                </nav>
                {!(Object.keys(ACTIVITIES) as ActivityId[]).some((id) =>
                  unlocked(session, id),
                ) && (
                  <p className="micro">
                    先和小猫发现身边的物品，新的小故事会在这里出现。
                  </p>
                )}
                {b.scene === "meadow" && (
                  <button
                    onClick={() => {
                      setModal(null);
                      openTool({ kind: "craft", id: "craft" });
                    }}
                  >
                    自由制作 · {CRAFTS.map((c) => c.word).join(" / ")}
                  </button>
                )}
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
