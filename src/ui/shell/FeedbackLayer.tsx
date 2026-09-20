import type { Cue } from "../../game/shell.ts";
/** Render-only feedback can disappear at any time; a cue is never a save input. */
export function FeedbackLayer({
  cue,
}: {
  cue: Cue | null;
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
