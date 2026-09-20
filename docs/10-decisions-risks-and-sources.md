# 10 · 设计决策、风险、来源和假设

## 当前有效决策 · 2026-09-20 / WP-ANIMATED-PLAY-LEARNING-06

| 决策 | 当前结论 |
| --- | --- |
| 产品与主线 | 雪梨英语奇旅 / Xueli English Quest；按世界目标与行为事实推进，旧 step++ 不驱动正式页面 |
| 范围数量 | 三幕六词是首个故事的编排，不把三字母、十二挑战、十三步骤固化成产品限制 |
| 早期探索 | 恢复同伴后，按实际出现物品开放可逆玩法；主线自由布置不借用通关初始状态 |
| 英语应用 | 有限语法/语义判定；命令执行，描述核对。目标不符与世界受阻不等于错误英语 |
| 制作与身份 | restore/make/transform/find 明确区分；craft-mat/craft-hat 各一件，关键物品不复制 |
| 目标与结局 | 准备/布置允许合理换序；帽子与收纳选择保留到结局，当前布置来自真实世界 |
| 活动与随机 | 复用三活动，每个两个实质变体；能力解锁，隔离世界，固定 seed/variant 恢复 |
| 状态和存档 | 同一 domain.transition，schema 5 重放并核对投影；旧 step 无法可靠迁移新目标，备份/导出后明确重开 |
| 证据 | 教学、辅助、独立、探索、回访分开；TTS 明示未审核，自动化不证明好玩、教研合格或学习提升 |

## 2. 风险与应对

| 风险 | 触发/识别 | 应对 |
| --- | --- | --- |
| 核心不好玩 | 只会机械填字，看不懂变形用途 | 从正式入口完整试玩并改进世界操控与因果 |
| 教学混淆 | 字母名当音素、帽子排他、泄露答案 | 教研审查、模式标记、独立测试 |
| 状态死局 | 变走正在用的垫子、缺地图、主角变帽子 | 实例/情境守卫、恢复测试、同内核可达性检查 |
| 范围膨胀 | 平台功能替代实际游戏体验 | 沿当前工作包交付，缺口必须来自真实观察 |
| 网络或音频 | 移动端无法访问、播放被阻止 | 本地资源、首次交互解锁、真实网络验收 |
| 权利与隐私 | 直接取公司课件/真人声线/儿童数据 | 原创占位、授权后替换、无个人数据默认 |
| 双 agent 覆盖 | 同工作区修改核心协议与 lock | 一包一负责人、独立 worktree、先合约后并行 |
| 验证缺口 | 只有逻辑/视口测试，没有目标设备或儿童观察 | 如实标 NOT_RUN；不能据此声称真机或教学验收 |

## 3. 公开资料与用途

以下是初始化时（2026-09-16）的 historical 调研来源，仅保留出处追溯；不是本轮重新核验的技术合同或产品需求。实际依赖以锁文件、工程行为以当前代码与验证为准。

- [单词拼读王 App Store](https://apps.apple.com/cn/app/id6749286225)：用于核对自然拼读产品定位；不据宣传推定实际学习效果。
- [悦读小达人 App Store](https://apps.apple.com/cn/app/id6760697207)：用于核对绘本、听读、场景词汇方向；不推定内部 SDK、授权或法人与公司的关系。
- [Vite Getting Started](https://vite.dev/guide/)：Node 版本要求及工程入口。初始化选用的直接依赖版本参考当日官方模板，完整依赖仍须真实安装锁定。
- [Vite 官方 React TypeScript 模板](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/package.json)：初始化依赖基线参考，不承诺永远使用最新版本。
- [Vite Static Deploy](https://vite.dev/guide/static-deploy)：dist、base 和静态部署；preview 不是生产服务器。
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)：统一输入及取消语义。
- [MDN Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)：浏览器媒体自动播放限制。
- [OpenAI AGENTS.md](https://developers.openai.com/codex/guides/agents-md)：Codex 项目指令入口。
- [Claude Code Memory](https://code.claude.com/docs/en/memory)：CLAUDE.md 与文件引用入口。

旧比赛日程与调用预算蓝图已退役。目标年龄、体验时长与教学效果仍需外部验证，不是已测结论。

## 4. 待负责人确认，但不阻断全部开发

素材权利与正式审核、录音和听审、教研负责人、真机与适当儿童试玩条件，以及另行授权的托管部署。资源发布检查继续拦截未审核素材；模型凭据不在当前范围，不作为当前工程阻塞。

## WP06 决策

- 复用 DOM + Web Animations；四帧原生步态 atlas 与开包对应图接入正式入口。未更换引擎，未将装饰漂浮称为动作。
- 使用单一 journal 记录实际帮助曝光和有限技能观察；内容 5.0.0-dev.1/schema 5，旧 v4 decoder 冻结在 legacy，不推断旧帮助或升级旧证据。
- 以隔离教学帧复用领域规则，动作与词块分别呈现，演示不替孩子提交。
- 动作性能工作由本包承接；PR #9/#10 已合并，PR #11 原分支保留，后续以本包唯一清单为准，不叠加设计分支。
