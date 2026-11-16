# CLAWSTRIKE 设计文档

## 游戏概述

2D 一条命平台跳跃动作游戏，主题为黑猫复仇。玩家操控黑猫，在三段连击消灭关卡内所有人类敌人后过关，死亡即重来。

## 平台与输入

| 平台 | 识别方式 | 输入方案 |
| --- | --- | --- |
| 桌面端 | 默认 | 键盘 |
| 移动端 | UA 含 Android / iPhone / iPad 等关键词，或触屏 Mac | 屏幕虚拟按键 + 触屏按钮 |

输入状态统一收敛在 `src/input/keys.js`：

- `downKeys`：键盘按键状态。
- `touchKeys`：虚拟按键状态。
- `held(key)`：键盘或虚拟按键任一按下即为按下。
- `pressed(key)`：虚拟按键或轻触产生的单帧脉冲。
- `resetFrameInput()`：每帧结束清空脉冲。

游戏逻辑只通过 `held` 与 `pressed` 读取输入，不直接读取键盘事件。

## 虚拟按键

布局定义在 `src/input/touch.js` 的 `VIRTUAL_KEY_LAYOUT`，使用设计基准坐标（1600×900）：

| 按键 | 位置 | 半径 | 图标 |
| --- | --- | --- | --- |
| 左移 | (300, 700) | 92 | arrow-left |
| 右移 | (560, 700) | 92 | arrow-right |
| 喵叫 | (1020, 690) | 68 | cat |
| 攻击 | (1230, 730) | 76 | sword |
| 跳跃 | (1455, 690) | 92 | arrow-up |
| 翻滚 | (1240, 470) | 62 | refresh |

界面按钮定义在 `uiButtons()`：左上返回、右上设置、顶部中间暂停。

视觉规范：渐变底色、小纹理叠加、光影描边、按下时下沉并高亮，图标全部来自 `assets/UI/icons`，使用 `nvgImagePatternTinted` 思路的离屏着色缓存。

## 跳跃与贴墙跳

修改点位于 `src/entity/cat.js`：

- `canJump()`：只在落地或贴墙时成立。
- `jump()`：起跳瞬间清空 `wallStickX`、`wallStickDirection`、`lastStickToWall`，避免上一面墙的残留状态影响正常起跳。
- `jumpEndAge`：起跳后 0.12 秒内忽略新的跳跃输入，防止一次按住触发多段跳跃。
- `stickingToWall`：只在该帧确实靠墙时成立，落地后立即失效。
- 贴墙时下坠加速度为 220，普通下落为 2600，保证蹬墙跳手感。

## 主循环与性能

`src/game.js`：

- 逻辑固定步长 `FIXED_TIME_STEP = 1/120`，渲染插值系数 `alpha = accumulator / FIXED_TIME_STEP`。
- 单帧最多追赶 `MAX_STEPS_PER_FRAME = 12` 步，超出则丢弃堆积，避免掉帧后连锁追赶。
- 实体渲染位置使用 `renderX` / `renderY`（上一状态与当前状态插值），相机使用 `renderZoom`。
- 画布使用 `alpha: false` 与 `desynchronized: true`。

`src/utils/resizer.js`：

- 画布像素按窗口尺寸与设备像素比（上限 2）设置，超过 2560×1440 时自动降采样。
- `UIScale = CANVAS_WIDTH / DESIGN_WIDTH`，界面与 HUD 统一按此比例绘制。

其他优化：

- `src/entity/structure.js`：视口外的墙体整块跳过绘制。
- `src/graphics/ui.js`：图标颜色与旋转提前烘焙到离屏画布，逐帧只做一次 `drawImage`。
- `src/entity/human.js`：两只眼睛的视线射线合并为一次遍历。
- `src/entity/camera.js`：相机跟随按步长归一化，与刷新率无关。

## 界面清单

| 界面 | 文件 | 说明 |
| --- | --- | --- |
| 开场 | `screen/story-screen.js` | 铲屎官被杀，提示轻触跳过 |
| 主菜单 | `screen/menu/main-menu-screen.js` | 右上设置，左下版本号，底部引擎署名 |
| 设置 | `screen/menu/settings-screen.js` | 音效与音乐、振动反馈、开发者名单 |
| 开发者名单 | `screen/menu/credits-screen.js` | 中文角色分工，左上返回 |
| 暂停 | `screen/menu/pause-screen.js` | 吸收下层输入，暂停时静音 HUD |
| 失败 | `screen/menu/game-over-screen.js` | 显示剩余命数或「猫生惨剧」 |
| 通关 | `screen/menu/game-complete-screen.js` | 统计、解锁九命模式 |

## 语言规范

- 游戏内全部文案为中文，包括菜单、HUD、关卡标签、故事文本、喵叫拟声词。
- 专有名词保留原名：`CLAWSTRIKE`、`UrhoX`、`ZzFX`、`Sonant-X`。
- 技术语法符号不是文案，按原样保留，例如「按 [K] 切换难度」中的方括号。

## 设置项

存储键位于 `localStorage`：

| 键 | 含义 | 默认 |
| --- | --- | --- |
| `clawstrike-sound` | 音效与音乐开关 | 开 |
| `clawstrike-vibration` | 振动反馈开关 | 开 |
| `clawstrike-best-time` | 最佳通关用时 | 0 |

振动仅在支持 `navigator.vibrate` 的安卓设备上生效。

## 构建与验证

- 打包：`build.mjs`（esbuild），常量在构建期替换，调试构建保留界面栈与自动化钩子。
- 无头验证：`.tools/headless.mjs` 在 Node 中模拟浏览器环境跑完整流程；`.tools/jump-test.mjs` 逐帧验证跳跃与贴墙判定。
- 截图验证：`.tools/screenshot.mjs` 通过 DevTools 协议驱动无头 Edge，输出到 `.tools/shots`。
