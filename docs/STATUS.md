# 项目状态 · WP-ANIMATED-PLAY-LEARNING-06

2026-09-20 开始实施。唯一负责人 Codex；独立分支 `codex/animated-play-learning-06`，worktree `/Users/yuan/.codex/worktrees/animated-play-learning-06/xueli-english-quest`。

baseline：刷新后默认分支 origin/main `a9a62e3eb632781595b40171dfb442bf0fbbe55e`。主工作区干净；其他工作区未改动。WP05 任务 idle；PR #9/#10 已合并，PR #11 OPEN，已推送动作增量为 `c57945c`。本包只在新分支继续，吸收经核对的动作实现；不修改已有 PR 或 Actions 开关。

## 读取与治理

已完整读取 AGENTS/CLAUDE、README、01–05、07–12、WP05 和动作追加计划，并核对正式 App/GameShell、world/adventure、句子、音频、存档、资源及测试。

已修正的冲突：独立组句自动播放答案；按钮点击即算示范；唯一 mat 假设；移动副本与真实实体同时显示；过路将纸与猫机械使用同一动画；PR #9 未合并和向旧 PR 追加的过时指令。前两项为本包待修复源码缺陷，不能宣称现有实现满足合同。旧 UI 只存历史证据，无第二正式入口。旧 decoder、素材来源、历史截图不删除。

唯一实施清单见 [WP06](work-packages/WP-ANIMATED-PLAY-LEARNING-06.md)。旧交付和免测试集成记录完整保存于 [historical WP05](archive/status-through-shell-05.md)，其 PASS 不代表本轮验证。

## 本轮检查

`npm ci` PASS（26 installed，0 vulnerabilities，lock 未变）；baseline `npm run build` PASS。其余本轮最终检查尚未执行，NOT_RUN。动作/性能基线正在从正常首页采集。

## 边界

素材权利、正式录音/听审、教研、实体设备、真实儿童试玩、公网部署 NOT_RUN；发布资源审核仍 PENDING。开发 TTS 不证明听懂；本包不调用 runtime Provider。工程实现、浏览器证据、动作素材、语义版本及交付 SHA 将在实际完成后更新。
