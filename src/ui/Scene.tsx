import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Cue } from "../game/shell.ts";
import { Art, CharacterArt, NAMES, Visual } from "./Art.tsx";
export { Art, CharacterArt, AssetContext, NAMES } from "./Art.tsx";
import type { Adventure } from "../game/adventure.ts";
import {
  accessible,
  availableTargets,
  availableWords,
  board,
  occluded,
} from "../game/adventure.ts";
import type { Location, Entity } from "../domain/world.ts";
import { usePointerDrop } from "./pointer.ts";
import { SCENES } from "../content/adventure.ts";
export function Scene({
  session,
  selected,
  onSelect,
  onWord,
  onMove,
  onMiss,
  response,
  pose = "idle",
  disabled = false,
  children,
  cue,
}: {
  session: Adventure;
  selected: string | null;
  onSelect: (id: string) => void;
  onWord: (id: string) => void;
  onMove: (source: string, target: Location) => void;
  onMiss: () => void;
  response: string;
  pose?: "idle" | "thinking" | "action" | "happy";
  disabled?: boolean;
  children?: ReactNode;
  cue?: Cue | null;
}) {
  const surface = useRef<HTMLElement>(null);
  const b = board(session),
    e = b.world.entities;
  const place = (source: string, key: string | null) => {
    if (disabled) return;
    const target = availableTargets(session, source).find((t) => t.key === key);
    if (target) onMove(source, target.target);
    else onMiss();
  };
  const pointer = usePointerDrop(place, disabled, surface);
  useEffect(() => {
    pointer.cancel();
  }, [session.mode, b.scene, b.world.revision, b.bagOpen]);
  const moving = pointer.ghost?.label ?? selected;
  const targets = moving ? availableTargets(session, moving) : [];
  const choose = (id: string) => {
    if (disabled) return;
    const target = selected && targets.find((t) => t.key === id);
    if (target) onMove(selected!, target.target);
    else onSelect(id);
  };
  const positions: Record<string, [number, number]> = {
    "cat-companion": [
      b.scene === "trail" && b.world.flags.includes("crossed-ink") ? 80 : 16,
      b.scene === "trail" && b.world.flags.includes("crossed-ink") ? 30 : 47,
    ],
    "bag-main": [45, b.scene === "trail" ? 22 : 38],
    "route-sheet": b.scene === "meadow" ? [16, 73] : [80, 80],
    "hat-main": [32, 72],
    "cat-card":
      b.scene === "trail" && b.world.flags.includes("crossed-ink")
        ? [18, 20]
        : [79, 28],
    "picnic-mat": [70, 73],
    "craft-mat": [12, 64],
    "craft-hat": [48, 76],
  };
  const name = (item: Entity) =>
    item.id === "cat-card" && item.word === "cat"
      ? "小猫纸偶"
      : item.id === "route-sheet" && item.word === "mat"
        ? "纸张垫子"
        : item.id === "picnic-mat"
          ? "野餐垫"
          : item.id.startsWith("craft-")
            ? `备用${NAMES[item.word]}`
            : NAMES[item.word];
  function renderEntity(item: Entity, childIndex = 0, childCount = 1) {
    if (!accessible(b, item.id)) return null;
    const l = item.location,
      target = targets.find((t) => t.key === item.id);
    const children = Object.values(e).filter(
      (x) => "targetId" in x.location && x.location.targetId === item.id,
    );
    const onTop = children.filter(
      (x) => x.location.kind === "relation" && x.location.relation === "on",
    );
    const inside = children.filter(
      (x) => x.location.kind === "relation" && x.location.relation === "in",
    );
    const hats = children.filter((x) => x.location.kind === "worn");
    const [x, y] =
      l.kind === "zone" ? [54, 64] : (positions[item.id] ?? [50, 75]);
    const style =
      l.kind === "worn"
        ? { left: "62%", top: "14%" }
        : l.kind === "relation"
          ? l.relation === "in"
            ? {}
            : {
                left: `${((childIndex + 1) * 100) / (childCount + 1)}%`,
                top: "42%",
              }
          : { left: `${x}%`, top: `${y}%` };
    return (
      <div
        key={item.id}
        data-motion-id={item.id}
        data-feedback={
          cue?.entity === item.id
            ? cue.kind
            : item.id === "cat-companion" && cue?.kind === "cross"
              ? "cross"
              : undefined
        }
        className={`entity-anchor anchor-${item.word} ${item.kind === "actor" ? "anchor-actor" : ""} ${l.kind === "worn" ? "anchor-worn" : l.kind === "relation" ? `anchor-${l.relation}` : ""} ${l.kind === "zone" ? "anchor-road" : ""}`}
        style={style}
      >
        <button
          className={`quest-object ${item.kind === "actor" ? "quest-cat" : ""} ${item.word === "mat" ? "quest-mat" : ""} ${l.kind === "worn" ? "quest-worn" : ""} ${selected === item.id ? "selected" : ""} ${target ? "legal-target" : ""} ${pointer.ghost?.label === item.id ? "drag-origin" : ""} ${target && pointer.ghost?.target === item.id ? "drop-hover" : ""}`}
          data-entity={item.id}
          data-word={item.word}
          data-location={
            l.kind === "relation" ? `${l.relation}:${l.targetId}` : l.kind
          }
          data-drop={item.id}
          aria-label={name(item)}
          aria-pressed={selected === item.id}
          disabled={disabled}
          onPointerDown={(ev) => pointer.start(ev, item.id)}
          onClick={() => pointer.click(() => choose(item.id))}
        >
          {item.kind === "actor" ? (
            <CharacterArt pose={hats.length ? "idle" : pose} />
          ) : (
            <span className="object-art">
              <Art word={item.word} paper={item.id === "cat-card" && item.word === "cat"} />
              {cue?.kind === "transform" && cue.entity === item.id && cue.from && (
                <span className="morph-previous" key={cue.id} aria-hidden="true">
                  <Art word={cue.from} paper={item.id === "cat-card" && cue.from === "cat"} />
                </span>
              )}
            </span>
          )}
          <span className="item-label">
            {name(item)}
            {l.kind === "relation"
              ? l.relation === "in"
                ? " · 包内"
                : " · 垫上"
              : l.kind === "worn"
                ? " · 戴着"
                : ""}
          </span>
          {item.id === "bag-main" && (
            <small className="bag-state">
              {b.bagOpen ? "袋口开着" : "袋口合着"}
            </small>
          )}
        </button>
        {onTop.map((child, index) => renderEntity(child, index, onTop.length))}
        {hats.map((child) => renderEntity(child))}
        {b.bagOpen && inside.length > 0 && (
          <div className="bag-contents" aria-label="背包里面">
            {inside.map((child) => renderEntity(child))}
          </div>
        )}
      </div>
    );
  }
  return (
    <section
      ref={surface}
      tabIndex={-1}
      inert={disabled}
      className={`quest-scene scene-${b.scene} ${b.bagOpen ? "bag-open" : ""}`}
      aria-label="故事场景"
      data-drop-surface="world"
      data-scene={b.scene}
      data-crossed={b.world.flags.includes("crossed-ink")}
      data-dragging={!!pointer.ghost || undefined}
    >
      <Visual
        id={`scene-act-${SCENES[b.scene].act}`}
        label={SCENES[b.scene].title}
        className="quest-background"
      />
      <p className="cat-speech">
        {response ||
          (b.scene === "trail" && !b.world.flags.includes("crossed-ink")
            ? "喵…爪子会沾上湿墨。有什么能铺过去？"
            : "点点我和身边的东西，看看能做什么。")}
      </p>
      <div className="world-canvas">
        {b.scene === "trail" && (
          <button
            className={`quest-ink ${targets.some((t) => t.key === "ink-road") ? "legal-target" : ""}`}
            data-drop="ink-road"
            onClick={() =>
              moving ? place(moving, "ink-road") : onSelect("ink-road")
            }
            aria-label="湿墨小径"
          >
            {b.world.flags.includes("crossed-ink") ? "已到对岸 ✓" : "湿墨小径"}
          </button>
        )}
        {Object.values(e)
          .filter(
            (item) =>
              item.location.kind === "stage" || item.location.kind === "zone",
          )
          .map((item) => renderEntity(item))}
        {occluded(b, "cat-card") && (
          <div className="covered-brim" aria-label="背包后露出的小帽檐">
            <Art word="cap" />
            <span>露出一点帽檐…</span>
          </div>
        )}
        {availableWords(session).map((t) => (
          <button
            key={t.id}
            className="missing-object"
            style={{
              left: `${positions[t.entity][0]}%`,
              top: `${positions[t.entity][1]}%`,
            }}
            onClick={() => onWord(t.id)}
            data-word-entity={t.entity}
            aria-label={t.purpose}
            disabled={disabled}
          >
            {t.id === "wake" ? (
              <CharacterArt pose="thinking" />
            ) : (
              <Art word={t.word} />
            )}
            <span>{t.purpose}</span>
          </button>
        ))}
        {moving && targets.some((t) => t.key === "ground") && (
          <button
            className="ground-target legal-target"
            data-drop="ground"
            onClick={() => place(moving, "ground")}
          >
            放回地面
          </button>
        )}
      </div>
      {children}
      {pointer.ghost && e[pointer.ghost.label] && (
        <div
          ref={pointer.ghostRef}
          className="drag-ghost object-ghost"
          aria-hidden="true"
        >
          {e[pointer.ghost.label].kind === "actor" ? (
            <CharacterArt />
          ) : (
            <Art word={e[pointer.ghost.label].word} />
          )}
        </div>
      )}
    </section>
  );
}
