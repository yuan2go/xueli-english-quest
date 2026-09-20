# WP-WEB-GAME-SHELL-05 · 页面式应用 → Scene-first Web Game

## 唯一目标
在不重写已验证 Domain/Application/Save 的前提下，将正式 React 产品推进为持续场景、直接操控、上下文工具和游戏反馈统一的网页游戏表面。

## 开工前
1. 读取 README、STATUS、01–05、11、12、本工作包、AGENTS/CLAUDE 及实际代码。
2. 以代码证据核对文档；删除或归档已被当前合同覆盖、互相冲突、仍把固定 12 challenge/13 step 当正式产品约束的过期设计。历史交付证据可保留，但必须明确 historical，不得继续充当权威蓝图。
3. 清理重复 Demo、第二套资源清单、死 UI/样式和失效说明后再编码；不得破坏旧存档 decoder 和必要历史证据。

## 实现范围
- 建立唯一 Game Shell：Scene View + HUD + Context Tool + Feedback/Presentation Layer；Start/Pause/Ending/Review 保持独立表面。
- 场景在任务切换时持续存在；拼写、组句、听音、物品动作按情境展开，不再呈现为连续练习页。
- 点击/拖放/键盘统一进入 interaction adapter → Adventure Intent → 唯一 transition；UI 不直接写 world/goal。
- 强化直接操控：稳定命中区、pointer capture/cancel、click/drag 阈值、吸附/回退、遮挡/局部坐标、手机触控。
- 明确 committed / UI / ephemeral presentation 三类状态；动画不推进业务，不把逐帧表现写入存档。
- 建立内容驱动 encounter/tool/feedback 映射，消除散落 JSX 的流程判断；不要建设万能关卡编辑器。
- 完善选择、受阻、成功、变形、移动、角色反应和关键故事演出；reduced-motion 有稳定终态。
- 完善 desktop/tablet/phone 游戏布局，保证场景持续可见，工具不会把手机退化为表单页。
- 完善 critical/scene/lazy 资源加载、失败重试、音频激活/取消、visibility/rotation 恢复；失败不得回滚 committed world。
- 保持 schema/journal/replay/旧档保护语义；必要版本变更显式升级。
- 仅在代码证据证明需要时重构模块；不默认加入 Phaser/Pixi/Cocos、后端、PWA、账号、AI、经济/养成系统。
- 维护可访问键盘等价操作、focus、语义名称和 reduced-motion。

## 质量要求
采用生产级边界和错误处理，不做最小 Demo；同时拒绝无需求的通用框架和过度抽象。优先把现有能力完整接入唯一正式入口。视觉/交互必须围绕 Agency、Causality、Continuity、Manipulation、Juice、Recovery、Pacing、Replayability 做自检。

## 必要测试
保留并运行最少但高价值的 domain/application 回归；浏览器从正常入口实际走通完整主线、关键拖放/组句、刷新恢复、活动隔离、资源/存储失败，并覆盖至少 phone + tablet/desktop。检查 build/typecheck/resources。不得为了通过删除断言、降低发布门槛或注入预置通关状态。真机、教研、儿童试玩未执行时必须如实标记。

## 交付
更新权威文档、STATUS 和本工作包实际结果；记录 baseline/final SHA、关键设计变化、删除的过期设计、实际测试、未运行项、已知限制。提交并推送分支，创建 PR；除非执行时得到明确授权，不自动合并 main。

## 代码事实与实施清单（本包唯一执行计划）

基线 `9b20d629dd4a4472f33afff3b935597a47741771`；沿用已授权 11/12，未新增平行规格。

| 事实 | 权威设计 | 本包落点 |
| --- | --- | --- |
| App 982 行，常驻 action 列表和 JSX 流程分支 | 11 持续世界 / 12 Context Tool | GameShell、HUD、ContextTool；encounter/action 纯投影模块 |
| Scene 已按世界递归物品；pointer 缺 scope、lost capture、显式释放 | 03/12 输入 | 共用 scoped pointer adapter；词块加入拖入/重排/退回 |
| 手机始终一半场景一半表单 | 11 场景主体 | 无工具满世界，工具按需底部/侧边展开，局部滚动 |
| checkAssets 只用于失败重试，首次没有分级生命周期 | 05/12 资源 | critical/scene/lazy 调度，取消、失败/重试和低网 fallback |
| world/adventure/save 原子/重放链已存在 | 04/05 | 保持业务与 schema，不重写核心；新增表现仅消费提交前后 |

- [x] 文档治理先于实现：历史状态隔离；旧 WP/evidence 明示 historical；重写过期 03/06/08/09/10/prompts/submission/content 导航；清除未使用 Experience/Picnic/ObjectButton 和三份旧样式，保留旧档链和测试。
- [ ] Game Shell 纵向接入：内容映射、情境入口、工具焦点、连续场景；App 只接平台/会话和外层表面。
- [ ] 输入/表现：统一 pointer 命中边界，取消/释放/旋转；词块直接操控；提交前后 cue、有限演出、跳过/reduced-motion。
- [ ] 资源/生命周期：manifest 分组调度，错误/重试保留输入；音频/后台/旋转清理。
- [ ] 必要验证：npm ci/test/typecheck/typecheck:domain/build/check:resources/check:release；正式入口完整主线及六活动变体，拖放/组句/刷新/故障/多视口；复查儿童视角并修复。
- [ ] 同步实际结果与证据，检查无新冲突；提交/推送/PR，不合并。
