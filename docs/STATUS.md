# 项目状态 · 初始化基线

更新：2026-09-16。起始仓库为空；首个 README 提交为 d5065fb4186fa508be749bcbafd9835e61b75884。本文件随初始化实现一并提交；实际最终 SHA 以 Git 历史为准。

## 已交付

完整产品/玩法/交互/技术/内容/AI 工坊/教研/测试发布规格；AGENTS.md 与 CLAUDE.md；六个开发工作包的路线图及 WP-01 详细任务；两套启动提示词；设计说明和 AI 使用记录模板。

React / TypeScript / Vite 工程结构、开发验证页面、确定性 World 状态内核、十二挑战十三步的世界效果草案、Node 原生测试、CI 配置和 PR 模板。验证页用调试按钮执行状态命令，不是孩子可玩的最终界面。

## 实际验证

| 检查 | 状态 | 说明 |
| --- | --- | --- |
| npm test | PASS | 本地 Node 22.16.0，16 项通过、0 失败；14 项领域与 2 项世界路径检查 |
| npm run typecheck:domain | PASS | 本地预装 TypeScript 5.8.3，仅领域内核；不冒充 package.json 中 6.0.2 的完整类型检查 |
| npm 依赖安装/锁文件 | BLOCKED_LOCAL | registry.npmjs.org DNS 解析失败；未伪造 package-lock.json |
| npm run typecheck / build | BLOCKED_LOCAL | 缺少完整依赖，未声明全应用构建通过 |
| GitHub Actions | 配置已提交 | 运行结果需实际查询；此处不预填 PASS |
| 浏览器/真机/正式音频 | NOT_RUN | 没有已验证的设备与教学音频证据 |
| 真实 Provider/教研/儿童试玩 | NOT_RUN | 未调用运行时模型；没有真实审核和试玩记录 |
| 发布/比赛提交 | NOT_DONE | 未配置公开体验站点，仓库链接不是游戏链接 |

测试范围与源文件 blob 哈希见 [初始化验证记录](evidence/bootstrap-validation.md)。

## 尚未实现

真实字母盘、拖放、GameSession/step runner、步骤与 attemptId 去重、教学反馈、存档恢复、完整十二关 UI、正式音画、内容解析/审核发布、在线工坊、真机验收和正式部署。

世界内核只拒绝不合法物品转换，不负责当前题目和步骤顺序。测试中的正确路径模拟不是生产会话引擎。尤其禁止用“领域测试通过”宣称 s04b 不能被 UI 绕过；WP-01 必须实现真实步骤守卫。

## 下一步

进入 [WP-01](work-packages/WP-01.md)，一个 agent 为实现负责人，另一个独立审查或领取不冲突任务。先解决联网依赖锁定和真实 map→mat→铺路→map 切片，不扩建平台，不因缺运行时模型 Key 停止主线。
