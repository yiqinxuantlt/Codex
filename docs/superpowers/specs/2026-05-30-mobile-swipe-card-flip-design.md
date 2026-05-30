# 移动端滑动翻页修复设计

## 背景

当前读书笔记应用的阅读卡片已经支持上一条、下一条和随机回顾按钮，也曾加入移动端左滑/右滑逻辑。用户反馈移动端左滑右滑无反应，并希望切换时有类似卡片翻页的精美动画。

本次修复只针对手势识别、阅读卡片切换动画和少量 CSS 状态，不重写项目，不修改 CSV、IndexedDB、同步服务、句子库或阅读记录的数据逻辑。

## 目标

- 修复移动端左滑/右滑不稳定或无反应的问题。
- 保持现有方向：左滑上一条，右滑下一条。
- 增加温和、纸张质感的卡片翻页动画。
- 与长句卡片内部滚动兼容，避免垂直滚动被误判为翻页。
- 设置面板打开时禁用手势。
- 保持按钮操作、键盘空格随机和阅读停留记录逻辑不变。
- 尊重 `prefers-reduced-motion`，系统减少动画时退化为淡入。

## 非目标

- 不改动数据存储和同步架构。
- 不新增第三方动画库。
- 不做实时跟手拖拽动画。
- 不改变当前“左滑上一条、右滑下一条”的方向。
- 不重做移动端整体布局。

## 方案

采用“稳手势识别 + CSS 卡片翻页动画”的小补丁。

手势识别层：

- 在 `readingCard` 上继续监听 pointer 事件，并补充 touch fallback。
- 记录 `startX/startY/currentX/currentY/startTime/pointerId`。
- 横向位移超过约 52px，且横向位移明显大于纵向位移时，判定为翻页。
- 垂直位移更明显时，不阻止默认行为，允许长句内容继续滚动。
- 一旦进入横向手势，调用 `preventDefault()` 避免浏览器滚动或地址栏手势打断。
- 使用 `setPointerCapture()` 提升 pointer 事件在移动端的稳定性；失败时静默跳过。
- 使用 `touch-action: pan-y` 保留垂直滚动意图，结合 JS 判定横向翻页。
- 增加 `isAnimatingCard` 锁，避免连续触发导致动画和阅读记录重复提交。

动画层：

- 保留随机回顾的轻量淡入。
- `next` 使用右侧进入、轻微 `rotateY`、小幅位移和透明度变化。
- `previous` 使用左侧进入、相反方向 `rotateY`。
- 卡片容器加 `perspective`，内容容器使用 `transform-style: preserve-3d`。
- 动画时只作用在 `quoteWrap` 或阅读卡片的内容层，不改变卡片布局尺寸，避免按钮跳动。
- 在 `prefers-reduced-motion: reduce` 中取消位移和旋转，只保留极短透明度变化。

## 代码边界

修改 `index.html`：

- CSS：
  - 新增卡片翻页相关 class 和 keyframes。
  - 为 `readingCard` 增加移动端手势稳定性属性。
  - 调整 `quoteWrap` 的动画 class 命名和 reduced motion。
- JavaScript：
  - 扩展 `swipeStart` 为更完整的手势状态。
  - 新增 `isAnimatingCard`。
  - 新增 `getGesturePoint()`、`beginSwipe()`、`moveSwipe()`、`endSwipe()`、`resetSwipe()` 等小函数。
  - 保留 `showPreviousNote()` / `showNextNote()` 的导航入口。
  - `displayNoteAt()` 负责根据方向添加翻页动画 class，并在动画结束后释放锁。

## 验证计划

- 语法检查：提取 `index.html` 内联脚本并用 Node `new Function` 检查。
- 移动端宽度检查：360px、375px、390px、414px。
- 手势检查：
  - 左滑触发上一条。
  - 右滑触发下一条。
  - 垂直滚动长句不会误触发翻页。
  - 设置面板打开时滑动不触发翻页。
- 动画检查：
  - 上一条和下一条方向相反。
  - 随机回顾仍为轻量淡入。
  - 按钮区不因动画跳动。
  - reduced motion 下没有明显旋转位移。

## 风险

- 某些移动浏览器对 pointer 事件处理不同，因此需要 touch fallback。
- 卡片内部可滚动时，横向滑动和垂直滚动容易冲突；本设计通过方向阈值避免误判。
- 动画过重会破坏当前宁静风格，因此旋转角度和位移都保持克制。
