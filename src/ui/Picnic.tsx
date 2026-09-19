import { useEffect, useRef, useState } from "react";
import {
  initialPicnic,
  play,
  picnicGoals,
  picnicComplete,
  MODES,
} from "../game/picnic.ts";
import type {
  Picnic as PlayState,
  PlayMode,
  PlayCommand,
} from "../game/picnic.ts";
import {
  decodePicnic,
  encodePicnic,
  picnicKey,
} from "../platform/picnic-save.ts";
import { localId } from "../platform/id.ts";
import { shuffled, seedOf } from "../game/random.ts";
import { Letters } from "./Letters.tsx";
import { Art, NAMES, Visual, AssetNotice } from "./Art.tsx";
import { ObjectButton } from "./ObjectButton.tsx";
import { usePointerDrop } from "./pointer.ts";
import { sceneTargets } from "../game/interaction.ts";
import { StoryAudio } from "../platform/audio.ts";
import type { Entity, Location, WordId } from "../domain/world.ts";
import { WORDS } from "../domain/world.ts";
import { STEPS } from "../content/story.ts";
import { Modal } from "./Modal.tsx";
import "./picnic.css";
function loadMode(mode: PlayMode, seed?: number) {
  try {
    const raw = localStorage.getItem(picnicKey(mode));
    if (raw)
      return { state: decodePicnic(raw, mode), warning: "", blocked: false };
  } catch {
    return {
      state: initialPicnic(localId(), mode, seed ?? 1),
      warning: "布置暂时无法读取。原档保留，可导出后确认恢复初始布置。",
      blocked: true,
    };
  }
  const id = localId();
  return {
    state: initialPicnic(id, mode, seed ?? seedOf(id)),
    warning: "",
    blocked: false,
  };
}
export function Picnic({ exit }: { exit: () => void }) {
  const [loaded] = useState(() => {
    let mode: PlayMode = "free";
    try {
      const raw = localStorage.getItem("wordspell.play.active");
      if (raw && Object.hasOwn(MODES, raw)) mode = raw as PlayMode;
    } catch {}
    return loadMode(mode);
  });
  const [state, setState] = useState(loaded.state),
    current = useRef(state);
  const [warning, setWarning] = useState(loaded.warning),
    blocked = useRef(loaded.blocked);
  const [selected, setSelected] = useState<string | null>(null),
    [message, setMessage] = useState("选一件物品，试着移动、戴上或施法。");
  const [tool, setTool] = useState<"none" | "spell" | "transform">("none"),
    [round, setRound] = useState(0);
  const [modal, setModal] = useState<"pause" | "reset" | null>(null);
  const [audioMessage, setAudioMessage] = useState(
    "开发语音未审核；所有小活动提供文字线索。",
  );
  const audio = useRef(new StoryAudio()).current;
  const [morph, setMorph] = useState<{
      id: string;
      before: WordId;
      after: WordId;
    } | null>(null),
    [phase, setPhase] = useState(0);
  const paused = useRef(false);
  paused.current = !!modal || !!morph;
  const source = selected ? state.world.entities[selected] : undefined;
  function persist(s: PlayState) {
    try {
      localStorage.setItem("wordspell.play.active", s.mode);
      if (!blocked.current)
        localStorage.setItem(picnicKey(s.mode), encodePicnic(s));
    } catch {
      setWarning("当前布置只能临时保留，可导出。");
    }
  }
  useEffect(() => {
    persist(current.current);
    const hide = (e: Event) => {
      if (document.hidden || e.type === "pagehide") {
        setModal("pause");
        setMorph(null);
        audio.stop();
      }
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", hide);
      audio.stop();
    };
  }, [audio]);
  useEffect(() => {
    if (modal) {
      audio.stop();
      setMorph(null);
      setTool("none");
    }
  }, [modal, audio]);
  useEffect(() => {
    if (!morph) return;
    const a = setTimeout(() => {
      setPhase(1);
      audio.unlock();
      audio.play(morph.after, setAudioMessage, undefined, 1800);
    }, 400);
    const b = setTimeout(() => setPhase(2), 1100);
    const c = setTimeout(() => setMorph(null), 2500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
      audio.stop();
    };
  }, [morph, audio]);
  function send(
    input: Pick<PlayCommand, "action" | "source" | "word" | "target">,
  ) {
    const old = current.current;
    if (
      paused.current ||
      old.id !== state.id ||
      old.revision !== state.revision
    )
      return;
    const result = play(old, {
      ...input,
      sessionId: old.id,
      mode: old.mode,
      revision: old.revision,
      attemptId: localId(),
    });
    setMessage(result.message);
    if (result.focus) setSelected(result.focus);
    if (result.session !== old) {
      current.current = result.session;
      setState(result.session);
      persist(result.session);
      setTool("none");
      setRound((n) => n + 1);
      if (input.action === "transform") {
        setPhase(0);
        setMorph({
          id: input.source!,
          before: old.world.entities[input.source!].word,
          after: result.session.world.entities[input.source!].word,
        });
      }
    }
  }
  function place(id: string, target: string | null) {
    if (!target) {
      setMessage("没放稳，物品回到原位。再试一次。");
      return;
    }
    let location: Location;
    const [targetId, relation] = target.split(":");
    if (targetId === "grass") location = { kind: "stage" };
    else if (relation === "wear") location = { kind: "worn", targetId };
    else if (relation === "in" || relation === "on")
      location = { kind: "relation", relation, targetId };
    else return;
    send({ action: "place", source: id, target: location });
  }
  const pointer = usePointerDrop((id, target) => {
    if (!paused.current) place(id, target);
  });
  const targets = sceneTargets(state.world, 3);
  function select(e: Entity) {
    if (paused.current) return;
    const target = targets.find((t) => t.entityId === e.id);
    const at = selected ? state.world.entities[selected]?.location : undefined;
    const already = at?.kind === "relation" && at.targetId === e.id;
    if (selected && selected !== e.id && target && !already)
      place(selected, target.id);
    else {
      setSelected(e.id === selected ? null : e.id);
      setTool("none");
    }
  }
  function open(mode: PlayMode, restart = false) {
    audio.stop();
    setMorph(null);
    const result = restart
      ? {
          state: initialPicnic(
            localId(),
            mode,
            (current.current.seed + 1) >>> 0,
          ),
          warning: "",
          blocked: false,
        }
      : loadMode(mode, current.current.seed);
    blocked.current = result.blocked;
    current.current = result.state;
    setState(result.state);
    setWarning(result.warning);
    setSelected(null);
    setTool("none");
    setModal(null);
    setMessage("小猫准备好了，看看这次的布置吧。");
    persist(result.state);
  }
  function reset() {
    try {
      const key = picnicKey(state.mode),
        old = localStorage.getItem(key);
      if (old) localStorage.setItem(`${key}.previous`, old);
    } catch {
      setWarning("未能备份原布置，暂不覆盖。请先导出。");
      setModal(null);
      return;
    }
    open(state.mode, true);
  }
  function exportSave() {
    let raw = encodePicnic(state);
    try {
      if (blocked.current)
        raw = localStorage.getItem(picnicKey(state.mode)) ?? raw;
    } catch {}
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `picnic-${state.mode}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const goals = picnicGoals(state),
    complete = picnicComplete(state);
  const display = (e: Entity) =>
    morph?.id === e.id && phase < 2 ? morph.before : e.word;
  const children = (e: Entity) =>
    Object.values(state.world.entities).filter(
      (c) => c.location.kind === "relation" && c.location.targetId === e.id,
    );
  const render = (e: Entity, child = false): React.ReactNode => (
    <div
      key={e.id}
      className={`play-object ${child ? "child-object" : ""} entity-${e.id}`}
    >
      <ObjectButton
        entity={e}
        word={display(e)}
        selected={selected === e.id}
        drop={targets.find((t) => t.entityId === e.id)?.id}
        onClick={() => pointer.click(() => select(e))}
        onPointerDown={(ev) => {
          if (!paused.current) pointer.start(ev, e.id);
        }}
      >
        {e.kind === "actor" &&
          Object.values(state.world.entities)
            .filter(
              (h) => h.location.kind === "worn" && h.location.targetId === e.id,
            )
            .map((h) => (
              <span className="worn-prop" key={h.id}>
                <Art word={h.word} />
              </span>
            ))}
      </ObjectButton>
      {e.word === "bag" && (
        <button className="bag-toggle" onClick={() => send({ action: "bag" })}>
          {state.bagOpen ? "合上背包" : "打开背包"}
          {children(e).length ? `（${children(e).length}）` : ""}
        </button>
      )}
      {(e.word !== "bag" || state.bagOpen) && children(e).length > 0 && (
        <div
          className={`play-contents ${e.word === "bag" ? "inside" : "on-top"}`}
          aria-label={e.word === "bag" ? "背包内部" : "垫子表面"}
        >
          {children(e).map((c) => render(c, true))}
        </div>
      )}
      {e.kind === "actor" && (
        <button
          className="head-target"
          data-drop={`${e.id}:wear`}
          onClick={() =>
            selected
              ? place(selected, `${e.id}:wear`)
              : setMessage("先选 hat 或 cap，再点小猫头顶。")
          }
        >
          给小猫戴帽
        </button>
      )}
    </div>
  );
  const worn = Object.values(state.world.entities).find(
    (e) => e.location.kind === "worn",
  );
  const selectedWord = source?.word;
  const transformable =
    source && ["route-sheet", "cat-card"].includes(source.id);
  const to: WordId =
    source?.id === "route-sheet"
      ? source.word === "map"
        ? "mat"
        : "map"
      : source?.word === "cat"
        ? "cap"
        : "cat";
  const letterStep = {
    ...STEPS[0],
    id: `play-${round}-${selected ?? ""}`,
    mode: "guided" as const,
    type: tool === "transform" ? ("transform" as const) : ("spell" as const),
    from: tool === "transform" ? selectedWord : undefined,
    word: tool === "transform" ? to : ("cat" as WordId),
    letters: shuffled(
      [...(tool === "transform" ? `${selectedWord?.[2]}${to[2]}` : "catbgmph")],
      state.seed,
    ).join(""),
  };
  return (
    <main className="picnic-page" data-mode={state.mode} data-seed={state.seed}>
      <header className="topbar">
        <button
          onClick={() => {
            audio.stop();
            exit();
          }}
        >
          故事回顾
        </button>
        <strong>{MODES[state.mode]}</strong>
        <button onClick={() => setModal("pause")}>暂停</button>
      </header>
      <AssetNotice />
      {warning && (
        <p className="notice" role="alert">
          {warning}
          <button onClick={exportSave}>导出布置</button>
          <button onClick={() => setModal("reset")}>恢复初始布置</button>
        </p>
      )}
      {state.mode !== "free" && (
        <section className="activity-goals">
          <button className="quiet" onClick={() => open("free")}>
            返回我的野餐
          </button>
          <h1>{MODES[state.mode]}</h1>
          <ul>
            {goals.map((g) => (
              <li key={g.label}>
                {g.done ? "✓" : "○"} {g.label}
              </li>
            ))}
          </ul>
          {state.mode === "find" && (
            <button
              onClick={() => {
                audio.unlock();
                audio.play(state.seed % 2 ? "hat" : "cap", setAudioMessage);
              }}
            >
              听找物线索
            </button>
          )}
          {complete && (
            <div role="status">
              <strong>小委托完成啦！</strong>
              <button onClick={() => open(state.mode, true)}>再玩一次</button>
              <button onClick={() => open("free")}>继续我的野餐</button>
            </div>
          )}
        </section>
      )}
      <div className="play-layout">
        <section
          className="play-scene"
          aria-label="魔法野餐场景"
          data-phase={morph ? phase : undefined}
          data-reaction={state.events.at(-1)?.action}
        >
          <Visual id="scene-act-3" label="野餐草地" className="scene-background-image" />
          <div className="play-objects">
            {shuffled(
              Object.values(state.world.entities).filter(
                (e) => e.location.kind === "stage",
              ),
              state.seed,
            ).map((e) => render(e))}
          </div>
          <button
            className="grass-target"
            data-drop="grass:stage"
            onClick={() =>
              selected
                ? place(selected, "grass:stage")
                : setMessage("先选物品，再点草地。")
            }
          >
            草地 · 放回这里
          </button>
          {worn && (
            <button
              className="remove-hat"
              onClick={() =>
                send({
                  action: "place",
                  source: worn.id,
                  target: { kind: "stage" },
                })
              }
            >
              摘下{NAMES[worn.word]}
            </button>
          )}
          {morph && (
            <div className="play-morph" role="status">
              {morph.before.slice(0, 2)}
              <del>{morph.before[2]}</del> → {morph.after.slice(0, 2)}
              <strong>{morph.after[2]}</strong>
              <span>
                {phase < 2 ? "同一张纸，换个词尾…" : "变好了，试试它的新用途。"}
              </span>
              <button
                onClick={() => {
                  audio.stop();
                  setMorph(null);
                }}
              >
                跳过演出
              </button>
            </div>
          )}
        </section>
        <section className="play-tools">
          <p className="play-response" role="status">
            {message}
          </p>
          <p>
            {source
              ? `已选：${source.id === "cat-card" && source.word === "cat" ? "小猫纸偶" : NAMES[source.word]}。点目标可放置，也可拖过去。`
              : "点物品，再点背包、垫子或草地。"}
            {source && (
              <button
                className="quiet"
                onClick={() => {
                  setSelected(null);
                  setTool("none");
                }}
              >
                取消选择
              </button>
            )}
          </p>
          {source && (
            <div className="action-strip">
              <button
                onClick={() =>
                  send({
                    action: "place",
                    source: source.id,
                    target: { kind: "stage" },
                  })
                }
              >
                拿到草地
              </button>
              {transformable && (
                <button onClick={() => setTool("transform")}>换字魔法</button>
              )}
              <button
                onClick={() => {
                  audio.unlock();
                  audio.play(source.word, setAudioMessage);
                }}
              >
                听这个词
              </button>
            </div>
          )}
          <button
            className="primary"
            onClick={() => {
              audio.stop();
              setTool(tool === "spell" ? "none" : "spell");
            }}
          >
            拼词找物
          </button>
          {tool !== "none" && !morph && (
            <div>
              <button className="quiet" onClick={() => setTool("none")}>
                收起字母
              </button>
              <Letters
                key={`${tool}-${round}-${selected}`}
                step={letterStep}
                submit={(word) =>
                  send({
                    action: tool === "transform" ? "transform" : "spell",
                    word,
                    source: selected ?? undefined,
                  })
                }
              />
            </div>
          )}
          <details>
            <summary>六张词卡与声音说明</summary>
            <p>
              {WORDS.join(" · ")}
              。每个具名物品只有一件；地图和野餐垫是两张不同的纸。这里的探索不计主线成绩。
            </p>
            <p>{audioMessage}</p>
            <p>临时纸片插画 / 开发语音，待正式审核。</p>
          </details>
        </section>
      </div>
      {state.mode === "free" && (
        <nav className="picnic-activities" aria-label="野餐小活动">
          <h2>一起做个小委托</h2>
          {(["dress", "find", "helper"] as const).map((mode) => (
            <button
              key={mode}
              aria-label={MODES[mode]}
              onClick={() => open(mode)}
            >
              {MODES[mode]} <span aria-hidden="true">→</span>
            </button>
          ))}
        </nav>
      )}
      <details className="play-recap">
        <summary>我们刚才做过的魔法</summary>
        <ul>
          {state.events.slice(-8).map((e, i) => (
            <li key={i}>{e.response}</li>
          ))}
        </ul>
        <button onClick={() => setModal("reset")}>恢复初始布置</button>
        <button onClick={exportSave}>导出布置</button>
      </details>
      {pointer.ghost && (
        <div
          className="drag-ghost play-drag"
          style={{ left: pointer.ghost.x, top: pointer.ghost.y }}
        >
          <Art
            word={state.world.entities[pointer.ghost.label]?.word ?? "cat"}
          />
        </div>
      )}
      {modal === "pause" && (
        <Modal title="野餐歇一会儿" close={() => setModal(null)}>
          <p>布置已保留。回来继续玩。</p>
          <button
            onClick={() => {
              audio.muted = !audio.muted;
              setAudioMessage(audio.muted ? "已静音。" : "已开启声音。");
            }}
          >
            切换静音
          </button>
          <button onClick={() => setModal(null)}>继续野餐</button>
          <button
            onClick={() => {
              audio.stop();
              exit();
            }}
          >
            故事回顾
          </button>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="恢复初始布置？" close={() => setModal(null)}>
          <p>
            只重置当前玩法，原布置备份在本机。主线与其他玩法不受影响。新一局的排列与找物线索可能不同。
          </p>
          <button onClick={reset}>确认恢复布置</button>
        </Modal>
      )}
    </main>
  );
}
