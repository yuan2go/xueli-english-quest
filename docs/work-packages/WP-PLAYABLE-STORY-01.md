# WP-PLAYABLE-STORY-01 · 完整故事主线与纸上小径

> **Historical delivery / 历史交付**：本包保留原版本范围和证据，不再授权新开发。固定挑战/步骤、旧页面与旧 UI 接入点均非当前产品规范。现行规则见 01–05、11/12，当前包为 [WP-WEB-GAME-SHELL-05](WP-WEB-GAME-SHELL-05.md)。

2026-09-17；实施分支 `feat/wp-playable-story-01`。
基线：`080d70d95790ed3c37c188214a4a6b8ffeefc93a`。开始时本地 main、origin/main 与设计分支均为该 SHA；不存在 design/、docs/design/ 或可读取设计交接资产。复用 docs/01～05 和已有世界内核；保留并提交前次真实安装生成的锁文件。

## 覆盖关系

- WP-01：真实字母点击/取回/交换/拖放、显式施法、map→mat→铺路→map、步骤/revision/attempt 守卫、两处恢复、资源与音频退路。
- WP-02：从正常开始入口到结局的三幕十二挑战十三步骤；四种底层操作；独立 cat-card、两个纸垫实例、固定延迟复现、逐级提示/演示/记录；内容结构与生产运行路径验证。
- WP-03 工程部分：纸页 tokens、复用组件、手机/宽屏布局、暂停/重开/记录、音频服务、资源哈希/回退、键盘焦点、reduced-motion、真实 HTTP 浏览器证据。
- WP-03 剩余门槛：正式美术、六词四句教学录音、教研和素材审核、iPhone/Android/iPad 真机；全部未冒充通过。
- WP-04/05：未扩建工坊、账号或学习平台；未部署和提交比赛。

## 验收与继续入口

精确结果、启动命令和限制在 [STATUS](../STATUS.md)，截图和自检在 [工程证据](../evidence/playable-story/README.md)。自动化完整主线使用 UI，不写入预制通关状态；仅故障用例注入损坏存档、不可用 storage/语音和资源失败。

后续资源替换在 `src/content/manifest.ts`，内容在 `src/content/story.ts`，视觉在 `src/ui/tokens.css` 和正式共享组件。改变内容/资源时提升版本、重新计算 content hash，并跑相应回归；不要用审核占位人名或临时文件名代替审核记录。
