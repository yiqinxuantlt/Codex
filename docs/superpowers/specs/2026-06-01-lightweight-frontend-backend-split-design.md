# Lightweight Frontend Backend Split Design

## Purpose

把当前单文件读书笔记应用重构为轻量前后端结构，让代码更容易维护、扩展和测试，同时保持现有功能、数据格式、局域网同步、PWA、APK 构建路线不被破坏。

这次重构不引入 React、Vue、SQLite、账号系统或云端数据库。目标是先把边界拆清楚，让后续升级有稳固地基。

## Current State

当前项目以 `index.html` 为核心，文件内同时承担这些职责：

- 页面结构与 Tailwind 类名。
- 全部自定义 CSS。
- IndexedDB 本地数据层。
- 局域网同步 API 客户端。
- 句子库、书架、随机回顾、阅读记录、备份恢复、主题字体等业务逻辑。
- 事件绑定和界面渲染。

`sync-server.js` 已经是一个轻量 Node 后端，但它也同时负责：

- 静态文件服务。
- API 路由。
- `sync-data.json` 读写。
- 服务端备份。
- 局域网地址打印。

因此，项目已经具备前后端雏形，但边界还没有显式化。

## Goals

1. 将前端从单个 `index.html` 拆为静态页面壳、CSS 文件和多个 JavaScript 模块。
2. 将后端从单个 `sync-server.js` 拆为启动入口、静态文件服务、API 路由、数据存储和备份模块。
3. 保持现有用户数据兼容：IndexedDB 数据库名、版本、store 名称和 `sync-data.json` schema 不变。
4. 保持现有使用方式兼容：
   - 直接打开 `index.html` 仍可使用本地模式。
   - 运行 `start-sync.bat` 仍可进行局域网同步。
   - `npm.cmd run verify` 仍作为基础检查。
   - `npm.cmd run cap:copy` 和 APK 构建路线继续可用。
5. 为后续云端化、SQLite、账号系统或 React/Vue 迁移留下明确扩展点。

## Non-Goals

这次不做以下事情：

- 不重写 UI 视觉风格。
- 不迁移到 React、Vue、Svelte 或 Next.js。
- 不把数据迁移到 SQLite 或远程云数据库。
- 不改变 CSV 导入格式。
- 不改变 IndexedDB schema。
- 不改变 `sync-data.json` 的主结构。
- 不新增用户登录、权限、多设备冲突合并策略。

## Proposed Architecture

### Frontend

保留 `index.html` 作为静态页面壳，负责：

- 基础 HTML 结构。
- CDN/本地 vendor 资源引用。
- 加载 `src/styles.css`。
- 加载 `src/app.js` 作为 ES module 入口。

新增前端目录：

```text
src/
  app.js
  constants.js
  state.js
  dom.js
  utils.js
  db.js
  api.js
  storage.js
  notes.js
  bookshelf.js
  reading.js
  records.js
  backup.js
  settings.js
  sync.js
  styles.css
```

职责划分：

- `constants.js`：数据库名、store 名、localStorage key、显示选项常量。
- `state.js`：运行时状态，例如 `notes`、`readingEvents`、`displaySettings`、`currentIndex`、`reviewScope`。
- `dom.js`：集中收集 DOM 元素引用，避免各模块重复查询。
- `utils.js`：文本清理、id、时间格式化、HTML 转义、下载文件等纯工具。
- `db.js`：IndexedDB 打开、读写、replace、delete。
- `api.js`：局域网同步 API 请求封装。
- `storage.js`：本地 IndexedDB 与局域网后端之间的统一存储接口。
- `notes.js`：CSV 解析、句子新增编辑删除收藏。
- `bookshelf.js`：按书分组、书架渲染、单本书回顾。
- `reading.js`：随机/上一条/下一条、滑动、卡片动画、阅读 session。
- `records.js`：阅读记录聚合和图表渲染。
- `backup.js`：本地快照、完整备份、恢复、数据体检。
- `settings.js`：设置面板、主题、字体、视图切换。
- `sync.js`：同步地址、局域网模式、远端刷新、本机数据导入同步库。
- `app.js`：初始化顺序、事件绑定入口、服务注册。
- `styles.css`：从 `index.html` 提取出的自定义 CSS。

### Backend

保留 Node 原生 HTTP，避免引入 Express 造成额外依赖和 APK/本地脚本变动。

新增后端目录：

```text
server/
  index.js
  config.js
  state.js
  backup.js
  static.js
  routes.js
  http.js
  network.js
```

职责划分：

- `server/index.js`：启动 HTTP server，打印桌面和手机访问地址。
- `server/config.js`：端口、根目录、数据文件、备份目录、body 大小限制。
- `server/state.js`：`sync-data.json` 读取、保存、normalize、merge。
- `server/backup.js`：服务端备份文件创建和保留数量清理。
- `server/static.js`：静态文件路由和 MIME type。
- `server/routes.js`：`/api/state`、`/api/notes`、`/api/settings` 等 API 处理。
- `server/http.js`：JSON body 读取、响应工具、错误响应。
- `server/network.js`：获取局域网 IP 和访问地址。

`sync-server.js` 保留为兼容入口，只做：

