import { writeFileSync, mkdirSync } from "node:fs";
import { checkLevel } from "../src/game/level-check.ts";
const checks = [
  ["R1", "step"],
  ["R1", "hole"],
  ["R2", "any"],
  ["R3", "any", 0],
  ["R3", "any", 1],
  ["R1-R", "step"],
];
const results = checks.map(([level, strategy, variant = 0]) =>
  checkLevel(level, strategy, variant),
);
for (const r of results)
  console.log(
    `${r.level} variant=${r.variant} ${r.strategy}: ${r.status}, explored=${r.explored}/${r.budget}, ${r.reason}, actions=${r.witness.length}`,
  );
if (process.argv.includes("--write")) {
  mkdirSync("docs/evidence/gameplay-refoundation-06", { recursive: true });
  writeFileSync(
    "docs/evidence/gameplay-refoundation-06/witnesses.json",
    JSON.stringify(results, null, 2) + "\n",
  );
}
if (results.some((r) => r.status !== "PASS")) process.exitCode = 1;
