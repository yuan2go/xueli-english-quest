# 04 · 技术架构与运行设计

## 1. 架构决策

一个轻量 React + TypeScript + Vite 应用，HTML/CSS/SVG 场景和必要动画。主线部署为静态文件；AI 工坊如实现在线功能，再增加一个小型同源服务。无需数据库、微服务、复杂消息总线、物理引擎或模型训练。

TypeScript 严格模式；npm 为唯一包管理器。初始化直接依赖写在 package.json；锁文件必须由真实安装生成，不能伪造 integrity。当前环境 registry DNS 不通，因此 build/依赖锁定是否完成由 STATUS 记录。初始化没有安装开发热刷新插件；需要时在工作包中有针对性增加，而不是重建工程。

## 2. 模块边界

| 目录/模块 | 责任 | 禁止依赖 |
| --- | --- | --- |
| src/domain | 词汇约束、物品状态、不变量、确定性转换 | React、DOM、网络、storage、音频 |
| src/game（后续） | 步骤状态机、判题、提示、学习事件 | Provider 的实时判断 |
| src/content（后续） | 已审核内容包、运行时结构校验与资源索引 | 任意模型代码执行 |
| src/ui（后续）/App | 场景、字母盘、触屏、可访问性 | 直接绕过命令修改权威世界 |
| src/platform（后续） | AudioService、存档、资源加载 | 学习正确性判定 |
| server/workshop（P1） | 鉴权、预算、模型调用、校验与草稿存储 | 儿童每步通关的依赖 |

括注后续的目录是目标结构，不必先创建空抽象层。当前初始化源码只提供领域不变量与开发验证页面；后续由同一条主线扩展。

## 3. 状态分层

WorldState 保存物品与位置、故事标记和 revision；GameSession 保存当前 packVersion/challengeId/stepId、阶段、已完成集合、输入草稿与学习记录；UIState 保存选中、拖影和动画；AudioState 由平台服务管理。

单一入口：UI command → 当前步骤和世界校验 → 原子状态变化＋学习事件 → 持久化 → UI/音频表现。不能由 CSS 动画回调直接发奖励或创建物品。

GameSession 阶段：loading → presenting → awaiting-input → evaluating → feedback → transitioning → awaiting-input/completed。错误从 feedback 回 awaiting-input；pause 是可恢复标记而非另一套游戏。evaluating 期间忽略或拒绝重复请求。动画用 effectId 与 stepId 绑定，过期回调不推进新步骤。

领域内核只验证世界转换不变量，不知道当前题答案；Game 层负责 expected answer 和 step ownership。不能只调用合法 transform 就跳过 s04b。通关必须来自 challenge 的全部步骤完成，而非数组下标被随意递增。

## 4. 命令一致性

生产命令包含 sessionId、stepId、attemptId、expectedRevision、type 和 payload。初始化内核已有 revision 守卫，完整去重与步骤守卫属于 WP-01/02。

判题错误不改变 WorldState；UI 落空不形成语言尝试。成功时原子变更世界、已完成集合与事件。相同 attemptId 重放返回原结果，不重复生成物品；同 ID 不同 payload 拒绝。旧 revision 和旧 stepId 拒绝。去重记录只保留本次会话需要的有界范围，不建设分布式事务系统。

变形保持 instanceId，替换 word 和形态并回到操作区；旧形态不能残留。非目标词的投影只在 UI。对已有物品再次生成是重复操作，而非免费复制。

## 5. 恢复与存档

首版可用 localStorage 小型 JSON 快照，schemaVersion + packId + packVersion + contentHash + lastCommittedStep + world + evidence。不要存拖影、音频对象、计时器或临时投影。

在已提交的原子步骤边界保存；s04a 后恢复仍需完成 s04b；s04b 已提交则 crossed-ink 保留，刷新后不再要求重复过路。动画恢复为提交后的稳定画面。保存失败不影响本次通关，但显示不能持久保存。

先检查 schema/content 版本和业务不变量再恢复。不同内容版本不按数组下标拼接旧状态；提供旧包继续（若可用）或确认重开。损坏存档不得导致白屏，也不得悄悄伪造已完成记录。至少保留一份最近合法快照或提供安全重开。

## 6. 性能与可靠性预算

以下为待测目标：首屏脚本 gzip 尽量低于 250 KB；首幕必需图片＋音频尽量低于 2 MB；正常操作可见反馈目标 100ms 内；移动端持续动画避免明显掉帧。实际结果需附设备、网络与测量方式，不能仅凭包体声称首开达标。

本地静态资源使用内容哈希缓存；HTML/发布清单短缓存。主线不从第三方字体/模型站点拉取必需资源。大陆移动网络与微信内置浏览器单独验证，不把 GitHub Pages 在开发机能打开当作评审一定可达。

首版不强制 Service Worker/PWA，避免缓存版本混乱。只有定义离线范围、更新提示和失效恢复后再做；“不依赖实时 AI”不等于首次断网可打开网站。

## 7. 托管与后续产品接入

Vite 构建 dist，部署静态 HTTPS 服务；base 路径必须支持子目录。初始化用相对 base；不要硬编码 /assets。正式部署由负责人选择可达的公司托管/CDN，Pages 可作为备选但不默认已配置。[Vite 官方部署资料见来源文档]

未来产品集成可接收 allowlisted wordIds、packId、学习模式，返回按题型区分的摘要。iframe/postMessage 必须校验 origin、消息类型和版本；原生 WebView 接口也要明确权限。不在参赛版预置真实用户登录、支付或未提供的内部接口。
