# WP-TABBY-ART-UI-CUTOVER-01

Initial baseline: `fbd322b1efd0ce13786af1d70ce0cccffc21d313`; latest `origin/main` merged at user request: `60c30f06d006a2a3b18818fc0f9beb1ab9fc87d8` via `451ef210348e91806e9222b8aaf28ee0301c143b`; reuse PR #5 identity commit `b1d64dafe085eeb379321fecd4d3d0bc5789273a`. Implement in `codex/tabby-art-ui-cutover-01`, isolated worktree; preserve domain/session/audio/save contracts.

## PAGE → STATE → ASSET

| Page | State | Assets |
| --- | --- | --- |
| Game | waiting / transform / placing | act 1/2/3 background; idle/action tabby; map, mat, bag, hat, cap |
| Game | correct / wrong / hint | same scene; action or thinking tabby; real changed entity / transient projection; DOM feedback |
| Start | new / saved | act 1, idle tabby; DOM book title and resume/restart |
| Tutorial | introduction / inline demonstration | idle/action tabby; actual letter controls and DOM instructions |
| Result / Picnic | completed / free play / activities | act 3, happy/idle tabby, actual entity arrangement |
| Pause / Progress / Recovery | overlay / records / failure | shared paper; DOM controls, no separate background image |

## Implementation sequence

1. Generate only missing individual references/assets using built-in imagegen and the verified tabby reference. Inspect alpha/dimensions; retain native masters, downsample runtime. Single authoritative `manifest.ts`; keep release review separate from visual use. Asset-only commit and push, read back hashes.
2. Integrate `Art`/`CharacterArt`/scene with manifest. Replace obsolete illustration files and scenery; rebuild formal `App` pages and CSS around a book spread. Preserve unique entity IDs, session and save versions. Neutral/thinking/action/happy mapped by actual state.
3. Run existing npm commands and HTTP Playwright journeys; add only asset retry/draft persistence/visual-cutover regressions. Review desktop/tablet/phone screenshots against page references, fix observed issues, commit UI then fixes. Push and PR; no merge.

Palette: paper #f5efdf, light paper #fffaf0, ink #254b3d, ochre #c89845, muted #636653. System Songti/Georgia headings, PingFang/system body, Arial lowercase letters. Book spread and paper print blocks are the signature; no dashboard cards, glow or visual effects without game meaning.

User's explicit implementation instruction supersedes skill approval checkpoints and multi-option exploration. The short sequence above is the working plan, not a separate audit deliverable. Validation and limitations are recorded in STATUS after execution.
