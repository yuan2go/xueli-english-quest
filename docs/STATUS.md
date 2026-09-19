# 项目状态 · 美术与玩法已合并 / 合并后未验证 / 发布未就绪

## 2026-09-19 · 免测试合并与全分支发布

本轮按仓库负责人的明确要求完成 Git 提交、推送和 PR 合并，不执行测试、类型检查、构建、浏览器或资源检查。下方 2026-09-17 的 PASS 均为历史结果，不适用于本轮合并后的代码。

- 起始本地与远程 main：`cb7c59017296ab197e58b8c72acf25f5c6ec4563`。原有 4 个本地分支均已包含在该 main；3 个原有工作区均干净，无待提交代码。
- 现有 [PR #3](https://github.com/yuan2go/xueli-wordspell/pull/3) 原有 3 个提交；在独立工作区解决 `src/ui/Scene.tsx` 冲突，产生合并提交 `7f5f6582f56962c90bbf2e807902d8a8b66b596c`，没有重写既有提交。
- PR #3 已通过指定 head SHA 的普通 merge 合并，远程合并提交为 `19b04f725fe3c8d0a416de9b590eca8374655869`，本地 main 随后 fast-forward 到同一 SHA。
- 执行全分支推送后，当时的 5 个本地分支与同名远程 SHA 全部一致，且都已被 main 包含；补建远程 `feat/wp-playful-game-03` 和 `feat/wp-story-experience-02`。本交付文档通过后续独立 PR 发布，最终 SHA、数量和全分支复核以本轮交付回复为准。
- 已关闭本仓库 GitHub Actions；API 回读为 `enabled: false`。关闭前未发现运行中的工作流。

合并后的代码接入 PR #3 的 WebP 词汇图像、场景背景、角色表情和样式，同时保留 main 的固定种子排列、同实例变形前后投影、过路后的稳定位置、按成功事件修复场景、物品词形属性和拖动名称反馈。地图方向留在场景说明内，避免新样式恢复已移除的悬浮提示。领域转换路径和既有野餐/短活动代码沿用 main。

| 本轮命令或证据 | 结果 |
| --- | --- |
| `git fetch --all --prune`、所有分支/工作区/PR 清点 | 已执行；初始 1 个待合并 PR，4 个本地分支、3 个干净工作区 |
| `git diff --check`、`git diff --cached --check` | PASS，仅 Git 差异空白检查；冲突文件已人工逐段合并 |
| `git -c core.hooksPath=/dev/null commit` / `push --no-verify` | 已执行；本轮测试钩子不运行 |
| `gh pr merge 3 --merge --match-head-commit 7f5f6582f56962c90bbf2e807902d8a8b66b596c` | MERGED；GitHub 返回上述 `19b04f7…` 合并提交 |
| `git -c core.hooksPath=/dev/null merge --ff-only origin/main` | 已执行；本地 main 同步至 PR #3 合并结果 |
| `git -c core.hooksPath=/dev/null push --all --no-verify origin` | 已执行；全部当时存在的本地分支已推送 |
| `gh api repos/yuan2go/xueli-wordspell/actions/permissions` | `enabled: false`；远程 CI NOT_RUN |
| `npm test`、`npm run typecheck`、`npm run typecheck:domain`、`npm run build` | NOT_RUN，用户要求 |
| `npm run test:browser`、`npm run check:resources`、`npm run check:release` | NOT_RUN，用户要求 |
| 浏览器交互、视觉复核、真机、录音听审、Provider | NOT_RUN；本轮无对应新增证据 |

限制与下一包：合并完成不证明合并后运行正确、视觉完成度、素材权利或发布就绪。PR #3 中已有的 `APPROVED` / `APPROVED_RUNTIME` 元数据按原内容保留，不代表本轮进行了审核。下一包应在获得验证授权后检查合并后的真实交互、资源与视觉效果，再完成素材/录音/教研审核、真机及儿童试玩；公开发布仍为 NOT_READY，AI/Provider 仍暂停。

## 历史记录 · 2026-09-17 玩法包验证

更新：2026-09-17。[WP-PLAYFUL-GAME-03](work-packages/WP-PLAYFUL-GAME-03.md) 已完成本地实现与本次回归；AI 工坊、Provider、成人编辑器及预算系统暂停，未新增接口。

本次固定的实际 origin/main 基线：`0ff79584a96da53e512a6702c7987d4ab65e1d20`。原体验包 `28231ec765c4f8d5026d8b63bfe26aafd2c996b0` 已在 main 祖先链，设计恢复 PR #2 也已合入；旧工作包中的未推送/未合并是当时历史状态。本包独立分支 `feat/wp-playful-game-03`，没有 push、PR、合并或部署。已验证实现 SHA：`20775514e6b1dd347e0e639c93640f10349aac72`；其后只整理文档/证据，最终完整 SHA 见交付回复与 `git rev-parse HEAD`。

| 维度 | 本次结果 |
| --- | --- |
| 游戏实现 | 原十三步完整主线；通关后拼词找物、打开包/取出、两种帽子任选与换装、地图/纸偶双向变形、可恢复布置；三个独立短活动 |
| 自动化 | 34/34 Node 测试、8/8 HTTP Chromium 回归；类型、领域类型、构建、开发资源检查通过 |
| 正式美术/录音/教研 | PENDING。沿用明确标识的临时 SVG 与开发 TTS；已入库 WebP/MP3 尚未被本包冒认为审核通过，也未覆盖并行设计 |
| 真机/听审/儿童试玩 | NOT_RUN。视口与 CDP 触控模拟只验证功能操作，不能证明趣味性/教学效果 |
| 公开发布 | NOT_READY。实际发布检查阻断未审核 cat；未创建公网部署 |

## 已可体验

正常开始→完成三幕→“继续野餐”。自由模式复用六个既有实例，不无限复制；摆放、收纳、取出和换帽真实改变唯一位置。选地图或纸偶→“换字魔法”；占用、被戴着或收纳时先移走/摘下/取出。草地是可逆退路。三个小活动在野餐页下方：帽子搭配、背包找物、野餐小帮手。它们有独立目标、退出、恢复和重玩；找物重玩会换目标，刷新不换当前种子。

普通反馈缩短；关键变形先展示旧形态/位置，再词尾、词音、新物和用途。暂停/跳过/后台/超时落到已提交稳定态。小猫过路后保持对岸位置；道路、树木和野餐区域按真实完成事实修复。手机截图复查修正地图提示遮住物品的问题。

主线指令现在由有限结构定义，另一条已登记指令不能替换后仍判原答案；WAV/WebP RIFF 识别改为固定字节偏移；首次出现不算回访。旧 pack3.0 的确切已知日志可备份后重放迁移，未知/损坏存档不清除。自由玩法不混入主线学习成绩。

## 本次验证

macOS arm64，Node 26.3.1 / npm 11.16.0；实际 `npm ci` 安装 26 包，0 vulnerabilities，未升级依赖或改锁文件。

| 命令 | 实际结果 |
| --- | --- |
| `npm test` | PASS 34/34，0 skipped；保留原关键断言，新增可逆玩法、活动不同结果/顺序、去重/隔离、语义错配、RIFF 反例与回访/兼容恢复 |
| `npm run typecheck` / `npm run typecheck:domain` | PASS |
| `npm run build` | PASS；JS 274.14 kB / gzip 88.71 kB；CSS 24.53 kB / gzip 6.46 kB；HTML 0.58 kB；dist 磁盘占用 384 KB（含 public 资源，不是网络首开测量） |
| `npm run check:resources` | PASS；磁盘字节/哈希/格式/引用及生产路径；浏览器启动另验图片解码 |
| `npm run check:release` | BLOCKED，退出 1：`发布资源缺失或未审核 cat`，不是测试放宽或发布通过 |
| `npm run test:browser` | PASS 8/8，38.2 秒；实际生产 HTTP `127.0.0.1:4174`，全主线→自由模式→三个活动→恢复→重置；另覆盖两处铺路恢复、音频失败/旧回调、触控取消/落空、多指/旋转、键盘/弹窗 |
| 视口 | 手机 390×844 全流程，Pad 1024×768 核心布局、取出/换帽/暂停/重置；现有桌面 1440×1000 与小屏 360×640 回归保留。模拟，不是真机 |
| 控制台/请求 | 正常全主线路径无 pageerror/console error/HTTP 4xx+；新增玩法路径无 pageerror；故障注入测试有意制造失败。未做真实慢网首开测量 |
| 远端 CI | 本包 NOT_RUN；未改权限/工作流，保留既有 [浏览器 CI 补丁](evidence/playable-story/browser-ci.patch) |

截图及 UI 自检见 [本次证据](evidence/playful-game/README.md)。先前证据保留在原目录，不将旧 PASS 用作本次结果。

## 启动和继续入口

```sh
cd /Users/yuan/projects/xueli-wordspell-playful-game-03
npm ci
npm run dev -- --host 127.0.0.1 --port 5176
# http://127.0.0.1:5176/；组件预览 /#design
npm test
npm run typecheck
npm run build
npm run check:resources
npm run test:browser
```

开发服务器已实际启动。主线无需密钥或网络模型。手机 LAN 非安全 HTTP 缺 SubtleCrypto 时仍验字节/格式/解码尺寸，Node 始终验哈希；正式手机发布需 HTTPS。当前产物带有已入库但尚未接纳的设计材料，开发构建成功不代表发布包审核。下一步是素材接入/授权、录音听审、教研与真实设备及儿童试玩；没有为这些待验收项停止确定性玩法开发，也没有替用户签署验收。
