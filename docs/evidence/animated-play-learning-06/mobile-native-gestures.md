# 手机长按菜单抢占拖动 · WP06 追加修复

2026-09-20，用户提供 iPhone Chrome 截图：第二幕拖动物品时弹出 `scene-act-2.webp` 的原生保存/打开图片菜单，同时“地图”标签出现文字选区。这是输入缺陷；此前的手机视口与触控模拟没有验证 iOS 浏览器原生弹窗。

## 版本与复现

- 默认分支 baseline 仍为 `a9a62e3eb632781595b40171dfb442bf0fbbe55e`。
- 本次修复前 HEAD：`159e0c2514775135b9c75de2a75b34a450ded339`，PR #12 OPEN；继续同一独立分支，没有向已合并 PR 追加。
- 修复与回归源 SHA：`577107e60dd89b241dc95c0d29b0f7f97e55e430`。

正常首页 → 开始冒险 → 场景图片；最小测试 `npm run test:browser -- tests/browser/native-gestures.spec.mjs` 在业务修改前执行：1 failed，`contextmenu` 预期 `false`、实际 `true`（浏览器默认菜单仍被允许）。修复后相同断言通过，再扩展为最终的三个交互回归。

只读检查用户截图中的线上站点，也观察到图片 `contextmenu` 未取消、背景 `pointer-events:auto`。当时首页引用 `assets/index-DIzxgpri.js` 和 `assets/index-DeZkQ9Yq.css`；不能据此推断其完整源码 SHA。本次没有部署到该站点。

## 根因与变更

已有 `draggable=false` 禁止普通图片拖拽，但不关闭 iOS 长按 callout。背景图仍参与命中；桌面 WebKit 下字母区域的 `-webkit-user-select` 为 `text`。三者让浏览器的图片/选词功能与游戏手势争用。

GameShell 内明确设置 `-webkit-touch-callout:none`、带 WebKit 前缀的 `user-select:none`，拦截 `contextmenu` / `dragstart`；该区域插画 `pointer-events:none`，命中交给语义按钮。使用 Apple 的 [Safari CSS Reference](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html) 中说明的 iOS 长按限制。未修改领域状态链、存档、奖励、学习证据或 Pointer 拖放判定。

没有添加全局 touchmove/pointerdown preventDefault；成人记录不处于该保护区域，仍可选择文本，工具仍保留触摸滚动。

## 验证范围

环境：同一 macOS / Playwright 1.63.0；Chromium 153.0.8010.12、桌面 WebKit 26.6。按住 750ms 再拖动。390×844 手机视口跑字母、过路纸张、句子词块；360×640 跑原生工具滚动。

- Chromium 使用 CDP touchStart / touchMove / touchEnd / touchCancel 输入包；桌面 WebKit 使用 Pointer 鼠标拖动和 touchscreen.tap，配合键盘 Enter。
- 主线通过正常首页和实际拼写/换字抵达草地，无通关存档注入。原生菜单/HTML 拖拽事件在真实图片、字母和词块节点上显式派发，验证默认行为被取消；这不等于拍到了 iOS 原生浏览器菜单。
- 取消字母拖动不填答案、不增加练习/帮助命令；音频回执允许独立完成。按住再拖动能填字母、铺路、填入词块；中途取消保留句子。无文字选区、无残留拖影，键盘撤回可用。
- 过路后的世界刷新恢复一致；工具触摸滚动位置实际增加，场景位置不变；退出游戏到成人记录后，原生上下文事件仍允许，真实双击能选中文字。
- 桌面 WebKit `CSS.supports('-webkit-touch-callout', 'none')` 为 false；该 iOS 专用属性保留于实际 production CSS。不能把桌面 WebKit 的绿色结果写成 iPhone 原生长按复验 PASS。

实体 iPhone Chrome/Safari 长按复验：**NOT_RUN**。线上更新：**NOT_RUN**。用户截图是已发生的真机失败证据；修复后的真机结论仍需实际测试。

最终复测：`npm test` **52/52 PASS**；`npm run typecheck`、`npm run typecheck:domain`、`npm run build`、`npm run check:resources`、`git diff --check` PASS；`npm run test:browser` **19/19 PASS**（2.6m，[原始输出](native-gesture-browser.log)）。`npm run check:release` 实跑 exit 1，仍被未审核 `bag` 阻断。仓库 Actions 总开关仍关闭，CI NOT_RUN。依赖和 lockfile 未改。
