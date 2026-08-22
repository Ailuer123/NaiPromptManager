# 前端单 HTML 样板设计规格

日期：`2026-08-10`

状态：视觉方向已确认，等待书面规格审核

ArchitectureReviewRequired: yes

## 1. 任务意图

### TaskIntentDraft

- 结果：创建一个独立、可交互、同时适配 PC 与移动端的单 HTML 前端样板，覆盖当前项目全部功能页。
- 目标：用统一的信息层级、导航模型、控件密度和视觉语言，解决移动端容器与按钮堆叠问题，并为后续 React 重构提供可手动评审的视觉基线。
- 成功证据：用户可以在一个 HTML 文件内切换全部功能页；PC 与移动端采用不同但同构的导航策略；关键按钮、表单、弹层和页面状态具备可点击演示。
- 停止条件：独立 HTML 文件完成，未接入真实 API，未修改生产 React 页面，按照用户要求不执行构建、浏览器或截图验证。
- 非目标：不重构现有 React 组件，不改变后端、D1、R2、IndexedDB 或 API contract，不读取或复用现有原型设计文件与 `?design` 页面。

## 2. 基线读取集

### BaselineReadSetHint

- `AGENTS.md`：项目架构、正式功能 owner 与约束。
- `CONTEXT.md`：历史压缩、自动 JPG 保存、偏好设置等领域语言。
- `docs/aegis/baseline/2026-06-22-initial-baseline.md`：产品与 runtime boundary。
- `README.md`：产品定位、角色权限和功能总览。
- 正式功能源码：`App.tsx` 的 `HEAD` 版本，以及 `components/` 下非 `design`、非 `prototype` 的页面组件。
- 明确排除：工作区内已有 HTML 原型、`components/design/`、任何原型设计资源和 `?design` 页面逻辑。

## 3. 影响范围

### ImpactStatementDraft

- 新增 owner：一个带有“仅供设计评审”说明的独立 HTML 样板文件。
- 影响层：仅静态前端演示层。
- 不变量：正式页面路由、角色权限、Prompt 编译顺序、数据 owner 与持久化边界不变。
- 兼容边界：样板不引用正式业务函数，不向真实 API 发起请求，不写入 LocalStorage、IndexedDB、D1 或 R2。
- 已有工作保护：不覆盖当前工作区中任何未提交文件，尤其不改动已有 HTML 原型和 `components/design/`。

## 4. Design Read

将本项目理解为：面向 NovelAI 重度创作者的高密度生产力工具，采用暗房创作台式的冷静视觉语言，以 Native CSS、语义化 HTML 和 Phosphor Icons 构建单文件交互样板。

- `DESIGN_VARIANCE: 7`：桌面端允许非对称编辑区与层级错位，但不牺牲工具效率。
- `MOTION_INTENSITY: 3`：只为页面切换、Sheet、Modal 与按钮反馈提供轻量动效。
- `VISUAL_DENSITY: 6`：保留专业工具所需信息密度，通过分组和 progressive disclosure 降低拥挤感。

## 5. 方案比较

### 方案 A：暗房创作台，已确认

- 冷黑、石墨灰与雾灰构成表面层级，朱砂红作为唯一品牌强调色。
- Desktop 使用稳定侧栏、上下文 Header 和页面内容区。
- Mobile 使用五项 Bottom Navigation 与 More Sheet，复杂动作进入 Sheet 或二级页面。
- 优点：适合长时间创作，层级鲜明，能容纳高密度工具功能。
- 代价：需要严格控制深色表面的对比度与边框可见性。

### 方案 B：浅色策展台，未选择

- 冷白纸面、墨色文字与钴蓝强调色。
- 优点：图库和 Prompt 文本更轻盈。
- 代价：长时间创作时亮度更高，工具感与沉浸感较弱。

### 方案 C：保守品牌演进，未选择

- 保留现有 Indigo 主色与基本页面结构，只调整间距、尺寸和移动端折叠。
- 优点：迁移成本最低。
- 代价：无法彻底解决现有信息层级与导航结构问题。

