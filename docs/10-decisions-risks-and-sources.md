# 10 · 有效决策、风险与来源

2026-09-20 / Refoundation 06。来源说明事实，取舍说明本项目设计判断；参考作品的口碑、宣传和示例均不是本游戏趣味或教学证据。

## 决策记录

| 决策 | 结论与后果 |
| --- | --- |
| D06-01 应用边界 | 保留名称/仓库/一个 Web 应用；重做主玩法而非新建平行 Demo |
| D06-02 主要乐趣 | 创造性场景解谜；选择、组合、后果与再尝试，不是英语小游戏合集 |
| D06-03 语言作用 | 有限造物、属性词义、可执行指令、观察描述；不把描述句当魔法命令 |
| D06-04 真实规则 | 尺寸、可达性、开合、支撑、容纳必须改变合法行为，不能用动画 flags 冒充 |
| D06-05 核心重构 | 允许改 Domain/Application/Save；旧 SHELL-05 的核心不改约束不再适用于新包 |
| D06-06 技术栈 | 继续 React/TS/Vite、一个确定性写入链；无测量/实际需求不换引擎 |
| D06-07 内容范围 | 3 主关 + 1 回访 + 工坊/词语册仅为本包范围；旧六词/三幕不是全局限制 |
| D06-08 旧身份 | 原故事 map→mat→铺路→map 和主角/纸偶分离保持；新尺寸属性不改变角色身份 |
| D06-09 记录与恢复 | 撤销不洗掉帮助；旧档不映射新通关；新规则显式版本化 |
| D06-10 AI/安全 | AI 用于实际开发制作；运行时本地判定，不新建 AI 平台，不收集儿童个人数据 |
| D06-11 授权 | 本次直接 main 仅限文档；后续实现默认独立分支/PR，部署与外部服务核对授权 |
| D06-12 质量状态 | 工程、视觉、真机、教研、趣味与发布分开；本次设计不等于已完成游戏 |

旧设计与交付保存在 Git 基线及 archive 原文快照。历史来源/证据不能覆盖以上有效决定；变化时维护本表和对应合同，不另加冲突的总蓝图。

## 参考作品与采用范围

- [Scribblenauts Unlimited 官方 Steam](https://store.steampowered.com/app/218680/Scribblenauts_Unlimited/)：创造物体、赋予属性并解决问题。采用“先给问题、再选工具”；不复制开放世界、角色或素材。
- [Baba Is You 官方 Steam](https://store.steampowered.com/app/736260/Baba_Is_You/)：通过可操作词块改变规则。采用有限规则的组合；其规则语言不是自然英语教材。
- [Noun Town 官方 Steam](https://store.steampowered.com/app/2313720/Noun_Town_Language_Learning/)：语言学习、探索与小游戏结合。采用“语言用于行动”的组织，不复制小镇/经营/语音识别系统。
- [Letter Quest 官方 Steam](https://store.steampowered.com/app/373970/Letter_Quest_Grimms_Journey_Remastered/)：前序调研的拼词回合挑战参考；本轮不引入战斗装备。未在此次文档提交中重新试玩。
- [English K1 Run](https://github.com/TeacherEvan/English-K1Run)：前序读取的触控优先 React/TS/Vite 游戏参考；借鉴输入/音频组织，不整库搬迁。其 README/许可/版本须在实际代码复用时重新核对。
- [Words of Wonders 原型](https://github.com/mertmcd/Words-of-Wonders)：前序检查到字母连线与 pointer 交互，采用手感思路，不把固定词表原型当完整课程或直接生产底座。
- [JavaScript Baba 民间复刻](https://github.com/slwulf/baba-is-you)：仅机制研究，非官方授权素材来源，不默认允许代码/素材复用。

Scribblenauts、Baba、Noun Town 官方页面在 2026-09-20 文档整理时重新读取；未做购买、安装、手机实测或教学效果验证。上述采用与舍弃是设计决策，不是已证实的效果排序。GitHub 可见不等于所有附带资源均可复用；代码许可、图像、音乐、商标各自核对。

## 工程依据

基线为 [a9a62e3eb632781595b40171dfb442bf0fbbe55e](https://github.com/yuan2go/xueli-english-quest/tree/a9a62e3eb632781595b40171dfb442bf0fbbe55e)。包版本以该提交 package.json/lock 为准，代码差距详见 12；不声称已验证该基线的运行状态。

[Vite 静态部署](https://vite.dev/guide/static-deploy.html)说明 dist/base 与 preview 边界；[Codex AGENTS.md 指南](https://developers.openai.com/codex/guides/agents-md/)作为项目指令入口参考，执行权限以实际工具/用户授权为准。原有 [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) 和 [媒体自动播放](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) 参考在涉及兼容性实现时再核对，不把初始化说明当本轮真机证据。

用户在会话中给出的比赛信息作为产品范围背景，未独立验证赛事，也不意味着可以公开公司课件或声线。仅记录工作需要的截止时间，不复制内部公告原文、奖项金额或个人信息。

## 风险与处理

| 风险 | 可观察信号 | 处理 |
| --- | --- | --- |
| 换皮答题 | 只有预设句子触发预设演出，没有可用替代办法 | R1 先证明两种机制解法，失败先改核心循环 |
| 属性是装饰 | big 后通道/支撑判定完全不变 | 同规则正反例与跨对象检查 |
| 逻辑瞬移 | 拖物越墙、远处把手可直接开 | 单一可达性与搬运守卫，视图不写坐标事实 |
| 模型复杂失控 | ECS/物理/AI 后台先于可玩关卡 | 限制规则、离散空间，按实际需求拆模块 |
| 学习被绕开 | 固定颜色/槽位可作答；提示后标独立 | 独立条件变体和单调帮助记录 |
| 语言误教 | 描述当指令、短句误判、指代不清 | 有限句法规则、语义/世界分层及教研 |
| 新旧档损坏 | 改枚举后旧日志无法重放且被覆盖 | 版本化、原文备份/导出、精确 fixture，不猜进度 |
| 未审核资源发布 | check:release 被移除或审核者虚构 | 保持发布阻断；工程与内容验收分开 |
| 多 agent 冲突 | 同时改 core/lock 或强推 main | 单负责人、独立 worktree/PR、读取最新 SHA |
| 只做文档/核心 | 没有正式入口和完整章节 | A/B/C 明确交付，不能以类图/求解器替代 UI 游戏 |

正式素材、录音、教研人员、真实设备/儿童观察条件和托管权限尚须真实核验。只阻断对应验收，不阻断其余独立工程工作。
