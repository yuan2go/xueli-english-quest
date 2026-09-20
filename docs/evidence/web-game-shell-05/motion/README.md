# 贴图动作与输入性能追加验证

2026-09-20。优化基线 `d251e05878537b6e13c8bc92b4a686551a4f30a2`；最终实现 SHA 与命令结果见 [STATUS](../../../STATUS.md)。复用原 WebP，没有新增逐帧素材或渲染引擎，没有改动 Domain/Application/Save/manifest/lock。

## 动作与恢复

小猫待机呼吸、解码后姿态叠化、纸张变形叠化；实际实体使用 transform 补间，父对象携带子物品。过路先把纸垫放到墨迹上（220ms），再让小猫通过（850ms），并使路径与墨迹对齐。所有业务事先原子提交。中断、后台、暂停、旋转或 reduced-motion 直接显示已提交终态。

拖动坐标不再触发逐次 React 更新，requestAnimationFrame 合并输入、直接写 transform；只有开始/命中目标变化/结束触发 React。落点持续注册，快速松手不依赖下一帧是否已渲染。新增用例曾实际捕获单任务内 down/move/up 丢失有效放置，修复后确认仅提交一次。

实测另发现：字母放入后原按钮禁用，焦点落到 body，Escape 偶尔无法关闭工具。最小脚本在第一轮即复现（hidden=false，keydown target=BODY），排除后台干扰。字母/词块在绘制前把焦点交给新位置；补充原回归断言，20 次实际打开→填字→滚动→Escape 连续通过，未放宽原焦点要求。

## 性能样本与边界

[before.json](before.json) / [after.json](after.json) 保存三轮原始计数。after 的实现在 `b50964e` 固定，随后仅对齐小径上的过路位置并强化回归，不影响采样的家门口拖动路径。macOS arm64 / Node v26.3.1 / Playwright Chromium headless；390×844，CDP CPU 4x。每轮新上下文，从正式首页实际唤醒、生成背包，等待有限 cue 结束后移动指针 120 次再 Escape。最终性能采样与完整测试串行执行。没有预置通关状态。

复现：先 `npm run build` 并启动本地 preview，再执行：

```sh
node scripts/profile-motion.mjs http://127.0.0.1:4186 /tmp/motion-report.json label
```

| 三轮中位数 / 计数 | 优化前 | 优化后 |
| --- | ---: | ---: |
| LayoutCount | 122 | 4 |
| 拖动内联 style 变更 | 238 | 120 |
| ScriptDuration | 70.6ms | 50.4ms |
| TaskDuration（总主线程任务时间） | 175.0ms | 229.4ms |
| RAF 中位帧间隔 | 约 16.7ms | 约 16.7ms |
| 大于 33.4ms 的采样帧 | 三轮均 0 | 三轮均 0 |

可确认拖动布局计算减少约 96.7%，此样本脚本时间下降。总任务时间没有下降，样式计算也有新增表现开销；不能从这组数据声称整个页面提速、FPS 提升或目标真机达到 60fps。基线在此机器上已没有明显掉帧。回归门槛只锁定高频拖动不逐事件触发布局，不用脆弱的绝对耗时作发布承诺。

## 正常入口实录

[playthrough.webm](playthrough.webm) 为生产 HTTP 首页的 Playwright 实录，没有剪辑或注入进度；录屏帧率不用于性能证明。[walkthrough.json](walkthrough.json) 记录实际过路几何、动画状态、个人结局、活动往返和刷新结果。

路径：唤醒 → 背包 → 戴帽 → 纸偶变帽 → 地图 → 小径变垫 → 真正拖到墨迹 → 取回地图 → 草地制作座位 → 组句/描述/邀请/听音找物 → 鸭舌帽穿戴、宽檐帽收纳 → 结局 → 活动往返 → 刷新恢复。console/pageerror 为零。

[纸垫先落下](pad-first.png)、[过路中间帧](crossing-in-motion.png)、[过路终态](crossing-settled.png)、[个人结局](final-ending.png) 来自同一路径；实际检查了动画阶段截图。旧初次交付截图留在上级目录，未以本轮截图覆盖。

必要回归包括原完整 8 条路径、新增 2 条动作/性能回归、强化既有焦点与铺垫空间断言。物理设备、Safari、正式录音听审、教研、儿童试玩、公网部署均 NOT_RUN；`check:release` 保留 bag 未审核的 exit 1 阻塞。
