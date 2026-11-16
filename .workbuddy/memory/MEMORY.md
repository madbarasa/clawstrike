# clawstrike · 项目长期记忆

## 共享图标资源（2026-10-22）
- **完整图标库**：`.workbuddy/icon_library/`（815个preview PNG + 1656个SVG源文件，约9MB）
- **渲染脚本**：`.workbuddy/devtools/`（render_persona_icons.py 等）
- **运行时图标**：`assets/UI/icons/`（图标库 PNG，供界面与虚拟按键引用）
- 来源：`R:/WorkFlow/VibeCoding/德州扑克/.workbuddy/icon_library/`（已同步）
- 使用时直接引用 `assets/UI/icons/<icon-name>.png`，缺失的从 `.workbuddy/icon_library/preview/` 复制

## 构建与验证（2026-11-16）
- 打包改用 `build.mjs`（esbuild），已移除 roadroller / terser / js13k-tools 链路
- 调试构建：`node build.mjs --debug --out=build/debug.html`
- 正式构建：`node build.mjs --out=build/index.html`
- 验证：`node .tools/verify.mjs`（无头流程 + 跳跃判定）；截图：`node .tools/screenshot.mjs .tools/shots.json`
- 无头 Edge 截图必须开启 `Emulation.setFocusEmulationEnabled`，否则 `document.hasFocus()` 为假、画面不渲染
- 本机没有 nvm 版 node，需使用 DSH 内置 node：`C:\Users\hohox\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin`

## 设计文档
- 功能设计以 `docs/design.md` 为准，修改功能必须先同步该文档
