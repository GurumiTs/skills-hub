# Workflow State Playbook

Workflow State 是 skills-hub 的跨 Command 交接格式，不是 Gemini CLI 官方 state engine。它只保存後續階段真正需要的 compact context，避免重複讀取完整 manifests、playbooks 與前序長篇回覆。

使用 `write_sdlc_artifact` 儲存於 configured workflow directory；更新時建立版本化檔案，不覆寫既有 state。

## Reuse Rule

`/sdlc:plan` 透過 `inspect_project_context` 建立 snapshot 與 `context_fingerprint`。後續階段：

1. 先比對 evidence fingerprints。
2. 未變更時重用 snapshot。
3. 缺失、衝突或變更時才重新 inspect。
4. 原始 manifest 只在 compact result 無法支撐判斷時讀取最小範圍。
5. Connection value 與 secrets 永遠不進入 state。

## Compact State Template

```markdown
# SDLC Workflow State

## Workflow

| Item | Value |
|---|---|
| Workflow ID | |
| Source / ID | |
| Target Project | |
| Current Stage | |
| Current Gate | |
| Gate Status | Pending / Ready for Approval / Approved / Rejected / Blocked / Skipped / Needs More Evidence |
| Required Next Step | |
| Updated At | |

## Requirement Contract

### Summary
### Acceptance Criteria
### In Scope
### Out of Scope
### Assumptions / Open Questions

## Project Context Snapshot

| Item | Value | Evidence |
|---|---|---|
| Project Type | | |
| Language / Version | | |
| Runtime / Framework | | |
| Package Manager | | |
| Direct Dependency Source | | |
| Resolved Dependency Source | | |
| Build Target / Compiler | | |
| Hosting / Deployment | | |
| DB Platform / Hosting | | |
| Connection Names / Providers | values redacted | |
| Context Fingerprint | | |
| Context Risk | None / Low / Medium / High / Needs More Evidence | |

### Evidence Fingerprints

| File | SHA-256 | Size |
|---|---|---|

## File Encoding Policy

| Item | Value | Evidence |
|---|---|---|
| Existing File Rule | Preserve encoding / BOM / line ending | inspect_text_encoding |
| Observed Encoding | | |
| New File Default | utf8 / utf8-bom / project-specific / Needs More Evidence | |
| Line Ending | CRLF / LF / Mixed / Unknown | |

## Playbooks Used

只記錄實際讀取的 playbook；未讀取不得標示 Used。

| Area | Playbook | Reason | Status |
|---|---|---|---|

## Stage and Gate Status

| Stage | Status | Owner Agent | Output / Notes |
|---|---|---|---|
| Planning | Pending / Done / Blocked / Needs More Evidence | SA / DB / Orchestrator | |
| Development | Pending / Done / Blocked / Needs More Evidence | Developer Agent | |
| Test | Pending / Done / Blocked / Not Tested / Needs More Evidence | Test Agent | |
| Review | Pending / Done / Blocked / Needs More Evidence | Review / DB / Security | |
| Release / UAT / Handover | Pending / Done / Blocked / Needs More Evidence | Release Agent | |

| Gate | Status | Evidence / Decision |
|---|---|---|
| SA / DB → Development | | |
| Development → Test | | |
| Test → Review | | |
| Security → Release | | |
| Release → UAT | | |
| UAT → Handover | | |

## Expected Changes

| Type | Target | Reason | Approval / Status |
|---|---|---|---|

## Actual File Changes

| Action | Path | Summary | Encoding Before | Encoding After | BOM | Line Ending | Verification |
|---|---|---|---|---|---|---|---|

## DB Change Proposals

| Object / File | Summary | Rollback | Validation | Status |
|---|---|---|---|---|

## Test Summary

| Mode | Status | Regression Scope | Failed / Blocked / Not Tested |
|---|---|---|---|

## Review Summary

| Area | Decision | Blocking / High Findings |
|---|---|---|

## Generated Artifacts

| Category | Path | Status |
|---|---|---|

## Agent Execution Trace

| Sequence | Stage | Agent | Invocation Type | Result | Artifact |
|---|---|---|---|---|---|

## Risks / Follow-up / Rollback
```

## Gate Rules

- Gate 不是 `Approved` 時不得進入下一個 mutating stage。
- Project Context 不足、fingerprint 失效、encoding verification 失敗或 evidence 缺失時使用 `Needs More Evidence` / `Blocked`。
- `Development → Test` 需要 Implementation Result 與 encoding verification。
- `Test → Review` 需要 Test Report 或等效有效證據。
- `Security → Release` 不得存在 unresolved Blocking / High issue。
- `Release → UAT` 需要 deployment validation 與 rollback plan。
