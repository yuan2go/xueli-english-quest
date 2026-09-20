import { applySpatial } from "./spatial.ts";
import type { Action, SpatialRules, SpatialWorld, Motion } from "./spatial.ts";
export const WORDS = ["cat", "bag", "map", "mat", "hat", "cap"] as const;
export type WordId = (typeof WORDS)[number];
export type Location =
  | { kind: "stage" }
  | { kind: "zone"; id: "ink-road" }
  | { kind: "worn"; targetId: string }
  | { kind: "relation"; relation: "in" | "on"; targetId: string };
export interface Entity {
  id: string;
  word: WordId;
  kind: "actor" | "object" | "token";
  location: Location;
}
export interface World {
  revision: number;
  entities: Record<string, Entity>;
  flags: string[];
}
export type Effect =
  | { type: "spawn"; entity: Entity }
  | { type: "transform"; sourceId: string; to: WordId }
  | { type: "place"; sourceId: string; target: Location };
export type ErrorCode =
  | "STALE_REVISION"
  | "MISSING_ENTITY"
  | "DUPLICATE_ENTITY"
  | "INVALID_TRANSFORM"
  | "PROTECTED_ACTOR"
  | "INVALID_TARGET"
  | "TARGET_IN_USE"
  | "INVALID_WORLD";
