# Vibe 功能实施计划

**Goal**：让用户在 Chain 编辑器与生图实验室中导入 NovelAI / 智绘姬导出的 `.naiv4vibe`，保存到浏览器本地库，挂载 1–4 个 Vibe，并将所选预编码正确送入 NovelAI V4.5 生图请求。

**Architecture**：`vibeFile` 独占外部文件格式解析，`vibeLibrary` 独占 IndexedDB 持久化，`vibeRules` 独占挂载校验与编码解析，`naiPayload` 独占生成请求组装，`ChainEditorVibePanel` 独占用户交互。Chain 仅保存轻量 `VibeMount`，encoded 与预览图只留在本地库。

**Tech Stack**：React 19、TypeScript、原生 IndexedDB、Tailwind CSS 4、Vitest、fake-indexeddb。

**Baseline/Authority Refs**：`AGENTS.md`、`docs/aegis/baseline/2026-06-22-initial-baseline.md`、NovelAI 官方 Vibe Transfer 文档、NovelAI Image API contract、已确认的 OpenCode session 设计。

**Compatibility Boundary**：旧 Chain 没有 `vibes` 时请求与界面行为不变；不修改 Worker、D1、R2；不把 encoded 或大缩略图写入 Chain；不改变登录、游客、历史和 metadata 导入流程。

**Verification**：`npm test`、`npm run build`，以及浏览器手动验证导入、持久化、挂载、超限阻止和暗色模式。

## Plan Basis

- 事实：`.naiv4vibe` 是 UTF-8 JSON，顶层标识为 `novelai-vibe-transfer`，编码位于 `encodings.<model>.<variant>.encoding`，每个编码绑定 `params.information_extracted`。
- 事实：官方支持最多 16 个 Vibe，但第 5 个起产生额外 Anlas 成本；一期 UI 限制 4 个。
- 事实：一期不调用 `/ai/encode-vibe`，因此 Information Extracted 只能选择导入文件中已缓存的档位，不能任意连续改变。
- 假设：智绘姬导出保持 NovelAI 单文件结构；解析器额外接受 `vibes[]` bundle 结构中的单项，以覆盖常见导出变体。
- 未知：缺少用户的真实智绘姬样例文件；通过严格错误提示与多结构 fixture 降低风险，最终仍需真实样例确认。

## Architecture Integrity Lens

- 不变量：生成请求中的每个 Vibe 都必须解析为一个真实存在的 encoded 档位。
- canonical owner：外部格式由 `services/vibeFile.ts` 管理；本地数据由 `services/vibeLibrary.ts` 管理；请求字段由 `services/naiPayload.ts` 管理。
- 责任重叠：禁止 UI 自行解析 JSON，禁止 `ChainEditor.tsx` 直接操作 IndexedDB，禁止 `naiService.ts` 查询本地库。
- 更高层简化：生成前由编辑器一次性解析挂载，向 `generateImage` 传入运行时 encoded；持久化参数仍保持轻量。
- 退役条件：若二期接入 `/ai/encode-vibe`，Information Extracted 可升级为连续滑块；一期不保留伪连续 fallback。
- 结论：按独立 owner 文件推进。

## Plan Pressure Test

- Owner / contract / retirement：边界清楚；不引入兼容 adapter 或双 owner。
- Architecture integrity / higher-level path：`buildGenerationPayload` 作为唯一 payload owner。
- Verification scope：parser、rules、IndexedDB、payload 单测，加全量 build 与手动 UI。
- Task executability：每项都有明确文件与命令。
- Pressure result：proceed。

## Plan-Time Complexity Check

- Target files：`ChainEditor.tsx` 1313 行、`naiService.ts` 152 行、`types.ts` 156 行。
- Existing size / shape signals：`ChainEditor.tsx` 明显过载。
- Owner fit：编辑器适合编排，不适合解析、存储或 payload 规则。
- Add-in-place risk：在编辑器内实现会增加异步状态、文件 I/O 和校验分支。
- Better file boundary：新增 `vibeFile`、`vibeLibrary`、`vibeRules`、`naiPayload`、`ChainEditorVibePanel`。
- Recommendation：add owner file；编辑器只接线。

