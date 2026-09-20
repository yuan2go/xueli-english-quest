# 项目状态 · WP-ANIMATED-PLAY-LEARNING-06

2026-09-20：正式入口的工程实现与本轮必要验证完成；正式发布仍 BLOCKED，不能称为已验证教学效果或生产质量。唯一实现负责人 Codex；独立分支 `codex/animated-play-learning-06`，worktree `/Users/yuan/.codex/worktrees/animated-play-learning-06/xueli-english-quest`。

baseline：刷新后默认分支 origin/main `a9a62e3eb632781595b40171dfb442bf0fbbe55e`。最终运行代码/浏览器/性能验证源 SHA：`1ee59d14545f0ec52d02f13ef383b53acb51cf54`；其后仅提交证据与文档，最终交付 HEAD 见 PR 和交付报告。主工作区仍为原 main 且干净；其他工作区没有修改。PR #9/#10 已合并，PR #11 OPEN 且未追加，本包吸收经核对的动作增量，在新分支交付新 PR，不自动合并。

## 已实现

- 唯一 App → GameShell → Adventure → domain.transition；先原子提交，再按 actor/source/support/attachment/displaced 表现动作。纸垫先铺稳，小猫独立走过；同一实体 FLIP、父节点坐标换算、嵌套拖影、实际包口遮挡，支持连续动作、跳过、暂停/后台/pagehide、旋转、卸载与 reduced-motion 取消。
- 原生 1254×1254 四帧步态 atlas 和开包图接入正式页，保留狸花猫身份与画面右颈定位器，不镜像。纸张折叠/换用途、戴帽调整、出现/移动/收纳/取出、局部眨眼和姿态变化使用同一实体。素材尺寸、Alpha、帧/锚点、来源与转换见 [motion assets](../design/tabby/motion/README.md)。
- 三幕及六活动变体保留，强化阳光/风下帽子试验、藏物与遮挡线索、换座/收纳/休息/出发的世界后果；活动可退出并隔离主线。首页、手机对象尺寸、按需工具和真实结局布置同步调整。
- 三种组句范式：听后重组、情境独立组句、示例后亲手复现。独立组句不自动播放/显示完整答案；逐级帮助记录实际曝光。隔离示范使用同一领域规则，逐步对照对象、词块、in/on 与指令/描述，不代答。图像失败、部分词块、动作未落稳均不能冒充完整示范；音频绑定原请求，完成任务后的取消仍保存。
- 内容 `5.0.0-dev.1` / schema 5 / `learning-observation-v2`；任务目标、技能维度、帮助/答案曝光、实际结果与回访分开。成人回顾给具体事实，不给掌握率。v4 冻结 decoder 和旧线性 decoder 仅 historical；原文备份、导出、显式重开，不猜测旧曝光或升级旧成绩。

## 清理与审查

业务编码前完整阅读 AGENTS/CLAUDE、README、01–05、07–12、WP05 及动作追加计划，先提交文档清理。旧状态归档、旧 PR 状态/唯一 mat/固定题数/两套入口/独立组句/示范定义冲突已修订；[WP06](work-packages/WP-ANIMATED-PLAY-LEARNING-06.md) 是唯一有效清单。旧证据见 [historical WP05](archive/status-through-shell-05.md)，不沿用其 PASS。

双轴只读审查的具体问题已修复并复核：音频终态丢失、父子重复位移、示范缺图/词块未曝光却记完整、找物反馈泄露答案、bag/hat 指向 cat 的教学文案。工程完整走查还修复包内物品拦截背包点击、收纳表现悬空、手机对象偏小和重复试验反馈残留。工程走查不等于真实儿童研究。

## 本轮命令与证据

| 命令/检查 | 实际结果 |
| --- | --- |
| `npm ci` | PASS，26 installed / 0 vulnerabilities，依赖与真实 lockfile 未改 |
| `npm test` | PASS 52/52，含旧档/原子性/语义/音频终态/部分帮助 |
| `npm run typecheck` / `npm run typecheck:domain` | PASS |
| `npm run build` | PASS，JS 321.91kB / gzip105.98kB，历史 decoder 延迟块24.09kB / gzip9.50kB |
| `npm run check:resources` | PASS，字节/哈希/格式/尺寸/引用校验 |
| `npm run check:release` | BLOCKED（实跑 exit 1），首个缺失/未审核资源 `bag`；未降低门槛 |
| `npm run test:browser` | PASS 16/16，正常首页全主线/六变体/组句/存档/触控键盘/异常；未注入通关状态 |
| 原生桌面后台切页 | PASS，独立 Chromium 临时会话实际 hidden=true / moving=0，恢复后世界一致；默认驱动的虚拟焦点尝试不计通过 |
| `git diff --check` | PASS |
| 双轴代码审查 | 具体报告问题均修复；静态审查，不冒充独立浏览器/儿童验收 |

[证据索引](evidence/animated-play-learning-06/README.md) 含正常速度动作录屏、80/350/650/950/1450ms 过路采样、换父节点首帧数值、示范与实际学习记录、手机/平板/桌面截图、环境与完整源 SHA。测试异常 fixture 只用于明确的旧档/损坏/网络失败用例。

性能在同一 Mac14,3 / macOS26.5.2 / Chromium153.0.8010.12 headless、390×844、CPU4x、同一 cat/bag 后 120 次拖动输入场景各三轮。LayoutCount 每轮 122→3，style mutations 238→120；样式重算次数未减少，帧间隔中位数仍约16.7ms。只证明此场景布局工作减少，不宣称 FPS 或真机体验提升；[原始前后记录](evidence/animated-play-learning-06/README.md#同条件性能前后对照)。

## 未执行、阻塞与下一步

- NOT_RUN：素材权利正式审核、正式录音与发音听审、教研验收、实体 iPhone/iPad/Android/Safari、真实儿童试玩、公网部署。所有资源审核仍 PENDING。
- NOT_RUN：运行时 Provider（本包范围外）；开发内置图像生成的真实资产来源已登记，不能把它当运行时教学 Provider 验证。
- BLOCKED：正式发布资源门槛。其余已授权工程工作没有因外部审核而跳过。
- 动作边界：四帧步态和有限姿态，不是自由物理移动/骨骼系统；开包生成图与旧闭合图有轻微比例差，现有 512px 欢呼图未冒充高清 master。
- 远端四个 Actions workflow 只读核对为 active，本包没有改动文件或开关；本地 PASS 不预填 CI 结果。
- 下一包尚未分配；优先用真实设备、正式音频/教研和儿童观察校准现有玩法，再决定工程迭代。不自动添加平台、账号、后台或新引擎。
