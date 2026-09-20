# 04 · 架构与重构边界

版本：Refoundation 06。本文定义运行架构；开工差距和已实施映射见 [12](12-web-game-technical-design.md)，详细协议见 [05](05-content-and-runtime-contracts.md)。只有 STATUS 记录已实现/已验证。

## 技术选择

保留一个 React/TypeScript/Vite 单机 Web 应用。基线 package.json 为 React/React DOM 19.2.8、TypeScript 6.0.2、Vite 8.3.0、Playwright 1.63.0，Node >=22.12.0；这是已读取仓库的锁定选型，不是“最新版本”推荐。继续真实 lockfile 与 npm ci，不为更名或文档更新升级依赖。

采用事件驱动、有限离散空间、受控路径与表现动画。不把 Phaser/Pixi、ECS、物理引擎、微服务、后端或状态管理框架设为前置。若实际测量证明 DOM 表现无法满足需求，再独立比较渲染方案；不能凭“像不像游戏”迁移整栈。

## 唯一执行链

输入 → scoped interaction adapter → 带会话/版本的意图 → Application 解析与守卫 → 同一 deterministic domain.transition → 原子提交世界/事实/记录 → goal/evidence 投影 → presentation cue → 保存。

世界目标与语言结果分开。UI 不直接置 completed，动画不写世界，路径规划不能绕过领域判定，教学判题不调用 LLM。纯描述可以提交观察证据，但世界保持不变。合法且有用的非预设解法按世界目标接受。

## 责任边界

| 层 | 当前入口与目标职责 |
| --- | --- |
| App | src/App.tsx：启动、恢复、外层表面、平台生命周期；不管理关卡细步骤 |
| UI | src/ui/Scene.tsx、src/ui/shell/*、src/ui/pointer.ts：稳定实体、交互草稿、工具、焦点与动画 |
| Application | src/game/quest.ts、quest-command.ts、language.ts：意图、任务绑定、原子提交、会话隔离、目标/记录派生 |
| Domain | src/domain/world.ts → spatial.ts：唯一版本分派、身份、空间、属性、关系、动作规则 |
| Content | src/content/quest.ts、quest-validation.ts：章节/词义/练习/空间与配额，整包校验；旧内容为 decoder/回归依赖 |
| Platform | src/platform/quest-save.ts、audio.ts、useAssets.ts：版本化恢复、音频、资源；旧 save 模块为历史 decoder |

具体新文件名由实现者决定；以上不是要求构建通用插件框架。优先按空间、动作、语言、恢复等真实变化原因拆分，不把一个巨型文件改成大量一行转发器。

## 三类状态与两种内容职责

Committed：世界、会话/关卡、seed/variant、行为事实、帮助历史、语言记录和 journal。UI interaction：选择、词块/字母草稿、工具展开、拖动候选。Ephemeral presentation：测量几何、动画相位、声音对象、拖影、短角色反应。后三者中的临时 UI/表现数据不能成为世界事实或写进存档。

PuzzleSpec 负责局面、规则和胜利谓词；ExerciseSpec 负责明确的语言目标、可接受表达、支持与评估。二者可关联，但不能把一个固定句子字符串当全关胜利条件。教学必须要求的语言行为明确属于教学任务，不偷塞进所有开放谜题的完成条件。

## 世界模型重构

把旧六词枚举、ink-road 单一区域、bag/mat 特判和故事变形名单收束到版本化内容规则中。新规则需要稳定实体、有限属性、可达节点/区域、通道净空、支撑和容器约束、门/把手状态。使用受限数据与纯函数，不引入任意脚本求值。

原故事作为 picnic 规则集适配到同一状态链，保持身份与过路约束。历史 decoder 可只读保留，不作为第二个当前运行时写入者。新规则不得扩大旧存档解释范围。主角可在新章节按许可改变尺寸，但不能被 word transform 变成帽子或另造一个主角。

## 重构顺序

先核对文档/代码冲突和未合并相关工作，更新合同；再用现有入口做 R1 单关闭环，验证两种真实机制解法；然后扩展章节、工坊/词语册、恢复和表现；最后按实际失败补齐必要回归。工程验证后可继续实施，无需等待不存在的实时 AI 凭据；教研/真机/儿童审核独立保持待办。

只维护一套正式应用。保留旧 Git 基线和旧档，不长期并行维护新旧 GameShell。迁移时允许删除已无调用的页面/样式/重复协议，但要先证明无活动入口/存档/测试依赖。不能删除仍有价值的历史 decoder 来让测试变绿。

## 非功能边界

依赖真实锁定；输入/存档/内容边界校验；确定性与幂等；资源/音频/存储失败可解释恢复；移动端可访问操作；无密钥与儿童个人数据；有版本回滚与 exact-SHA 证据。工业级质量体现在这些边界可验证，不体现在框架数量、文档数量或未经测试的“生产就绪”标签。
