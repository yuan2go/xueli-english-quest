# 12 · 网页游戏技术与交互设计

版本：2026-09-20。本文是 04/05 的实现指导；领域事实仍以 05 为权威。

## 架构决策
当前采用 **React + TypeScript + Vite 的事件驱动单机网页游戏架构**。保留唯一确定性领域转换，不引入第二套游戏状态、不默认引入 Phaser/Pixi/Cocos、不增加后端。当前玩法是点击/拖放、拼写、组句、物品关系、有限演出和场景条件推进，尚无持续物理、自由角色控制或大规模逐帧实体模拟。

## 当前分层
Browser/App Shell 下分 Start/Pause/Ending/Review 与 Game Shell；Game Shell 由 Scene View、HUD、Context Tool、Feedback Layer、Accessibility 组成。Application 保持 Adventure Session；Domain 保持 world.transition；Content 保存 scenes/encounters/tasks/manifest；Platform 保存 save/replay/audio/assets/browser lifecycle。依赖方向 UI → Application → Domain；Domain 不依赖 React、DOM、Storage、Audio。

## Game Shell
**Scene View**：世界是第一视觉层并跨任务持续。实体位置由 committed world 投影；拖影、粒子、选中光晕不是领域事实。点击与拖放共用 intent/availableTargets；失败/取消恢复 committed world。

**HUD**：只显示当前情境必要信息、暂停、音量/重听和少量状态；不引入无价值的 XP、货币、任务列表。

**Context Tool**：由选中对象、encounter 和目标按需展开。拼写/组句/听音不是独立页面；关闭工具不改变已提交世界。手机采用底部 sheet/有界区域，桌面/Pad 可侧栏。

**Feedback Layer**：即时反馈约 100–250ms，关键动作约 300–900ms，少数故事演出更长。业务先提交，表现随后消费结果；禁止依赖 animationend 才保存。reduced-motion 直接投影终态。

## 状态模型
1. Committed game state：world、facts、scene、goals、journal、practice evidence，可重放/保存。
2. UI interaction state：selected entity、opened tool、focus、未提交字母/词块。
3. Ephemeral presentation state：drag ghost、animation phase、particle、hover、pressed，不进入存档。

React state 只承担需要 React 渲染的状态。未来若出现高频逐帧对象，不把每帧坐标灌入全局 React state。

## 命令与结果
所有改变世界或学习证据的输入转换为显式 intent，通过现有 adventure command 进入唯一执行链：Pointer/Keyboard → Interaction Adapter → Intent → runAdventure → guards/content semantics → world.transition → atomic commit → goals/evidence → presentation cue。世界阻挡不得被记录成英语错误。

## 内容驱动
Scene/Encounter/Task 使用稳定 ID。内容声明 prerequisites、completion conditions、relevant entities、available tools、language objective、semantic effect/observation、feedback cue、assets/audio、practice classification。不要把通关逻辑散落在 JSX。新增关卡原则上通过内容 + 可复用规则完成；只有新机制才扩展 Domain/Application。

## 资源与生命周期
唯一 manifest 继续作为资源入口。加载分 critical / scene / lazy；失败有 fallback/retry，retry 不重置世界。首次用户手势后激活音频；切后台停止瞬时演出和音频，恢复后以 committed state 重绘。首阶段不要求 Service Worker/PWA。

## 输入
统一 Pointer Events + Keyboard adapter：单 active pointer、pointer capture/cancel、click/drag 阈值、交互区 touch-action、旋转/visibility change 取消未提交拖动、键盘与点击产生同一 intent、语义名称和 focus ring。不使用桌面 HTML5 drag-and-drop 作为核心触控方案。

## 响应式
Desktop：Scene 主区 + Context Tool 侧区。Tablet：Scene 优先，工具按方向切换。Phone portrait：固定比例场景 + 底部工具，工具滚动不推动场景完全离屏。Phone landscape：限制 HUD 高度，优先可操作场景。360×640、390×844、768×1024、1024×768、1440×1000 为工程回归基准，不等于真机验收。

## 性能
不因架构升级引入重量级引擎；避免无关全树 rerender；world projection 使用稳定派生；图片按显示尺寸优化；动画优先 transform/opacity；listener/timer/audio/pointer capture 在切场景时清理。只有出现持续 60fps 模拟需求才建立帧循环专项预算。

## 存档
继续 command journal + projection verification。Game Shell 重构不得改变 journal 重放得到权威状态的原则。表现状态不进入 journal；内容/schema 改动显式版本化；未知/损坏存档保留原文。

## 测试策略
只保留高价值测试：Domain 不变量；Application 关键 encounter、幂等/revision、目标投影、活动隔离、保存重放；Browser 正常入口完整冒险、关键拖放/组句、刷新恢复、移动端和桌面/平板、资源/存储失败；关键 Game Shell 状态截图和无横向溢出。真机/儿童试玩独立记录。不要为 CSS 细节或私有函数堆单测，不删除失败断言换 PASS。

## 引擎升级门槛
只有出现连续自由移动/物理碰撞、大量精灵粒子、复杂镜头动画，或 DOM 场景经测量无法满足目标设备性能，才提 ADR 比较继续 DOM、PixiJS、Phaser/Cocos。若迁移，采用 renderer adapter 渐进切换；Domain/Application/Content/Save 不随渲染器重写。

## 实际模块与边界

落点见 04 的模块表。GameShell 不用旧 Step 伪装工具；Letters 接受有限 `LetterTask`，SentenceBuilder 保留唯一 token ID、拖入/排序/退回和键盘按钮。`sceneModel` 将 Adventure 的真实可用任务映射为对象相关邀请与出口，结束条件仍由 `complete/goals` 提供。

资源以唯一 manifest ID 分类：critical 为伙伴与当前背景；scene 为当前所需道具；lazy 为延迟姿态/草地欢呼图。未来背景不在首页预取；实际显示可立即按需请求。请求去重、成功缓存、卸载取消；失败显示 fallback，重试仅失败 ID，epoch 只重建图片，不重置工具/世界。没有 Service Worker 或第二份资源登记。

每个拖动表面限定命中 scope，捕获后仍以视口坐标命中当前可见元素；关系对象用父对象百分比局部定位。失去 capture、多指、旋转、后台和 Escape 都清理；释放 capture 不触发第二次提交。键盘 Enter/Space 不被上一拖动的合成 click 抑制。句尾有明确落点，已有词块是插入点。

Phone 未开工具时世界占满剩余视口；打开工具后世界至少保留主体区域，底部 sheet 最大约 45%，内部滚动，句子行保持可见便于拖入。窄横屏改侧栏。命中尺寸与遮挡通过实际回归检查，真机范围仍见 STATUS。
