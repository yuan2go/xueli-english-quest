# 项目状态 · Gameplay Refoundation 06

2026-09-20：本包 A/B/C 工程范围已在独立分支完成。未自动合并、未部署；外部 D 阶段验收保持独立待办。先前文档交付状态保留于 [原文快照](archive/status-at-74ea735.md.txt)。

- 仓库：yuan2go/xueli-english-quest；分支 `codex/gameplay-refoundation-06`。
- 刷新后的 baseline / origin/main：`74ea7358ce41738d16bfa5dab29e94f581605a5c`。原主工作区干净，未改其分支或内容；未合并 #11/#12 的旧动画实现。
- 最终运行代码与浏览器检查 SHA：`7f42995006884e3bf17ef9c61a17b3f64557ba5e`。
- 对应 src tree：`2b9bb458e87681817521dd0c2d906b3c904b23f9`。其后交付提交只更新文档与证据；最终 full SHA 以 Git/PR head 和交付回复为准，避免自引用伪造。
- 内容 `paper-rescue / 6.0.0-dev.2`，规则 `rescue-1`，存档 schema 6 / `xueli.quest.v6`。

## 已实现行为

正式 `/` 已替换旧页面，入口为 `App → GameShell → runQuest → domain.transition`。R1 从首页可通过大箱支撑高把手或同猫缩小穿洞开内把手取篮。尺寸参与净空、承载、触及高度、容量与搬运；拖动提出动作，不能穿墙或取出关闭容器中的物品。目标读取世界，不读取参考操作顺序。

R2 允许缩小苹果、改变背包或制作箱子，容器与内容物一起搬运；big 容器过不了窄拱门。R3 依据英语请求区分 in/on，语言成立但未满足请求与世界受阻各自反馈；描述不移动物品。真实结局读取交付关系与小猫抵达，雨后 R1-R 封洞，必须调整解法。固定 seed/variant 刷新不改变。

魔法工坊有词义小样、WordSpell、句型说明、辅助/独立指令与描述、独立拼写；词语册有已遇词、语音、例子与实际记录。新知识先看意义；独立拼写隐藏目标英文并使用全字母键盘。词块实例 ID 与任务绑定；接受大小写、标点、已声明句型/顺序变体与选中对象的 it。短句 Open the box. 可执行。

世界撤销保留帮助、尝试、日志和历史完成；当前目标重新计算。关闭工具、重试、重开不能把已给答案洗成独立；独立拼写重开含答案工具和词义会永久记录 text 支持；工坊/章节/回访世界隔离。保存严格白名单、版本重放与投影校验；旧/未知/坏档保留原文、备份读回、可导出和内存降级。不把旧成绩映射到新章节。旧路线纸、主角/纸偶和独立野餐垫的 46 个核心回归继续执行。

确认的狸花猫资产继续使用；box/door/basket/apple 为本次原创 SVG，逐件写入唯一 visual registry，hash/尺寸/字节/master 均检查，HTTP 正式路径实际引用。稳定实体动画消费提交结果，支撑高度可见，子物品跟随父路径；关闭容器隐藏子物品。取消、多指、旋转、后台、键盘、reduced-motion、音频和资源失败均有测试。没有新增运行时 AI、账号、后端或依赖。

## 实际检查与退出码

环境：macOS 26.5.2 arm64，Node v26.3.1，npm 11.16.0；Playwright Chromium headless，正常 HTTP `http://127.0.0.1:4174/` 生产构建。浏览器没有注入新章节完成状态；旧档与故障用例明确使用夹具/故障注入。