export class DomainError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode) {
    super(code);
    this.code = code;
    this.name = "DomainError";
  }
}
function fail(code: ErrorCode): never {
  throw new DomainError(code);
}
export function isWord(value: string): value is WordId {
  return (WORDS as readonly string[]).includes(value);
}
export function singleLetterChange(from: string, to: string): boolean {
  return (
    from.length === to.length &&
    [...from].filter((letter, index) => letter !== to[index]).length === 1
  );
}
function entityAt(world: World, id: string): Entity {
  if (!Object.hasOwn(world.entities, id)) fail("MISSING_ENTITY");
  return world.entities[id];
}
function validLocation(world: World, source: Entity, location: Location): void {
  if (location.kind === "stage") return;
  if (location.kind === "worn") {
    const actor = entityAt(world, location.targetId);
    if (
      actor.kind !== "actor" ||
      !["hat", "cap"].includes(source.word) ||
      Object.values(world.entities).some(
        (e) =>
          e.id !== source.id &&
          e.location.kind === "worn" &&
          e.location.targetId === actor.id,
      )
    )
      fail("INVALID_TARGET");
    return;
  }
  if (location.kind === "zone") {
    if (location.id !== "ink-road" || source.word !== "mat")
      fail("INVALID_TARGET");
    return;
  }
  if (location.kind !== "relation") fail("INVALID_TARGET");
  const target = entityAt(world, location.targetId);
  if (target.id === source.id) fail("INVALID_TARGET");
  if (location.relation === "in") {
    if (target.word !== "bag" || source.kind === "actor")
      fail("INVALID_TARGET");
  } else if (location.relation === "on") {
    if (target.word !== "mat") fail("INVALID_TARGET");
  } else fail("INVALID_TARGET");
  // Walk parents, not render nodes: hidden contents must still obey containment rules.
  const visited = new Set([source.id]);
  let cursor = target;
  while (true) {
    if (visited.has(cursor.id)) fail("INVALID_TARGET");
    visited.add(cursor.id);
    if (cursor.location.kind !== "relation") break;
    if (source.kind === "actor" && cursor.location.relation === "in")
      fail("INVALID_TARGET");
    cursor = entityAt(world, cursor.location.targetId);
  }
}
/** Checks trusted, typed world invariants; not a parser for external JSON. */
export function assertWorld(world: World): void {
  if (!Number.isSafeInteger(world.revision) || world.revision < 0)
    fail("INVALID_WORLD");
  if (
    world.flags.some((flag) => flag !== "crossed-ink") ||
    new Set(world.flags).size !== world.flags.length
  )
    fail("INVALID_WORLD");
  for (const [id, entity] of Object.entries(world.entities)) {
    if (
      !/^[a-z][a-z0-9-]{0,63}$/.test(id) ||
      entity.id !== id ||
      !isWord(entity.word) ||
      !["actor", "object", "token"].includes(entity.kind)
    )
      fail("INVALID_WORLD");
    if (entity.kind === "actor" && entity.word !== "cat") fail("INVALID_WORLD");
    validLocation(world, entity, entity.location);
  }
}
/** Deterministic world effects only. The game layer must also enforce step/answer ownership. */
function transitionPicnic(
  world: World,
  command: {
    expectedRevision: number;
    effect: Effect;
    mode?: "story" | "picnic";
  },
): World {
  assertWorld(world);
  if (command.expectedRevision !== world.revision) fail("STALE_REVISION");
  const next = structuredClone(world);
  const effect = command.effect;
  switch (effect.type) {
    case "spawn": {
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(effect.entity.id))
        fail("INVALID_WORLD");
      if (Object.hasOwn(next.entities, effect.entity.id))
        fail("DUPLICATE_ENTITY");
      next.entities[effect.entity.id] = structuredClone(effect.entity);
      break;
    }
    case "transform": {
      const source = entityAt(next, effect.sourceId);
      if (source.kind === "actor") fail("PROTECTED_ACTOR");
      const pair = `${source.word}:${effect.to}`;
      if (
        command.mode === "picnic" &&
        (source.location.kind !== "stage" ||
          !["route-sheet", "cat-card"].includes(source.id))
      )
        fail("TARGET_IN_USE");
      if (
        !singleLetterChange(source.word, effect.to) ||
        !(
          pair === "map:mat" ||
          pair === "mat:map" ||
          (pair === "cat:cap" && source.kind === "token") ||
          (command.mode === "picnic" &&
            pair === "cap:cat" &&
            source.id === "cat-card" &&
            source.kind === "token")
        )
      ) {
        fail("INVALID_TRANSFORM");
      }
      if (
        Object.values(next.entities).some(
          (entity) =>
            entity.location.kind === "relation" &&
            entity.location.targetId === source.id,
        )
      )
        fail("TARGET_IN_USE");
      next.entities[source.id] = {
        ...source,
        word: effect.to,
        location: { kind: "stage" },
      };
      break;
    }
    case "place": {
      const source = entityAt(next, effect.sourceId);
      if (
        command.mode === "picnic" &&
        effect.target.kind !== "stage" &&
        Object.values(next.entities).some(
          (e) =>
            e.location.kind === "relation" && e.location.targetId === source.id,
        )
      )
        fail("TARGET_IN_USE");
      validLocation(next, source, effect.target);
      next.entities[source.id] = {
        ...source,
        location: structuredClone(effect.target),
      };
      // This is an authored story effect. A session runner must restrict who can issue it.
      if (
        effect.target.kind === "zone" &&
        source.id === "route-sheet" &&
        !next.flags.includes("crossed-ink")
      )
        next.flags.push("crossed-ink");
      break;
    }
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
  next.revision += 1;
  assertWorld(next);
  return next;
}

/** The only domain write entry. Historical picnic commands retain their exact rules. */
type PicnicCommand = { expectedRevision: number; effect: Effect; mode?: "story" | "picnic" };
type RescueCommand = { expectedRevision: number; action: Action; rules: SpatialRules };
export function transition(world: World, command: PicnicCommand): World;
export function transition(world: SpatialWorld, command: RescueCommand): { world: SpatialWorld; motions: Motion[] };
export function transition(world: World | SpatialWorld, command: PicnicCommand | RescueCommand) {
  if ('rules' in world && 'action' in command) {
    if (world.revision !== command.expectedRevision) throw new DomainError('STALE_REVISION');
    return applySpatial(world, command.action, command.rules);
  }
  if (!('rules' in world) && 'effect' in command) return transitionPicnic(world, command);
  throw new DomainError('INVALID_WORLD');
}
