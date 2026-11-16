<p align="center">
<img src="/assets/icon-320x320.png">
</p>

# CLAWSTRIKE

**CLAWSTRIKE** 是一款 2D 一条命平台跳跃游戏，最初为 2025 年 [JS13K](https://js13kgames.com/) 而作，当届主题为**黑猫**。

玩家需要一边闪避子弹与陷阱，一边三段连击消灭所有敌人，尽快通关全部关卡。

> 为倒下的铲屎官复仇，在快节奏、高难度的关卡里一路冲杀。CLAWSTRIKE 是反复死亡、反复重来的动作游戏：你会摔很多次，但每次重来都是瞬时的，节奏不会被打断。
>
> 通关后解锁九命模式。

<p align="center">
<img src="/assets/gameplay-demo.gif">
</p>

## 平台与语言

- 原生支持桌面端与移动端，输入方式自动切换：桌面端使用键盘，移动端使用屏幕虚拟按键。
- 界面语言默认且固定为中文，游戏内不出现英文文案。

## 操作

| 操作 | 键盘 | 移动端虚拟按键 |
| --- | --- | --- |
| 左右移动 | 方向键 / A D / Q D | 左下方向键 |
| 跳跃（可贴墙跳） | 上方向键 / W / Z | 右侧跳跃键 |
| 翻滚 | 下方向键 / S | 右侧翻滚键 |
| 攻击 | 空格 | 右侧攻击键 |
| 喵叫 | E | 右侧喵叫键 |
| 暂停 | ESC | 顶部暂停按钮 |
| 切换难度 | K | 菜单内提示 |
| 返回主菜单 | M | 左上返回按钮 |
| 重试 | R | 轻触屏幕 |

## 构建

```bash
npm install
npm run build:debug   # 调试构建，输出 build/debug.html
npm run build:prod    # 正式构建，输出 build/index.html
npm run verify        # 无头流程测试 + 跳跃判定测试
npm run shots         # 无头浏览器截图，输出到 .tools/shots
npm run http          # 本地静态服务器
```

## 关卡编辑器

- 编辑器只在调试构建中可用：运行 `npm run build:debug` 后打开 `build/debug.html`。
- 主菜单按 `E` 进入编辑器。
- 编辑器操作：
    - 切换实体模式：<kbd>1</kbd>（拖拽实体）
    - 切换结构模式：<kbd>2</kbd>（编辑方块）
    - 换颜色、添加实体、试玩等：右键菜单
    - 分享关卡：右键菜单「分享链接」

## 使用的工具

- [ZzFX](https://github.com/KilledByAPixel/ZzFX)
- [Sonant-X](https://github.com/nicolas-van/sonant-x)
- [Sonant-X Live](https://github.com/nicolas-van/sonant-x-live)

## 歌曲生成

歌曲由 GPT-5 生成，全部提示词与脚本位于 `ai/` 目录。

生成新歌曲需要 API key，写入 `.env`：

```
OPENAI_API_KEY=<YOUR_API_KEY>
```

然后运行 `npm run songwriter`。**该操作消耗大量 token，请勿滥用。**

生成结果位于 `ai/out`，可直接导入 Sonant-X Live。

## 移动端适配要点

- 主循环采用固定步长（120Hz 逻辑更新）加渲染插值，逻辑速度与屏幕刷新率解耦，避免掉帧导致的顿挫与判定漂移。
- 画布像素按屏幕尺寸与设备像素比设置，整帧按 `UIScale` 从 1600×900 设计基准缩放，绘制、命中判定、虚拟按键共用同一套坐标。
- 视口外的墙体整块跳过绘制，图标着色与旋转提前烘焙到离屏画布。
- 跳跃与贴墙跳判定互不干扰：起跳瞬间清空贴墙记录，落地后不会被上一面墙的残留状态打断。
- 音效、振动反馈与开发者名单位于设置界面。

# 许可证

代码可阅读参考，请勿用于商业用途。游戏是长期投入的成果，作者保留全部权利。

如需在自有平台分发，请联系作者。
