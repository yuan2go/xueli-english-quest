# 项目状态 · WP-WEB-GAME-SHELL-05

2026-09-20：正式入口 Scene-first Game Shell 及用户追加的贴图动画/拖动性能优化已实现并验证。唯一实现负责人 Codex；分支 `codex/web-game-shell-05`，独立 worktree，原主工作区保持原状。未公开部署、未合并 main。

- baseline / 当前读取的 origin/main：`9b20d629dd4a4472f33afff3b935597a47741771`。
- 先治理文档和死代码：`83756cb`；其后实现和实际截图：`efc52f30542bd3c0df48721e551368e4a8fd6a12`。
- 追加优化基线：`d251e05878537b6e13c8bc92b4a686551a4f30a2`；最新实现：`0aaaa303513fda5040392f010b09aa91332e308f`。最终分支 HEAD 包括随后的交付文档，见 Git/关联 PR #9。
- 下方初次检查仅对应原实现；当前检查与性能边界见「追加贴图动画与性能验证」。

## 当前能力与权威对应

开工前完整读取 main 的 README、STATUS、01–05、11/12、WP05、AGENTS/CLAUDE，核对 App/Scene/工具/输入、world/adventure、save/audio/assets 与回归。沿用 11/12，不新增平行蓝图。

正式入口为 `App → GameShell → Scene + HUD + ContextTool + FeedbackLayer → Adventure Intent → application → domain.transition`。`content/encounters.ts` 与 `game/shell.ts` 投影情境、对象入口、工具和反馈；App 只管理会话/平台与外层表面。committed 游戏状态、UI 选择/草稿、短暂表现分离；动画不推进目标、不写存档。

场景持续存在，点击对象/邀请才展开拼写、变词、组句、听音或物品工具；成功后回到世界，不自动打开下一题。桌面/横屏侧栏、手机/纵屏底部有限高度工具，工具独立滚动。保留实际地图 → 垫子 → 放到墨迹并过路 → 取回地图的同一物品链，以及个人帽子/收纳结局、可逆探索和六活动变体。

统一 scoped pointer 处理阈值、capture/release/cancel/lostcapture、多指、可见命中与遮挡、resize/后台/Escape；词块可拖入、插入重排、退回，点击/键盘等价。世界坐标独立于工具层；放置从已提交世界吸附，取消/落空回退。恢复焦点、44px 控件、语义名称和 reduced-motion 保留。

反馈覆盖选择/拖动、受阻、生成、变形、移动、过路、角色反应、抵达和结局；有限演出可跳过。资源沿单一 manifest 按 critical/scene/lazy 加载，失败可重试，成功检查缓存并去重；重试只刷新图片，不清工具草稿。音频、后台、旋转和关闭工具取消瞬时操作。错误组句可原位修正；正确句子被关闭背包阻挡时，可在工具内打开真实背包，保留词块后显式再提交。

`domain/world.ts`、`game/adventure.ts`、`game/session.ts`、两个 save codec、历史 `content/story.ts`、package 与 lock 均与 baseline 相同。保留 schema 4 journal/replay、旧档保护、原子世界转换和学习证据分类；没有新引擎、依赖、后端或运行时 AI。

## 过期设计治理

旧 STATUS 移至 [historical archive](archive/status-through-core-04.md)；旧工作包、旧 evidence、旧页面参考图和内容 fixture 明确 historical。固定十二挑战/十三步骤仅留在历史证据和旧档兼容链。退役旧页面 UX、旧比赛日程、工坊 API/后台蓝图、失效 Prompt 和提交模板；统一当前 01–12/导航/README/AGENTS/CLAUDE。删除未使用的 `Experience.tsx`、`Picnic.tsx`、`ObjectButton.tsx` 及三份旧样式。资源来源与旧 decoder 有真实追溯/兼容价值，继续保留。

## 初次 Game Shell 交付检查（历史基线）

环境：macOS arm64，Node v26.3.1，npm 11.16.0。浏览器为 Playwright Chromium 生产构建 HTTP 正式首页，无通关状态注入；测试详见 [证据索引](evidence/web-game-shell-05/README.md)。

| 实际执行 | 结果 |
| --- | --- |
| `npm ci` | PASS；真实 lock 安装，26 added / 27 audited，0 vulnerabilities；lock 未变 |
| `npm test` | PASS，46/46，0 skipped；保留 43 个核心回归，新增 3 个 shell/证据/表现边界回归 |
| `npm run typecheck` | PASS |
| `npm run typecheck:domain` | PASS |
| `npm run build` | PASS；CSS 16.38 kB / gzip 4.56，JS 289.57 kB / gzip 94.79 |
| `npm run check:resources` | PASS |
| `npm run check:release` | BLOCKED，实际 exit 1：`发布资源缺失或未审核 bag`；门槛未降低 |
| `npm run test:browser` | PASS，8/8，51.2s；5 个已有真实路径保留并适配入口，新增 3 个回归 |
| `git diff --check` | PASS |
| 核心/存档/依赖与 baseline 的定向 diff | PASS，无修改 |
| GitHub Actions 权限查询 | 实际 `enabled: false`；远端 CI NOT_RUN，未擅自启用 |

