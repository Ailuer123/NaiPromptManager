# ADR-0002：Vibe 编码仅由本地库持有，Chain 保存轻量引用

- **状态**：已采纳（回填自实现）
- **日期**：2026-07-17
- **来源证据**：`docs/aegis/work/2026-07-17-vibe-feature/`、`docs/aegis/plans/2026-07-17-vibe-feature.md`

## 背景

NovelAI V4 的 `.naiv4vibe` 文件可能同时包含原图、缩略图，以及多个 Information Extracted 档位对应的预编码字符串。encoded 数据体积明显大于普通 Chain 参数；项目现有 Chain 会保存到 D1，而 Vibe 一期被定义为浏览器本地能力，不做云端同步或 R2 上传。

生成时又必须把准确的 encoded 传给 NovelAI，因此需要明确 encoded 的 source of truth，以及 Chain 在刷新、保存和 Fork 时携带什么数据。

## 决策

1. `services/vibeLibrary.ts` 管理独立 IndexedDB `NAI_Vibe_DB`，它是 Vibe encoded、可用 IE 档位和缩略图的唯一持有者。
2. `NAIParams.vibes` 只保存 `vibeId`、名称、Strength 和所选 Information Extracted，不保存 encoded 或缩略图。
3. 生成前由 `services/vibeRules.ts` 将轻量挂载与本地库合并，必须精确解析到已存在的 IE 档位；解析失败时阻止请求并提示重新导入。
4. `services/naiPayload.ts` 是 NovelAI 生成 payload 的唯一 owner，负责把运行时 Vibe 映射为三个顺序一致的 `reference_*_multiple` 数组。
5. 不提供 inline encoded fallback。本地库被清除或换浏览器后，原 Chain 的挂载会明确失效，不把大数据静默写入 D1。

## 备选方案

### A. encoded 始终内联到 `NAIParams`

- 优点：Chain 跨浏览器恢复时无需重新导入。
- 缺点：Chain JSON 和 D1 体积显著增加，缩略图与多个编码档位会重复存储，并改变普通用户存储配额语义。

### B. 本地库保存 encoded，Chain 只保存轻量引用（采纳）

- 优点：保持云端数据轻量；同一个 Vibe 可被多个 Chain 复用；不改 Worker、D1、R2。
- 缺点：清理浏览器数据或换设备后需要重新导入 Vibe。

### C. encoded 上传 R2，Chain 保存云端 URL

- 优点：可以跨设备同步。
- 缺点：需要新权限、配额、删除和隐私 contract，也会扩大一期后端范围。

## 后果

- 旧 Chain 没有 `vibes` 时保持原行为，无需迁移。
- Chain 保存、Fork 和本地历史只携带轻量挂载。
- 删除本地库项会同步移除当前编辑器挂载；加载到其他浏览器的旧挂载会在生成前得到明确错误。
- `.naiv4vibe` 中同一个官方 `id` 再次导入时覆盖本地项，避免重复存储。
- 一期不调用 `/ai/encode-vibe`，Information Extracted 只能选择文件已有档位。

## 兼容边界

- 不修改 Worker、D1 schema、R2 或认证权限。
- 不把 Vibe 数据加入 Prompt 编译顺序。
- 不支持 Precise Reference，也不把它与 Vibe 混用。
- 游客可以使用浏览器本地库和实验室，但不能因此获得云端保存权限。

## 退役影响

- 当前没有旧 Vibe owner 或 fallback 需要退役。
- 若未来接入 `/ai/encode-vibe`，编码服务应扩展同一个本地库 owner；只有正式支持云端同步时，才重新评估轻量引用 contract。

## Baseline 同步

`docs/aegis/baseline/2026-06-22-initial-baseline.md` 已补充 Vibe 本地库、payload owner 与轻量引用兼容边界。

## 验证证据

- `npm test`：parser、IndexedDB、挂载规则、payload 与 React 主流程测试。
- `npm run build`：TypeScript、Vite 和 Worker 完整构建。
- NovelAI 官方 Image API schema：确认三个 `reference_*_multiple` 字段及数组类型。
