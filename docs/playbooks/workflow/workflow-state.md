# Workflow State Playbook

Workflow State 用於記錄 `/sdlc:plan`、`/sdlc:run`、`/sdlc:implement`、`/sdlc:review`、`/sdlc:release` 執行過程中的階段狀態、gate 決策與交付物。

此文件定義建議格式。若要實際寫入 workflow state 檔案，仍必須遵守 `GEMINI.md` Change Control，先取得使用者明確同意。

## 建議儲存位置

```text
docs/_generated/workflows/<workflow-id>/state.md
```

若任務目標是外部專案，應優先依該目標專案的文件規則存放，或由使用者指定。

## Workflow ID 建議

```text
YYYYMMDD-<source>-<short-title>
```

範例：

```text
20260701-redmine-1234-email-2fa
```

## State Template

```markdown
# SDLC Workflow State

## Workflow Info

| 項目 | 內容 |
|---|---|
| Workflow ID | |
| Source | Redmine / Manual / GitHub Issue / Incident |
| Source ID | |
| Target Project | |
| Current Stage | |
| Created At | |
| Updated At | |
| Owner | |

## Requirement Summary

## Acceptance Criteria

## In Scope

## Out of Scope

## Assumptions

## Open Questions

## Stage Status

| Stage | Status | Owner Agent | Output / Link | Notes |
|---|---|---|---|---|
| Requirement Intake | Pending / Done / Blocked | Workflow Orchestrator | | |
| SA Analysis | Pending / Done / Blocked | SA Agent | | |
| DB Impact | Pending / Done / Blocked | DB Agent | | |
| Implementation Planning | Pending / Done / Blocked | Developer Agent | | |
| Development | Pending / Done / Blocked | Developer Agent | | |
| DB Change | Pending / Done / Blocked | DB Agent | | |
| Test Planning | Pending / Done / Blocked | Test Agent | | |
| Test Execution | Pending / Done / Blocked | Test Agent | | |
| Code Review | Pending / Done / Blocked | Review Agent | | |
| DB Review | Pending / Done / Blocked | DB Agent | | |
| Security Review | Pending / Done / Blocked | Security Agent | | |
| Release Planning | Pending / Done / Blocked | Release Agent | | |
| UAT Support | Pending / Done / Blocked | SA Agent / Test Agent | | |
| Handover | Pending / Done / Blocked | Release Agent | | |
| Incident / RCA | Pending / Done / Blocked | Incident Agent | | |

## Gate Decisions

| Gate | Status | Decision By | Decision Time | Notes |
|---|---|---|---|---|
| SA / DB → Development | Pending / Approved / Rejected / Blocked | | | |
| Development → Test | Pending / Approved / Rejected / Blocked | | | |
| Test → Review | Pending / Approved / Rejected / Blocked | | | |
| Review → Security | Pending / Approved / Rejected / Blocked | | | |
| Security → Release | Pending / Approved / Rejected / Blocked | | | |
| Release → UAT | Pending / Approved / Rejected / Blocked | | | |
| UAT → Handover | Pending / Approved / Rejected / Blocked | | | |

## Expected File Changes

| Action | Path | Reason | Status |
|---|---|---|---|

## Actual File Changes

| Action | Path | Summary |
|---|---|---|

## DB Changes

| Type | Object | Summary | Rollback |
|---|---|---|---|

## Test Results

## Review Results

## Security Results

## Release Notes

## Rollback Plan

## Follow-up Items
```

## Status Values

| Status | Meaning |
|---|---|
| Pending | 尚未開始 |
| In Progress | 正在處理 |
| Done | 已完成 |
| Blocked | 因問題停止 |
| Skipped | 經確認後略過 |

## Gate Rule

如果 gate status 不是 `Approved`，不得進入下一個 mutating 階段。