## 6. 视觉系统

### 6.1 颜色

- 默认主题：暗色。
- 页面背景：近黑冷灰，不使用纯黑。
- 一级表面：石墨灰。
- 二级表面：略亮的矿物灰。
- 品牌强调：低饱和朱砂红。
- 文本：柔白、银灰、暗灰三级。
- 状态色：成功、警告、错误仅表达真实语义，不参与装饰。
- 提供页面级亮暗切换，同一时刻只存在一种主题，不允许 Section 局部翻转主题。

### 6.2 字体与图标

- 中文正文使用系统无衬线字体栈，标题依靠字重和字距建立层级。
- Prompt、Seed、参数与日志使用系统等宽字体。
- 图标统一使用 Phosphor Icons Web，不使用 Emoji 充当结构图标，不手绘 SVG path。

### 6.3 形状与间距

- Panel 使用 14px 圆角，Input 与 Button 使用 10px 圆角，Chip 使用全圆角。
- 使用 4px 基础间距体系，常用间距为 8、12、16、24、32px。
- 卡片只用于可独立选择或需要 elevation 的对象；普通分组优先使用留白、标题和弱分隔线。

## 7. 全局导航

### 7.1 PC

- 左侧固定主导航：串库、军火库、实验室、灵感图库、本地历史、设置。
- “串库”页面内部用 Segmented Control 切换画师串与角色串，避免重复占用一级导航。
- 顶部 Context Header 只放当前页面标题、全局搜索、主题和账户入口。
- 页面级动作放在内容 Header 右侧，每屏只保留一个主要动作。

### 7.2 移动端

- 底部导航最多五项：串库、军火库、实验室、灵感、更多。
- “更多”Bottom Sheet 承载本地历史、设置、主题切换、存储信息与退出登录。
- 进入编辑器后隐藏全局 Bottom Navigation，改为顶部返回栏和底部上下文 Action Bar。
- 所有触控目标不小于 44px，相邻操作至少保留 8px 间隔。

## 8. 功能页清单

### 8.1 登录与异常页

- 账号登录与游客参观 Segmented Control。
- 用户名、密码、游客口令、主题切换和错误反馈。
- 数据库未连接状态及刷新动作。

### 8.2 串库

- 画师串与角色串切换。
- 搜索、标签筛选、收藏筛选、排序、刷新和新建。
- 卡片展示封面、名称、描述、标签、作者、更新时间、私人状态。
- 复制详情、收藏、删除、新建 Modal 和空状态。

### 8.3 串编辑器

- 信息编辑、标签、收藏、Fork、复制正负 Prompt、API Key、重置。
- Base Prompt、模块开关与前后位置、分组、多角色坐标、全局 Negative Prompt。
- 分辨率、Sampler、Steps、Seed、Quality、Variety、UC、CFG Scale 与 CFG Rescale。
- Vibe 本地库导入、搜索、挂载、Information Extracted 与 Reference Strength。
- 主体变量 Prompt、生成预览、下载、设为封面、手动上传。
- 游客不可见、私人串、保存状态和引用预设 Modal。

### 8.4 实验室

- 复用编辑器核心工作区，但明确标记为临时 Playground。
- 支持从历史与灵感图导入完整配置。
- 允许试生成并在需要时保存为画师串或角色串。

### 8.5 军火库

- 搜索或粘贴 Prompt、原图与实装模式、Grid 与 List 模式、密度调节。
- 收藏、A-Z 定位、批量导入、复制历史与已选画师 Cart。
- Benchmark Slot 切换、配置、补全、单项生成、全部生成。
- Queue 暂停与恢复、失败重试、任务日志、Lightbox 浏览。

### 8.6 灵感图库

- 搜索、刷新、管理模式、批量删除和上传。
- 图片网格、详情 Lightbox、Prompt 复制、编辑、下载与导入实验室。
- 加载、空数据与错误状态。

### 8.7 本地历史

