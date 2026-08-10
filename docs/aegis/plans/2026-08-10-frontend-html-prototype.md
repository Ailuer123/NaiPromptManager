# 前端单 HTML 样板实施计划

日期：`2026-08-10`

状态：已批准规格的实施计划

## Goal

创建根目录下的 `nai-darkroom-sample.html`，以一个独立、可交互、响应式的单 HTML 文件覆盖 NAI Prompt Manager 的全部正式功能页，为后续 React 重构提供视觉与交互基线。

## Architecture

- 单文件结构：语义化 HTML、内联 CSS、内联 JavaScript。
- 页面导航：使用 Hash 与 `data-page` 切换，不使用 `?design` 或 React Route。
- 状态模型：仅使用内存 Mock State，不访问真实 API，不写入任何持久化存储。
- 图标：通过 Phosphor Icons Web CDN 使用统一图标族。
- 图片：使用带固定宽高的远程占位图片；加载失败时由背景与替代文本维持结构。
- 响应式：Mobile First，Desktop Sidebar 与 Mobile Bottom Navigation 共用同一页面状态。

## Tech Stack

- HTML5
- Native CSS
- Vanilla JavaScript
- Phosphor Icons Web CDN

## Baseline / Authority Refs

- `AGENTS.md`
- `CONTEXT.md`
- `README.md`
- `docs/aegis/baseline/2026-06-22-initial-baseline.md`
- `docs/aegis/specs/2026-08-10-frontend-html-prototype-brief.md`
- `App.tsx` 的 `HEAD` 版本
- 正式页面组件：`ChainList.tsx`、`ChainEditor.tsx`、`ArtistLibrary.tsx`、`ArtistAdmin.tsx`、`InspirationGallery.tsx`、`GenHistory.tsx` 与编辑器子组件

## Compatibility Boundary

- 不修改生产 React、Worker、Service、Schema、配置与依赖。
- 不读取、不复制、不覆盖任何现有 HTML 原型、`components/design/` 或 `?design` 页面。
- 不纳入工作区已有未提交改动。
- 样板不成为业务逻辑或数据结构的 canonical owner。

## Verification

- TDD Route：`skipped`。
- 原因：这是独立视觉样板，用户明确要求不执行验证并由用户手动验证。
- 不运行：测试、构建、浏览器、截图、Lighthouse、响应式模拟或 HTML Validator。
- 只允许在实施过程中读取 `git status --short -- nai-darkroom-sample.html`，用于确认没有越界修改；该检查不作为功能通过证据。

## Plan Basis

### Fact

- 用户已确认“暗房创作台”方案。
- 项目包含登录、画师串、角色串、编辑器、实验室、军火库、灵感、本地历史和设置四个子页面。
- 当前工作区存在多项用户未提交 UI 改动和多个现有 HTML 原型。
- 目标文件名当前未被占用。

### Assumption

- 样板默认使用 Admin 角色，以便展示全部权限页面。
- 页面提供角色切换演示，以展示 Admin、VIP、User、Guest 的权限差异。
- 默认暗色主题，同时保留页面级亮色切换作为现有功能演示。

### Unknown

- 最终视觉取舍以用户打开 HTML 后的手动反馈为准。
- 远程图片在用户网络环境中的可用性不作为本次完成条件。

## Files

### Create

- `nai-darkroom-sample.html`：全部样板 UI、Mock Data、交互和响应式样式的唯一 owner。

### Modify

- 无生产文件修改。

## Architecture Integrity Lens

- 不变量：正式业务 owner、Prompt 编译顺序和持久化边界不变。
- Canonical owner：`nai-darkroom-sample.html` 只拥有演示 UI，不拥有业务行为。
- 责任重叠：不复制 Service 或 Worker 逻辑，所有按钮只修改 Mock State 或显示反馈。
- Higher-level path：视觉 tokens、导航结构与页面组织可在后续生产重构中重新实现，而非直接搬运样板 JavaScript。
- Retirement：生产重构完成后删除或归档样板。
- Verdict：可以在单独文件中实施，不引入生产 source of truth 冲突。

## Plan Pressure Test

- Owner / contract / retirement：单独文件拥有明确边界和退休条件。
- Architecture integrity / higher-level path：不扩张三个超过 1000 行的现有大型组件。
- Verification scope：用户明确承担手动验证，本计划不生成虚假的自动化完成证据。
- Task executability：每个任务围绕同一文件中的独立 Section 与 JavaScript 模块展开。
- Pressure result：proceed。

## Plan-Time Complexity Check

- Target files：只创建 `nai-darkroom-sample.html`。
- Existing size / shape signals：`ChainEditor.tsx`、`ArtistLibrary.tsx`、`GenHistory.tsx` 均超过 1000 行，且现有工作区包含未提交视觉改动。
- Owner fit：独立样板最适合承载探索性视觉与 Mock 交互。
- Add-in-place risk：修改生产组件会与用户当前改动重叠，并让样板逻辑污染正式 owner。
- Better file boundary：新增根目录单 HTML。
- Recommendation：add owner file。