```js
require("./server/index");
```

这样现有 `start-sync.bat` 不需要变，用户仍然双击同一个文件启动同步。

## Data Compatibility

### IndexedDB

保持以下常量不变：

- `DB_NAME = "reading-note-reviewer-db"`
- `DB_VERSION = 3`
- `NOTES_STORE = "notes"`
- `SETTINGS_STORE = "settings"`
- `FONTS_STORE = "fonts"`
- `READING_EVENTS_STORE = "readingEvents"`
- `BACKUPS_STORE = "backups"`

重构过程中只移动代码，不改变数据写入结构。

### Sync Server

保持 `sync-data.json` schema 不变：

```json
{
  "schemaVersion": 1,
  "updatedAt": "ISO time",
  "notes": [],
  "settings": {},
  "fonts": [],
  "readingEvents": [],
  "meta": {
    "createdAt": "ISO time",
    "lastWriteSource": "server"
  }
}
```

API 路径保持兼容：

- `GET /api/state`
- `PUT /api/state`
- `PUT /api/notes`
- `PUT /api/settings`
- `PUT /api/fonts`
- `POST /api/reading-events`
- `DELETE /api/notes/:id`
- `DELETE /api/fonts/:id`
- `POST /api/clear-notes`

## Migration Strategy

重构分阶段执行，避免一次性大爆炸：

### Phase 1: Backend Split

先拆 `sync-server.js`，因为后端没有浏览器 DOM 依赖，更容易验证。拆完后：

- `node sync-server.js` 能正常启动。
- `GET /` 返回页面。
- `GET /api/state` 返回当前 state。
- `npm.cmd run verify` 通过。

### Phase 2: CSS Extraction

把 `index.html` 内的 `<style>` 移到 `src/styles.css`，并在 `index.html` 引用。拆完后：

- 页面视觉不变。
- `file://` 本地打开仍能加载 CSS。
- 同步服务打开也能加载 CSS。
- Capacitor web assets 可以复制。

### Phase 3: Frontend Utilities and Data Layer

先抽纯函数和数据层：

- `constants.js`
- `utils.js`
- `db.js`
- `api.js`
- `storage.js`
- `state.js`
- `dom.js`

这一步会让 `index.html` 仍保留业务逻辑，但底层依赖已经模块化。

### Phase 4: Feature Modules

再按功能抽：

- `notes.js`
- `bookshelf.js`
- `reading.js`
- `records.js`
- `backup.js`
- `settings.js`
- `sync.js`

抽取顺序以依赖少到多为准，避免循环引用。

### Phase 5: App Entry and Cleanup

最后把初始化和事件绑定集中到 `app.js`。`index.html` 内只保留 HTML 壳和脚本引用。

## Error Handling

前端保持现有用户可见提示方式：

- `setStatus()` 继续写入导入区和设置区状态文本。
- API 不可用时保留“同步服务暂时不可用”的提示。
- IndexedDB 初始化失败时保留“本地数据库初始化失败，请刷新页面后重试”。
- CSV/备份文件解析失败时保留现有提示。

后端保持现有 JSON 错误响应，不把堆栈暴露给浏览器。数据文件损坏时继续保留 `.broken-*` 文件并自动生成空 state。

## Testing and Verification

每个阶段都必须运行：

```powershell
npm.cmd run verify
```

涉及前端资源路径时额外运行：

```powershell
npm.cmd run cap:copy
```

后端拆分阶段额外检查：

```powershell
node sync-server.js
```

并访问：

- `http://localhost:8787/`
- `http://localhost:8787/api/state`

移动端体验和 APK 路线不能因为模块化被破坏。模块路径必须能被本地 HTTP、GitHub Pages 和 Capacitor WebView 正常加载。

## Git and Repository Notes

当前仓库曾经从 `_git` 改回 `.git`。如果普通 `git status` 仍报 `this operation must be run in a work tree`，说明 `.git/config` 里 `core.bare` 仍为 `true`。在实施前需要修正为标准工作区仓库，或继续使用：

```powershell
git --git-dir=.git --work-tree=. status
```

`.git-empty-backup/` 是空仓库备份目录，不应提交。

## Acceptance Criteria

重构完成后必须满足：

1. `index.html` 不再包含大段业务 JavaScript 和 CSS。
2. 前端代码位于 `src/`，后端代码位于 `server/`。
3. `sync-server.js` 仍可作为原启动入口运行。
4. 直接打开 `index.html` 本地模式可用。
5. `start-sync.bat` 局域网同步可用。
6. 现有 IndexedDB 用户数据不丢失。
7. 现有 `sync-data.json` 可继续读取。
8. 书架、句子库、随机回顾、阅读记录、备份恢复、主题字体、左右滑动都保持可用。
9. `npm.cmd run verify` 通过。
10. `npm.cmd run cap:copy` 通过。

## Self Review

- Placeholder scan: no placeholder requirements remain.
- Internal consistency: the architecture keeps the current static/PWA/APK path while splitting responsibilities.
- Scope check: this is intentionally a structural refactor, not a framework rewrite or cloud migration.
- Ambiguity check: data formats, API paths, non-goals, and staged migration order are explicit.
