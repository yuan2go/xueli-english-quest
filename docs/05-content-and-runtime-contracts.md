# 05 · 内容、领域和存档协议

本文件保留产品合同，并记录已落地的 WP-PLAYABLE-STORY-01 主线协议；在线工坊未实现。

## 当前主线实现合同

`content/story.ts` 的十三个 Step 消费于会话和 UI；当前 pack `3.1.0-dev`。运行时检查字段、效果、词表、来源当前词形、字母多重集、可编辑/锁定位置、场景可选实体与自然目标、帮助和反馈引用。字母布局与目标检查复用 UI 的 `letterLayout`、`sceneTargets`；合法路径通过同一个 `game/session.run` 执行。内容 SHA-256 覆盖 pack、步骤、图片、音频、有限指令与受限 feedback 定义；测试核对实际哈希。静态内容待教研审核，不支持导入任意外部关卡。

实际存档 envelope 为 `{schema:2, pack, content, id, journal}`：pack 是内容版本，content 是 SHA-256，id 是本地会话 ID，journal 是已接受命令日志。每个命令携带 sessionId、stepId、attemptId、expectedRevision、type、input；type 为 submit/hint/text/demo/replay/observe。恢复严格检查结构、版本与未知字段，再从初始世界重放同一会话转换链；World、步骤、学习证据、去重回执重新推导。日志上限 4000 条/JSON 2 MB，达到上限提示导出并重开。临时字母、拖影和音频对象不入档。

observe.input.observation 是有严格字段检查的 JSON 字符串：requestId、assetId、version、stepId、purpose(task/success)、eventId、status、source。status 为 loading/playing/completed/failed/cancelled/muted；source 为 recording/development-speech/unavailable。没有观察时为 unplayed，不伪造“听过”。success 绑定最近正确 eventId，task 绑定当前任务及资源文本；终态、被替换请求与旧任务回调不再更新记录。每次答案证据保留提交前该任务的观察快照；没有可确认已开始音频的独立模式完成记 unverified-correct。开发 TTS、正式录音、播放观察与孩子听懂是不同事实。

错误答案不改变 World；未填满、落空、过期和冲突命令不加入语言事件。帮助/重听命令也持久化，刷新不会丢失已看答案的辅助口径。每步成功原子更新世界、事件、步骤，再保存；s04a 后仍为 s04b，s04b 后已有 crossed-ink。重复 attempt 返回已登记 outcome 和当前状态，不重复推进；同 ID 不同输入拒绝。

localStorage key 仍为 `wordspell.story.v1`（key 不是 schema），确认重开先将原始存档备份到 `wordspell.previous.v1`，会明确提示替换更早上一局；备份失败只临时游玩，不覆盖旧存档。旧 schema 1 / pack 2 与损坏存档原样保留，不能猜测旧版音频/帮助证据，未做自动迁移。警告入口可导出原始两份存档；确认清除才删除，正常记录可下载 JSON。

图片合同支持 SVG/PNG/WebP，录音支持 MP3/WAV/OGG；登记 id/path/type/bytes/SHA-256/version/source/review，以及图片尺寸/Alpha/用途、录音文本/locale/durationMs。开发策略允许明确标记的临时资源和空录音路径；候选发布策略拒绝缺失或未审核资源与内容。`check:resources` 检查磁盘字节/格式/哈希/引用，浏览器额外解码核对图片尺寸；`check:release` 增加发布门槛。局域网非安全 HTTP 无 SubtleCrypto 时只做尺寸/字节/格式检查，不能宣称浏览器验证过哈希。

正式录音缺失时 inputMode 标记 audio-dev；文字可见时为 text-assisted。outcome 区分 independent-correct（仅指本题未辅助，不是审核听力结果）、assisted-correct、demonstrated、incorrect、interaction-complete。页面记录按题型展示，不计算混合能力分数。

## 1. 词、实例和资源

WordId 为 cat | bag | map | mat | hat | cap。Lexeme 含 wordId、spelling、graphemes、wordAudioId、可选经审核的 phonemeAudioIds、imageAssetId、reviewStatus。不得从字母名自动推导音素。

