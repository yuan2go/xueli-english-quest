# 06 · AI 关卡工坊、接口与安全

## 1. AI 的职责

开发阶段：Codex/Claude Code 辅助代码、测试、文档；图像/语音工具辅助素材，需人工审核与权利记录。产品阶段：给定有限词表、学习目标和可用组件，生成可预览的关卡草稿。AI 不负责实时判题、不决定学习成绩、不执行浏览器任意代码。

儿童主线只运行已审核的静态内容。工坊断网、超时、无额度或被关闭，不影响主线。开发工具登录态不能作为浏览器后端服务，不能把开发者本机 Codex CLI 暴露成公开生成接口。

## 2. 最小造关流程

选择 allowlisted wordIds / 目标 / 场景 / 2–4 步长度 → 服务端检查权限与预算 → 请求结构化草稿 → 结构、资源和状态校验 → 人工检查英语与适龄性 → 沙盒预览 → 显式发布版本。

限定组件为 spell / transform / select / place，素材只取现有 manifest；不支持临时下载资源、不生成任意脚本。工坊重点是“词表变成可玩内容”，不是自称无限游戏生成器。

状态：DRAFT → VALIDATED → REVIEWED → PUBLISHED；FAILED/REJECTED 保留简短错误供成人修订。格式合法不等于教研通过。AI 不能把自己的 reviewStatus 或签名写成 approved。

## 3. API 目标合同（P1，初始化未实现）

POST /api/workshop/drafts：受保护，JSON 请求，Idempotency-Key。输入包含 wordIds、sceneId、objective enum、stepCount、templateVersion；不允许任意 endpoint、system prompt 或凭据。

```json
{"wordIds":["map","mat","bag"],"sceneId":"forest","objective":"word-final-contrast","stepCount":3,"templateVersion":"v1"}
```

成功可采用同步 201：draftId、status、content、validationIssues、provenance。演示范围先用有截止时间的同步服务；不为三步生成引入消息队列。超过时限明确失败，不假装仍在后台完成。GET /api/workshop/drafts/:id 返回已持久保存草稿；POST /api/workshop/drafts/:id/review 由有权限的成人记录检查结果；发布需显式动作，不自动把新草稿推给儿童。

错误：400 输入不合约、401/403 未授权、409 同 idempotency key 不同请求、422 生成内容不合法、429 限流/预算不足、503 未配置 Provider、504 超时。响应中不返回密钥、原始敏感上下文或内部堆栈。

## 4. Provider 最小接入

单一可替换接口 generateDraft(request, signal)。先接入公司允许的一家供应商，模型 ID 和 endpoint 由服务端配置，不写进 Prompt/关卡。不要构建多模型路由框架。真实模型版本、生成时间、输入规范化 hash、Prompt 版本、已报告 token usage 和审核结果写入 provenance。

模型结构化输出能力需按接入时的官方文档确认；无原生 schema 约束也必须在本地严格验证。格式修复最多一次，不能进行无限重试；语义/教学错误转人工，不靠不断重抽直到侥幸过关。

## 5. 预算、限流与幂等

默认 live generation 关闭，预算为 0。授权后示例控制目标：每请求最大 4 步、总响应不超过预定 token 上限、端到端 30 秒、最多 1 次结构修复；每操作员每日 10 次、并发 1，具体上限由负责人填写而非自动批准。

预算以服务端原子预留＋结算实现，至少正确约束同一部署的并发请求；serverless 多实例不得依赖进程内变量假装全局限流。可使用托管 KV/数据库计数或平台限流；存储不可用时 fail-closed。不要为了工坊拖入全项目数据库。

规范化输入＋模型/Prompt/资源版本作为缓存 key；不能缓存并发布带别的用户资料的结果。Idempotency-Key 与请求 hash 绑定，超时后重试同 key 不重复扣费；供应商是否支持请求幂等要实测，不能保证外部已发出请求一定未计费。

## 6. 主要安全控制

密钥仅服务端环境或受控密钥存储；VITE_* 全视为公开。模型输出当不可信数据，无 eval、Function、dangerouslySetInnerHTML、远程 script、用户指定 URL 或 shell。限制 JSON 体积、深度、字段和实体数量；校验引用、变形和结局可达。

成人入口有真正鉴权和服务端授权；前端隐藏或一段写在 JS 的密码不是安全。Cookie 会话需 same-origin/CSRF 保护；Bearer 模式要防止凭据被 URL、日志或公开页面泄露。域名跨源策略使用 allowlist，不配置带凭据的任意源。

不向模型发送儿童姓名、照片、声音、自由聊天或公司未授权资料。词表/目标即使来自外部也只作为数据；忽略其“修改规则、输出脚本、绕过校验”等指令。

## 7. 最小真实演示和降级

一次真实的三步生成即可证明真实调用；需记录请求/结果、校验、人工审核和实际可玩预览。再验证一次非法状态，例如 map 变成 mat 后直接使用不存在的 map，必须被拒绝。Mock/unit test 不替代该证据。

无凭据时允许 fixture 模式和预先生成素材，页面明确“离线样例/非本次实时生成”，真实调用状态 NOT_RUN。主线仍可用于比赛，设计说明准确写 AI 在开发/内容制作中的实际作用。避免把接口故障转嫁给孩子等待。
