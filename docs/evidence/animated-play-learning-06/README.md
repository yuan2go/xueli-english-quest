# WP06 · 实测证据

工程实现源 SHA `1ee59d14545f0ec52d02f13ef383b53acb51cf54`；baseline `a9a62e3eb632781595b40171dfb442bf0fbbe55e`。本目录之后只增加证据与说明，不修改运行代码。完整环境与结果在 [verification.json](verification.json)。单一实现负责人，双轴只读审查发现的音频终态、示范曝光、戴帽/入包首帧和教学文案问题均已修复。审查不替代浏览器证据。

## 正常播放的动作

[动作录屏](video/actions.webm) 从正常首页开始，依次拼词、戴帽、换字、铺路、收纳/取出、快速中断、暂停和 reduced-motion/刷新恢复。没有注入通关状态。录屏保留正常速度，不关闭动画；末段 reduced-motion 是显式异常用例。

[过路数值](crossing-samples.json) 采集计划偏移 80/350/650/950/1450ms，实际时间使用浏览器 `performance.now()`。纸张在 350ms 后四次位置/尺寸一致，小猫独立移动；中段 `walk` 与序列帧处于 running；帽子附属关系及唯一实例均断言。对应 [动作前](cross-before.png)、[350ms](cross-350.png)、[650ms](cross-650.png)、[1450ms](cross-1450.png)。不是 animations-disabled 截图。

额外使用本机独立原生 Chromium、全新临时 profile 和 `connectOverCDP(noDefaults:true)` 验证真实切页：[后台状态](desktop-background.json) / [返回画面](desktop-background-return.png)。实际 `document.hidden=true`、活动动画数0、暂停已显示，回前台继续后世界逐字段一致。默认 Playwright headless/headed 会保持虚拟焦点，最初切页仍 visible，未将这些尝试计为 PASS。此项是桌面原生后台验证，不代替移动 OS 挂起或实体手机/平板。

[父子转换首帧](reparent-samples.json) 在点击戴帽/入包之前与下一次绘制比较同一帽子的 x/y/width/height；每项差值 <3 CSS px。测试同时覆盖收纳后快速再戴、暂停、包内物品随拖动背包一起显示、取消、关闭/打开背包、变形、旋转、后台与刷新后仍为最新提交世界。没有终点飞行副本。

## 教学与记录

[教学动作](teaching-action.png) 展示隔离舞台中的 `in`；原正式世界字节不改变，退出后句子仍需玩家重组提交。[学习观察样例](learning-example.json) 是浏览器实际提交的句子事件，包含示范曝光、文字辅助、情境无自动答案完成；音频状态照实保存，不能将 headless 开发 TTS 的失败当成播放成功。完整播放后的听后重组语义另由确定性回执夹具回归验证，夹具不是真实听音。

演示动作与 DOM 词块分别记录，实际图像解码、动作落稳、可见区域满足条件后才记完整步骤；网络失败用例证明图像失败不能获得完整示范，部分文字仍保留曝光。v4 旧档兼容用例明确使用历史 fixture，只验证原字节备份、不可自动升级和显式重开，不作为主线通关证据。

## 页面与六个活动

[首页](home.png)、[开包收纳](bag-open.png)、[手机组句](phone-sentence.png)、[手机结局](phone-ending.png)、[桌面结局](desktop-ending.png)、[拖拽组句结局](phone-dragged-ending.png)、[帽子搭配](activity-dress.png)、[藏物观察](activity-find.png)、[语言小帮手](activity-helper.png)。活动截图各代表一个变体，两个变体的完整交互均由 picnic 浏览器用例实际走完。还有小手机/平板和横屏样本。

工程视角完整走查后实际修复：包内物品挡住背包点击、物品看似悬在包下、手机对象偏小、独立组句自动播答案、示范未显示词块却记全曝光、缺图仍可记示范完成、通用 cat 指引、重复实验残留过时反馈、父子节点重复位移。以上是工程走查，不是儿童研究。

## 同条件性能前后对照

同一 macOS 主机、Chromium 153.0.8010.12 headless、390×844、CDP CPU 4x、正常首页完成 cat/bag、静置 2700ms，再 120 次 pointer move + Escape。三轮各新 context，使用 [profile-motion.mjs](../../../scripts/profile-motion.mjs) 同一采样逻辑；无其他本任务浏览器测试并行。baseline 为修改前生产 build；after 为上述源 SHA 生产 build。拖动从同一 bag 操作区域相对位置开始；布局与资源本身随实现改变。不是物理设备 FPS 测试。

原始 [before.json](before.json) / [after.json](after.json)：

| 指标 | before 三轮 | after 三轮 |
| --- | --- | --- |
| LayoutCount | [122, 122, 122] | [3, 3, 3] |
| RecalcStyleCount | [135, 135, 135] | [136, 138, 138] |
| style mutations | [238, 238, 238] | [120, 120, 120] |
| LayoutDuration (ms) | [4.976, 6.691, 9.952] | [0.885, 1.471, 0.298] |
| ScriptDuration (ms) | [146.191, 126.425, 147.746] | [47.953, 39.736, 58.062] |
| TaskDuration (ms) | [354.569, 304.554, 343.237] | [216.997, 214.18, 237.022] |
| frame median (ms) | [16.7, 16.7, 16.7] | [16.7, 16.7, 16.7] |
| frame P95 (ms) | [16.7, 16.7, 16.8] | [16.8, 16.7, 16.7] |

布局次数由每轮 122 降至 3；样本只支持拖动布局工作减少。样式重算次数没有减少，帧间隔中位数仍约 16.7ms，双方 >33.4ms 帧均为 0；不能宣称 FPS、真机体验或儿童兴趣提升。相同条件可能受宿主调度影响。

复测命令：`node scripts/profile-motion.mjs http://127.0.0.1:4186 docs/evidence/animated-play-learning-06/after.json <完整源SHA>`，该端口必须运行同一 SHA 的 production build。baseline 采样时把该脚本临时放入 baseline 工作区，使用其原有 start/word 浏览器驱动，完成后删除临时脚本；没有提交或改动 baseline。

## 检查与证明上限

`npm test` 52/52（[原始输出](core-test.log)）、`npm run typecheck`、`npm run typecheck:domain`、`npm run build`、`npm run check:resources`、`npm run test:browser` 16/16 均 PASS。`check:release` [实际输出](release-check.log) 退出 1，首个阻塞为未审核 bag；门槛未放宽。构建 JS 321.91kB / gzip105.98kB，历史 decoder 延迟块24.09kB / gzip9.50kB；CSS20.83kB / gzip5.53kB。

实体 iPhone/iPad/Android、Safari/WebKit 真机、目标儿童试玩、正式资源权利/发音/教研、公网部署 NOT_RUN。新增资产和现有素材均没有由开发 agent 填写正式审核通过。四帧步态不是自由物理移动；开包图与原图有轻微比例差，教学效果未证明。

GitHub 交付：[PR #12](https://github.com/yuan2go/xueli-english-quest/pull/12)，未合并。CI NOT_RUN：只读 API 核对仓库 `actions/permissions.enabled=false`，分支 run/check 为空；workflow 定义 active 不等于仓库允许执行。本包未改动开关。