Entity 含 id、word、kind(actor/object/token)、location。Location 为 stage、zone(ink-road)、relation(in/on,targetId) 或 worn(targetId)。worn 是持久换装位置，只接受帽子指向角色、每角色一顶，不是新增教学关系。权威位置只有一个；不同时维护多个可能互相矛盾的 inventory 数组。场景可见性是投影，进入背包不等于实例删除。

WorldState = { revision, entities: Record<id,Entity>, flags: string[] }。flags 只接受已定义事件，例如 crossed-ink；不允许 AI 构造任意执行指令。

## 2. 关卡模型

ContentPack 至少包括 schemaVersion、packId、version、locale、reviewStatus、lexiconVersion、assetManifestVersion、initialWorld、scenes、challenges 和 provenance。正式发布有内容哈希；hash 应覆盖已规范化内容及依赖清单，而不是只覆盖标题。

Challenge 包括 id、sceneId、objective、steps、完成条件。Step 为判别联合：spell、transform、select、place。每步含 id、promptAudioId、instructionText、assessmentMode、hintPolicy、preconditions 和 allowlisted effects。动作结果与目标必须由内容提供，不能由模型临时评判。

```ts
type AssessmentMode = 'teaching' | 'guided' | 'independent' | 'interaction';
type Step =
  | { id: string; type: 'spell'; expectedWord: WordId; create: Entity; letters: string[] }
  | { id: string; type: 'transform'; sourceId: string; from: WordId; to: WordId }
  | { id: string; type: 'select'; targetId: string }
  | { id: string; type: 'place'; sourceId: string; target: Location };
```

以上是核心 discriminant 示意，不是完整可直接发布的 schema。WP-02 需实现完整运行时校验，禁止以 TypeScript 类型强转替代校验不可信 JSON。字段有长度和数量上限，unknown keys 拒绝；外部文本按文本渲染。

### 第四关示例（设计数据）

```json
{
  "id": "04",
  "sceneId": "forest",
  "steps": [
    {"id":"s04a","type":"transform","sourceId":"route-sheet","from":"map","to":"mat"},
    {"id":"s04b","type":"place","sourceId":"route-sheet","target":{"kind":"zone","id":"ink-road"}}
  ],
  "completion":"all-steps"
}
```

s04b 的审核后成功效果包含 crossed-ink；s05 前置条件必须检查这一标记。s07 onEnter 只生成一次 cat-card。s08 创建 picnic-mat，不能复用 route-sheet ID。onEnter 重放必须幂等。

## 3. 三层校验

结构校验：枚举、必需字段、类型、ID 唯一、字符串/数组长度、不含未知指令。参考上限：1–3 幕、最多 20 challenge / 40 step、输入文本总长 4 KB；具体上线限制在实现中统一配置。

语义校验：词汇在 allowlist；字母多重集能拼目标；音频/图片实际存在并满足审核状态；transform 恰有一个字符改变且在允许关系中；目标物品/区域类型正确；指令语义与答案需教研确认，不能靠字符串格式证明。

状态校验：从 initialWorld 按合法路径执行，检查来源存在、目标形态、容器约束、保护角色、无环包含和结局可达；每一步使用同一领域逻辑，不另写放宽规则的模拟器。有限模板线性关卡可执行整条 witness path；这只证明该路径可达，不宣称搜索证明了所有自由分支都无死局。

## 4. 必须保持的不变量

1. 实例 ID 唯一，word 在已知集合，location 引用存在；关系不指向自身、不构成环。
2. cat-companion actor 不变形；cat-card token 主线只允许 cat→cap；picnic 模式允许 cap→cat，仍为纸偶。
3. map↔mat 是同一 route-sheet；另一个 mat 必须拥有不同实例 ID。
4. 变形不能使依附于原容器/支撑物的对象悬空；有孩子节点则拒绝或经明确任务先移走。
5. ink-road 只能接收允许铺路的 mat；crossed-ink 由指定成功步骤写入。
6. 旧步骤、旧 revision、重复 attempt 不重复给效果。动画失败不回滚已提交逻辑。
7. 提示与错误不修改目标答案；重听不重置 hintLevel。

