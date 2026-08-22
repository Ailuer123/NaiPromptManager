# 实现 Vibe 功能 - Intent

## TaskIntentDraft

- Requested outcome: 完成 NovelAI 与智绘姬导出的 Vibe 文件导入、管理、挂载和生图请求集成
- Goal: 用户能在 Chain 编辑器和实验室中导入并使用预编码 Vibe 完成图片生成
- Success evidence:
- 解析与 payload 测试通过；本地库可持久化；UI 可挂载与调参；完整构建通过；关键流程完成手动验证
- Stop condition: 全部验收证据满足则完成；出现外部格式样本缺失但仍可推进时标为待验证；权限或外部服务造成不可继续时记录阻塞；新增云端编码需求时标记超范围
- Non-goals:
- 不上传原图编码、不做云端同步、不支持 Precise Reference、不新增独立导航页
- Scope: 前端 types、Vibe 文件解析、IndexedDB 本地库、ChainEditor UI、naiService payload 与测试；不改 Worker、D1、R2
- Change kinds:
- feature
- Risk hints:
- 专有文件格式、多编码档位、IndexedDB 持久化和生成请求 contract

## BaselineReadSetHint

- docs/aegis/baseline/2026-06-22-initial-baseline.md

## ImpactStatementDraft

- Compatibility boundary: 旧 Chain 无 vibes 时行为不变；不改变 Worker、D1、R2；现有登录与历史功能不受影响
- Affected layers:
- React UI、前端服务、生成 API contract、本地持久化
- Owners:
- services/vibeFile.ts、services/vibeLibrary.ts、services/naiPayload.ts、components/ChainEditorVibePanel.tsx
- Invariants:
- encoded 仅保存在 IndexedDB，不写入 Chain 或 D1；生成前必须解析到准确的编码档位
- Non-goals:
- 不上传原图编码、不做云端同步、不支持 Precise Reference、不新增独立导航页

These records are Method Pack drafts / hints, not authoritative runtime decisions.
