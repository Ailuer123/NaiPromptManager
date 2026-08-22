# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目本质

全栈 Serverless 应用：React 19 前端 + Cloudflare Workers 后端。运行时由 **Cloudflare Pages 单一 Worker** (`dist/_worker.js`) 同时服务静态资源和 `/api/*` 路由 —— 没有独立的 Pages Functions 目录，所有后端逻辑集中在 `worker/index.ts`。

## 常用命令

```bash
# 开发
npm run dev               # Vite dev server (端口 3000，仅前端，无 Worker)
npm run dev:local         # 完整本地栈（构建 + Wrangler Pages dev，模拟 D1/R2 到 ./local-data/）
npm run dev:local:watch   # 监听模式：并发跑 vite watch + esbuild watch + wrangler

# 验证
npm test                  # vitest run
npm run build             # tsc -b && vite build && build:worker

# 构建与部署
npm run build:worker      # esbuild 单独打包 worker → dist/_worker.js (ESM, browser platform)
npm run deploy            # 构建 + 创建 Pages 项目（幂等）+ wrangler pages deploy
```

**注意**：
- 修改 Worker 后必须 `npm run build:worker`，否则 `dev:local:quick` 用的是过时产物。
- `tsconfig.json` 设了 `noEmit: true`，TS 只做类型检查；JS 产物由 Vite/esbuild 各自处理。

## 版本号

版本写在两处，必须同步：`package.json` 的 `version`，以及 [`app/version.ts`](app/version.ts) 的 `APP_VERSION`（关于页、`/api/version` 读这里）。`package-lock.json` 根版本跟着改。

**每次 commit 都升级版本。** 由 [`.githooks/prepare-commit-msg`](.githooks/prepare-commit-msg) 调 [`scripts/bump-version.mjs`](scripts/bump-version.mjs)：读约定式标题，改上述文件并 `git add`。

| 提交标题 | 升级 |
|---|---|
| `feat` | minor（1.2.0 → 1.3.0） |
| `feat!` / `BREAKING CHANGE:` | major |
| 其余约定式类型（`fix`/`docs`/`style`/`chore`…） | patch |
| 工作区版本相对 HEAD 已改过 | 跳过（手改优先） |
| `SKIP_VERSION_BUMP=1`、Merge 提交、无约定式标题 | 跳过 |

`npm install` 会把 `core.hooksPath` 指到 `.githooks/`。手动：`npm run version:bump -- patch|minor|major`。

完成标准：commit 里 `package.json` 与 `APP_VERSION` 同号，且比 HEAD 至少高一档（或本次已手改并因此跳过自动 bump）。

## 关键架构

### 1. 单文件 Worker (`worker/index.ts`)
所有 API 路由用一个大 switch 处理，`Env` 包含：
- `DB`：D1（用户、会话、Chain、画师、灵感图、**shared_vibes**、settings、access_logs、daily_stats）
- `BUCKET`：R2（封面图、灵感图原图、共享 Vibe 缩略图/payload）
- `ASSETS`：Pages 静态资源 fetcher（fallback 到 SPA）

Worker 启动时 `initializeDatabase()` 自动建表/迁移，所以 `schema.sql` 是参考文档而非 source of truth。跑 `migration_*.sql` 时核对 worker init 是否已包含。

NAI 生成走 Worker 代理：`POST /api/generate`（zip）与 `POST /api/generate-stream`（SSE）。API Key 只在 `Authorization` 头透传，Worker 不存。`/api/nai/subscription` 拉 Anlas / Opus 电量。

### 2. 数据模型分层
- **云端 (D1 + R2)**：Chain、Artist、Inspiration、共享 Vibe、User/Session
- **本地 (IndexedDB)**：GenHistory（原始 API，非 Dexie）；Vibe 库也在本地，可上传成共享 Vibe
- **内存**：NovelAI 订阅快照（[`services/naiAccountStore.ts`](services/naiAccountStore.ts)），随 API Key 变化刷新
- **LocalStorage**：NAI API Key、暗色模式偏好

### 3. Prompt 编译流水线
[`services/promptUtils.ts`](services/promptUtils.ts)：**Base → Pre-Modules → {subject} → Post-Modules**。模块 `position: 'pre' | 'post'`；`{subject}` 来自 `variableValues`，默认 `'1girl'`。

### 4. 服务层 (`services/`)
- `dbService.ts`：`/api/*` 薄封装（含共享 Vibe CRUD）
- `naiPayload.ts` / `naiService.ts`：组装 NAI 请求；`generateImage` + `generateImageStream`
- `naiModels.ts`：V4.5 / V5、默认参数、透明背景 tag、Opus 电量换算
- `naiAccount.ts` + `naiAccountStore.ts`：订阅/Anlas/电量解析与刷新
- `pngAlpha.ts`：透明图 straight / premultiplied alpha
- `vibeFile.ts` / `vibeLibrary.ts` / `vibeResolve.ts`：本地 Vibe 编解码与生成前解析
- `localHistory.ts`：IndexedDB
- `metadataService.ts`：PNG 里的 NAI 元数据
- `promptUtils.ts`：编译/解析提示词

### 5. 认证
- 默认管理员 `admin` / `admin_996`（首次启动改密）
- 会话：HttpOnly Cookie，`sessions` 表管过期
- 游客走 Discord OAuth（`role = guest`）；没有共享 `guest` 账号或游客口令
- 密码：bcryptjs
- 普通用户配额 300MB

### 6. 路径别名
`@/` → 项目根目录（`vite.config.ts`）。TS/Vite 都识别。

## 非显而易见的陷阱

1. **重复读取 request body**：Worker 里 `request.json()` 只能调一次。inspirations / vibes 先读到变量再分发。
2. **数据库迁移幂等性**：init 里部分 `ALTER TABLE ADD COLUMN` 用 try/catch 忽略已存在。改 schema 跟随这个模式。
3. **游客切换状态**：登出/切用户要清前端缓存里的非游客数据；`chains` 等有游客不可见标记。
4. **本地数据 vs 云端数据隔离**：`./local-data/` 由 wrangler `--persist-to` 管理，重启保留但不上传。
5. **前端缓存 TTL**：1 小时（`App.tsx` 的 `CACHE_TTL`）。改后端数据形状时改缓存键或清缓存。
6. **图片上传链路**：前端 Base64 → Worker → R2 → 返回 `/api/assets/<key>`；不要暴露 R2 公网 URL。
7. **Worker 是 browser platform**：esbuild `--platform=browser`，不能用 Node API；bcryptjs 用纯 JS 版。
8. **旧 Chain 缺 `model`**：按 V4.5 Full，不要悄悄升到 V5。
9. **透明背景仅 V5**：payload 里 `tag_hint_transparent_background` + `straight_alpha`；预览棋盘格走 `pngAlpha`。
10. **Anlas / 电量 UI**：顶栏/侧栏用 `NaiAnlasChip`，生成区用 `NaiBatteryBar`。不要再加无前缀的副本组件。

## 环境变量

- `GEMINI_API_KEY`：Vite 启动时注入到 `process.env.API_KEY` 和 `process.env.GEMINI_API_KEY`
- NAI API Key：仅前端 LocalStorage，运行时 `Authorization` 透传，**Worker 不存**

## 部署前检查

1. `wrangler.toml` 里 `database_id` 和 `bucket_name` 已填实际值
2. Cloudflare Pages 项目已绑定 `DB` (D1) 和 `BUCKET` (R2)
3. `npm test` 与 `npm run build` 本地通过
