import { useEffect, useRef, useState } from "react";
import type {
  Adventure,
  AdventureResult,
  Intent,
} from "../../game/adventure.ts";
import { lessonFrames } from "../../game/lesson.ts";
import type { Tool } from "../../game/shell.ts";
import { localId } from "../../platform/id.ts";
import { Art, CharacterArt, Visual } from "../Art.tsx";
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
  const current = useRef({ send, step });
  current.current = { send, step };
  const ended = useRef(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    setSeen(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || document.hidden) return;
        current.current.send(
          {
            action: "help",
            task: taskId,
            value: "demo",
            request,
            phase: "shown",
            step,
          },
          true,
        );
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    if (panel.current) observer.observe(panel.current);
    return () => observer.disconnect();
  }, [step, request, taskId]);
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
      <button
        className="primary"
        disabled={!seen}
        onClick={() => {
          if (step < frames.length - 1) setStep(step + 1);
          else {
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
