# 项目状态 · 主线体验闭环可玩 / 发布未就绪

更新：2026-09-17。[WP-STORY-EXPERIENCE-02](work-packages/WP-STORY-EXPERIENCE-02.md) 接续已合入的 WP-PLAYABLE-STORY-01。独立分支 `feat/wp-story-experience-02`；本包只做本地提交，未 push、合并或部署。

实际 origin/main 基线：`6b06c9efa149ea3643b3957d98a349b845b9c7fb`。已验证运行代码 SHA：`5ff8551157ec3f1246d0e4c43205c0794a0a2b6c`。原工作树与独立美术分支未修改。其后提交仅整理文档与截图，最终 SHA 见交付回复；历史验证不替代本次结果。

| 维度 | 实际状态 |
| --- | --- |
| 工程实现 | 完整三幕、十二挑战、十三步骤可玩；造物→变物→使用→角色/场景响应→三页修复贯通 |
| 自动化 | 29 项 Node 测试、7 项真实 HTTP 浏览器测试通过；类型检查、领域检查、构建通过 |
| 正式美术/教学音频/教研 | PENDING：现有临时 SVG、CSS 表演、浏览器开发 TTS；正式录音接入合同已支持，不代表已获得正式录音 |
| 真机/儿童试玩/听审 | NOT_RUN；浏览器触控与视口模拟不冒充真机或教学效果 |
| 公开发布 | NOT_READY；发布检查实际拒绝未审核资源，未创建公开部署 |

## 本包实际变化

每步成功原子提交 World、步骤和证据后，运行绑定 eventId/entityId 的有限演出。词尾变化、目标词音、形态与用途分阶段呈现；可跳过/暂停/后台/超时，刷新直接进入稳定态。绘本修复从正确事件派生，没有第二套修复存档。

场景内背包、垫子、湿墨提供语义目标，点击与 Pointer Events 拖放共用命令；不提供不自然关系，不暗示唯一正确目标。s03 的 mat 投影和小猫休息误会只在表现层，输入保留、重复缩短、离页清理。教程随实际字母操作推进，摆物时再教学；帮助按错误类型，示范可观察但不代做。

儿童结局保留真实野餐、三页修复和重听词卡；成人摘要按词/题型/帮助/混淆/固定回访汇总。音频观察区分来源、任务、资源版本及播放状态，未播放不记成已听，音频不判题。帮助暴露与观察通过同一日志恢复。

资源支持 SVG/PNG/WebP 和 MP3/WAV/OGG，校验路径、字节、哈希、元数据、引用与实际可操作路径。开发/发布策略分开。pack 升至 `3.0.0-dev`、save schema 2；旧档保留并可导出/确认重开，不猜测迁移音频证据。

## 本次实际验证

macOS arm64，Node 26.3.1 / npm 11.16.0，沿用 React 19.2.8、TypeScript 6.0.2、Vite 8.3.0、Playwright 1.63.0。`npm ci` 实际安装 26 包，审计 0 vulnerabilities；依赖和锁文件未升级。

| 命令/检查 | 结果与边界 |
| --- | --- |
| `npm test` | PASS，29/29，0 skipped；原关键断言保留，替换“音频必须为空/SVG 固定格式”的过时前提 |
| `npm run typecheck` / `npm run typecheck:domain` | PASS |
| `npm run build` | PASS；JS 250.49 kB / gzip 81.33 kB，CSS 19.66 kB / gzip 5.50 kB，HTML 0.58 kB |
| `npm run check:resources` | PASS；磁盘格式/字节/哈希、引用、生产转换路径与输入可操作性 |
| `npm run check:release` | BLOCKED，实际拒绝 `cat` 未审核；这是正确执行门槛，不是发布通过 |
| `npm run test:browser` | PASS，7/7；最终演出首帧修正后另跑 `--grep 'result timing'` 1/1；自动启动生产 HTTP `127.0.0.1:4174` |
| 手机 390×844 | 正常入口完整十三步、真 DOM 字母操作、CDP 模拟触控拖放、场景点击、两处铺路恢复、结局和记录 |
| Pad 1024×768 / 桌面 1440×1000 / 小屏 360×640 | 核心切片、键盘/旋转/弹窗焦点，无横向溢出，字母≥56px |
| 新风险与故障 | 无回调超时、跳过、演出后台恢复、错词重复抑制、帮助示范恢复、正式录音边界失败/取消、资源与存储失败退路均有覆盖 |
| 控制台/请求 | 完整主线无 pageerror/console error/HTTP 4xx+；故障用例的注入失败单列 |
| UI 自检 | 对真实截图执行 Anti-AI-Generic Review 并修复；不是正式美术或用户验收 |

真实截图与限制见 [本包证据](evidence/story-experience/README.md)。保留历史 [浏览器 CI 补丁](evidence/playable-story/browser-ci.patch)，本次未改凭据或工作流；远端 CI 本包 NOT_RUN。没有用本地 PASS 冒称远端已通过。

## 启动和继续入口

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5175
# 首页 http://127.0.0.1:5175/；共享组件预览 /#design
npm test
npm run typecheck
npm run build
npm run check:resources
npm run test:browser
```

工作树：`/Users/yuan/projects/xueli-wordspell-story-experience-02`。本次已启动并打开首页。HTTP 局域网缺 SubtleCrypto 时不执行浏览器哈希，仍检查格式/字节/解码尺寸；Node 资源检查始终核对 SHA-256。首次离线加载、iOS/Android/iPad 实机、微信、大陆公网、正式授权/听审/儿童试玩均未验收。

下一步是按 manifest 接入经审核资产、教研及真机试玩，再经授权发布。工坊仍是后续独立包，最小接口条件见本包交接；当前没有模型接口、后台、遥测或新增付费资源。
