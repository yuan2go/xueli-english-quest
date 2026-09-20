# 项目状态 · Refoundation 06

## 本次文档交付 · 2026-09-20

用户授权：详细整理新游戏方案为项目/技术文档，直接提交 main，并提供 Codex 实施提示。本次仅修改文档和 agent 指令，不修改运行代码、依赖、资源、CI 或部署设置。文档提交最终 SHA 由本文件的 Git 提交和本轮交付回复标识，不在同一提交内伪造自引用 SHA。

读取的仓库：yuan2go/xueli-english-quest；默认分支 main；代码基线 `a9a62e3eb632781595b40171dfb442bf0fbbe55e`，tree `21bbdd2fa3031c50cc56362630e506f9003572b2`。读取 AGENTS/CLAUDE、项目合同、旧工作包、package、领域/应用/句子/存档关键代码与目录信息；不是全仓逐行审计。

## 当前实际能力与待实现

基线仍是旧 Scene-first 野餐故事、有限造物/变形/摆放、Put/The…is… 句子和 schema 4 重放。代码差距详见 [12](12-web-game-technical-design.md)：六词/空间特判、无属性/门/通行模型、短句阈值、旧关卡目标与 codec 白名单均需实质修改。

新产品合同已整理为一个应用中的词语工具解谜；R1/R2/R3、改变条件回访、学习工坊和词语册是 **TARGET_NOT_IMPLEMENTED**，不因为文档提交成为已上线能力。

| 维度 | 本次状态 |
| --- | --- |
| 方案与技术文档 | 已编写并进入本次文档交付；远端提交/回读结果以 Git 和交付回复为准 |
| 新玩法实现 | NOT_IMPLEMENTED |
| 新玩法工程验收 | NOT_RUN |
| 动画/新素材完整性 | NOT_RUN；未制作或接入新资产 |
| 实体设备 | NOT_RUN |
| 目标儿童趣味性 | NOT_RUN |
| 新内容/发音教研 | PENDING |
| 素材权利与录音 | PENDING，保持既有发布门槛 |
| 公网部署/站点更新 | NOT_RUN；未核验已有托管，不声称没有网站 |
| 运行时 AI | 不在范围，未调用 |

## 本次检查边界

GitHub 读取可用；容器 git clone 因无法解析 github.com 失败，未形成可运行的本地 checkout。这是环境限制，不是游戏测试失败。文档修改走 GitHub Git tree/commit/ref，基于原 tree 增量提交，禁止强推；远端并发前进时需重读基线。

npm ci/test/typecheck/build、资源检查、浏览器、真机和 Provider 本轮均 NOT_RUN。没有继承旧 46/46、8/8 或任何历史 PASS。文档范围、引用与远端差异按本次交付实际检查报告，不据文档整理宣称代码回归通过。

## 文档治理结果

01–12、README/文档导航、AGENTS/CLAUDE 同步 Refoundation 06；旧 SHELL-05 改为历史入口。原 STATUS 与旧工作包完整字节快照保留为 [状态快照](archive/status-at-a9a62e3.md.txt)、[工作包快照](archive/wp-shell-05-at-a9a62e3.md.txt)，历史运行结论仅对应原记录。旧源代码、fixture、decoder 和证据未删除。

## 下一实施

唯一工作包：[WP-GAMEPLAY-REFOUNDATION-06](work-packages/WP-GAMEPLAY-REFOUNDATION-06.md)。Codex 先核对最新 origin/main 和本地无关变更，按 12 定向确认差距，清理仍冲突的活动引用；R1 真入口多解闭环成立后继续完整章节、工坊/词语册、回访、可靠性与表现。不得只做一关或引擎就宣布全包完成。

实现默认独立分支、提交、推送、PR；本次直接 main 授权不自动延伸到后续代码或部署。外部教研/素材/真机/儿童/托管条件仅阻断对应验收，缺少实时模型凭据不阻断游戏。
