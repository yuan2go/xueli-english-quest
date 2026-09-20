# 雪梨英语奇旅 / Xueli English Quest

**观察问题，把英语当工具，用自己的办法帮助小猫。**

## 当前分支：Refoundation 06

正式 `/` 已重做为英语工具解谜主章节：R1 围栏取篮有“箱子支撑高把手”和“同一小猫缩小穿洞”两种机制；R2 组合大小、开合与容纳，把水果带过窄拱门；R3 按英语请求完成 in/on 的实际交付与结局。雨后回访封住小洞，必须重新调整办法。

魔法工坊提供词义小样、WordSpell、句子教学、辅助/独立练习；词语册记录实际使用与帮助。描述只观察，世界行动经同一确定性内核。可撤销世界而不能抹掉帮助，主线/工坊/回访分别恢复。旧故事保留规则、fixture 与只读 decoder，不再占据首页，也不把旧通关映射为新成绩。

本地工程检查已完成，证据绑定代码 `bfe1d2e42da7e331e7681b0b3dc264a675b1ce63`；最终交付提交只追加文档/证据。此分支需要 PR 审查，未自动合并或部署。完整结果与限制见 [STATUS](docs/STATUS.md)。

## 文档入口

- [项目蓝图](docs/11-web-game-product-blueprint.md)：游戏最终是什么、玩家怎样玩、为什么不另建应用。
- [玩法与章节](docs/02-gameplay-and-levels.md)、[技术设计与代码映射](docs/12-web-game-technical-design.md)：问题、规则、代码差距与重构路径。
- [当前工作包](docs/work-packages/WP-GAMEPLAY-REFOUNDATION-06.md)、[Codex 提示词](docs/prompts/codex-gameplay-refoundation-06.md)：完整实施范围、必要验收与交付。
- [全部文档导航](docs/README.md)、[有效决策](docs/10-decisions-risks-and-sources.md)：唯一权威索引。

## 开发与体验

基线要求 Node >=22.12.0，使用仓库真实锁文件。

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5178
npm test
npm run typecheck:domain
npm run build
npm run check:resources
npm run check:release
npm run check:levels
npm run test:browser
```

`build` 已包含 typecheck；当前浏览器回归需安装 Playwright 浏览器并使用生产构建的本地 HTTP 预览。命令存在不等于本次执行过；结果只见 STATUS。`dist` 为静态产物，Vite dev/preview 不是正式生产托管。提交到 main 不等于网站已更新，现有托管地址/权限须实际核验。

## 不变量与边界

一个确定性世界写入链；指令执行、描述观察，语言正确/任务满足/世界许可分开。动画只表现已提交结果。新玩法允许内容化属性与空间规则，不解除旧故事 route-sheet 同实例铺路后恢复地图、cat-companion/cat-card 分离和 picnic-mat 独立约束。

保留已确认狸花猫、绿围巾、背包及画面颈部右侧白色定位器，不镜像。新素材/录音/教研必须真实审核；开发 TTS 明示。旧存档保留、备份和导出，不伪造新章节进度。

当前不需要账号、后端、运行时 AI、支付或社交。无凭据不阻断确定性游戏。工程、视觉、真机、儿童趣味、教学和公开发布分别判断；仓库可见不等于第三方素材有复用许可。AGENTS.md 是唯一共同工程合同，CLAUDE.md 仅作入口。