## 5. 命令/结果协议

```json
{
  "sessionId":"local-session-id",
  "stepId":"s04a",
  "attemptId":"unique-local-attempt-id",
  "expectedRevision":3,
  "type":"submit-transform",
  "payload":{"sourceId":"route-sheet","word":"mat"}
}
```

Game 层结果：success / language-error / interaction-error / stale / unavailable。附可本地化 feedbackCode、nextState、events；不依赖随机自然语言。领域错误码包括 STALE_REVISION、MISSING_ENTITY、DUPLICATE_ENTITY、INVALID_TRANSFORM、PROTECTED_ACTOR、INVALID_TARGET、TARGET_IN_USE。错误反馈文字集中映射，不把内部异常原文暴露给孩子。

## 6. 学习事件

LearningAttempt：eventId、sessionId、packVersion、challengeId、stepId、taskType、targetWord/targetRelation、submittedValue、outcome、hintLevel、answerVisible、inputMode、priorAttempts、presentationMode。需要耗时时使用本次会话相对时间；时间戳与随机 ID 由边界注入，不进入纯函数判题。

taskType 区分 spelling / substitution / lexical-listening / sentence-placement / interaction。outcome 区分 independent-correct / assisted-correct / demonstrated / incorrect。replayAudio 单独计数；落空不进入错误率分母；教学关不进入独立准确率分母。

默认仅设备本地，不远端上传。汇总必须明确分母，例如“本局 3 次无提示拼写提交中 2 次正确”，不得合并为通用英语能力评分。

## 7. 存档与内容版本

实际存档使用本章开头的 schema 2 命令日志，代替原设计的 World/evidence 快照。恢复重放生产转换并验证内容版本及不变量；unknown future schema 拒绝恢复但保留原档并可确认重开，不能按新关卡数组索引续接旧记录。

正式 pack 发布后不原地修改同一版本。代码构建号、内容版本和资源版本分别记录，便于定位“代码没变但音频改了”的问题。参赛期间只需简单静态版本文件，不建设复杂发布平台。


## WP-PLAYFUL-GAME-03 协议增量

`content/instructions.ts` 登记有限 word/find/cross/place 指令，place 明确 source word/relation/target word。文本从固定模板生成，与 audio 文本、步骤类型、当前来源词形、目标和 effect 一起检查；`validateStory` 与生产 `run` 共用 `instructionIssue`。任意另一条已登记指令也不能替换目标句通过判题。故事文案与受限判题指令分离，教研仍未审核。当前内容哈希 `0400c42731deac0c728566185d7c6a2fb2e3970a4b1e38a475e67462caeef7fb`。

只兼容一个已验证旧版本：schema2、pack3.0.0-dev、hash `a6bf55d43c1e7bda54ce71c42980260e73d395b8ae257aebc3faef0f474e4854`。十三步与资源不变，原命令逐条通过新规则重放，帮助/音频证据保留；加载先备份原文到 `wordspell.story.v1.legacy.<sessionId>` 并提示。备份失败不覆盖原文。其他未知版本或损坏数据保留、导出并确认重开，不猜测进度。

野餐/活动使用独立 key `wordspell.play.v1.<free|dress|find|helper>`，envelope `{version:1,id,mode,seed,journal}`；同样重放生产命令，不信任世界快照，最多 2000 条/1.5 MB。`wordspell.play.active` 只记当前入口，不解锁主线。重置前备份 `<key>.previous`，备份失败不覆盖；活动退出不改自由布置。模式不兼容或损坏时保留原档、提示导出/确认重置。

RIFF 的 WAV/WebP 固定标识按原始字节偏移检查，最小 12 字节；长度字段含 C2 A9 的合法 PCM WAV 是回归反例。格式检查不代替真实音频听审。摘要按真实成功事件的词形首次位置区分首次/回访，换字与完整拼写保留各自题型，不推断长期掌握。
