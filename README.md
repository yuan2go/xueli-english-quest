# 雪梨英语奇旅 / Xueli English Quest

**观察问题，把英语当工具，用自己的办法帮助小猫。**

## 当前设计与代码不是同一状态

目标产品是一款触控优先的纸上冒险解谜游戏：有限拼词造物、属性变化、句子行动和观察描述共同服务场景问题。保留一个 React/TypeScript/Vite 应用和本仓库，实质重做主玩法，不新建平行 Demo。

本次更新仅为 Refoundation 06 的项目/技术文档与执行合同，未实现新关卡或切换页面。读取的运行代码基线为 `a9a62e3eb632781595b40171dfb442bf0fbbe55e`；该基线仍是已有 Scene-first《小猫的野餐冒险》与短活动。其历史验证不自动继承为本次验证。实际状态见 [STATUS](docs/STATUS.md)。

新工作包目标：3 个连续主关、1 个改变条件的回访、同内容的学习工坊与词语册；先证明一个真实多解关卡再扩展完整章节。原故事六词、三幕和旧十二挑战/十三步骤不是全产品限制。

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
npm run test:browser
```

`build` 已包含 typecheck；当前浏览器回归需安装 Playwright 浏览器并使用生产构建的本地 HTTP 预览。命令存在不等于本次执行过；结果只见 STATUS。`dist` 为静态产物，Vite dev/preview 不是正式生产托管。提交到 main 不等于网站已更新，现有托管地址/权限须实际核验。

## 不变量与边界

一个确定性世界写入链；指令执行、描述观察，语言正确/任务满足/世界许可分开。动画只表现已提交结果。新玩法允许内容化属性与空间规则，不解除旧故事 route-sheet 同实例铺路后恢复地图、cat-companion/cat-card 分离和 picnic-mat 独立约束。

保留已确认狸花猫、绿围巾、背包及画面颈部右侧白色定位器，不镜像。新素材/录音/教研必须真实审核；开发 TTS 明示。旧存档保留、备份和导出，不伪造新章节进度。

当前不需要账号、后端、运行时 AI、支付或社交。无凭据不阻断确定性游戏。工程、视觉、真机、儿童趣味、教学和公开发布分别判断；仓库可见不等于第三方素材有复用许可。AGENTS.md 是唯一共同工程合同，CLAUDE.md 仅作入口。
