# Gameplay Refoundation 06 Implementation Plan

执行方式：当前会话单负责人，用户已授权自主设计与完整实施。权威设计仍为 02/05/12，本文件只追踪实施。

**Goal:** 正式首页完成三关、改变条件回访、同规则学习工坊与词语册。
**Architecture:** App → GameShell → runQuest → domain.transition。旧 picnic 写入分支只供历史 decoder/回归，当前页面不加载旧 Shell。尺寸、通道、把手、支撑/容量由有限内容数据定义。
**Tech Stack:** 现有 React / TypeScript / Vite / Node test runner / Playwright，不加依赖。

## Global constraints

稳定身份、单一写入、描述不修改世界、撤销不撤销帮助；原档备份读回/导出；默认独立分支/PR，不合并。G01–G12 和外部审核分别报告。

## A · R1 正式入口

- [x] `src/domain/spatial.ts` 定义位置、尺寸、路径、容纳、支撑和原子动作；`world.ts` 按已绑定版本分派。测试直接拖篮子越墙、够不到把手、载人箱缩小、同实例缩小穿洞。
- [x] `src/content/quest.ts` 声明关卡/词义/配额；`src/game/quest.ts` 实现 revision/session/attempt 守卫和不可洗白事件；`src/game/language.ts` 有限语法及 token 所有权。
- [x] `src/platform/quest-save.ts` schema 6 重放与投影；旧 key 不覆盖。`App.tsx`/`GameShell.tsx`/`Scene.tsx` 切换唯一正式入口，保留输入/音频/资源基础。
- [x] `tests/quest.test.mjs` 和真实 HTTP R1 A/B；规则验证后提交 A。

## B · 章节与学习

- [x] 同内容表添加 R2 容纳/窄口、R3 请求交付/描述、封洞回访。`scripts/check-levels.mjs` 使用相同内核受控枚举并输出 witness。
- [x] 教学示意、属性工具、WordSpell、组句、独立/辅助练习、词语册；主线/工坊/回访世界隔离。R3 结局读物品关系。
- [x] 单调支持和尝试回归；正常首页完整章节与往返后提交 B。

## C · 表现、故障与证据

- [x] 稳定实体有序路径补间，容器带子物品，尺寸/开合/小猫动作；新增原创纸艺 SVG 并写入现有 manifest，资源失败文字替代。
- [x] 触摸/键盘/取消/旋转/后台/reduced-motion、音频/存储失败；保存失败可导出，未来/坏档不覆盖。
- [x] 执行 npm test、typecheck:domain、build、check:resources、check:release、check:levels、test:browser；修复真实失败并登记 exit code。
- [x] STATUS / 工作包 / 02、05、12 / 设计说明 / AI log / exact-SHA 证据；完成本地阶段提交。push/PR 结果以远端回读和交付回复为准，不自动合并。

视觉方向：纸页折叠的围栏剧场，色板纸白 #f7edd8、墨绿 #264f45、叶绿 #89a572、金黄 #d6a64a、莓红 #9c5146。标题用本机圆体/手写后备，正文系统中英字体；场景占主空间、工具是一条打开的纸抽屉。围栏开口与真正可通行路径为主要视觉结构，不用背景整图承载交互。
