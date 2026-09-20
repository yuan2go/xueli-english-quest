# WP-WEB-GAME-SHELL-05 · 实际工程证据

2026-09-20；实现 SHA `efc52f30542bd3c0df48721e551368e4a8fd6a12`，baseline `9b20d629dd4a4472f33afff3b935597a47741771`。命令结果见 [STATUS](../../STATUS.md)。本目录是本轮证据；其他旧包 evidence 为 historical，不与本轮 PASS 混用。

本包随后增加了贴图动作/输入性能优化，最新结果见 [motion 证据](motion/README.md)。本页初次交付的 8 项结果对应上方实现 SHA，不覆盖后续变化。

## 表面、执行与边界

Playwright Chromium，生产 `dist` 经 Vite preview HTTP 正式 `/` 入口；浏览器回归端口 4174，额外最终试玩端口 4185。macOS arm64，Node v26.3.1 / npm 11.16.0。8/8 浏览器回归实际通过（51.2s），正式路径未注入预置通关状态。资产损坏、旧档/坏档、拒绝存储等仅在明确的故障用例注入。

截图是实际运行画面；JSON 是 agent 操作摘要，不是儿童观察或独立第三方证明。最终代码树与实现 SHA 相同，后续提交只补交付记录。物理设备、Safari、正式录音听审、教研和儿童研究均 NOT_RUN。

## 必要浏览器路径

| 测试 | 实际验证 |
| --- | --- |
| `story.spec` phone | 390×844 正式首页，提前可逆探索，三幕，实际过路、句子、个人结局，暂停/静音/刷新 |
| `story.spec` desktop | 1440×1000 相反准备顺序、句子选择/重排/撤回、不同帽子结局，真实 craft 备用垫及放置 |
| `story.spec` touch | CDP 真 touch 事件、cancel/落空、后台返回、键盘与小屏/平板方向变化 |
| `picnic.spec` activities | 1024×768 正常主线解锁后三活动各两个变体，逐个实际完成，刷新保留 seed，退出精确核对原主线 |
| `art-cutover.spec` failures | 资源/音频失败与重试、crypto 不可用 fallback、损坏/旧档保护及拒绝存储后的临时游玩 |
| `shell.spec` persistent world | 场景 DOM 连续、工具局部滚动、focus、lost capture、CDP 多指取消、360×640 与 768×1024 旋转 |
| `shell.spec` full phone | 完整主线，实际拖放/重排词块，已提交过路演出时刷新，正确句子受阻后原工具开包保留词块并显式重试 |
| `shell.spec` lifecycle | 首页不加载未来场景背景；资源失败重试/暂停保留未完成拼字；瞬时字段不进入存档 |

## 最后一轮儿童玩家视角工程试玩

第一轮 [记录](playtest-first-pass.json) 与 [受阻截图](playtest-blocked-sentence.png) 发现：正确句子被关闭背包挡住时，虽然受阻时草稿尚在，但关闭工具开包后必须重新组句。此图及 `playtest-small-ending.png` **只保留为本轮修复前证据**，不代表最终交互。

修复后，工具直接提供真实「打开背包」，词块保留，玩家显式重新提交。新增浏览器断言验证 draft 完整保留；随后从空白正常首页重新全程操作，得到 [最终记录](playtest-final.json)、[保留草稿截图](playtest-repaired-draft.png)、[360×640 最终结局](playtest-final-small-ending.png)。没有 pageerror/console error。

实际路径：唤醒 → 先选地图 → 错词不生成物品，原位换字母 → 背包/帽子/卡片变帽 → 地图变垫 → 过早变回被阻挡 → 拖到墨迹并过路 → 取回同一纸张变回地图 → 草地变垫 → 组句放帽入包，受阻后原工具开包再提交 → 帽子放垫上 → 描述核对世界不变 → 邀请/听音找物 → 自选鸭舌帽穿戴、宽檐帽收纳 → 结局 → 活动往返 → 刷新保留个人世界。

| 体验维度 | 最终实际观察 / 对应改进 |
| --- | --- |
| Agency | 准备顺序可选；场景对象/邀请决定打开哪件工具；个人结局和收纳选择保留 |
| Causality | 同一纸张变形、垫子真正铺过墨迹，受占用保护；语言命令改变物品，描述只核对 |
| Continuity | 工具成功后回到仍在的场景；任务没有连跳下一题；演出中的刷新保留已提交过路 |
| Manipulation | 真实物品拖放；词块拖入尾部/插入重排/退回；修复平板遮挡、小屏触达和键盘点击抑制 |
| Juice | 可见变形、移动、过路、角色反应与结局；可跳过，reduced-motion 直接稳态 |
| Recovery | 错字原位换字；落空不算语言错误；背包受阻保留句子；资源/存储失败有可用恢复路径 |
| Pacing | 不强开下一题；工具有限高度与句子区固定可见；本轮实测后消除开包造成的重复组句 |
| Replayability | 不同准备顺序/帽子结局，真实自由摆放，六个 authored 活动变体且退出后主线不变 |

这些观察只支持工程交互和确定性行为，不证明目标儿童觉得好玩、达到 30–90 秒节奏目标或产生学习收益。

## 截图索引

- `phone-sentence.png`：手机有场景的按需组句；`phone-dragged-ending.png`：真实词块拖放路径后的结局。
- `phone-ending.png` / `desktop-ending.png`：两个正式完整路径的结局和布局。
- `small-phone-crossing.png` / `pad-crossing.png`：过路演出与旋转后的世界。
- `landscape-360.png` / `landscape-768.png`：方向变化后的工具/场景布局。
- `activity-dress.png` / `activity-find.png` / `activity-helper.png`：正常解锁后活动世界；六变体完成由断言证明，单截图不证明全部变体。
- `playtest-repaired-draft.png` / `playtest-final-small-ending.png`：额外最终全程试玩中的恢复与个人结局。

实际看图检查包括 phone-sentence、phone-ending、landscape-360、activity-find 及最终草稿/结局；未把每个自动截图都声称人工审图。

## 保留的发布门槛

`check:resources` PASS；`check:release` 实际 exit 1，首先报告 `发布资源缺失或未审核 bag`。没有修改审核字段或删除门槛来换 PASS。Actions 当前关闭，远端 CI NOT_RUN。公开部署、目标真机与外部内容/儿童验收不在本轮已完成证据中。