| 命令 | 结果 | exit |
| --- | --- | --- |
| `npm ci` | PASS，真实 lock，0 vulnerabilities；package/lock 与最终代码相同 | 0 |
| `npm test` | PASS，59/59，0 skipped；含原 46 个回归 | 0 |
| `npm run typecheck:domain` | PASS | 0 |
| `npm run build` | PASS，包含完整 typecheck | 0 |
| `npm run check:resources` | PASS，新旧资源与章节引用校验 | 0 |
| `npm run check:levels -- --write` | PASS，6 个检查均输出正式内核 witness | 0 |
| `npm run test:browser` | PASS，9/9，13.5s | 0 |
| `git diff --check` | PASS | 0 |
| `npm run check:release` | BLOCKED：发布资源缺失或未审核 box；门槛未降低 | 1 |
| GitHub Actions 权限读取 | `enabled:false`，远端 CI NOT_RUN；未更改开关 | 0 |

完整日志和逐命令代码 SHA 见 [checks.json](evidence/gameplay-refoundation-06/checks.json)。旧页面专属浏览器断言完整归档至 tests/historical-shell-05；[替代覆盖说明](../tests/historical-shell-05/README.md)和 G01–G12 映射见 [证据索引](evidence/gameplay-refoundation-06/README.md)。

## 轨迹、视觉与性能观察

- R1 支撑方案：认识/拼出 box → 搬到门外 → big → 小猫 on box → Open door → 搬篮子回集合点。
- R1 洞口方案：同一小猫 small → 经洞到门内 → 开内把手 → 搬篮子回集合点；UI 实际还演示了恢复原大小。
- R2 HTTP：打开 bag → 缩小 apple → 放入 → 关闭 bag → 带整个容器过拱门。另有规则检查验证更换容器等合法替代，不封禁额外解法。
- R3 HTTP：开门 → 错请求关系的合法行动/正确描述仍 task mismatch → 正确请求交付 → 真实结局 → 工坊/词语册往返 → 封洞回访 → 箱子方案 → 刷新。

全部 witness 含内容版本、variant、预算、结束原因和动作，见 [witnesses.json](evidence/gameplay-refoundation-06/witnesses.json)。预算不足明确 UNKNOWN。实际验证视口 360×640、390×844、768×1024、1024×768、1440×1000 和旋转；这些是模拟视口，不能替代手机 Safari 或实体软键盘。

相同 Chromium、390×844、CPU 限速 4、三轮 resize/move/35 采样拖动：旧阶段 `d45bb82ea23057ccb369d6c777c488b90e823929` 单次记录 layout 129 次、17.695ms、script 162.067ms；最终记录见 performance-final.json。两次均未观察到 long task。布局、工具与动画也有变更，只有单次本机观察，不据此宣称统计性能提升、60fps 或真机流畅。

工程试玩修复了真实失败：短句兼容边界、SVG master 校验、重复打字工具折叠、工具关闭焦点、收纳内容物遮挡父容器、手机抽屉挡场景，以及同一实体动画打断后的终态。已按最终代码重走；不把 agent 试玩当作儿童研究。

## 六项结论与下一包

| 结论 | 状态与边界 |
| --- | --- |
| ENGINEERING_READY | YES：本包工程范围通过本地必要检查，准备 PR 审查；远端 CI 未运行 |
| VISUAL_COMPLETE | NO：正式场景/动作/资产和模拟视口自检已完成，独立人工视觉验收 PENDING |
| DEVICE_VALIDATED | NO / NOT_RUN：实体 iPhone Safari、Android Chrome、iPad Safari及真实软键盘 |
| TEACHING_REVIEWED | NO / PENDING：逐词句/图义/发音/难度审核与正式录音未完成 |
| FUN_VALIDATED | NO / NOT_RUN：没有目标儿童观察或学习效果证据 |
| PUBLIC_RELEASE_READY | NO / BLOCKED：资源权利/录音/教研与设备条件未完成；公网部署 NOT_RUN |

下一包是基于这一已可玩的章节完成真实视觉、权利/教研/录音、设备和儿童观察，再按实际问题修订。没有读取或改动现有托管设置，不对已有站点是否存在下结论，也未新建或部署第二个网站。运行时 Provider 不在范围，调用次数为 0。
