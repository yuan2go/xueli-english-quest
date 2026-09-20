# 12 · 技术设计与代码实施映射

Refoundation 06 技术设计与实施映射。开工前代码检查基线：`a9a62e3eb632781595b40171dfb442bf0fbbe55e`，默认分支 main，2026-09-20 读取。本节早期差距表保留为历史；当前实施映射见末节，实际检查只见 STATUS。必要契约见 04/05，验收见 08。路径指向本次已知结构，开工须核对最新代码而不是机械按旧行号修改。

## 1. 开工时的代码差距（历史）

| 位置/函数 | 已读取事实 | 新包需要改变什么 |
| --- | --- | --- |
| src/domain/world.ts / WORDS | 六词枚举；Entity 只有 id/word/kind/location；Effect 为 spawn/transform/place | 内容词表/原型引用、有限属性、开合与空间动作；旧六词只约束旧包 |
| world.ts / validLocation | zone 只认 ink-road；in 只认 bag；on 只认 mat | 用内容声明的容器、支撑、通道和交互条件取代全局词形特判 |
| world.ts / assertWorld | flags 只接受 crossed-ink；actor 只能为 cat；变形有实例与词对限制 | 通用实体完整性与规则集特定校验分开，保留旧包限制而非全删 |
| src/game/adventure.ts | availableWords/sentenceTasks/goals 和活动构造围绕三幕、教学事实、两种活动 variant | 关卡初态/世界目标与 ExerciseSpec 分离；新内容不继续复制分支树 |
| src/game/sentences.ts / parseSentence | 少于六词直接 incomplete；词表与正则限 Put/The…is…和 in/on | 各结构完整性独立；支持 Open/Close、属性描述、按审核开放的 Make；不误判短句 |
| sentences.ts / assemble/sameMeaning | 词块 ID 唯一检查和有限语义比较已存在 | 复用思想；增加任务归属、实体绑定/消歧和新语义，而非换唯一答案字符串 |
| src/platform/adventure-save.ts | schema 4/content 精确匹配；重放 runAdventure；字段/target 白名单；6000 条与 4,000,000 字符限制 | 新动作/位置需版本化 codec、白名单和 fixture；不能只改类型/版本号 |
| adventure-save.ts / exportRecords | 导出覆盖 wordspell.* 与 xueli.adventure.* 前缀 | 新 key 必须进入导出/清理/备份范围，旧档保留，不造成数据遗漏 |
| App/GameShell/Scene/pointer | 当前架构已有一个正式 Shell、三态分离和 scoped 输入 | 替换主玩法投影；真实实体路径/属性变化，不新建并行产品入口 |
| package.json | 包名仍为 xueli-wordspell；Node test runner 与现有脚本 | 包名仅是历史工程名，不代表仓库没改名；必要时单独一致性清理，不触发整栈重建 |