## Task 1：建立测试设施与领域 contract

**Files**：修改 `package.json`、`package-lock.json`、`types.ts`；创建 `vitest.config.ts`、`services/vibeFile.test.ts`。

**Why**：先把 `.naiv4vibe` 的真实输入、输出与轻量挂载形状固定下来。

**Impact/Compatibility**：只增加开发依赖和可选字段；旧数据无需迁移。

**Verification**：`npm test -- services/vibeFile.test.ts`，预期先因模块不存在而 RED，完成 parser 后 GREEN。

- [ ] 写入 fixture：单个 Vibe、多个 IE 档位、bundle 单项、非法 identifier、缺失 encoding。
- [ ] 运行测试并确认因 `services/vibeFile.ts` 缺失或导出缺失而失败。
- [ ] 在 `types.ts` 增加 `VibeEncoding`、`VibePreset`、`VibeMount`、`ResolvedVibe` 和 `NAIParams.vibes?`。
- [ ] 创建 parser，验证 identifier、编码字符串、IE 数字和至少一个编码，生成稳定 id、名称、预览 Data URI 与默认 Strength。
- [ ] 重跑目标测试并确认全部通过。

## Task 2：实现本地库与挂载规则

**Files**：创建 `services/vibeLibrary.ts`、`services/vibeLibrary.test.ts`、`services/vibeRules.ts`、`services/vibeRules.test.ts`。

**Why**：确保导入结果刷新后仍存在，并在生成前阻止断链、无档位和强度超限。

**Impact/Compatibility**：新建独立 `NAI_Vibe_DB`，不升级历史数据库；Chain 仅存 `vibeId/name/strength/informationExtracted`。

**Verification**：`npm test -- services/vibeLibrary.test.ts services/vibeRules.test.ts`。

- [ ] 用 fake-indexeddb 写入新增、覆盖、读取、倒序列表和删除测试，并确认 RED。
- [ ] 实现 `VibeLibrary` 的 `list/get/put/delete/clear`，每个 transaction 正确处理 `onerror/onabort`。
- [ ] 写入 4 个规则测试：空挂载、缺失本地项、IE 档位不匹配、Strength 总和大于 1。
- [ ] 实现 `resolveVibeMounts(mounts, presets)` 与 `validateVibeMounts`，返回准确 encoded，禁止静默选 nearest 档位。
- [ ] 重跑目标测试并确认全部通过。

## Task 3：建立生成 payload contract

**Files**：创建 `services/naiPayload.ts`、`services/naiPayload.test.ts`；修改 `services/naiService.ts`。

**Why**：把 Vibe producer 与 NovelAI consumer 的字段映射做成可独立验证的纯函数。

**Impact/Compatibility**：无 Vibe 时不得出现 `reference_*` 字段；有 Vibe 时三个数组顺序一致。

**Verification**：`npm test -- services/naiPayload.test.ts`。

- [ ] 写无 Vibe payload 快照断言并确认现有代码尚无纯函数而 RED。
- [ ] 写双 Vibe 顺序断言：`reference_image_multiple`、`reference_strength_multiple`、`reference_information_extracted_multiple`。
- [ ] 把现有 payload 构造迁移到 `buildGenerationPayload`，保留 seed、quality、UC、characters 和 Variety+ 现有行为。
- [ ] 让 `generateImage` 接收可选 resolved Vibe 数组并调用唯一 payload owner。
- [ ] 重跑 payload 测试及全部服务测试并确认 GREEN。

## Task 4：实现编辑器 Vibe 面板

**Files**：创建 `components/ChainEditorVibePanel.tsx`；修改 `components/ChainEditor.tsx`。

