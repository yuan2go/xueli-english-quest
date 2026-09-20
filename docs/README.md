# 项目与技术文档导航

版本：2026-09-20 / Gameplay Refoundation 06。当前文档为产品与运行合同；**已实现/已验证只看 STATUS 与绑定代码 SHA 的证据**。旧 SHELL-05 的核心不改约束和后续只做设备验收路线被新工作包取代；历史证据不删除，也不沿用为本轮 PASS。

| 文档 | 唯一职责 |
| --- | --- |
| [STATUS](STATUS.md) | 当前代码基线、交付状态、实际检查和限制 |
| [01 产品与范围](01-product-and-scope.md) | 名称、对象、应用边界、本包范围与非目标 |
| [02 玩法与章节](02-gameplay-and-levels.md) | 核心规则、R1/R2/R3/回访、不同解法与旧包不变量 |
| [03 交互/美术/音频](03-ux-art-audio.md) | 触屏、场景、焦点、角色、素材、音频与降级 |
| [04 架构](04-architecture.md) | 分层、技术栈、唯一状态链与重构边界 |
| [05 内容/运行/恢复](05-content-and-runtime-contracts.md) | 内容、空间、指令、判定、证据、撤销与版本化 |
| [06 AI/安全](06-ai-workshop-and-security.md) | 开发期 AI、无运行时依赖、隐私和凭据 |
| [07 教学与审核](07-learning-quality-and-safety.md) | 学习序列、能力矩阵、支持口径、教研与儿童观察 |
| [08 验证与发布](08-test-release-and-operations.md) | G01–G12、必要测试、设备、内容/发布门槛 |
| [09 路线与协作](09-roadmap-and-agent-handoff.md) | 阶段、负责人、Git 权限与交付格式 |
| [10 决策/来源](10-decisions-risks-and-sources.md) | 有效取舍、风险、参考作品及事实边界 |
| [11 项目蓝图](11-web-game-product-blueprint.md) | 完整玩家体验与产品定型，不另立规则 |
| [12 技术设计](12-web-game-technical-design.md) | 最新基线代码差距、规则核、语言/恢复/表现实施映射 |
| [WP-GAMEPLAY-REFOUNDATION-06](work-packages/WP-GAMEPLAY-REFOUNDATION-06.md) | 当前完整实施范围、里程碑和验收 |
| [Codex 提示词](prompts/codex-gameplay-refoundation-06.md) | 精简执行入口；细节引用权威合同 |
| [历史 SHELL-05](work-packages/WP-WEB-GAME-SHELL-05.md) | 历史交付入口，不是当前待实施规格 |
| [设计说明](submission/design-description.md) | 提交材料，发布前按实际实现更新，不当作当前能力证明 |
| [AI 使用记录](submission/ai-usage-log.md) | 真实制作记录，不按计划编造 |

阅读顺序：README → STATUS → AGENTS/CLAUDE → 01/02/11 → 04/05/12 → 当前工作包；UI 必读 03，教学必读 07，验收必读 08。工程实施前再核对相关旧 Prompt/内容导航与实际入口，修正冲突后编码。

本次实施映射已回写 12；开工时差距保留为历史表。长期决定改 01/10；关卡改 02；协议改 05；工作状态改 STATUS/WP。不要复制一个“最终版蓝图2”与此索引并存。

旧 STATUS 与 SHELL-05 的完整原文分别保存在 [状态原文快照](archive/status-at-a9a62e3.md.txt) 和 [工作包原文快照](archive/wp-shell-05-at-a9a62e3.md.txt)。以 .txt 保留原始字节与原路径上下文，不把原文相对链接当新目录中的活动导航；可在 [基线 Git 树](https://github.com/yuan2go/xueli-english-quest/tree/a9a62e3eb632781595b40171dfb442bf0fbbe55e) 按原路径读取。其他历史工作包、evidence 与美术参考只供追溯。
