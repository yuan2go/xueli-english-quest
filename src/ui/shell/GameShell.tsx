import { playfulState } from "../../game/play.ts";
import { useEffect, useRef, useState } from "react";
import { ACTIVITIES } from "../../content/adventure.ts";
import type { ActivityId } from "../../content/adventure.ts";
import { ENTITY_REACTIONS } from "../../content/encounters.ts";
import { availableTargets, board, unlocked } from "../../game/adventure.ts";
import type {
  Adventure,
  AdventureResult,
  Intent,
} from "../../game/adventure.ts";
import { presentation, sceneModel, resolveTool } from "../../game/shell.ts";
import type { Cue, SceneAction, Tool } from "../../game/shell.ts";
import { StoryAudio } from "../../platform/audio.ts";
import { Scene } from "../Scene.tsx";
import { NAMES } from "../Art.tsx";
import { Modal } from "../Modal.tsx";
import { ContextTool } from "./ContextTool.tsx";
import { GameHUD } from "./GameHUD.tsx";
import { useSceneMotion } from "./useSceneMotion.ts";
import { FeedbackLayer } from "./FeedbackLayer.tsx";
export function GameShell({
  session,
  dispatch,
  paused,
  volume,
  muted,
  onPause,
  onHelp,
  onReview,
  onMute,
}: {
  session: Adventure;
  dispatch: (intent: Intent) => AdventureResult;
  paused: boolean;
  volume: number;
  muted: boolean;
  onPause: () => void;
  onHelp: () => void;
  onReview: () => void;
  onMute: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool | null>(null);
  const [explore, setExplore] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [cue, setCue] = useState<Cue | null>(null);
  const current = useRef(session);
  current.current = session;
  const returnEntity = useRef<string | undefined>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  const shell = useRef<HTMLDivElement>(null);
  const focusFrame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    },
    [],
  );
  const [audio] = useState(() => new StoryAudio());
  const b = board(session),
    model = sceneModel(session),
    entities = b.world.entities;
  const play = playfulState(session);
  const [hidden, setHidden] = useState(document.hidden);
  const inactive = paused || explore || hidden;
  const captureMotion = useSceneMotion(shell, cue, inactive);
  useEffect(() => {
    audio.muted = muted;
    audio.volume = volume;
    if (muted) audio.stop();
  }, [audio, muted, volume]);
  useEffect(() => {
    if (inactive) {
      audio.stop();
      setCue(null);
    }
  }, [inactive, audio]);
  useEffect(() => {
    const cancel = () => {
      setCue(null);
      audio.stop();
    };
    const visibility = () => {
      setHidden(document.hidden);
      if (document.hidden) cancel();
    };
    window.addEventListener("resize", cancel);
    window.addEventListener("pagehide", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("resize", cancel);
      window.removeEventListener("pagehide", cancel);
      document.removeEventListener("visibilitychange", visibility);
      audio.stop();
    };
  }, [audio]);
  useEffect(() => {
    if (!cue) return;
    const timer = setTimeout(() => setCue(null), cue.duration);
    return () => clearTimeout(timer);
  }, [cue]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 6500);
    return () => clearTimeout(timer);
  }, [feedback]);
  function send(intent: Intent, silent = false) {
    const before = current.current;
    if (!silent) captureMotion();
    const r = dispatch(intent);
    current.current = r.session;
    if (!silent) {
      const nextCue = presentation(before, intent, r);
      setFeedback(r.message);
      setCue(nextCue);
    }
    return r;
  }
  function focusWorld(id?: string) {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      const el = id
        ? shell.current?.querySelector<HTMLElement>(
            `[data-entity="${id}"], [data-word-entity="${id}"]`,
          )
        : trigger.current;
      if (el?.isConnected && !el.matches(":disabled"))
        el.focus({ preventScroll: true });
      else
        shell.current
          ?.querySelector<HTMLElement>(".quest-scene")
          ?.focus({ preventScroll: true });
    });
  }
  function close(focus = true) {
    const id = tool ? returnEntity.current : (selected ?? undefined);
    audio.stop();
    setTool(null);
    setSelected(null);
    if (focus) focusWorld(id);
  }
  function openTool(next: Tool) {
    trigger.current = document.activeElement as HTMLElement;
    const resolved = resolveTool(current.current, next);
    returnEntity.current =
      resolved.word?.entity ??
      resolved.morph?.id ??
      model.actions.find((a) => a.tool?.id === next.id)?.anchor;
    audio.unlock();
    audio.stop();
    setTool(next);
    setSelected(null);
    setFeedback(resolveTool(current.current, next).context);
  }
  function choose(id: string) {
    if (tool?.kind === "find") {
      const r = send({ action: "find", task: "find-map", source: id });
      if (["valid", "done"].includes(r.kind)) {
        close(false);
        focusWorld(id);
      }
      return;
    }
    close(false);
    trigger.current = document.activeElement as HTMLElement;
    setSelected(id === selected ? null : id);
    setFeedback(
      ENTITY_REACTIONS[id] ?? "试着把它放到别处，或者看看它的另一种用途。",
    );
  }
  function action(a: SceneAction) {
    if (a.tool) openTool(a.tool);
    else if (a.intent) {
      close(false);
      send(a.intent);
      focusWorld();
    }
  }
  const contextual = model.actions.filter((a) => a.anchor === selected);
  return (
    <div
      ref={shell}
      className={`game-shell ${tool ? "tool-open" : selected ? "object-open" : "world-open"}`}
      data-encounter={model.id}
      data-motion-paused={inactive || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !inactive) {
          close();
          setCue(null);
        }
      }}
    >
      <GameHUD
        title={model.title}
        problem={model.problem}
        muted={muted}
        explore={() => {
          audio.stop();
          setExplore(true);
        }}
        pause={onPause}
        help={onHelp}
        mute={onMute}
      />
      <div className="game-space">
        <Scene
          session={session}
          selected={selected}
          related={
            tool
              ? (() => {
                  const r = resolveTool(session, tool);
                  return r.sentence
                    ? [r.sentence.sourceId, r.sentence.targetId]
                    : r.morph
                      ? [r.morph.id]
                      : r.word
                        ? [r.word.entity]
                        : [];
                })()
              : []
          }
          onSelect={choose}
          onWord={(id) => openTool({ kind: "word", id })}
          onMove={(source, target) => {
            send({ action: "place", source, target });
            close(false);
            focusWorld(source);
          }}
          onMiss={() => {
            setFeedback(
              "没有放到合适的位置，物品留在原处。先点物品，再点目的地也可以。",
            );
            setCue({
              id: Date.now(),
              kind: "blocked",
              message: "回到原位",
              duration: 650,
            });
          }}
          response={feedback || play?.response || play?.clue || ""}
          pose={
            cue?.kind === "blocked"
              ? "thinking"
              : cue
                ? ["observe", "celebrate"].includes(cue.kind)
                  ? "happy"
                  : "action"
                : model.ended
                  ? "happy"
                  : tool || selected
                    ? "thinking"
                    : "idle"
          }
          disabled={inactive}
          cue={cue}
        >
          {play && !tool && (
            <div
              className={`play-situation situation-${play.scene}`}
              aria-label="情境实验"
            >
              {play.scene === "breeze" && (
                <span className="wind-leaves" aria-hidden="true">
                  🍃
                </span>
              )}
              {play.actions.map((a) => (
                <button
                  key={a.value}
                  onClick={() => {
                    close(false);
                    send({ action: "experiment", value: a.value });
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <nav className="scene-invitations" aria-label="场景中的邀请">
            {(!tool
              ? model.actions.filter((a) => a.anchor !== selected)
              : []
            ).map((a) => (
              <button
                key={a.id}
                data-encounter-action={a.id}
                className={a.intent ? "scene-exit" : "encounter-marker"}
                onClick={() => action(a)}
              >
                <span aria-hidden="true">{a.intent ? "↝" : "☏"}</span> {a.label}
              </button>
            ))}
            {model.activityComplete && (
              <div className="activity-success">
                ✓ 小问题解决了！
                <button
                  onClick={() => {
                    close(false);
                    send({ action: "exit" });
                  }}
                >
                  返回故事
                </button>
                <button
                  onClick={() => {
                    close(false);
                    send({ action: "restart-activity" });
                  }}
                >
                  换个情境重玩
                </button>
              </div>
            )}
            {model.ended && !tool && (
              <div className="ending-choice">
                <p>{model.ending}</p>
                <button onClick={onReview}>回顾这次冒险</button>
              </div>
            )}
          </nav>
          <FeedbackLayer cue={cue} />
        </Scene>
        {(tool || selected) && (
          <aside className="quest-tools" aria-label="行动工具" inert={inactive}>
            {tool ? (
              <ContextTool
                key={`${session.mode}-${tool.kind}-${tool.id}`}
                session={session}
                tool={tool}
                send={send}
                close={() => close()}
                paused={inactive}
                audio={audio}
                onSuccess={(id) => {
                  close(false);
                  focusWorld(id);
                }}
              />
            ) : (
              <section className="object-tool" aria-label="物品行动">
                <div className="tool-heading">
                  <h2>
                    {selected === "ink-road"
                      ? "湿墨小径"
                      : selected === "cat-card" &&
                          entities[selected]?.word === "cat"
                        ? "小猫纸偶"
                        : NAMES[entities[selected!]?.word]}
                  </h2>
                  <button onClick={() => close()}>取消选择</button>
                </div>
                <div className="context-actions">
                  {selected === "bag-main" && (
                    <button onClick={() => send({ action: "bag" })}>
                      {b.bagOpen ? "合上背包" : "打开背包"}
                    </button>
                  )}
                  {["cat-card", "route-sheet"].includes(selected!) && (
                    <button
                      onClick={() => openTool({ kind: "morph", id: selected! })}
                    >
                      试试换字
                    </button>
                  )}
                  {contextual.map((a) => (
                    <button key={a.id} onClick={() => action(a)}>
                      {a.label}
                    </button>
                  ))}
                  {availableTargets(session, selected!).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => {
                        send({
                          action: "place",
                          source: selected!,
                          target: t.target,
                        });
                        close(false);
                        focusWorld(selected!);
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="micro">
                  拖到亮起的位置，或点选行动。随时可以放回地面。
                </p>
              </section>
            )}
          </aside>
        )}
      </div>
      <div className="sr-only" role="status">
        {feedback}
      </div>
      {cue && ["arrive", "cross", "celebrate"].includes(cue.kind) && (
        <button className="skip-presentation" onClick={() => setCue(null)}>
          跳过演出
        </button>
      )}
      {explore && (
        <Modal title="野餐小路" close={() => setExplore(false)}>
          <p>走一条小路，回来时故事里的布置还在。</p>
          <nav className="activity-doors" aria-label="短活动">
            {(Object.keys(ACTIVITIES) as ActivityId[]).map((id) => (
              <button
                key={id}
                disabled={!unlocked(session, id)}
                onClick={() => {
                  setExplore(false);
                  close(false);
                  send({ action: "activity", value: id });
                }}
              >
                {ACTIVITIES[id].title}
                {!unlocked(session, id) && " · 故事中发现"}
              </button>
            ))}
          </nav>
          {b.scene === "meadow" && (
            <button
              onClick={() => {
                setExplore(false);
                openTool({ kind: "craft", id: "craft" });
              }}
            >
              自由制作 · mat / hat
            </button>
          )}
          {session.mode !== "story" && (
            <>
              <button
                onClick={() => {
                  setExplore(false);
                  close(false);
                  send({ action: "exit" });
                }}
              >
                返回故事
              </button>
              <button
                onClick={() => {
                  setExplore(false);
                  close(false);
                  send({ action: "restart-activity" });
                }}
              >
                换个情境重玩
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
