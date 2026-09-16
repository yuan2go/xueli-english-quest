import { createContext, useContext, useEffect, useState } from "react";
import type { WordId } from "../domain/world.ts";
import type { Step } from "../content/story.ts";
import type { Session, Input } from "../game/session.ts";
import { assetPath } from "../content/assets.ts";
import { usePointerDrop } from "./pointer.ts";
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
}: {
  session: Session;
  step?: Step;
  submit: (input: Input) => void;
  onMiss: () => void;
  reveal?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const place = (source: string, target: string | null) => {
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
  const entities = Object.values(session.world.entities);
  const act = step?.act ?? 3;
  return (
    <section
      className={`scene act-${act} ${session.world.flags.includes("crossed-ink") ? "crossed" : ""}`}
      aria-label="故事场景"
    >
      <div className="scenery" aria-hidden="true">
        <span className="sun" />
        <span className="tree tree-one" />
        <span className="tree tree-two" />
        <span className="trail" />
        <span className="house">⌂</span>
      </div>
      <p className="scene-caption">
        {act === 1
          ? "从一页空白，走向一场野餐。"
          : act === 2
            ? session.world.flags.includes("crossed-ink")
              ? "小猫过来了，小径留在身后。"
              : "一张纸，也能成为一条路。"
            : "把故事里的物品，放回故事里。"}
      </p>
      {act === 2 && (
        <button
          className="ink-road"
          disabled={step?.mode !== "interaction"}
          data-drop="ink-road:across"
          onClick={() => {
            if (selected && step?.type === "place")
              place(selected, "ink-road:across");
          }}
          aria-label="湿墨小径"
        >
          {session.world.flags.includes("crossed-ink")
            ? "✓ 已走过的小径"
            : "湿墨小径"}
          {session.world.entities["route-sheet"]?.location.kind === "zone" && (
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
            return (
              <div
                key={entity.id}
                className={`object-wrap object-${entity.id} ${entity.location.kind === "zone" ? "on-road" : ""}`}
              >
                <button
                  className={`object ${selected === entity.id ? "selected" : ""} ${entity.kind === "token" ? "paper-token" : ""}`}
                  aria-label={name}
                  aria-pressed={selected === entity.id}
                  data-entity={entity.id}
                  onPointerDown={(e) => {
                    if (step?.type === "place") pointer.start(e, entity.id);
                  }}
                  onClick={() =>
                    pointer.click(() => {
                      if (step?.type === "select")
                        submit({ source: entity.id });
                      else if (step?.type === "place")
                        setSelected(selected === entity.id ? null : entity.id);
                    })
                  }
                >
                  <Art word={entity.word} />
                  {entity.word === "mat" && children.length > 0 && (
                    <span className="on-mat">
                      {children.map((child) => (
                        <span key={child.id}>
                          <Art word={child.word} />
                          <small>{NAMES[child.word]}在上面</small>
                        </span>
                      ))}
                    </span>
                  )}
                  <span>{reveal ? entity.word : name}</span>
                  {selected === entity.id && <small>已选中 ✓</small>}
                </button>
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
                {step?.type === "place" &&
                  step.mode !== "interaction" &&
                  (entity.word === "bag" || entity.word === "mat") && (
                    <div className="drop-options">
                      {["in", "on"].map((relation) => (
                        <button
                          key={relation}
                          data-drop={`${entity.id}:${relation}`}
                          aria-label={`${name}${relation === "in" ? "里面" : "上面"}`}
                          onClick={() => {
                            if (selected)
                              place(selected, `${entity.id}:${relation}`);
                            else onMiss();
                          }}
                        >
                          {relation === "in" ? "里面" : "上面"}{" "}
                          <span lang="en">{relation}</span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}
      </div>
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
          放到目标处
        </div>
      )}
      <span className="asset-note">原创临时纸片插画 · 待正式美术替换</span>
    </section>
  );
}