## Tasks

### Task 1：建立视觉 tokens、全局 Shell 与访问页

**Files**

- Create: `nai-darkroom-sample.html`

**Why**

先固定全局视觉语言、导航与基础状态，后续页面才能共享一致的层级和响应式行为。

**Impact / Compatibility**

- 新文件独立运行。
- 不引入项目 npm 依赖。
- 不修改现有页面或原型。

**Implementation**

- 建立 `<!doctype html>`、Viewport、中文 `lang`、Phosphor Icons Web CDN 与内联 Style。
- 定义暗色和亮色语义 tokens：背景、表面、文字、边框、品牌朱砂红与语义状态色。
- 定义 Sidebar、Context Header、Content View、Mobile Header、五项 Bottom Navigation、More Sheet、Modal、Toast。
- 建立登录页：账号与游客切换、表单、错误态。
- 建立数据库未连接异常页。
- 建立 Admin 默认 Mock User 与角色切换入口。

**Verification**

- 不运行页面验证。
- 仅确认目标文件是唯一新增实施文件。

**Steps**

- [ ] Write test：跳过，视觉样板不新增自动化测试。
- [ ] Verify RED：跳过，不运行测试或浏览器。
- [ ] Minimal code：用 `apply_patch` 创建完整 Document Shell、tokens、访问页和响应式导航。
- [ ] Verify GREEN：不运行；由用户最终手动打开 HTML。
- [ ] Commit：若实施阶段获准提交，只暂存目标文件并使用 `feat: 创建暗房样板基础框架`。

### Task 2：实现串库与新建、复制交互

**Files**

- Modify: `nai-darkroom-sample.html`

**Why**

串库是产品主入口，必须先解决画师串与角色串重复导航、筛选工具拥挤和移动端卡片动作堆叠问题。

**Impact / Compatibility**

- 只增加 Mock Cards 与本地过滤状态。
- 不触发真实创建、删除或复制业务。

**Implementation**

- 串库内部加入画师串与角色串 Segmented Control。
- 加入搜索、标签、收藏、排序和刷新工具。
- 建立响应式 Chain Grid，显示封面、名称、描述、标签、作者、更新时间、私有状态。
- Desktop 使用 Hover Action；Mobile 使用卡片底部单一 More Action 打开 Action Sheet。
- 加入新建串 Modal、复制详情 Modal、空状态和 Mock Toast。

**Verification**

- 不运行交互验证。

**Steps**

- [ ] Write test：跳过。
- [ ] Verify RED：跳过。
- [ ] Minimal code：在 `page-chains` Section 中加入完整内容与事件绑定。
- [ ] Verify GREEN：不运行。
- [ ] Commit：若获准提交，只暂存目标文件并使用 `feat: 完成串库样板页面`。

### Task 3：实现串编辑器与实验室

**Files**

- Modify: `nai-darkroom-sample.html`

**Why**

编辑器是最高密度页面，也是移动端拥挤问题的核心，需要用 Split Pane 与 progressive disclosure 重建层级。

**Impact / Compatibility**

- 仅演示 Prompt 表单、参数与生成预览。
- 不调用 NAI API，不保存 API Key，不上传图片。

**Implementation**

- Desktop 建立左侧 Prompt Workbench 与右侧 Preview Stage。
- Mobile 将 Base、Modules、Characters、Negative、Params、Vibe 分为 Accordion Section。
- 加入名称、描述、标签、收藏、Fork、复制、API Key、重置与引用预设入口。
- 加入 Module 开关、分组、Pre/Post、多角色、坐标与 Negative Prompt。
- 加入分辨率、Sampler、Steps、Seed、Quality、Variety、UC、CFG Scale、CFG Rescale。
- 加入 Vibe 本地库 Sheet、挂载项、Information Extracted 与 Reference Strength。
- 加入 Subject Prompt、Mock 生成状态、预览图、下载、设封面和上传动作。
- 加入底部 Context Action Bar，区分保存与生成的视觉优先级。
- 实验室复用相同结构，但展示临时状态、导入来源和保存类型 Modal。

**Verification**

- 不运行布局或表单验证。

**Steps**

- [ ] Write test：跳过。
- [ ] Verify RED：跳过。
- [ ] Minimal code：实现 `page-editor` 与 `page-playground` 及共享事件函数。
- [ ] Verify GREEN：不运行。
- [ ] Commit：若获准提交，只暂存目标文件并使用 `feat: 完成编辑器与实验室样板`。

### Task 4：实现军火库

**Files**

- Modify: `nai-darkroom-sample.html`

**Why**

军火库拥有最多的筛选、视图和队列控件，需要重点演示 Desktop 高密度布局与 Mobile Action Sheet 的降噪策略。

**Impact / Compatibility**

- 所有 Artist、Benchmark、Queue 与 Cart 使用 Mock Data。
- 不访问 GitHub、Danbooru 或真实生成接口。

