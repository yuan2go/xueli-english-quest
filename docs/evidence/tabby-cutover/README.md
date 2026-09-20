> **Historical evidence**：仅证明本目录对应的历史版本；不是当前 UI/流程规范，也不是 SHELL-05 的验证结果。

# 狸花猫正式 UI · 本轮运行证据

2026-09-19，WP-TABBY-ART-UI-CUTOVER-01。本目录截图来自正常 HTTP 入口的真实 React 页面与真实点击/触控，没有注入进度或调试跳关。旧存档兼容测试只替换正常游玩得到的 envelope 哈希，命令日志保持原样。

## 入口与可追踪交付

- 正式入口：`index.html → src/main.tsx → src/App.tsx`。在本工作树运行 `npm ci && npm run dev -- --host 127.0.0.1 --port 5176`，打开 http://127.0.0.1:5176/ 。这是本地入口，未部署公网。
- 最新 main 基线：`60c30f06d006a2a3b18818fc0f9beb1ab9fc87d8`；原起点 `fbd322b1efd0ce13786af1d70ce0cccffc21d313`。按用户追加指令合并 main，合并提交 `451ef210348e91806e9222b8aaf28ee0301c143b`，没有回退或强推。
- 资产独立提交并推送：`955ad10914a451bbef09317699675255cc87e38b`。UI 实现提交：`2236aa7e4eae6d3125328d59b0de5435de92a9d9`。其后的修复/证据提交由 PR head 标识。
- [页面参考、原生 master 和来源](../../../design/tabby/README.md)；[唯一图片登记](../../../src/content/visual-assets.ts)；[runtime](../../../public/assets/game/tabby/)。四张参考原生 1672×941；三张场景 master 1536×1024；角色/大部分道具原生 1254×1254，地图 1477×1065。不是截图裁切或插值高清。
- 12 张 runtime 共 1,689,420 字节；9 张真实透明 Alpha（0–255），3 张不透明场景。原始确认欢呼姿态仅有 512px WebP，master=null，结局最大 220 CSS px。新建三种角色姿态可覆盖待机、思考/纠错、行动/教学，不把欢呼用作默认姿态。

## 本轮验证

| 命令/证据 | 实际结果 |
| --- | --- |
| `npm ci` | PASS，真实锁文件安装 26 包，0 vulnerabilities，依赖/锁文件未变 |
| `npm test` | PASS 36/36，0 skipped |
| `npm run typecheck`、`npm run typecheck:domain` | PASS |
| `npm run build` | PASS，正式 Vite 生产构建 |
| `npm run check:resources` | PASS，文件、格式、字节、哈希及故事路径 |
| `npm run test:browser` | PASS 10/10；生产 HTTP 127.0.0.1:4174 |
| 子路径实际生产构建 | PASS；`vite build --base /wordspell/ --outDir /tmp/wordspell-tabby-base`，同目录 `vite preview --base /wordspell/ --outDir /tmp/wordspell-tabby-base --port 4178`；[实际请求记录](review/http-evidence.json) |
| Pillow 实际解码 | PASS，27 个参考/master/runtime 均解码；透明素材在浅纸/墨绿合成上人工看过边缘 |
| `npm run check:release` | BLOCKED，退出 1：`发布资源缺失或未审核 bag`；没有放宽门槛 |

全主线从 Start/Tutorial 到 Result：错误 mat → 修改为 map、Hint、重听、暂停/恢复、map→mat→铺路→map、其余挑战、真实练习记录。两处铺路边界刷新、确切旧版 3.1 存档备份恢复、演示/辅助证据、音频取消/旧回调/失败、损坏存档确认/导出、存储拒绝、初次与晚到的资源错误/重试均已覆盖。保留自由野餐全部三活动、取出/换帽/可逆变形/退出隔离/恢复/重置/重玩变体。

视口：390×844 触控完整主线与野餐；1024×768 平板与 1440×1000 桌面核心路径；360×640 小手机、旋转、多指/取消、落空、键盘、弹窗焦点及 reduced-motion。另在 1440×1000 子路径构建从正常入口完整通关。所有 12 张选定图片成功解码；正常路径没有旧 SVG 请求、图片 4xx 或 pageerror。故障注入中的失败是预期测试行为。

## 参考 vs 实际 React

对照的是构图/层级/身份/可操作区域，不把参考图里的英文、装饰叶片或木牌硬贴进页面。中文任务、进度、字母和所有控制为 DOM。桌面保留书页双栏，手机按任务需要垂直排列和滚动。

| 页面/状态 | 设计参考 | 本轮实际截图 / 复核 |
| --- | --- | --- |
| Start | [Start](../../../design/tabby/references/start.png) | [桌面](review/desktop-start.png)：纸页入口、狸花猫/地图独立层、真实开始/继续状态 |
| Tutorial | [Tutorial](../../../design/tabby/references/tutorial.png) | [桌面](review/desktop-tutorial.png)：纸页 overlay、三步真实操作说明，演示证据不等于独立完成 |
| Game | [Core Game](../../../design/tabby/references/core-game.png) | [桌面](review/desktop-game.png)、[手机](flow/phone-game.png)、[平板铺路](flow/pad-crossing.png)：目标与物品分层，字母可操作 |
| Correct | Core Game 状态 | [桌面](review/desktop-correct.png)：同一 route-sheet 的真实 mat 形态；reduced-motion 直接显示结果 |
| Wrong | Core Game 状态 | [桌面](review/desktop-wrong.png)、[手机](flow/phone-wrong.png)：思考姿态、短期想象、槽位保留；反馈移到下缘，脸与定位器可见 |
| Hint | Core Game 状态 | [桌面](review/desktop-hint.png)：下一步提示，不提前揭露独立听词完整答案 |
| Pause | Tutorial 共用 overlay | [桌面](review/desktop-pause.png)：音量、静音、恢复、首页、确认重开；焦点回原按钮 |
| Result | [Result](../../../design/tabby/references/result.png) | [桌面](review/desktop-result.png)、[手机](flow/phone-ending.png)：真实三页修复/12 挑战、帽子与猫在垫子上、继续野餐 |
| 既有玩法 | Result 共用场景/物品 | [手机摆物](flow/phone-placement.png)、[手机野餐](flow/phone-picnic.png)、[平板野餐](flow/pad-picnic.png) |

已修复实测偏差：手机路线纸遮住湿墨点击面、第三幕猫挡地图、摆物提示遮住物品标签、帽子叠层误用标签白底、结局垫子/角色基线和无作用的按钮、手机反馈遮住角色、减少动画时延迟显示新形态。

Anti-AI-Generic Review：PASS（本轮工程自检）。对象是以上运行页面：没有通用大厅/仪表盘卡片、Glow、粒子或图片拼成整页；有明确的书页场景、字母印块、地图与湿墨目标。装饰服从可读性；实体位置/叠层由真实世界状态投影，纸偶有纸托，容器展开区域用于说明实际内容。此结论不代替用户视觉验收、素材权利审核或儿童试玩。

## 证据上限

真机、Safari、正式录音听审、教研和儿童试玩：NOT_RUN。素材来源有记录，但公开发布的权利/质量审核仍 PENDING；check:release 为 BLOCKED。未启用或修改仓库 CI 权限，远端 Actions NOT_RUN。未调用在线玩法 Provider、未上传字体或密钥。下一包为素材/录音/教研审核与真实设备验收，不重建已通过的确定性玩法。
