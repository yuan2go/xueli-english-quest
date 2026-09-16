# 初始化验证记录

日期：2026-09-16。执行环境：Linux 容器，Node.js v22.16.0、npm 10.9.2、预装 TypeScript 5.8.3。应用 manifest 声明 TypeScript 6.0.2；本地领域检查版本不同，结果不能当成完整依赖构建证据。

## 已执行

```text
npm test
# tests 16
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0

npm run typecheck:domain
# tsc --project tsconfig.domain.json
# exit 0
```

14 个领域用例：变形身份与输入不变性；主角/纸偶区分；旧 revision/重复创建；命令引用隔离；缺失源；非法单字母变形；地图不能铺湿墨；合法 in/on；被占用支撑物；自包含/循环；缺失/非法目标；别的垫子不触发指定过路效果；非法世界状态；危险 ID 拒绝。

另 2 个用例检查完整十二挑战十三步的预设世界效果路径，以及删除 s04b 后 crossed-ink 前置条件失败。这是正确路径证据，不是整个游戏或全部可操作分支的验证。

首次测试暴露 Node strip-only 不支持参数属性语法，已改为显式字段并重跑通过；未通过的初次运行不作为最终 PASS。实际失败已修复，不依赖增加转译框架回避。

最初领域类型检查直接在命令行传文件名，并已在 TypeScript 5.8.3 下通过。复核 [TypeScript 6.0 官方说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) 后，发现这种调用在存在 tsconfig.json 时会产生 TS5112；最终改成独立 tsconfig.domain.json 和 --project，重跑领域类型检查及全部 16 项测试通过。此项是对已确认版本差异的兼容修正，不代表本地安装过 TypeScript 6.0.2。

## 测试源码锚点（Git blob SHA）

| 文件 | blob SHA |
| --- | --- |
| src/domain/world.ts | e81d15bc55b178812e0d9e3f3551bbd8c29c6784 |
| tests/world.test.mjs | 8796d05ad7648976ac0df21d915d878050d262a8 |
| tests/world-plan.test.mjs | 0fea0fed73cced10ecb57eb4b761d948cd28ed66 |
| content/drafts/picnic-world-plan.json | d55bea9548017ad0a2eb191e9cd3946b6c6b68c0 |

## 阻断和未运行

npm registry 网络探测返回 `Could not resolve host: registry.npmjs.org`；依赖查询超时。没有安装 React/Vite 项目依赖，没有生成伪造的锁文件。完整类型检查、生产构建、本地浏览器、手机/Pad、音频审核、在线工坊、教研、儿童试玩和正式发布均不在本次已通过证据中。

CI 已配置为先跑无依赖领域测试，再解析依赖/类型/构建；初次无锁会明确告警并上传解析出的锁作为 artifact（仅当工作流实际成功）。WP-01 必须提交真实锁并切换稳定 npm ci；工作流存在不等于运行成功。具体 GitHub Actions 状态以对应提交的实际 run 为准。
