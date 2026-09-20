# WP-ANIMATED-PLAY-LEARNING-06 · 动画化世界、趣味交互与可信学习证据

本包是唯一有效实施清单；用户 2026-09-20 已授权清理后直接实施、提交推送新分支并新建 PR，不合并。唯一实现负责人 Codex。01–05/07/11/12 维护合同，本文件记录实施顺序和实际验收，不新建并行蓝图。

**Goal:** 正式首页到结局完整接入有动作意义的世界、六个可重玩情境与保守的学习观察。
**Architecture:** App → GameShell → Adventure → 唯一 domain.transition。原子提交先于可取消表现。演示复制隔离 Board 并调用同一 transition，不写正式 facts、奖励或存档世界。
**Tech stack:** 现有 React/TypeScript/Vite、Pointer Events、Web Animations、单一 manifest；不新增依赖、后台或引擎。

## 全局约束

基线 `a9a62e3eb632781595b40171dfb442bf0fbbe55e`；借鉴 PR #11 tip `c57945c` 的已提交增量，原工作区不变。保留同一 route-sheet 的 map → mat → 铺路 → map；伙伴不可变形；白色定位器保持画面右颈且不镜像。演出不是业务输入，取消直接显最新事实。教学、音频、学习效果、资源权利和真机各自验收。

## 设计选择

采用现有 DOM 实体的稳定视觉节点与可取消动作计划，按 actor/source/target/support/attachments 区分。比第二层飞行复制更能消除双影，较新引擎更小且保留可访问输入。移动显示准备、路径、落稳；过路先铺纸再让猫通过。按需解码，drag ref+rAF，不把高频坐标写进 React。

学习沿既有 journal 增加版本化 exposure 和 skill observation，避免建立独立评估系统。组句明确 listen-rebuild / scene-compose / example-reproduce。任务说明不等于完整答案，帮助逐级显示并记录真正曝光；音频开始/完成/中断分别保存。历史原档保留，不推断旧曝光。

六活动沿原实例和能力开放深化：帽子选配产生遮阳/抗风反应；找物靠遮挡、开包和线索观察；小帮手让纸的两种用途与可逆布局决定行动顺序。情境变体固定，退出恢复主线。

## 顺序与验证

- [x] 读取仓库与远端，核对任务；先归档 WP05 状态，修订旧 PR、唯一 mat、组句和示范冲突。保留旧 decoder/素材来源/证据。
- [ ] **动作纵向实现**：`ui/pointer.ts` 合并帧；`game/shell.ts` 提交差异角色；`ui/Scene.tsx` 稳定实例；`ui/shell/useSceneMotion.ts` 取消/中断/支撑物先行；`ui/Art.tsx`/manifest 实际动作资产与姿态。测试正常播放过路至少三个采样、换帽/收纳/变形唯一实体、连续输入和生命周期取消。
- [ ] **教学与证据纵向实现**：`content/sentences.ts` 任务范式；`game/adventure.ts`/学习模块记录 objective、skills、曝光与回访；`platform/adventure-save.ts` 版本和旧档保护；`ui/shell/ContextTool.tsx` 逐级帮助；隔离演示组件使用 domain.transition。成人回顾显示具体观察与尚无独立回访。测示范不代答、情境无自动答案、播放失败/部分曝光和存档重放。
- [ ] **玩法与构图**：深化 `content/adventure.ts` 六变体、世界反馈和恢复；首页场景主体、工具缩短、结果来自玩家布置；多物品明确情境映射，错误保留草稿。
- [ ] **必要验证与修复**：`npm test`、`npm run typecheck`、`npm run typecheck:domain`、`npm run build`、`npm run check:resources`、`npm run check:release`；现有浏览器正常首页完整主线/六活动/异常，加教学/动作/保存回归。Phone/Tablet/Desktop、触控/键盘、后台/reduced-motion；无通关状态注入。相同 390×844 / Chromium / CPU 4x / 120 moves 三轮前后测量，完整 SHA 与脚本留证。
- [ ] **最后工程试玩和交付**：正常播放录屏/多时点样本；从儿童视角完整体验修复卡点，标明非儿童研究；有效文档与 STATUS 写实际命令、边界。提交、推送 `codex/animated-play-learning-06`、创建新 PR、不合并、不修改 Actions。

## 验收状态

实施中，以下均不得预填 PASS。外部素材权利、正式发音/教研、实体设备、目标儿童试玩为 NOT_RUN；资源 gate 保留。动作素材如不足仅阻断该动作资产，不阻断其他工程。最终源代码 SHA、动作资产尺寸/Alpha/锚点/来源、性能及测试记录将在实际完成后填入。
