# AI 使用与制作证据

本表只记录实际活动；未知模型版本、token 或费用写 unknown，不编造。不得提交密钥、儿童资料或公司内部敏感 Prompt。

| 日期 | 工具 | 实际任务 | 产物 | 人工/工程检查 | 范围限制 |
| --- | --- | --- | --- | --- | --- |
| 2026-09-16 | ChatGPT | 整理项目对话、核对公开技术资料、设计文档与初始化 | 本仓库初始化文件；实际提交号见 Git 历史 | 实际检查见 docs/STATUS.md | 非真实教学效果或儿童试玩证据 |
| 2026-09-17 | Codex / GPT-6 | 实现 WP-PLAYABLE-STORY-01、编写原创临时 SVG、生产 HTTP 浏览器回归与截图自检 | src/game、content、platform、ui；tests/browser；evidence/playable-story | 类型/构建/领域与浏览器检查见 STATUS；工程自检非人工教研验收 | 未调用生图或在线教学 Provider；无 GPT Image 成品；费用/token unknown |

后续每行填写：工具及可确认版本、任务与关键输入摘要、产物路径/提交、人工修改、素材来源/权利、测试或审核结果、已报告 usage 与成本（未知留 unknown）。

上述 2026-09-16/17 行为 historical，历史检查见 [历史状态](../archive/status-through-core-04.md)，不代替本轮结果。

| 日期 | 工具 | 实际任务 | 产物 | 人工/工程检查 | 范围限制 |
| --- | --- | --- | --- | --- | --- |
| 2026-09-20 | Codex / GPT-6 | 历史：执行 WP-WEB-GAME-SHELL-05，治理旧设计、正式入口 Game Shell、输入/反馈/资源、正常入口试玩后修复 | SHELL-05 历史代码、权威文档、tests、evidence/web-game-shell-05 | 46 核心测试、8 浏览器测试及实际检查见 STATUS；agent 工程自检 | 未调用生图或运行时 Provider；未接受人工教研/儿童验收；费用/token unknown |

当前没有运行时 AI 工坊。Fixture 不填 provider success；演示视频经过剪辑要标注。

## 2026-09-20 · Refoundation 06 实际制作

工具：Codex / GPT-6（本会话身份），本地 shell、Node/TypeScript、Playwright Chromium、Git/GitHub CLI。按用户的完整 WP06 授权读取 origin/main 与合同、重写正式入口及有限空间/语言/存档、制作原创 box/door/basket/apple SVG、执行有界内核见证和 HTTP 流程、查看截图并修复触摸/焦点/收纳遮挡等实际失败。

产物：src/domain/spatial.ts、game/quest*.ts、language.ts、content/quest*.ts、platform/quest-save.ts、正式 App/UI；public/assets/game/rescue 四个原始 SVG 与现有唯一 registry；tests 与 evidence/gameplay-refoundation-06。代码提交从 f0b3496d5523d5f2b753ddcb5d0e999206102c39 到 7f42995006884e3bf17ef9c61a17b3f64557ba5e，具体历史见 Git。

未调用 imagegen 或在线生成 Provider；新 SVG 为本次代码绘制，不是模型生图 master。狸花猫等原素材来源保留原 registry 记录。没有人工教研/美术/儿童验收，全部真实状态维持 PENDING/NOT_RUN。59 Node 与 9 HTTP 浏览器用例、资源和构建结果均见 STATUS/原始日志；release 实际 exit 1，没有把 fixture/TTS 写成真实 Provider 或正式录音。模型 token、费用 unknown；没有提交任何凭据或儿童资料。
