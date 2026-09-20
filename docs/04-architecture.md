# 04 · 技术架构

一个 React/TypeScript/Vite 应用，一个确定性 `domain/world.transition`。正式入口 `main.tsx → App → GameShell`。没有第二套正式游戏状态；隔离教学态只演示，不推进玩家世界。输入/资源细节见 12，玩法和证据合同见 02/05。

## 唯一执行链

Pointer/Keyboard → scoped interaction adapter → 显式 Adventure Intent → `runAdventure` 核对 session/revision/mode/attempt → 内容语义及世界守卫 → 同一 `domain.transition` → 原子提交 world/facts/events/journal → goals 投影 → presentation cue。

`App` 只接会话保存/恢复、外层 Start/Review、暂停/重开/帮助和资源生命周期。`GameShell` 组合持续 `Scene`、`GameHUD`、按需 `ContextTool` 和 `FeedbackLayer`。工具关闭后恢复世界空间，提交后不自动接下一题；成人记录独立，Ending 保留真实布置并提供回顾入口。

## 模块边界

| 模块 | 责任 |
| --- | --- |
| `domain/world.ts` | 身份、位置、包含/占用、角色保护；独立于 DOM/React/平台 |
| `content/adventure.ts` / `sentences.ts` | 故事、手工活动变体、有限词块/语义/配额；版本化内容及组句范式 |
| `content/encounters.ts` | 稳定场景 encounter ID、邀请、句子对应对象和角色反应；不自行判完成 |
| `game/adventure.ts` / `sentences.ts` | 命令、幂等/revision、守卫、句子语义、目标和证据；帮助曝光、技能观察与回访关系 |
| `game/shell.ts` | `sceneModel/resolveTool/presentation` 纯投影：现有可用任务映射到对象/工具；提交前后映射到有限反馈，不写世界 |
| `ui/Scene.tsx` / `ui/pointer.ts` | 递归关系物品、局部布局、可见命中与统一手势；合法目标仍用应用层试算 |
| `ui/shell/*` | HUD、上下文工具、焦点与表现；字母/词块草稿局部持有 |
| `platform/useAssets.ts` / `content/assets.ts` | 单一 manifest 的 critical/scene/lazy 调度、校验/失败重试/取消 |
| `platform/adventure-save.ts` / `audio.ts` | schema 5 重放/投影核验、旧档备份导出；单一可取消语音通道 |

`availableTargets` 在克隆世界无副作用试算；点击和拖动使用同一 Intent。旧 `content/story`、`game/session`、旧 save/summary/feedback 和回归仅供历史日志兼容；`initialPicnic` 仍用于既有活动初始构造。旧 Experience/Picnic/ObjectButton 与三份旧 CSS 已删除。

## 三类状态

| 状态 | 所在位置 | 生命周期 |
| --- | --- | --- |
| committed | Adventure / Board | 世界、事实、目标投影、学习记录和日志；通过 schema 5 保存/重放 |
| UI interaction | GameShell / Letters / SentenceBuilder | 选中、工具、焦点和未提交草稿；暂停保留，收起工具放弃草稿，刷新重新观察 |
| ephemeral presentation | scoped pointer / FeedbackLayer | 拖影、命中高亮、移动几何、cue；暂停/后台/旋转/超时/跳过清除，不序列化 |

业务先提交，不等待 animationend。实体平移约 460ms，折叠变形 650ms；过路纸张 220ms 铺稳，小猫 1250ms 沿路径通过，字幕寿命与实体动作分开；reduced-motion 直接显示稳定终态。场景与关系位置来自世界投影，稳定实体表现只补视觉路径；不得出现飞行副本与终点物体双份可见。手势与语音回调按当前活动/工具生命周期清理，不成为第二条状态推进路径。

动作计划区分 source/actor/support/attachment/displaced。现有 DOM 实体原地 WAAPI 插值；新父子关系在父节点动画局部坐标换算，已有附属物跟随父节点。新动作先采当前呈现几何，再取消旧表现；跳过、旋转、后台、pagehide、卸载和 reduced-motion 落到最新 committed state。回调只清理动画。

`game/lesson.ts` 用同一 `domain.transition` 构造隔离教学帧；`TeachingDemo` 分别确认图像解码/动作落稳与 DOM 词块可见。正式世界不写演示动作；仅实际呈现与失败/取消进入帮助日志。
