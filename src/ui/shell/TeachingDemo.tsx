import { useContext, useEffect, useRef, useState } from "react";
import type {
  Adventure,
  AdventureResult,
  Intent,
} from "../../game/adventure.ts";
import { lessonFrames } from "../../game/lesson.ts";
import type { Tool } from "../../game/shell.ts";
import { localId } from "../../platform/id.ts";
import { Art, AssetContext, CharacterArt, Visual } from "../Art.tsx";
import { Modal } from "../Modal.tsx";

export function TeachingDemo({
  session,
  tool,
  taskId,
  send,
  close,
}: {
  session: Adventure;
  tool: Tool;
  taskId: string;
  send: (intent: Intent, silent?: boolean) => AdventureResult;
  close: () => void;
}) {
  const [frames] = useState(() => lessonFrames(session, tool));
  const [step, setStep] = useState(0);
  const [request] = useState(localId);
  const frame = frames[step];
  const panel = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const assets = useContext(AssetContext);
  const [failed, setFailed] = useState(false);
  const current = useRef({ send, step });
  current.current = { send, step };
  const ended = useRef(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    setSeen(false);
    setFailed(false);
    const visible = new Map<Element, number>();
    const decoded = new WeakSet<HTMLImageElement>();
    const decoding = new WeakSet<HTMLImageElement>();
    const recorded = new Set<string>();
    let frameId = 0,
      alive = true;
    function record(
      part: "action" | "words",
      phase: "shown" | "partial" | "failed",
    ) {
      const key = `${part}:${phase}`;
      if (recorded.has(key)) return;
      recorded.add(key);
      current.current.send(
        {
          action: "help",
          task: taskId,
          value: "demo",
          request,
          phase,
          part,
          step,
        },
        true,
      );
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          visible.set(entry.target, entry.intersectionRatio);
      },
      { threshold: [0, 0.01, 0.95, 1] },
    );
    if (panel.current) observer.observe(panel.current);
    if (words.current) observer.observe(words.current);
    function check() {
      if (!alive || document.hidden) return;
      const stage = panel.current;
      const images = [...(stage?.querySelectorAll("img") ?? [])];
      for (const image of images) {
        if (image.complete && image.naturalWidth && !decoding.has(image)) {
          decoding.add(image);
          void image
            .decode()
            .then(() => decoded.add(image))
            .catch(() => {});
        }
      }
      const bad =
        !!stage?.querySelector(".art-fallback") ||
        images.some((image) => image.complete && !image.naturalWidth);
      if (bad) {
        record("action", "failed");
        setFailed(true);
      }
      const ratio = stage ? (visible.get(stage) ?? 0) : 0;
      if (ratio > 0 && images.some((image) => decoded.has(image)))
        record("action", "partial");
      const moving = stage
        ?.getAnimations({ subtree: true })
        .some(
          (animation) =>
            animation.playState === "running" &&
            animation.effect?.getTiming().iterations !== Infinity,
        );
      if (
        ratio >= 0.95 &&
        !bad &&
        images.length >= Object.keys(frame.world.entities).length &&
        images.every((image) => decoded.has(image)) &&
        !moving
      )
        record("action", "shown");
      const wordRatio = words.current ? (visible.get(words.current) ?? 0) : 0;
      if (wordRatio > 0) record("words", "partial");
      if (wordRatio >= 0.95) record("words", "shown");
      const ready = recorded.has("action:shown") && recorded.has("words:shown");
      if (ready) setSeen(true);
      else if (!(bad && recorded.has("words:shown")))
        frameId = requestAnimationFrame(check);
    }
    // Allow React's new layout and CSS transitions to start before testing the presented frame.
    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(check);
    });
    return () => {
      alive = false;
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [step, request, taskId, assets.epoch]);
  useEffect(
    () => () => {
      if (!ended.current)
        current.current.send(
          {
            action: "help",
            task: taskId,
            value: "demo",
            request,
            phase: "cancelled",
            step: current.current.step,
          },
          true,
        );
    },
    [request, taskId],
  );
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) close();
    };
    window.addEventListener("resize", close);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [close]);
  return (
    <Modal title="看看小猫怎样做" close={close}>
      <p className="micro">示范小舞台 · 你的物品留在原处</p>
      <div className="lesson-stage" ref={panel} data-lesson-step={step}>
        {Object.values(frame.world.entities).map((e) => {
          const target = e.id === frame.target;
          const placed = e.location.kind === "relation";
          const inside =
            e.location.kind === "relation" && e.location.relation === "in";
          return (
            <div
              key={e.id}
              className={`lesson-entity ${target ? "lesson-target" : "lesson-source"} ${placed ? "lesson-placed" : ""} ${inside ? "lesson-inside" : ""}`}
              data-lesson-entity={e.id}
              data-word={e.word}
              data-location={
                e.location.kind === "relation" ? e.location.relation : "stage"
              }
            >
              {e.kind === "actor" ? (
                <CharacterArt pose={step === 2 ? "action" : "idle"} />
              ) : e.word === "bag" ? (
                <Visual id="bag-open" label="打开的背包" />
              ) : (
                <Art
                  word={e.word}
                  paper={e.kind === "token" && e.word === "cat"}
                />
              )}
            </div>
          );
        })}
      </div>
      <div ref={words}>
        <p className="lesson-caption" role="status">
          {frame.caption}
        </p>
        <div className="lesson-chunks" lang="en">
          {frame.chunks.map((chunk, i) => (
            <span className={i === frame.highlight ? "highlight" : ""} key={i}>
              {chunk}
            </span>
          ))}
        </div>
      </div>
      {failed && (
        <p role="alert">
          示范图像没有加载完成。可以先退出，或
          <button onClick={assets.retry}>重试图像</button>。
        </p>
      )}
      <button
        className="primary"
        disabled={!seen}
        onClick={() => {
          if (step < frames.length - 1) {
            setSeen(false);
            setStep(step + 1);
          } else {
            const r = send(
              {
                action: "help",
                task: taskId,
                value: "demo",
                request,
                phase: "completed",
                step,
              },
              true,
            );
            if (["valid", "done"].includes(r.kind)) {
              ended.current = true;
              close();
            }
          }
        }}
      >
        {step < frames.length - 1 ? "看看下一步" : "我来试试"}
      </button>
      <button onClick={close}>先回去试试</button>
    </Modal>
  );
}