**Implementation**

- 加入搜索、Grid/List、密度、Original/Benchmark、Slot、收藏、导入和配置入口。
- Desktop 使用紧凑二层工具栏；Mobile 保留搜索、视图与筛选，其他动作进入工具 Sheet。
- 建立 Artist Grid 与 Benchmark Row 两种布局。
- 建立 A-Z 快速定位、Artist Lightbox、已选 Cart 与复制结果。
- 建立 Queue Dock、暂停、恢复、失败状态、重试和日志 Modal。
- 建立批量导入与 Benchmark 配置 Modal。

**Verification**

- 不运行队列或响应式验证。

**Steps**

- [ ] Write test：跳过。
- [ ] Verify RED：跳过。
- [ ] Minimal code：实现 `page-library`、Cart、Queue、Lightbox 和配置层。
- [ ] Verify GREEN：不运行。
- [ ] Commit：若获准提交，只暂存目标文件并使用 `feat: 完成军火库样板页面`。

### Task 5：实现灵感图库与本地历史

**Files**

- Modify: `nai-darkroom-sample.html`

**Why**

两个图库共享图片浏览心智，但拥有不同的数据来源和操作语义，必须保持视觉一致同时清楚区分云端灵感与本地历史。

**Impact / Compatibility**

- 不上传、下载、删除、发布或压缩真实文件。
- JPG 对比和进度只作视觉演示。

**Implementation**

- 灵感页加入搜索、管理、批量选择、上传、图库、Lightbox、Prompt 复制、编辑和导入实验室。
- 历史页加入总数、分页、跳页、清理、批量压缩、图库与 JPG 标记。
- 历史详情加入 Prompt、参数、下载、发布、导入实验室和单张压缩。
- 建立原图与 JPG 并排预览、质量 Slider、批量压缩确认、进度和摘要 Modal。
- 为两个页面加入 Loading、Empty 与 Error 状态切换入口。

**Verification**

- 不运行图片与分页验证。

**Steps**

- [ ] Write test：跳过。
- [ ] Verify RED：跳过。
- [ ] Minimal code：实现 `page-inspiration`、`page-history` 与相关 Modal。
- [ ] Verify GREEN：不运行。
- [ ] Commit：若获准提交，只暂存目标文件并使用 `feat: 完成图库与历史样板页面`。

### Task 6：实现设置页并收束全局交互

**Files**

- Modify: `nai-darkroom-sample.html`

**Why**

设置页需要覆盖角色权限和多类管理表面；全局交互收束保证单 HTML 能作为完整手动评审样板使用。

**Impact / Compatibility**

- 用户、配额、统计和偏好均为 Mock Data。
- 不保存主题与偏好，不清理真实日志。

**Implementation**

- 设置页加入偏好、画师管理、用户管理和使用统计 Tab。
- 偏好页加入密码、自动 JPG、JPG 质量、权重语法、主题与退出。
- 画师管理加入 GitHub 快速导入、添加、编辑、图片输入和删除。
- 用户管理加入创建、游客口令、角色、配额和删除。
- 使用统计加入关键数据、趋势视觉、登录日志与清理动作。
- 根据 Mock Role 隐藏或禁用不允许的 Tab 与动作。
- 完成 Hash 导航、Theme、Role、Modal、Sheet、Toast、Accordion、Segmented Control、Filter、Selection 与 Mock Loading 事件。
- 在文档顶部加入“视觉样板，不连接真实数据”提示。

**Verification**

- 按用户要求不运行任何验证命令。
- 交付时明确写明“未验证，由用户手动验证”。

**Steps**

- [ ] Write test：跳过。
- [ ] Verify RED：跳过。
- [ ] Minimal code：实现 `page-settings` 与最终全局 JavaScript Controller。
- [ ] Verify GREEN：不运行。
- [ ] Commit：若获准提交，只暂存目标文件并使用 `feat: 完成前端单页样板`。

## Risks

- 单 HTML 覆盖全部功能会形成较大文件；通过按 Section、CSS Layer 和 JavaScript Controller 分区降低阅读成本。
- 远程图片可能受网络影响；为图片容器提供固定比例、背景和 Alt Text。
- Mobile 页面功能多；通过五项导航、More Sheet、Accordion 和 Action Sheet 控制首屏密度。
- Mock 交互可能被误解为真实能力；固定展示“视觉样板，不连接真实数据”。
- 当前工作区已有多个未提交原型；目标文件使用唯一名称，并禁止任何批量替换。

## Retirement

- 样板只在视觉决策阶段存活。
- 正式 React 重构采纳 tokens、导航与信息结构后，删除或归档 `nai-darkroom-sample.html`。
- 禁止让 Mock Controller 演化为第二套业务实现。

## Execution Choice

- 本 Session 未获授权使用 subagent，采用 Inline Execution。
- 执行前加载 `aegis:executing-plans`。
- 按 Task 1-6 顺序实现；用户要求不验证，因此不插入运行时 checkpoint。
