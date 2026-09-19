import type { Entity } from "../domain/world.ts";
import type { PointerEvent, ReactNode } from "react";
import { Art, CharacterArt, NAMES } from "./Art.tsx";
/** Shared entity hit surface: IDs and semantic destinations survive art replacement. */
export function ObjectButton({
  entity,
  selected,
  onClick,
  onPointerDown,
  drop,
  children,
  word = entity.word,
}: {
  entity: Entity;
  selected: boolean;
  onClick: () => void;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  drop?: string;
  children?: ReactNode;
  word?: Entity["word"];
}) {
  const name =
    entity.id === "cat-card" && word === "cat"
      ? "小猫纸偶"
      : entity.id === "route-sheet" && word === "mat"
        ? "纸张垫子"
        : NAMES[word];
  return (
    <button
      className={`object ${entity.kind === "actor" ? "companion-object" : ""} ${entity.kind === "token" ? "paper-token" : ""} ${selected ? "selected" : ""}`}
      aria-label={name}
      aria-pressed={selected}
      data-entity={entity.id}
      data-word={word}
      data-drop={drop}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {entity.kind === "actor" ? <CharacterArt /> : <Art word={word} paper={entity.id === "cat-card" && word === "cat"} />}
      <span className="object-label">{name}</span>
      {children}
    </button>
  );
}
