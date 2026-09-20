import { puzzle, LEXICON, EXERCISES, QUEST_PACK } from "./quest.ts";
import { IMAGES, ALL_AUDIO } from "./manifest.ts";
import { assertSpatial } from "../domain/spatial.ts";
import { parseLanguage } from "../game/language.ts";
/** A finite authored pack fails as a whole; it is never partially loaded. */
export function validateQuestContent() {
  const fail = (message: string): never => {
    throw new Error(`Quest content: ${message}`);
  };
  if (new Set(LEXICON.map((l) => l.id)).size !== LEXICON.length)
    fail("duplicate lexeme");
  for (const l of LEXICON) {
    if (
      !IMAGES.some((a) => a.id === l.asset) ||
      !ALL_AUDIO.some((a) => a.text === l.word) ||
      !ALL_AUDIO.some((a) => a.text === l.example)
    )
      fail(`missing lexical resource ${l.word}`);
    if (
      parseLanguage(l.example).status !== "valid" ||
      l.contentVersion !== QUEST_PACK.version
    )
      fail(`invalid lexical example ${l.word}`);
  }
  for (const id of ["R1", "R2", "R3", "R1-R", "workshop"])
    for (const variant of [0, 1]) {
      const spec = puzzle(id, variant),
        r = spec.rules,
        nodeIds = new Set(r.nodes.map((n) => n.id));
      if (
        nodeIds.size !== r.nodes.length ||
        r.nodes.some(
          (n) =>
            !Number.isFinite(n.x) ||
            !Number.isFinite(n.y) ||
            n.x < 0 ||
            n.x > 100 ||
            n.y < 0 ||
            n.y > 100 ||
            n.clearance < 1 ||
            n.clearance > 3,
        )
      )
        fail(`invalid geometry ${id}`);
      assertSpatial(spec.initial, r);
      for (const e of r.edges)
        if (
          !nodeIds.has(e.a) ||
          !nodeIds.has(e.b) ||
          (e.door && !spec.initial.entities[e.door]) ||
          e.clearance < 1 ||
          e.clearance > 3
        )
          fail(`invalid path ${id}`);
      for (const h of r.handles)
        if (
          !nodeIds.has(h.node) ||
          !spec.initial.entities[h.door] ||
          h.height < 1
        )
          fail(`invalid handle ${id}`);
      for (const q of r.quotas)
        if (
          spec.initial.entities[q.id] ||
          !r.types[q.word] ||
          r.types[q.word].actor ||
          !nodeIds.has(q.node)
        )
          fail(`invalid creation ${id}`);
      for (const word of spec.words)
        if (!LEXICON.some((l) => l.word === word)) fail(`unknown lexeme ${id}`);
      for (const e of Object.values(spec.initial.entities))
        if (!IMAGES.some((a) => a.id === e.word))
          fail(`missing entity visual ${id}`);
      for (const g of spec.goals) {
        if (!spec.initial.entities[g.id]) fail(`missing goal source ${id}`);
        if (g.type === "at" && !nodeIds.has(g.node))
          fail(`missing goal node ${id}`);
        if (g.type === "relation" && !spec.initial.entities[g.target])
          fail(`missing goal target ${id}`);
      }
      if (spec.request && !ALL_AUDIO.some((a) => a.text === spec.request))
        fail(`missing request audio entry ${id}`);
    }
  for (const e of Object.values(EXERCISES))
    if (e.requires.some((w) => !LEXICON.some((l) => l.word === w)))
      fail(`unknown exercise prerequisite ${e.id}`);
  return true;
}
