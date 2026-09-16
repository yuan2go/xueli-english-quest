import { useEffect, useState } from "react";
import type { Step } from "../content/story.ts";
import type { Session } from "../game/session.ts";
import { repairs, summarize } from "../game/summary.ts";
import { NAMES, Art } from "./Scene.tsx";

export function RepairPages({
  session,
  expanded = false,
}: {
  session: Session;
  expanded?: boolean;
}) {
  return (
    <div
      className={`repair-pages ${expanded ? "expanded" : ""}`}
      aria-label="绘本修复"
    >
      {repairs(session).map((page) => (
        <details
          key={page.act}
          open={expanded || undefined}
          className={page.complete ? "repaired" : ""}
        >
          <summary>
            第 {page.act} 页 ·{" "}
            {page.complete
              ? "✓ 已修复"
              : `${page.items.filter((i) => i.complete).length}/${page.items.length} 处恢复`}
          </summary>
          <ul>
            {page.items.map((i) => (
              <li key={i.stepId} className={i.complete ? "restored" : ""}>
                {i.complete ? "✓" : "·"} {i.label}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
export function PracticeSummary({ session }: { session: Session }) {
  const summary = summarize(session);
  const types: Record<string, string> = {
    spelling: "拼写",
    substitution: "换字",
    "lexical-listening": "听词选择",
    "sentence-placement": "听句摆物",
    interaction: "铺路操作",
  };
  return (
    <section className="practice-summary">
      <h2>给陪伴者的练习摘要</h2>
      <p>
        换字不等于完整拼写。重听、落空和铺路不计语言错误。无提示记录只说明当时未暴露帮助；播放完成不代表听懂。没有独立复测的词，不能据此判断掌握。
      </p>
      {summary.groups.map((g) => (
        <p key={`${g.word}/${g.type}`}>
          <strong lang="en">{g.word}</strong> · {types[g.type]}：{g.attempts}{" "}
          次提交，{g.errors} 次需调整；教学 {g.teaching}，无提示且语音已开始{" "}
          {g.independent}，辅助 {g.assisted}，示范 {g.demo}，未确认音频{" "}
          {g.unverified}；重听 {g.replays}。
          {g.revisit.length > 0 &&
            `固定回访：${g.revisit.join("、")}（不是独立复测）。`}
        </p>
      ))}
      <h3>本局混淆</h3>
      {summary.confusions.length ? (
        <ul>
          {summary.confusions.map(([name, count]) => (
            <li key={name}>
              {name} · {count} 次
            </li>
          ))}
        </ul>
      ) : (
        <p>本局没有已提交的语言错误记录。</p>
      )}
    </section>
  );
}
/** Observable rehearsal only. Never calls submit, nor changes the player's draft. */
export function Demonstration({ step }: { step: Step }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((n) => Math.min(4, n + 1)), 650);
    return () => clearInterval(timer);
  }, [step.id]);
  return (
    <div className="demonstration" aria-label="操作示范" data-frame={frame}>
      {step.type === "spell" || step.type === "transform" ? (
        <div className="demo-slots" aria-label={`示范拼写 ${step.word}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={frame === i + 1 ? "demonstrating" : ""}>
              {step.type === "transform"
                ? i === 2 && frame < 2
                  ? step.from?.[i]
                  : i === 2 && frame === 2
                    ? "·"
                    : step.word[i]
                : frame > i
                  ? step.word[i]
                  : "·"}
            </span>
          ))}
        </div>
      ) : (
        <div className={`demo-move frame-${frame}`}>
          <span>
            <Art word={step.word} />
            {NAMES[step.word]}
          </span>
          {step.type === "place" && (
            <>
              <b>→</b>
              <span>
                {step.target?.kind === "zone"
                  ? "湿墨区域"
                  : step.target?.kind === "relation" &&
                      step.target.relation === "in"
                    ? "背包里面"
                    : "垫子表面"}
              </span>
            </>
          )}
        </div>
      )}
      <p role="status">
        {frame < 4
          ? step.type === "transform"
            ? "先取回词尾，再放入新字母；最后才施法。"
            : step.type === "spell"
              ? "看印块依次进入格子，填满后再施法。"
              : "先选物品，再选择场景目标。"
          : "现在轮到你。示范没有替你完成，请亲手试一次。"}
      </p>
    </div>
  );
}
