# 项目状态 · 完整故事工程可玩 / 发布未就绪

更新：2026-09-17。工作包 [WP-PLAYABLE-STORY-01](work-packages/WP-PLAYABLE-STORY-01.md)，分支 `feat/wp-playable-story-01`。

基线完整 SHA：`080d70d95790ed3c37c188214a4a6b8ffeefc93a`。
已验证实现 SHA：`b037005d8cb50bf18bbc4b94da10172cccdc0131`（此后交接文档提交不改变运行代码；最终交付 SHA 见 PR head/交付回复）。

## 三项独立结论

| 项目 | 状态 | 边界 |
| --- | --- | --- |
| 完整主线工程 | PLAYABLE / 自动化验证通过 | 正常入口走完三幕十二挑战十三步骤，无跳关按钮、无模型 Key、无后端依赖 |
| 正式美术、教学语音、教研 | PENDING / 未具备 | 六张原创临时 SVG＋CSS 场景；六词四句为浏览器开发 TTS；未调用付费生图，未伪称 GPT Image 素材 |
| 公开发布条件 | NOT_READY | 真机、正式资源/教研/授权审核、公开 HTTPS 地址和目标用户试玩未完成；没有部署生产 |

## 已实现

开始/继续/首次教学/确认重开、三幕主线、暂停/音量/静音/回首页、结局和本地练习详情/导出。字母点击、取回、拖动和交换，明确施法；物品 Pointer Events 拖放及点击等价操作。落空、pointercancel、多指与旋转有取消退路；键盘按钮、弹窗焦点循环及 reduced-motion 已验证。

原领域内核不变。唯一会话入口落实步骤、session revision、attemptId 去重与过期守卫；正确提交同步改变世界和学习事件，音画不推进业务。route-sheet 保持身份，cat-card 与同伴独立，picnic-mat 独立创建；第四关必须铺路。已知非目标词仅短暂投影。

内容结构/词表/效果/可达性校验、资源 manifest 与哈希、启动检查与图像失败重试。文字辅助/提示/演示/重听记录分开；既有关卡固定复现 map/mat，不宣称学习提升。存档绑定版本和内容 SHA-256，重放生产命令恢复；s04a/s04b 两个边界经过刷新实测。损坏/不兼容原始数据保留，重开需确认且备份上一局，存储不可用可临时游玩，清除需确认。

## 本次实际验证

环境：macOS arm64；Node 26.3.1，npm 11.16.0；React 19.2.8、TypeScript 6.0.2、Vite 8.3.0，新增 Playwright 1.63.0 / Chromium 153.0.8010.12。原应用依赖版本未升级或降级。

| 命令/检查 | 实际结果 |
| --- | --- |
| npm ci | PASS，真实依赖和锁文件；安装审计 0 vulnerabilities |
| npm test | PASS，24 项、0 失败、0 skipped；包含原有 16 项及会话/资源回归 |
| npm run typecheck:domain | PASS |
| npm run typecheck | PASS（生产 build 内也执行） |
| npm run build | PASS；Vite 报告 JS 233.04 kB / gzip 75.24 kB；CSS 13.65 kB / gzip 3.98 kB |
| npm run test:browser | PASS，6 个实际 HTTP 集成测试；自动启动生产预览 127.0.0.1:4174 |
| 手机视口 390×844 | 正常入口完整十三步、真实 CDP 触控字母交换/铺路、两次恢复、错误/提示、结局/记录；非真机 |
| Pad 1024×768、桌面 1440×1000、小屏 360×640 | 核心切片、键盘、布局与旋转；非真机 |
| 控制台/请求/尺寸 | 完整主线无 pageerror/console error/HTTP 4xx+；视口无横向溢出；字母命中宽度≥56px |
| 故障注入 | 图像请求失败与恢复、语音失败/重试/取消旧回调、存储拒绝、损坏存档保留与确认清除、缺少安全上下文 API 均通过 |
| UI 截图自检 | 已执行，修复手机过高留白、旧投影残留、无关放置区、物品位置文案遮挡、弹窗 Tab；不是美术验收 |
| iPhone/Android/iPad 真机、微信/大陆外网 | NOT_RUN |
| 教研/实际语音听审/儿童试玩 | NOT_RUN |
| 在线 Provider/正式生图 | NOT_RUN；主线不需要调用 |
| 公开发布/比赛提交 | NOT_DONE |

截图、测试边界、Anti-AI-Generic Review 和包体测量方法见 [工程证据](evidence/playable-story/README.md)。CI 已配置 npm ci/类型/构建/浏览器，远端实际运行状态以 PR checks 为准，不用本地 PASS 代替。

## 启动、预览与继续工作

```sh
npm ci
npm run dev -- --host 0.0.0.0
# 浏览器打开输出地址；设计预览为同源 /#design
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:browser
```

生产静态产物在 dist；`npm run preview -- --host 0.0.0.0` 只作本地验证。局域网 HTTP 已兼容缺少 randomUUID/SubtleCrypto 的环境：ID 使用 getRandomValues；资源在非安全上下文按大小/结构校验，安全上下文额外校验 SHA-256；资源单测始终核对 SHA。公开体验仍应使用 HTTPS。

下一步：在 `src/content/manifest.ts` 替换并登记真实审核资源，提升内容版本/hash，执行资源/主线回归；由真实审核者完成教研和美术/授权，再做三类实体设备验收及经授权的公开发布。工坊仍属后续 P1。本包未发现需要修改的既有无关代码问题，原初始化域规则与原测试保持原样。
