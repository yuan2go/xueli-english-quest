# 05 · 内容、领域和存档协议

本文件描述目标协议；初始化的 src/domain 为其最小实现，不表示 ContentPack/Session/工坊已全部落地。新增字段先在此定义语义，再补对应校验和测试。

## 1. 词、实例和资源

WordId 为 cat | bag | map | mat | hat | cap。Lexeme 含 wordId、spelling、graphemes、wordAudioId、可选经审核的 phonemeAudioIds、imageAssetId、reviewStatus。不得从字母名自动推导音素。

Entity 含 id、word、kind(actor/object/token)、location。Location 为 stage、zone(ink-road) 或 relation(in/on,targetId)。权威位置只有一个；不同时维护多个可能互相矛盾的 inventory 数组。场景可见性是投影，进入背包不等于实例删除。

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
2. cat-companion actor 不变形；cat-card token 可以 cat→cap。
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

Snapshot 包含 saveSchemaVersion、sessionId、packId、packVersion、contentHash、world、stepProgress、evidence、lastCommitId。恢复须再次校验内容版本和不变量。unknown future schema 拒绝恢复但可安全重开；不要自动按新关卡数组索引续接旧记录。

正式 pack 发布后不原地修改同一版本。代码构建号、内容版本和资源版本分别记录，便于定位“代码没变但音频改了”的问题。参赛期间只需简单静态版本文件，不建设复杂发布平台。
