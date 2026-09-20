# Immersive Game UI Implementation Plan

> For agentic workers: Execute this approved plan inline, task by task. User has authorized implementation; additional design/execution confirmation is unnecessary.

**Goal:** 把正式页面改为可直接操作的整屏绘本冒险。

**Architecture:** App 保留命令/存档/音频协调；GameChrome 提供标题/HUD，Scene 提供安全物品区及选中行动定位；Letters/SentenceBuilder 继续使用原提交函数。工具和菜单都是临时 UI，世界只有现有 transition 路径。

**Tech Stack:** React 19、TypeScript、Vite、原生 CSS、现有 Playwright。

## Global Constraints

- 基线 52fac621e6e81f6f645f6574096b937cd050b872；只在 codex/immersive-game-ui-05 工作。
- 不新增依赖/Provider；保存 cat-companion 与 route-sheet 身份、schema 4 和学习证据规则。
- 主操作至少 44px，字母至少 48px；360×640 竖屏与短横屏可操作。
- 正常探索整屏；工具内允许滚动；无永久侧栏；有界反馈和 reduced-motion。

## Task 1 · 游戏画面与场景行动

Files: `src/App.tsx`, `src/ui/GameChrome.tsx`, `src/ui/Scene.tsx`, `src/adventure.css`, `src/ui/tokens.css`.

- [ ] 新建 TitleScreen 与 GameHud 表现组件；接收现有 start/pause/mute 回调，HUD 只显示当前 scene/act。
- [ ] App 以 `.quest-layout.with-tool` 表达工具状态；使用 `data-tool` 支持短横屏布局。
- [ ] Scene 背景独立于 `.scene-world`；对象坐标继续基于世界实例，工具占用空间由 CSS 安全区给出。
- [ ] 选中行动传入 Scene 的 ReactNode，浮层按实际对象/区域矩形限制在场景内；ResizeObserver 响应工具和视口变化，清理观察器。
- [ ] 将目标、活动、制作和记录放入 `modal === "journal"`；底部行动调用原 actions，物品操作原 availableTargets。
- [ ] 工具只在 tool 存在时挂载；保留文字辅助、示范、重听、反馈与显式提交。工具布局按说明/操作分区，手机压缩间距而不缩小点击面积。
- [ ] `npm run typecheck` 确认组件/事件合同；通过浏览器截图检查标题、选中、工具是否符合全幅场景设计。

## Task 2 · 真实互动回归与响应式修复

Files: `tests/browser/helpers.mjs`, `tests/browser/story.spec.mjs`, `tests/browser/picnic.spec.mjs`, `tests/browser/game-screen.spec.mjs`.

- [ ] 截图路径改到 `docs/evidence/immersive-game-ui-05/`，避免覆盖历史证明。
- [ ] 活动与制作测试从“探险手记”真实打开，不直接调用应用状态。
- [ ] 添加布局回归：正常首页 → 唤醒 → 选物 → 关闭行动 → 开背包；检查场景覆盖视口、工具展开后角色与提交可见、关闭不改世界。
- [ ] 多视口实际点击与组句；保留原真实拖动/取消/三幕/六活动路径；视口边缘断言允许整屏场景恰好到边界。
- [ ] 执行 `npm test`、`npm run typecheck`、`npm run build`、`npm run check:resources`、`npm run test:browser`；仅对实际失败或新修改重跑相关检查。

## Task 3 · 合同与交付

Files: `docs/03-ux-art-audio.md`, `docs/STATUS.md`, `docs/README.md`, `README.md`, `docs/evidence/immersive-game-ui-05/README.md`.

- [ ] 03 将旧左右栏/上下堆叠的当前说明改成整屏 HUD/工具/手记合同，避免两个现行规范。
- [ ] STATUS 记录基线、实现、确切命令/结果、浏览器证据、未运行项与后续真实设备/教学审核边界。
- [ ] `git diff --check`；本地 commit；保留体验服务和浏览器入口；不推送、不创建 PR。
