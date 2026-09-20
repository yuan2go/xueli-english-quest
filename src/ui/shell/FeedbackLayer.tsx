import type { CSSProperties } from "react";
import type { Cue } from "../../game/shell.ts";
import type { WordId } from "../../domain/world.ts";
import { Art } from "../Art.tsx";
export type Flight = {
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  word: WordId;
};
/** Render-only copies can disappear at any time; neither cue nor geometry is a save input. */
export function FeedbackLayer({
  cue,
  flight,
}: {
  cue: Cue | null;
  flight: Flight | null;
}) {
  if (!cue) return null;
  const story = ["arrive", "cross", "celebrate"].includes(cue.kind);
  return (
    <div
      key={`${cue.id}-${cue.kind}`}
      className={`presentation cue-${cue.kind}`}
      data-cue={cue.kind}
      aria-hidden="true"
    >
      {flight && (
        <div
          className="motion-object"
          style={
            {
              left: flight.x,
              top: flight.y,
              width: flight.width,
              height: flight.height,
              "--dx": `${flight.dx}px`,
              "--dy": `${flight.dy}px`,
            } as CSSProperties
          }
        >
          <Art word={flight.word} />
        </div>
      )}
      {cue.kind === "transform" && (
        <div className="morph-ribbon">
          <span>{cue.from}</span>
          <b> → </b>
          <span>{cue.to}</span>
          <small>还是同一张纸</small>
        </div>
      )}
      {story && (
        <div className="story-ribbon">
          <span>
            {cue.kind === "cross"
              ? "爪子干干的，过来了！"
              : cue.kind === "celebrate"
                ? "我们的野餐，开始啦！"
                : "新的地方，新的发现"}
          </span>
        </div>
      )}
    </div>
  );
}
