# 08 · 必要验证、发布与运行

## 当前命令与证据边界

Node 22.12+；真实锁文件安装 `npm ci`。使用 `npm test`、`npm run typecheck`、`npm run typecheck:domain`、`npm run build`、`npm run check:resources`、`npm run check:release`、`npm run test:browser`。Playwright Chromium 必须已安装；`npm run test:browser` 使用构建产物在本地 4174 端口启动预览。检查结果只见 STATUS，不沿用历史 PASS。

| 层次 | 必要覆盖 | 不证明什么 |
| --- | --- | --- |
| Domain/Application | 身份、主角保护、占用/包含、原子性、幂等/revision、真实过路、任务/目标/语言分离、活动隔离 | 正式 UI 可操作 |
| Save | schema 4 journal 重放与投影核验，旧档备份/导出，损坏/未知拒绝，存储失败 | 云存档或跨设备同步 |
| Shell/Browser | 正常首页三幕和个人结局、六活动变体、点击/键盘/触控/词块拖放、cancel/lost capture/多指/旋转、focus、刷新、资源/语音/存储失败 | 真机触感、内容合格或儿童趣味性 |
| Resource | 单 manifest 的字节/哈希/格式/尺寸/引用、分组加载、fallback/retry、开发语音标记 | 权利、正式录音或听审 |
| 外部验收 | 真实设备、目标儿童观察、教研、素材权利和实际部署 | 不能由工程自动化替代 |

保留旧日志/领域回归以保护历史存档；固定步骤只存在于 historical fixture/decoder。浏览器不注入通关状态、不以修改断言或删用例换 PASS。故障用例可明确注入损坏存档/拒绝存储/失败资源。只因新变更、失败或未解决风险追加检查，不堆快照覆盖率。

## 设备与体验验收

工程基准包括 360×640、390×844、768×1024、1024×768、1440×1000 以及旋转。至少 iPhone Safari、Android Chrome、iPad Safari 的实体设备需记录系统/浏览器版本、操作者、方向和网络；模拟视口/CDP 不替代它们。

从正式入口完整观察 Agency / Causality / Continuity / Manipulation / Juice / Recovery / Pacing / Replayability。错误必须能调整；动画不锁住业务；首次语音、后台返回、滚动和 focus 可用。真实儿童试玩须有适当条件，不编造时长/反馈/学习收益。

## 发布门槛与运行

公开发布要求：当前实现和必要检查通过、资源权利及内容审核真实完成、正式语音可用并听审、目标真机证据、稳定 HTTPS URL 与部署验收。`check:release` 对未审核资源继续失败，不能因本地工程通过而降级。无后台/账号/AI 工坊，在线 Provider 不在当前范围。

部署是单独授权事项。静态 `dist` 与源代码仓库链接分开；Vite dev/preview 只用于本地体验。发布时记录代码 SHA、内容版本和 manifest、base 子路径、缓存/HTTPS/音频检查及回滚版本。回滚保持代码/内容/资源一致，不能自动删除旧档。远端 Actions 的真实开关与运行状态在每轮交付核对，不擅自启用安全或工作流权限。
