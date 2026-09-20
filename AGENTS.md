# Xueli English Quest — agent development contract

## Goal and authority

Build one touch-first children's English adventure puzzle game, not a learning-platform shell or a collection of disconnected minigames. Current target: **WP-GAMEPLAY-REFOUNDATION-06**. Read README.md, docs/STATUS.md, docs/README.md, the assigned package, and the relevant authoritative documents before coding. Product/scope: 01; levels/gameplay: 02; UX/assets: 03; architecture/contracts: 04/05; teaching: 07; acceptance: 08; synthesis and implementation mapping: 11/12.

Refoundation changes the primary gameplay, not merely the animations. Keep the repository and one application; replace unsuitable pages and domain/application/save structures where required. The old SHELL-05 restriction against core changes is historical, not an active constraint. Do not create a second demo, game state writer, sentence judge or resource manifest.

This documentation revision defines requirements, not completed capabilities. Current facts and exact-SHA checks belong in STATUS; old PASS reports are not current evidence. Do only the change-scope verification needed, then implement rather than repeating a whole-repository audit.

## Gameplay and teaching invariants

- Finite word creation, semantic properties, commands and observation must affect or describe the actual world. Size must affect traversal/support/containment; dragging proposes an action and cannot teleport through obstacles.
- Puzzle completion is derived from world goals, not a prescribed action sequence. The first core level requires two mechanically distinct solutions, not reordered scripts. Exercise language goals are separate from open puzzle goals.
- Commands may change the world; descriptions never do. Use finite authored grammar, token ownership and stable repeated-token IDs; handle short sentences, case/punctuation, reasonable declared variants and ambiguous references. Never judge correctness with an LLM.
- Preserve entity identity. cat-companion is not cat-card. The companion cannot be created again or transformed into an object; explicitly allowed size changes in the new pack keep the same actor identity.
- Preserve the original story's route-sheet map → mat → placed across ink/actual crossing → map chain and independent picnic-mat. Old six words/three acts are pack-specific, not global product limits.
- Teach new meaning before assessment. Guided, assisted, demonstrated, independent, exploration and revisit evidence remain distinct. Replays, incomplete input, failed drops, resource errors and world-blocked correct language are not language mistakes.
- Undo may restore world state but never erase historical help or attempts to claim independence. Goals, historical completion and learning evidence are distinct.

## Engineering constraints

- One React/TypeScript/Vite application and one deterministic transition path. Domain is independent of React, DOM, storage, audio and providers. UI emits commands; domain state drives rendering.
- Use finite spatial and content rules before considering a physics engine, ECS, new rendering engine, state framework or generic editor. Add dependencies only for a concrete need with actual lockfile installation/review.
- Reject stale commands, duplicate IDs, invalid references, cyclic containment, occupancy violations and partial effects. Commit compound actions atomically with replayable journal/evidence.
- Version content/rules/save changes. Preserve raw old/unknown/corrupt saves, verify backups, offer export, never infer new completion from old steps. Update decoder allowlists and export coverage together.
- Touch, click and keyboard equivalents must work. Handle pointer cancellation, rotation, backgrounding, focus, reduced motion and resource/storage failure. Animations never advance business state or gate saving.
- No keys in client code, VITE_* secrets, logs, files or screenshots. No child personal data, unauthorized company materials, arbitrary model HTML/JS/URLs or dynamic code execution.
- Runtime AI/provider work is out of scope. Lack of credentials blocks only separately authorized live work, not the local game. Label development TTS and fixtures honestly.

## Workflow

Inspect git status, branch, latest origin/main and related unmerged changes before work. Preserve unrelated edits. One implementation owner per package; another agent may review or perform non-overlapping work in a separate worktree. Coordinate shared content/domain/save contracts.

Read and retire conflicting active designs/prompts before coding. Retain historical evidence and needed decoders/fixtures. Update the existing authoritative documents, not parallel blueprints. Comments explain rationale and invariants, not narrated code.

Implement R1 end-to-end through the real entry first, then the complete assigned chapter/workshop/revisit scope. If the core still has no real choices, fix it before expanding content. Do not stop at a prototype or engine skeleton and mark the whole package complete.

Run relevant necessary behavior checks and the existing project commands. Build includes typecheck; avoid redundant runs where there is no change. Run domain/application/save regressions and real HTTP browser paths for affected behavior. Do not manufacture coverage with constants, massive snapshots, skipped failures or reduced release gates. Device, child, teaching and rights reviews are independent evidence.

This user's direct-main authorization applies to this documentation delivery only. Future implementation defaults to a separate branch, commits, push and PR; no auto-merge or force-push without fresh explicit authorization. Never overwrite concurrent changes or disable security/workflow controls.

## Handoff

Report baseline/final full SHA, branch/PR, actual changed behavior, command results and exit codes, exact-SHA browser evidence, remaining work and limitations. Unrun checks are NOT_RUN; unavailable conditions are BLOCKED. Engineering, visual completion, devices, fun, teaching and public release have separate readiness states. Never claim learning improvement, permanent mastery or production quality from code/tests alone.
