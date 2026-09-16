# 内容目录

`drafts/picnic-world-plan.json` 是十二挑战／十三步骤的世界效果正确路径草案，供 agent 对照玩法与状态测试。它不是完整 ContentPack，不含正式音频、字母盘、资源审核或完整判题数据，也不能直接进入儿童发布入口。

`tests/world-plan.test.mjs` 用同一个领域内核验证这条预设正确路径，并检查省略铺路时前置条件失败。测试不表示所有分支可达、教研通过、UI 通关或真实 AI 生成。

WP-02 将依据 docs/05-content-and-runtime-contracts.md 实现完整内容格式、运行时校验、资源索引与审核发布；迁移此草案时保留稳定的 challengeId/stepId 与物品身份，不把测试 fixture 的状态当成用户进度。
