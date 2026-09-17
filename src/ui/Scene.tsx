import { createContext, useContext, useEffect, useState } from "react";
import type { WordId } from "../domain/world.ts";
import type { Step } from "../content/story.ts";
import type { Session, Input } from "../game/session.ts";
import { assetPath, assetPathById } from "../content/assets.ts";
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
    <img src={assetPath(word)} alt="" draggable={false} onError={() => setBroken(true)} />
  );
}

function CharacterArt({ happy = false }: { happy?: boolean }) {
  const assets = useContext(AssetContext);
  const id = happy ? "cat-happy" : "cat";
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [assets.epoch, id]);
  if (broken || assets.failed.includes(id)) return <Art word="cat" fail />;
  return <img className="character-art" src={assetPathById(id)} alt="" draggable={false} onError={() => setBroken(true)} />;
}

export function Scene({ session, step, submit, onMiss, reveal = false, cue, cuePhase = 2, projection, disabled = false }: {
  session: Session;
  step?: Step;
  submit: (input: Input) => void;
  onMiss: () => void;
  reveal?: boolean;
  cue?: FeedbackDefinition;
  cuePhase?: number;
  projection?: { word: WordId; rest: boolean; repeated: boolean } | null;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const assets = useContext(AssetContext);
  const place = (source: string, target: string | null) => {
    if (disabled) return;
    if (!target) { onMiss(); return; }
    const [id, relation] = target.split(":");
    submit({ source, target: id, relation });
    setSelected(null);
  };
  const pointer = usePointerDrop((source, target) => {
    if (step?.type === "place") place(source, target);
  });
  const entities = Object.values(session.world.entities);
  const act = step?.act ?? 3;
  const sceneId = `scene-act-${act}`;
  const targets = sceneTargets(session.world, act);
  const arrived = session.events.some((event) => event.correct && event.stepId === "s11");
  const mapReady = session.world.entities["route-sheet"]?.word === "map";
  const sceneFailed = assets.failed.includes(sceneId);
  const happyCompanion = !!cue;

  return (
    <section className={`scene production-scene act-${act} ${session.world.flags.includes("crossed-ink") ? "crossed" : ""} ${projection?.rest ? "cat-rest" : ""}`} data-performance={cue?.kind} data-performing-entity={cue?.entityId} data-cue-phase={cue ? cuePhase : undefined} aria-label="故事场景">
      {!sceneFailed && <img className="scene-background-image" src={assetPathById(sceneId)} alt="" aria-hidden="true" draggable={false} />}
      <div className="scene-vignette" aria-hidden="true" />
      <p className="scene-caption">{act === 1 ? "从一页空白，走向一场野餐。" : act === 2 ? session.world.flags.includes("crossed-ink") ? "小猫过来了，小径留在身后。" : "换一个字母，让地图变成能过河的垫子。" : "把故事里的物品，放回故事里。"}</p>
      {mapReady && <span className="map-direction">{arrived ? "✓ 地图终点：野餐地" : session.world.flags.includes("crossed-ink") ? "地图指向 → 树荫与草地" : "地图指向 → 林间小径"}</span>}
      {cue && <p className="scene-response" role="status">{cue.response}</p>}
      {projection && (
        <div className={`scene-projection ${projection.rest ? "rest-projection" : ""}`} role="status">
          <Art word={projection.word} />
          <p>{projection.rest ? projection.repeated ? "还是 mat。听听词尾，再改一格。" : "“可以休息了吗？”这是 mat 的想象，还不是路线图。重听，再改词尾。" : `这是 ${projection.word} 的想象，也是故事里的单词；这次再听听另一件物品。`}</p>
        </div>
      )}
      {act === 2 && (
        <button className="ink-road" disabled={disabled || step?.type !== "place" || !targets.some((target) => target.entityId === "ink-road")} data-drop={targets.find((target) => target.entityId === "ink-road")?.id} onClick={() => { if (selected && step?.type === "place") place(selected, "ink-road:across"); }} aria-label="湿墨小径">
          {session.world.flags.includes("crossed-ink") ? "✓ 已走过的小径" : "把垫子铺到湿墨上"}
          {session.world.entities["route-sheet"]?.location.kind === "zone" && <span className="road-mat"><Art word="mat" /></span>}
        </button>
      )}
      <div className="scene-objects">
        {entities.filter((entity) => entity.location.kind === "stage").map((entity) => {
          const children = entities.filter((candidate) => candidate.location.kind === "relation" && candidate.location.targetId === entity.id);
          const name = entity.id === "cat-card" && entity.word === "cat" ? "小猫纸偶" : NAMES[entity.word];
          const region = targets.find((target) => target.entityId === entity.id);
          const isCompanion = entity.id === "cat-companion";
          return (
            <div key={entity.id} className={`object-wrap object-${entity.id}`}>
              <button disabled={disabled} className={`object ${selected === entity.id ? "selected" : ""} ${entity.kind === "token" ? "paper-token" : ""} ${isCompanion ? "companion-object" : ""}`} aria-label={name} aria-pressed={selected === entity.id} data-entity={entity.id} data-drop={region?.id} aria-description={region ? `放置目标：${region.label}。先选物品再点这里，或拖到这里。` : undefined} onPointerDown={(event) => { if (step?.type === "place") pointer.start(event, entity.id); }} onClick={() => pointer.click(() => {
                if (step?.type === "select") submit({ source: entity.id });
                else if (step?.type === "place") {
                  if (selected && region && selected !== entity.id) place(selected, region.id);
                  else setSelected(selected === entity.id ? null : entity.id);
                }
              })}>
                {isCompanion ? <CharacterArt happy={happyCompanion} /> : <Art word={entity.word} />}
                {cue?.kind === "try-hat" && isCompanion && <span className="try-hat-prop" aria-label="短暂试戴，不改变物品位置"><Art word="hat" /></span>}
                {entity.word === "mat" && children.length > 0 && <span className="on-mat">{children.map((child) => <span key={child.id}>{child.id === "cat-companion" ? <CharacterArt happy={happyCompanion} /> : <Art word={child.word} />}<small className="sr-only">{NAMES[child.word]}在上面</small></span>)}</span>}
                <span>{reveal ? entity.word : name}</span>
                {selected === entity.id && <small>已选中 ✓</small>}
                {step?.type === "place" && region && <small className="region-label">{region.label} · {region.relation}</small>}
              </button>
              {entity.word === "mat" && children.length > 0 && <span className="placement-caption">{children.map((child) => NAMES[child.word]).join("、")}在垫子上面</span>}
              {children.length > 0 && entity.word !== "mat" && <div className="placed inside" aria-label={`${name}里面的物品`}>{children.map((child) => <div key={child.id}><Art word={child.word} /><small>{NAMES[child.word]}在里面</small></div>)}</div>}
            </div>
          );
        })}
      </div>
      {step?.type === "place" && !disabled && <p className="placement-lesson" role="status">{selected ? "已选物品。点场景中的目标位置，也可以重新选择。" : "先点要移动的物品，再点场景目标；也可直接拖过去。落空不会扣分。"}</p>}
      {entities.length === 0 && <div className="empty-cat"><CharacterArt /><span>等待你的第一个单词</span></div>}
      {pointer.ghost && <div className="drag-ghost" style={{ left: pointer.ghost.x, top: pointer.ghost.y }}>放到目标处</div>}
    </section>
  );
}
