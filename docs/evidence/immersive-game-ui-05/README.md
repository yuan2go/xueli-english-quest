> HISTORICAL：旧沉浸式 UI 分支的交付材料。已由 WP-WEB-GAME-SHELL-05 的单一正式入口取代；不得按此文重新执行旧计划或将历史 PASS 当作本轮验证。原代码及测试见 `e4495d2be33cd473f81f25c5ef78b5c2cf11a695`，原状态见 `docs/archive/immersive-game-ui-05-status.md`。

# 整屏绘本冒险 · 本轮浏览器证据

2026-09-20，WP-IMMERSIVE-GAME-UI-05。截图全部来自正式 `/` 的实际 HTTP 操作，生产构建由 Playwright 管理的 `http://127.0.0.1:4174/` 提供。主线和活动通过页面按钮/字母/词块/拖放进入，没有注入通关世界。图片关闭有限动画以捕获稳定画面；不代表动态效果、真机或儿童验收。

## 直接看结果

- 标题：[桌面](desktop-title.png)、[手机](phone-title.png)、[小屏](small-phone-title.png)、[横屏](landscape-title.png)。
- 探索：[手机](phone-exploring.png)、[桌面](desktop-exploring.png)、[平板](pad-exploring.png)。
- 临时工具：[桌面拼词](desktop-spelling.png)、[手机组句](phone-sentence.png)、[小屏拼词](small-phone-spelling.png)、[短横屏拼词](landscape-spelling.png)。
- 实际纸张过路：[平板](pad-crossing.png)、[小屏](small-phone-crossing.png)。
- 真实布置结局：[手机 cap + hat 收包](phone-ending.png)、[桌面 hat + cap 留垫](desktop-ending.png)、[短横屏](landscape-ending.png)。
- 从故事解锁并实际完成的活动：[帽子搭配](activity-dress.png)、[背包找物](activity-find.png)、[野餐小帮手](activity-helper.png)。每项两个变体都有 HTTP 操作见证。

## 本次路径与检查

- 五种视口：360×640、390×844、1024×768、1440×1000、640×360。从标题进入，拼 cat 唤醒、找包、取消行动、开包、独立地图不显示完整词、收起工具不改世界、打开手记并恢复焦点。断言整屏场景尺寸、提交可达和无页面溢出。
- 手机完整主线使用 hasTouch/isMobile 浏览器上下文：早期戴帽、开合包、收纳/取出 → 地图换垫 → 实际拖到墨路 → 收回同纸恢复 map → 草地组句 → 听音找物（显式文字辅助） → 个人布置与回访 → 结局/刷新/记录。该路径无 pageerror、console error 或 HTTP 4xx+。
- 桌面反向准备顺序、真实组句重排/撤回、另一帽子搭配、限额制作和把路线图摆到新垫子上。
- 短横屏完整跑通纸张过路与野餐句子、结局；展示工具时世界仍可点选。
- 平板解锁三个短活动、完成每种两个变体；刷新保留当前局、退出保留主线布置。
- 360×640 / 1024×768 经 CDP touch 操作字母，验证 touchCancel、落空、键盘替代、后台暂停/焦点约束与旋转取消。
- 显式故障注入仅用于资源失败、音频失败、损坏档和存储拒绝回归，不用于主线完成证明。

最终 `npm run test:browser`：PASS 11/11，53.8 秒。另有 `npm test` PASS 43/43、typecheck/domain/build/resources PASS；完整命令见 STATUS。

本轮修复过的实际失败：自动展开行动挡住下一物品；猫在过路/活动中挡住纸张；低横屏背包遮住已铺纸张；touch 按下样式覆盖居中 transform 导致点击目标移动。修复后重跑相应真实路径及最终完整套件，没有强制点击、跳过用例或放宽领域规则。

素材/录音/教研待审核，`check:release` 仍 BLOCKED（bag 未审核）。真机 iOS/Android、Safari、真实儿童试玩、Provider 与公网部署均 NOT_RUN。本轮仅证明实现和列出的本地浏览器路径，不证明学习效果或正式发布就绪。
