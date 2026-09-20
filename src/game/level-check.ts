import { transition } from "../domain/world.ts";
import { RuleError } from "../domain/spatial.ts";
import type { Action, SpatialWorld } from "../domain/spatial.ts";
import { puzzle, QUEST_PACK } from "../content/quest.ts";
import { goalSatisfied } from "./quest.ts";
import type { QuestBoard } from "./quest.ts";
/** Controlled finite enumeration through the production kernel. No goal or success injection. */
export function checkLevel(
  level: string,
  strategy: "step" | "hole" | "any" = "any",
  variant = 0,
  budget = 25000,
) {
  const spec = puzzle(level, variant);
  const goal = (world: SpatialWorld) =>
    goalSatisfied({ level, variant, world } as QuestBoard);
  const key = (world: SpatialWorld) =>
    JSON.stringify([
      Object.values(world.entities).sort((a, b) => a.id.localeCompare(b.id)),
      [...world.created].sort(),
    ]);
  const allowed = (w: SpatialWorld): Action[] => {
    const actions: Action[] = [];
    // Size choices and spatial intentions are finite content actions; no solver-only effects.
    for (const q of spec.rules.quotas)
      if (!w.entities[q.id] && strategy !== "hole")
        actions.push({ type: "create", word: q.word });
    for (const e of Object.values(w.entities)) {
      const a = spec.rules.types[e.word];
      if (a.resize)
        for (const size of ["small", "normal", "big"] as const) {
          if (
            size === e.size ||
            (strategy === "step" && e.word === "cat" && size === "small") ||
            (strategy === "hole" && e.word !== "cat")
          )
            continue;
          actions.push({ type: "resize", source: e.id, size });
        }
      if (
        (a.container || spec.rules.handles.some((h) => h.door === e.id)) &&
        !e.open
      )
        actions.push({ type: "open", source: e.id, open: true });
      if (!a.fixed) {
        for (const n of spec.rules.nodes)
          if (e.place.kind !== "node" || e.place.id !== n.id)
            actions.push({
              type: "move",
              source: e.id,
              to: { kind: "node", id: n.id },
            });
        for (const t of Object.values(w.entities))
          if (t.id !== e.id) {
            if (spec.rules.types[t.word].support)
              actions.push({
                type: "move",
                source: e.id,
                to: { kind: "on", id: t.id },
              });
            if (spec.rules.types[t.word].container && e.word !== "cat")
              actions.push({
                type: "move",
                source: e.id,
                to: { kind: "in", id: t.id },
              });
          }
      }
    }
    return actions;
  };
  // Search prioritizes unmet physical goals, but accepts every legal resulting state.
  const score = (w: SpatialWorld) =>
    spec.goals.reduce((n, g) => {
      const e = w.entities[g.id];
      if (g.type === "relation")
        return (
          n + (e?.place.kind === g.kind && e.place.id === g.target ? 0 : 5)
        );
      if (g.type === "delivered")
        return (
          n +
          (e?.place.kind === "in" ? 0 : 4) +
          (e && JSON.stringify(e.place).includes(g.node) ? 0 : 2)
        );
      return n + (e?.place.kind === "node" && e.place.id === g.node ? 0 : 3);
    }, 0) + (w.entities.gate && !w.entities.gate.open ? 8 : 0);
  const queue = [{ world: spec.initial, trace: [] as Action[], order: 0 }],
    seen = new Set([key(spec.initial)]);
  let explored = 0,
    order = 0;
  while (queue.length && explored < budget) {
    queue.sort(
      (a, b) =>
        score(a.world) +
          a.trace.length * 0.25 -
          (score(b.world) + b.trace.length * 0.25) || a.order - b.order,
    );
    const item = queue.shift()!;
    explored++;
    if (goal(item.world))
      return {
        pack: QUEST_PACK,
        level,
        variant,
        strategy,
        status: "PASS" as const,
        explored,
        budget,
        reason: "goal-reached",
        witness: item.trace,
        world: item.world,
      };
    for (const action of allowed(item.world)) {
      try {
        const result = transition(item.world, {
            expectedRevision: item.world.revision,
            action,
            rules: spec.rules,
          }),
          k = key(result.world);
        if (seen.has(k)) continue;
        seen.add(k);
        queue.push({
          world: result.world,
          trace: [...item.trace, action],
          order: ++order,
        });
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
      }
    }
  }
  return {
    pack: QUEST_PACK,
    level,
    variant,
    strategy,
    status: "UNKNOWN" as const,
    explored,
    budget,
    reason: queue.length ? "budget-exhausted" : "enumeration-exhausted",
    witness: [],
  };
}