**Why**：完成导入、库选择、挂载、Strength 调节、IE 档位选择和删除的用户流程。

**Impact/Compatibility**：面板位于参数区下方；游客可在本地使用；只读 Chain 只能查看；挂载最多 4 个。

**Verification**：`npm run build`，随后在浏览器验证交互。

- [ ] 组件初始化时读取本地库，并展示加载、空态和错误态。
- [ ] 文件输入接受 `.naiv4vibe,.naiv4vibebundle,application/json`，解析每个条目后写库并自动挂载未挂载项。
- [ ] 已挂载卡片显示缩略图或渐变占位、名称、Strength slider、IE 可用档位 select、移除按钮。
- [ ] 库模态提供名称搜索、挂载/已挂载状态和删除；删除库项时同步移除当前挂载，避免悬空引用。
- [ ] 面板显示 `已挂载 n/4` 和 Strength 合计；超过 1 时显示 amber 阻断提示。

## Task 5：接通生成、保存、重置与错误反馈

**Files**：修改 `components/ChainEditor.tsx`、必要时修改 `components/ChainEditorPreview.tsx`。

**Why**：让 UI 状态真正进入生成请求，并在本地库异常时给出可操作错误。

**Impact/Compatibility**：保存/Fork 只携带轻量挂载；重置实验室清空挂载；本地历史继续保存轻量参数。

**Verification**：`npm test`、`npm run build`、浏览器手动生成前验证。

- [ ] 生成前读取挂载所需 presets 并调用 `resolveVibeMounts`；校验失败时保持按钮可恢复并展示中文错误。
- [ ] 将 resolved Vibe 传入 `generateImage`，不把 encoded 合并回 `params`。
- [ ] Reset 明确设 `vibes: []`；Save/Fork 沿用 `params` 的轻量挂载。
- [ ] 确认旧 Chain、metadata 导入与外部一键导入在没有 `vibes` 时保持原行为。
- [ ] 运行所有测试与完整 build。

## Task 6：验收、文档与架构回填

**Files**：更新 `docs/aegis/work/2026-07-17-vibe-feature/`、`docs/aegis/INDEX.md`；仅在形成长期决策时新增 ADR。

**Why**：用需求逐项证据证明完整功能，而不是只凭 build 通过。

**Verification**：`npm test`、`npm run build`、Aegis workspace `bundle/check`、浏览器手动验收记录。

- [ ] 逐项核对导入、持久化、挂载、调参、超限阻止、payload、旧 Chain 兼容。
- [ ] 在可用浏览器环境验证亮/暗色、窄屏布局、只读状态和错误提示。
- [ ] 记录真实 `.naiv4vibe` 样例是否已验证；没有样例时明确留下风险，不伪称格式全覆盖。
- [ ] 运行 workspace bundle/check 并补充 evidence、checkpoint、drift、reflection。
- [ ] 执行 `aegis:verification-before-completion` 的 Goal Closure 后才可声明完成。

## Risks

- 智绘姬可能包装 bundle 或修改名称字段；parser 仅接受可验证结构，不对未知字段做猜测。
- encoded 体积可能较大；独立 IndexedDB 避免 D1 与 Chain JSON 膨胀，但仍受浏览器配额约束，写入错误必须展示。
- 用户删除本地库后，云端 Chain 的挂载引用会失效；生成前明确报错并引导重新导入。
- 没有真实 NAI API Key 时只能验证 payload，不能证明服务端实际接受；此项在证据中单独标记。

## Retirement

- 不创建内联 encoded fallback，因此没有后续双路径退役负担。
- 若未来实现 `/ai/encode-vibe`，由新的编码服务扩展 preset 档位，替换“仅选择已有 IE 档位”的 UI；当前解析与存储 owner 保留。
- 若官方字段发生变化，只修改 `vibeFile` 与 `naiPayload` 两个 contract owner，不在 UI 增加兼容分支。