上表来自基线代码和对应合同读取，不代表本轮运行测试、完整安全审计或已验证所有未合并分支。精确基线代码可在 [Git 树](https://github.com/yuan2go/xueli-english-quest/tree/a9a62e3eb632781595b40171dfb442bf0fbbe55e) 查看。

## 2. 内容和世界的最小充分模型

保留 World/Entity/Command 等语义，可重命名或拆分实现。推荐结构能力为：

- 实体：稳定 id、lexeme/archetype、kind、有限 attrs、单一 location、实例状态和资源引用；属性/能力定义来自 ruleset。
- 空间：稳定节点/区域、连接、净空、支撑/高度、交互点和容器关系；场景百分比坐标只用于呈现，不直接判玩法。
- 关卡：pack/rulesVersion、initialWorld、goal predicates、tool permissions、creation quotas、exercise references、variant/seed。
- 运行会话：id/revision、active level/mode、各隔离会话、journal、帮助与语言事件、派生完成状态。

不把通用 ECS、物理系统、DSL 编译器或插件注册中心作为前置。只实现本包规则需要的数据类型和纯函数。内容定义可以用 TypeScript 或受校验 JSON，作者能力不等于要做可视化编辑器。

## 3. 单一规则核与搬运

将 canReach/canTraverse/canContain/canSupport/canResize/canInteract 一类查询实现为无副作用函数，供应用守卫、UI 候选与离线关卡校验共同使用。名称可变，但语义只能有一个权威实现。

点击/拖动对象到目标是一个 transport/place 意图：验证当前可见/可接触、操作者起点、路径、携带物净空、目标容量/支撑，再形成完整事务。不能让 DOM 坐标直接替换实体位置。门开启要求当前角色能到达正确把手；魔法属性工具可以按内容允许远程作用可见对象，但不因此授予远程搬运/开门权限。

尺寸改变应在同一事务检查实体所在空间、父容器和子树占用。可能造成悬空、内容丢失或穿透时拒绝，不自动消失、不静默挪动玩家物品。若需要新复合行为，明确 effects 顺序并验证完整后态，不在多个 React setState 间分散提交。

旧规则作为版本化 picnic ruleset 适配；同一 transition 选择已绑定规则。历史只读 decoder 不可成为第二条新玩法写入链。新 rescue ruleset 可以允许 cat-companion.resize，但不能允许 spawn/word-transform 主角。

## 4. 目标、语言与支持

PuzzleSpec 的 goal 读取世界和明确的游戏事实，不要求参考 witness 的逐步完成 flags。ExerciseSpec 的语言检查可以有情境目标；目标是否满足、表达是否成立、世界是否能执行是三个结果。

解析器按内容开放的结构匹配，不再先用全局词数阈值否定短句。输入规范化和 token 校验先行；两块 the 独立，重复 id/外来 task token 拒绝。有限语义至少包含 open/close/place/resize/observe；描述不能产生 effect。

先确定指代再执行：同词多实例要用预先选择、限定词或明确的内容绑定消歧；模糊时不择优猜测。outside 不等于错误英语；世界 blocked 保留正确语言与草稿。只有明确提交才生成语言尝试，撤销/重听/拖空不新增错词。

帮助维持评估窗口内单调支持；世界 undo 与证据不可互相覆盖。当前独立条件不足时，允许游戏继续但标记 assisted/unassessed。内容审核状态也不能由程序测试自动升级。

## 5. 撤销与恢复设计

使用现有 command journal 演进实现可重放撤销：撤销是新命令，回退完整的世界变更，revision 继续前进，不删除语言事件/支持。允许存储受限的前态/逆向信息作为校验辅助，不能信任任意用户提供的世界补丁。重放必须重新计算并核对。

明确本关 undo 边界、重开新会话和跨表面切换。重开/撤销不能重复造主角、恢复已消耗的一次性奖励或把旧帮助洗成独立。世界当前 goalSatisfied 与已完成历史分开；只保留有意义、幂等的章节结果。

旧 schema 4 decoder 精确行为需保护。采用新 envelope/key 或明确版本分支；不原地重新解释旧 journal。备份→回读→才允许替换，存储失败不覆盖原文。迁移不可靠时让用户导出后明确开始新章节，不编造转换成绩。新命令/target/属性白名单及大小限制须和 codec/export/清理一起更新。

## 6. Shell 与表现

沿用 main.tsx → App → GameShell 的正式入口，App 管会话恢复/平台与表面，Scene 投影世界，工具发意图。工坊与词语册是同一应用表面，不创建另一应用或复制一份领域状态；各场景会话数据隔离。

保持 committed/UI/ephemeral 三类状态。低频权威结果驱动 React；高频 pointer 坐标保存在 ref 并合并到 requestAnimationFrame，只有选中/落点语义变化需要视图更新。清理 cancel、lostcapture、多指、关闭、旋转和后台，防止合成 click 再提交。

表现从前后状态和已计算路径生成 cue。真实实体保留 key，读取前后几何后用 transform/opacity 做路径/属性补间；关系子物品一同运动。连续命令打断时从当前视觉采样平滑到最新终态，旧 cue 通过 session/revision token 作废。提交不等待动画；刷新直接恢复 committed state。reduced-motion 与跳过使用相同终态，不分叉业务。

角色有限姿态：待机/观察/行走/使用/受阻/庆祝；复用已有合适资源，新姿态或道具必须独立登记并实际引用。不能把一张合成图拆几个低清片段冒充全套动画素材。页面正式文字保持 DOM 可访问。

## 7. 资源、平台和错误处理

单一 manifest 与 BASE_URL；critical/scene/lazy 分级、去重、取消、失败重试。重试不清世界或词块。正式音频、开发 TTS、不可用三态可观察；首次手势激活和后台/切换取消沿用 StoryAudio。

内存可用但存储失败时继续并告知；未知/坏存档保留原文；内容失败不加载半套规则。视图命中与规则失败反馈分别标识，避免把网络错误归为英语错误。每次边界失败有短用户文案和不含个人信息的可诊断原因，不新增线上遥测默认采集。

输入反馈目标为及时且不中断连续操作；性能先对同条件做基线/变更后比较，不承诺未经测量的帧率。优先消除每次 pointermove 的 layout、全树重渲染、资源重复加载和未清监听；不在主线程同时做大规模关卡搜索。搜索属于开发期检查，运行时只执行已发布规则。

## 8. 可解性与必要测试

关卡检查复用 transition/goal 与可用行动枚举；固定内容/seed，使用有限状态键、预算和确定性 tie-break。为每关输出 witness 或明确 UNKNOWN；R1 的两 witness 在关键机制条件上不同。不要仅换动作顺序、填两条固定成功标志或用 LLM 宣布可解。

保存参考 witness 作为内容测试，不是孩子唯一正确路径。用正常 HTTP 首页重现核心解法和完整章节，检验 UI 可达性。规则/语言/恢复单测与浏览器测试互补；故障注入有明确目的，不注入通关状态。

当前命令和验收矩阵在 08。仅新增必要检查；新 check:levels 脚本若被采用，必须真实实现后加入 package，而不是文档先声称可运行。保留既有核心和旧档测试，必要时迁移失效 UI 测试并说明等价覆盖。

## 9. 切换与回滚

在独立实现分支先完成 R1，验证机制后继续完整章节/工坊/回访与 C 阶段。正式入口切换与内容/规则/schema 版本同批交付；旧档不被覆盖，旧代码可通过 Git 基线回退。不要常驻双 Shell、双判题、双 manifest。

只迁移本包需要的规则，删除的旧模块须确认不再被当前入口、历史 decoder 或测试依赖。更新文档表述与实际实现、生成证据并提交 PR；未经另行授权不合并 main。部署与 Git 提交分开，不把新文档或新 PR 当作线上站点更新。

## 本轮定向核验与实施决定（2026-09-20）

最新 origin/main `74ea7358ce41738d16bfa5dab29e94f581605a5c`，原主目录 main 干净。表 1 的六词/空间特判、六词句长阈值与 v4 白名单差距均仍存在。正式入口确为 main → App → GameShell；没有隐藏新玩法。未合并 #11/#12 为旧动画工作，不合并其旧流程。当前 Prompt/导航已指向本包，历史 superpowers/UI 工作包与证据只作历史输入。

选择有限节点图与支撑高度模型：比连续物理更可解释，且两条 R1 路径共享可达性/净空规则；保留旧 Shell 会形成平行产品，故替换正式 Shell，仅保留旧规则和 decoder 依赖。新规则由同一 domain.transition 的版本分支进入；当前应用唯一 runQuest 提交日志。具体执行追踪见 [实施计划](superpowers/plans/2026-09-20-gameplay-refoundation-06.md)。

## 10. 实际模块映射与证据边界

唯一当前入口 `main → App → GameShell → Scene / MeaningTool / SentenceBuilder`；词语册为同应用表面。旧 GameHUD/ContextTool/FeedbackLayer/Letters 和旧 CSS 已退役，没有第二套 Shell。旧 domain/picnic/adventure/session/save 链只保留历史 decoder、fixture 与 46 个旧 Node 回归的依赖；旧 UI 浏览器断言完整移至 tests/historical-shell-05，并登记等价新覆盖。

`game/quest.ts` 绑定 PuzzleSpec、评估窗口、不可洗白支持和 journal，`quest-command.ts` 严格校验，`language.ts` 为唯一有限语法，历史 sentences.ts 仅限制旧版本允许的结构。`domain.transition` 按绑定世界版本分派，spatial.ts 实现节点路径、净空、把手、容量/支撑和后态整体校验。`content/quest-validation.ts` 在启动及资源检查时整包验证词、音频引用、空间、目标和配额。

`quest-save.ts` schema 6 不信任投影，逐条命令重放并比对；保留旧 key 与原文。UI 草稿/动画不入档。pointer 只在一次 animation frame 处理最新位置并以 DOM transform 显示拖影，只有目标语义改变才更新 React。表现用稳定实体及路径，打开容器的子物品跟随父路径；重复命令、取消或动画中撤销不能重复推进业务。

当前关卡默认 seed=6；R3 另一请求通过内容 variant 与见证验证，默认 HTTP 主线为 in basket。回访固定封洞，不做任意随机布局。没有提供运行时 AI、账号或第二套后台。正式资源/音频/教研仍 PENDING，视觉工程自检不等于人工美术审核。完整 G01–G12 索引见 [本轮证据](evidence/gameplay-refoundation-06/README.md)。