- 图片网格、分页、跳页、刷新、删除、清空与条件清理。
- 批量 PNG 转 JPG、进度、取消、完成摘要。
- 图片详情、Prompt 与参数查看、原图和 JPG 并排预览、质量调整、单张压缩。
- 下载、发布到灵感图库与导入实验室。

### 8.8 设置

- 偏好设置：密码、自动 JPG 保存、JPG 质量、军火库权重语法、主题和退出。
- 画师管理：GitHub 快速导入、添加、编辑、上传与删除。
- 用户管理：创建用户、游客口令、角色、配额与删除。
- 使用统计：用户、串、灵感图、存储、登录趋势和日志清理。
- 根据 Admin、VIP、User、Guest 展示不同 Tab 与动作。

## 9. 单 HTML 交互边界

- 使用 `data-page` 与 Hash 路由切换页面，不使用 `?design`，也不创建原型专用 React Route。
- 所有操作使用内存中的 Mock State，刷新后允许恢复默认演示数据。
- 重要 Modal、Drawer、Bottom Sheet、筛选、Tab、主题切换和移动菜单可点击演示。
- 图片使用稳定的远程占位图片地址并声明尺寸；样板断网时保留可读的背景和替代文本。
- 文件顶部显著标记“视觉样板，不连接真实数据”。

## 10. 响应式规则

- `0-767px`：单列、固定 Mobile Header、Bottom Navigation、Sheet 承载次要操作。
- `768-1199px`：压缩 Sidebar，图库使用 3-4 列，编辑器按段落纵向排列。
- `1200px+`：完整 Sidebar，编辑器左右 Split Pane，图库按容器宽度自适应。
- 不使用横向页面滚动；仅 Slot、Chip 与紧凑工具带允许局部横向滚动。
- 固定 Header、Bottom Navigation 和 Action Bar 必须为内容预留 Safe Area 与滚动内边距。

## 11. Product Risk Lens

- 价值：先用低成本样板确定全局重构方向，减少直接改生产组件带来的返工。
- 非目标：样板不是可直接合并的生产实现。
- 取舍：优先统一工作流和信息层级，不追求真实数据联调与完整业务校验。
- 决策：已选择方案 A，暗房创作台。

## 12. Architecture Integrity Lens

- 不变量：正式业务 owner 与持久化边界不变。
- Canonical owner：样板文件只拥有 Mock UI 和演示交互，不拥有业务逻辑。
- 责任重叠：不从现有组件复制函数，不形成第二套可运行业务实现。
- 简化方向：后续 React 重构应从样板抽取视觉 tokens、导航模型和页面结构，不直接移植 Mock State。
- 退休条件：正式重构采纳视觉决策后，删除或归档样板。
- 结论：独立样板不会产生生产 source of truth 冲突。

## 13. Baseline Role Alignment

- Product / Requirement Baseline：覆盖现有创作、资源管理、历史与设置工作流。
- Architecture / Runtime Boundary Baseline：不改变 React、Worker、D1、R2、IndexedDB 与服务 owner。
- Result：aligned。
- scope：requirements。
- Next action：用户审核本规格后，进入实现计划并创建独立 HTML。

## 14. Plan-Time Complexity Check

- Better file boundary：新增单一独立 HTML，不继续扩张 `App.tsx` 或大型页面组件。
- Recommendation：add owner file。
- 原因：当前 `ChainEditor.tsx`、`ArtistLibrary.tsx` 与 `GenHistory.tsx` 均超过 1000 行；本任务只回答视觉方向，不应把样板逻辑塞入生产 owner。

## 15. 验收边界

- 必须：单 HTML、全部功能页、PC 与移动端适配、可点击页面切换、暗房创作台视觉、独立 Mock State。
- 必须：不读取、不复制、不覆盖现有原型设计文件与 `?design` 页面。
- 必须：不覆盖工作区未提交改动。
- 不执行：构建、测试、浏览器打开、截图、Lighthouse 或响应式验证，交由用户手动验证。
- 交付时说明：新增文件路径、覆盖页面与未执行验证事项。
