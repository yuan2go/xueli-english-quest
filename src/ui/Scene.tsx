import { createContext, useContext, useEffect, useState } from "react";
import type { WordId } from "../domain/world.ts";
import type { Entity } from "../domain/world.ts";
import { shuffled } from "../game/random.ts";
import type { Step } from "../content/story.ts";
import type { Session, Input } from "../game/session.ts";
import { assetPath } from "../content/assets.ts";
import { usePointerDrop } from "./pointer.ts";
import { sceneTargets } from "../game/interaction.ts";
import type { FeedbackDefinition } from "../content/feedback.ts";
export const NAMES: Record<WordId, string> = {
  cat: "小猫",
  bag: "背包",
  map: "地图",
  mat: "垫子",
  hat: "宽檐帽",
  cap: "鸭舌帽",
};
export const AssetContext = createContext({ failed: [] as string[], epoch: 0 });
export function Art({ word, fail = false }: { word: WordId; fail?: boolean }) {
  const [broken, setBroken] = useState(false);
  const assets = useContext(AssetContext);
  useEffect(() => setBroken(false), [assets.epoch]);
  return broken || fail || assets.failed.includes(word) ? (
    <span className="art-fallback">
      {NAMES[word]}
      <small>图像暂不可用</small>
    </span>
  ) : (
    <img
      src={assetPath(word)}
      alt=""
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}
export function Scene({
  session,
  step,
  submit,
  onMiss,
  reveal = false,
  cue,
  cuePhase = 2,
  before,
  seed = 1,
  projection,
  disabled = false,
}: {
  session: Session;
  step?: Step;
  submit: (input: Input) => void;
  onMiss: () => void;
  reveal?: boolean;
  cue?: FeedbackDefinition;
  cuePhase?: number;
  before?: Entity;
  seed?: number;
  projection?: { word: WordId; rest: boolean; repeated: boolean } | null;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const place = (source: string, target: string | null) => {
    if (disabled) return;
    if (!target) {
      onMiss();
      return;
    }
    const [id, relation] = target.split(":");
    submit({ source, target: id, relation });
    setSelected(null);
  };
  const pointer = usePointerDrop((source, target) => {
    if (step?.type === "place") place(source, target);
  });
  const entities = shuffled(Object.values(session.world.entities), seed).map(
    (e) =>
      cue?.kind === "morph" && before?.id === e.id && cuePhase < 2 ? before : e,
  );
  const done = (id: string) =>
    session.events.some((e) => e.correct && e.stepId === id);
  const act = step?.act ?? 3;
  const targets = sceneTargets(session.world, act);
  const arrived = session.events.some((e) => e.correct && e.stepId === "s11");
  const mapReady = session.world.entities["route-sheet"]?.word === "map";
  return (
    <section
      className={`scene act-${act} ${session.world.flags.includes("crossed-ink") ? "crossed" : ""} ${projection?.rest ? "cat-rest" : ""}`}
      data-performance={cue?.kind}
      data-performing-entity={cue?.entityId}
      data-cue-phase={cue ? cuePhase : undefined}
      aria-label="故事场景"
    >
      <div className="scenery" aria-hidden="true">
        <span className="sun" />
        <span
          className={`tree tree-one repair-region ${done("s06") ? "restored" : ""}`}
        />
        <span
          className={`tree tree-two repair-region ${done("s07") ? "restored" : ""}`}
        />
        <span
          className={`trail repair-region ${done("s03") ? "restored" : ""}`}
        />
        <span
          className={`house repair-region ${done("s02") ? "restored" : ""}`}
        >
          ⌂
        </span>
        <span
          className={`picnic-patch repair-region ${done("s08") ? "restored" : ""}`}
        />
      </div>
      <p className="scene-caption">
        {act === 1
          ? "从一页空白，走向一场野餐。"
          : act === 2
            ? session.world.flags.includes("crossed-ink")
              ? "小猫过来了，小径留在身后。"
              : "一张纸，也能成为一条路。"
            : "把故事里的物品，放回故事里。"}
        {mapReady && (
          <span className="map-direction">
            {arrived
              ? "✓ 地图终点：野餐地"
              : session.world.flags.includes("crossed-ink")
                ? "地图指向 → 树荫与草地"
                : "地图指向 → 林间小径"}
          </span>
        )}
      </p>
      {cue && (
        <p className="scene-response" role="status">
          {cue.response}
        </p>
      )}
      {projection && (
        <div
          className={`scene-projection ${projection.rest ? "rest-projection" : ""}`}
          role="status"
        >
          <Art word={projection.word} />
          <p>
            {projection.rest
              ? projection.repeated
                ? "还是 mat。听听词尾，再改一格。"
                : "“可以休息了吗？”小猫趴下了。\n这是 mat 的想象，还不是路线图。重听，再改词尾。"
              : `这是 ${projection.word} 的想象，也是故事里的单词；这次再听听另一件物品。`}
          </p>
        </div>
      )}
      {act === 2 && (
        <button
          className="ink-road"
          disabled={
            disabled ||
            step?.type !== "place" ||
            !targets.some((t) => t.entityId === "ink-road")
          }
          data-drop={targets.find((t) => t.entityId === "ink-road")?.id}
          onClick={() => {
            if (selected && step?.type === "place")
              place(selected, "ink-road:across");
          }}
          aria-label="湿墨小径"
        >
          {session.world.flags.includes("crossed-ink")
            ? "✓ 已走过的小径"
            : "湿墨小径"}
          {entities.find((e) => e.id === "route-sheet")?.location.kind ===
            "zone" && (
            <span className="road-mat">
              <Art word="mat" />
            </span>
          )}
        </button>
      )}
      <div className="scene-objects">
        {entities
          .filter((e) => e.location.kind === "stage")
          .map((entity) => {
            const children = entities.filter(
              (e) =>
                e.location.kind === "relation" &&
                e.location.targetId === entity.id,
            );
            const name =
              entity.id === "cat-card" && entity.word === "cat"
                ? "小猫纸偶"
                : NAMES[entity.word];
            const region = targets.find((t) => t.entityId === entity.id);
            return (
              <div
                key={entity.id}
                className={`object-wrap object-${entity.id} ${entity.location.kind === "zone" ? "on-road" : ""}`}
              >
                <button
                  disabled={disabled}
                  className={`object ${selected === entity.id ? "selected" : ""} ${entity.kind === "token" ? "paper-token" : ""}`}
                  aria-label={name}
                  aria-pressed={selected === entity.id}
                  data-entity={entity.id}
                  data-word={entity.word}
                  data-drop={region?.id}
                  aria-description={
                    region
                      ? `放置目标：${region.label}。先选物品再点这里，或拖到这里。`
                      : undefined
                  }
                  onPointerDown={(e) => {
                    if (step?.type === "place") pointer.start(e, entity.id);
                  }}
                  onClick={() =>
                    pointer.click(() => {
                      if (step?.type === "select")
                        submit({ source: entity.id });
                      else if (step?.type === "place") {
                        if (selected && region && selected !== entity.id)
                          place(selected, region.id);
                        else
                          setSelected(
                            selected === entity.id ? null : entity.id,
                          );
                      }
                    })
                  }
                >
                  <Art word={entity.word} />
                  {cue?.kind === "try-hat" && entity.id === "cat-companion" && (
                    <span
                      className="try-hat-prop"
                      aria-label="短暂试戴，不改变物品位置"
                    >
                      <Art word="hat" />
                    </span>
                  )}
                  {entity.word === "mat" && children.length > 0 && (
                    <span className="on-mat">
                      {children.map((child) => (
                        <span key={child.id}>
                          <Art word={child.word} />
                          <small className="sr-only">
                            {NAMES[child.word]}在上面
                          </small>
                        </span>
                      ))}
                    </span>
                  )}
                  <span>{reveal ? entity.word : name}</span>
                  {selected === entity.id && <small>已选中 ✓</small>}
                  {step?.type === "place" && region && (
                    <small className="region-label">
                      {region.label} · {region.relation}
                    </small>
                  )}
                </button>
                {entity.word === "mat" && children.length > 0 && (
                  <span className="placement-caption">
                    {children.map((child) => NAMES[child.word]).join("、")}
                    在垫子上面
                  </span>
                )}
                {act === 2 && entity.id === "cat-companion" && (
                  <small className="bank-state">
                    {session.world.flags.includes("crossed-ink")
                      ? "已到对岸"
                      : "小径这边"}
                  </small>
                )}
                {children.length > 0 && entity.word !== "mat" && (
                  <div
                    className="placed inside"
                    aria-label={`${name}里面的物品`}
                  >
                    {children.map((child) => (
                      <div key={child.id}>
                        <Art word={child.word} />
                        <small>{NAMES[child.word]}在里面</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      {step?.type === "place" && !disabled && (
        <p className="placement-lesson" role="status">
          {selected
            ? "已选物品。点场景中的背包内部、垫子表面或湿墨区域；也可以重新选择。"
            : "先点要移动的物品，再点场景里的目标。也可直接拖过去；落空不会扣分。"}
        </p>
      )}
      {entities.length === 0 && (
        <div className="empty-cat">
          <Art word="cat" />
          <span>等待你的第一个单词</span>
        </div>
      )}
      {pointer.ghost && (
        <div
          className="drag-ghost"
          style={{ left: pointer.ghost.x, top: pointer.ghost.y }}
        >
          {session.world.entities[pointer.ghost.label]
            ? NAMES[session.world.entities[pointer.ghost.label].word]
            : "放到目标处"}
        </div>
      )}
      <span className="asset-note">原创临时纸片插画 · 待正式美术替换</span>
    </section>
  );
}
