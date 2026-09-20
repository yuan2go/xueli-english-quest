# 05 · 内容、运行与存档合同

当前内容版本 `5.0.0-dev.1`、存档 schema 5、证据语义 `learning-observation-v2`。WP-ANIMATED-PLAY-LEARNING-06 的以下规则是正式页面合同；旧 schema 4 及 schema 2/pack3.x 只用于识别、验证与保留历史日志。

## 内容与身份

词汇来自现有资源词表，当前六词不限制未来产品词数。Letters 按目标长度生成槽位。每个 WordTask 声明意义、用途、模式、字母、多次提交目标和 restore/make 身份；不是从拼写随意生成物品。

cat-companion 永远为 actor，cat-card 为 token。route-sheet 的 map/mat 保留 ID；在本次主线提交 crossed-ink 前不能从 mat 恢复 map。picnic-mat、craft-mat 是不同实例；craft-mat/craft-hat 的内容配额各 1，刷新和重复操作不可复制。每个实例仅有一个 stage/zone/in/on/worn location，包含无环；占用支撑物不能静默变形或收纳；换帽原子移动旧帽。

SentenceTask 声明有限词块及独立 tokenId、语义 kind/source/relation/target、实例映射、place/observe、练习模式、情境与可接受模板。判定先检查 token 所有权/唯一性，再规范大小写/标点，通过有限语法解析语义，再比较目标、当前词形/位置和世界许可。范围外表达不泛称错误英语。描述句永远不执行 place。

## 命令与记录

`AdventureCommand` 包含 sessionId/revision/mode/attemptId 和有限 Intent；同 ID 同内容返回原回执，同 ID 不同内容或旧 revision/mode 拒绝。有效提交顺序为 clone → 校验 → effects → facts/events/journal → commit。世界错误不留下半个换帽动作。

结果 `valid/done/incomplete/structure/outside/mismatch/blocked/stale` 分开；证据另记 language correct/adjust/unassessed，不把语句成立但动作失败计为语言错误。当前目标经 `goals` 从 committed world/facts 推导，不能由 UI 提交“完成”。

事件区分 spelling、substitution、sentence-command、sentence-description、listening、operation、exploration；practice 区分 teaching/assisted/independent/exploration/revisit。帮助 text/hint/demo 与 exposures 持续保留；evidence 明确 guided/assisted/demonstrated/demo-partial/listen-rebuild/independent/audio-unverified/exploration。无播放开始的听音拼写/找物不获独立听力口径，开发 TTS 的来源与版本保存在 Support；播放开始不证明孩子听懂。重听、未填满、落空、资源失败不计语言错误。


## 实际帮助、组句与能力观察

`SentenceTask.exercise` 区分 `listen-rebuild`（可播放完整目标句，只记听后识别/重组）、`scene-compose`（情境指令，不自动显示/播放完整答案，主动示例音频也降低独立证据）、`example-reproduce`（隔离示范完整呈现后由孩子亲手完成）。任务指令说明行动，意义线索解释物品/关系，完整例句是答案曝光，结果反馈只描述本次结果。

逐级帮助为 attention → meaning → partial → text/demo；按钮点击不算曝光。视觉帮助实际进入可见区域后登记；示范按 action/words 分别记录 partial/shown/failed，各步动作须图像解码、最终位置落稳，词块须进入视口，四步两部分齐备后才能 completed。取消保留已显示部分，不声称孩子已经看懂。演示失败不能签发完整示范；仍可退出重试。

音频资源/版本/来源/request 与任务绑定，loading/playing/completed/cancelled/failed/muted 分别保存。任务完成或换字后仍以已登记原 request 接收终态；旧 request、错误资源不能覆盖当前请求。事件的 support 是提交当时快照，任务的帮助过程保留随后回执；开始播放不等于完成播放或听懂。

`Observation` 保存 objective/exercise/sourceId/targetId、skills、taskMatch、world、revisitOf。技能维度为词义识别、听力、完整拼写、换字、词序语法、情境语义、世界操作；只观察本次实际涉及的维度，听力须音频完成且无文字/提示/示范干扰。英语结构、任务匹配、世界可执行性分别判断。描述句不获得世界操作完成。回访只关联已有相应成功事件，无前史不补造关联。

成人回顾给出“完整目标句播放完成后重组成功”“看完示范后亲手完成”“未显示答案完成”“尚无独立回访”等事实，不使用掌握率。guided/assisted/independent 是本次条件，不能推断永久能力或学习效果。

## schema 5 存档

key 为 `xueli.adventure.v5`。envelope `{schema,content,id,seed,journal,projection}`，projection 包含故事/活动世界、场景/目标、已选 variant/seed、帮助和必要学习事件。恢复不信任该投影：验证 schema/content/结构/字段长度，从初始状态重放每条真实命令，再逐字比较导出的投影。上限 6000 条/4MB，超限提示导出。临时拖影、输入草稿和音频对象不持久化。

旧 `xueli.adventure.v4` 使用 `legacy/quest-v4` 冻结 decoder 验证，绝不升级为独立学习记录。旧 `wordspell.story.v1` 用旧 decoder 判断是否已知；先把原文备份至内容指纹后缀 key，回读一致且不覆盖碰撞。新目标无法可靠由旧 step 推导，因此保留旧档、提供导出、要求明确开始新冒险；不伪造迁移完成度。其他旧活动 key 原样保留，也包含在导出中。新档损坏/未来版本同样保留，确认重开前备份；备份失败不覆盖。存储完全不可用时临时运行并告知。

## 资源与发布

继续使用唯一图片 manifest 与 Vite BASE_URL。WP06 修改内容和证据语义，因此显式提升 schema/content；旧哈希和 decoder 作为 historical 原样保留。`sceneModel/resolveTool` 读取既有 availability/goals，presentation 只消费提交结果；选中、草稿、DOM 坐标和 cue 均不进入日志。原图/音频哈希、字节、格式与审核策略未放宽；新增有限句子的开发语音目录同样登记为 PENDING/path=null，经现有 StoryAudio 播放，不伪造录音。`check:resources` 包含新增语音目录；`check:release` 仍拒绝未审核素材。视觉资源不改变旧内容哈希；新内容行为修改应更新新版本，不能原地复用已发布版本。

旧 pack 的精确哈希和 journal decoder 保留在 `content/story.ts`、`platform/save.ts` 和旧回归测试里，仅用于历史验证；没有把旧十二挑战的定义重新加为新产品约束。