覆盖 360×640、390×844、768×1024、1024×768、1440×1000 和旋转；实际 CDP touch/cancel/多指/lostcapture，键盘和焦点，场景连续性，词块拖放/重排，完整主线不同准备顺序与不同结局，六活动变体和活动隔离，过路演出中的刷新恢复，资源/音频/存储失败与旧档保护。普通主线监测 console/pageerror/HTTP；故障注入用例明确区分预期失败。

## 最后一次完整体验复查

在 360×640 生产 HTTP 首页实际走完：唤醒小猫 → 自选先做地图 → 错词原位修正 → 背包/帽子/卡片变帽 → 地图变垫、受阻保护、实际拖过墨迹 → 取回地图 → 草地布置和组句 → 开背包保留句子后重新提交 → 描述核对不改变世界 → 邀请小猫/听音找物 → 自选帽子和收纳 → 结局 → 活动往返 → 刷新。

按 Agency / Causality / Continuity / Manipulation / Juice / Recovery / Pacing / Replayability 检查，发现并修复了真实平板遮挡、小屏输入可达性、拖放后的键盘点击抑制、句子拖入尾部目标、物品消失后的 focus 和受阻组句重做问题。最终重走无 pageerror/console error；草稿、个人结局和主线隔离恢复已实际确认。截图和两轮记录见证据索引。这是 agent 代入儿童视角的工程试玩，不能替代儿童研究。

## 剩余阻塞与下一包

工程范围无已知未解决阻塞。公开发布仍 BLOCKED：资源审核（检查首先停在 bag）、正式录音/听审与教研未完成。真实 iPhone/Android/iPad、Safari、教研审核、目标儿童试玩、公网部署均 NOT_RUN；开发 TTS 不证明独立听力合格。未调用 Provider，不存在待补“真实 AI”验收。

建议下一包 `WP-CONTENT-DEVICE-ACCEPTANCE-06`（建议，未新立平行规格）：完成素材权利/审核、正式语音和教研，收集目标真机及儿童观察，按真实体验缺口修正操控/节奏后再申请发布验收。当前不新增平台、引擎或账号系统。


## 追加贴图动画与性能验证 · 当前结果

用户要求把贴图的动作优化得更流畅。沿用已授权的表现边界和同一 PR；实施 `b50964e`，完整试玩后对齐纸垫/小猫路径 `0aaaa303513fda5040392f010b09aa91332e308f`。权威 03/04/12 与工作包同步更新，没有新增平行蓝图。

- 复用现有 WebP：小幅呼吸、解码后姿态叠化、纸张变形叠化；实际实体及其子物品通过 transform 补间。纸垫先落到墨迹上 220ms，小猫随后通过 850ms；动画不负责业务提交。
- 拖动坐标使用 ref + requestAnimationFrame，只有开始/落点改变/结束更新 React；取消释放待执行帧。落点持续注册，单帧内快速松手也能正确提交一次。
- 发现并修复禁用原字母/词块按钮导致焦点落到 body、Escape 间歇失效；绘制前移交焦点到新位置。最小真实入口循环 20 次 PASS，保留并强化原焦点断言。
- 暂停、后台、旋转、动态 reduced-motion、卸载可取消运动；取消不改存档。没有新图片、GIF、引擎、依赖或业务/存档格式变更。

| 实际执行 | 本次结果 |
| --- | --- |
| `npm test` | PASS，46/46，0 skipped |
| `npm run typecheck`（build 内） | PASS |
| `npm run typecheck:domain` | PASS |
| `npm run build` | PASS；CSS 17.11 kB / gzip 4.71，JS 292.90 kB / gzip 95.89 |
| `npm run check:resources` | PASS |
| `npm run check:release` | BLOCKED，exit 1，bag 缺失或未审核；审核门槛未改 |
| `XUELI_EVIDENCE_DIR=/tmp/xueli-motion-regression npm run test:browser` | PASS，10/10，1.4m；原 8 条保留，新增 2 条，强化焦点及纸垫实际落在墨迹区域的断言 |
| `node scripts/profile-motion.mjs …` | 完成优化前/后三轮对照，数据见证据；没有与全套浏览器检查并行测量 |
| 390×844 正式首页额外完整试玩/录屏 | PASS，实际过路、个人结局、活动往返、刷新一致，console/pageerror 为零 |
| `git diff --check` / 核心、save、素材与 lock 定向 diff | PASS；上述成熟核心与资源未改 |
| 依赖安装 | 本追加无需重装；沿用前述真实 `npm ci` 与原 lock |
| GitHub Actions | 实际查询仍 disabled，远端 CI NOT_RUN |

同条件 120 次拖动中，LayoutCount 三轮均由 122 降到 4（约减少 96.7%），style 变更 238→120。脚本时间中位数 70.6→50.4ms；但总 TaskDuration 175.0→229.4ms，不能声称整体 CPU 时间减少。前后 RAF 中位间隔均约 16.7ms，采样无大于 33.4ms 帧，不宣称 FPS 提升或真机 60fps。

最新 [性能数据、实录与验证边界](evidence/web-game-shell-05/motion/README.md) 保留这些正负结果；没有用部分指标掩盖总开销，也没有修改失败断言换 PASS。真机/Safari/教研/正式录音/儿童试玩/公网部署仍 NOT_RUN，下一包仍建议内容与目标设备验收。
