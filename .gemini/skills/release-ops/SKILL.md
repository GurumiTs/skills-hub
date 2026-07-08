---
name: release-ops
description: Use when the task requires deployment planning, rollback planning, release notes, post-deployment validation, UAT checklist, handover, or operational runbook output.
---
# Release Ops Skill

## Capability

此 Skill 提供 Release / Operations capability。

當此 Skill 被啟用時，使用它的 Agent 應依據已通過 review gate 的 SDLC 變更，整理 deployment steps、post-deployment validation、rollback plan、UAT checklist、handover 與 runbook notes。

此 Skill 不改變目前 Agent 的主要身份；若由 Release Agent 使用，仍應以 `.gemini/agents/release-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 整理 release preconditions。
- 產出 deployment scope 與 deployment steps。
- 產出 DB deployment steps，若適用。
- 產出 post-deployment validation。
- 產出 rollback plan。
- 產出 UAT checklist。
- 產出 handover / runbook notes。
- 彙整 open risks 與 required decisions。

此 Skill 不負責：

- 實際部署。
- 實際 DB mutation。
- 修改正式環境設定。
- 忽略 blocking / high-risk unresolved issues。
- 最終 release approval。

## Use Cases

使用於：

- `/sdlc:release` 需要產出 Release Package。
- Test / DB / Code / Security Review 已完成，需進入 Release Planning。
- 使用者要求部署步驟、rollback plan、UAT checklist 或 handover notes。
- 本次變更需要整理 release preconditions、validation、open risks 與 runbook。
- 需要判斷 Release → UAT 或 UAT → Handover Gate 是否可進入下一步。

## Non-use Cases

不使用於：

- Review gate 尚未通過。
- 有 unresolved Blocking issue。
- 有 unresolved High security risk。
- 需求尚未確認，無法定義 UAT。
- 使用者要求直接部署，但未明確核准。
- 任務主要是 code implementation、DB migration design、test design 或 security review。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取 release 相關設定、部署文件或 pipeline 定義 | 僅限與 release scope 直接相關內容 |
| Git diff / status | 確認 release scope 與 modified files | 不自動 commit，不 push |
| Test result reading | 確認測試證據與 not-tested items | 不將未測項目視為通過 |
| DB review reading | 確認 DB deployment / rollback / validation | 不執行 DB mutation |
| File output | 產出 release package 或 runbook 草稿 | 寫檔前必須遵守 `GEMINI.md` Change Control |

## Inputs Required

- Change Summary：本次變更摘要。
- Approved Scope：本次核准範圍。
- Implementation Result：實作結果與 modified files。
- Test Review Result：測試結果與 Not Tested 項目。
- DB Review Result：DB review 狀態、migration、validation、rollback。
- Code Review Result：Code Review findings。
- Security Review Result：Security Review findings。
- Deployment Target：目標環境、服務、站台、job、pipeline 或部署範圍。
- Acceptance Criteria：UAT 與部署後驗證依據。
- Known Risks：已知風險與 follow-up items。

若缺少必要輸入，Release Gate 必須標示為 `Needs More Evidence` 或 `Blocked`。

## Expected Outputs

- Change Summary。
- Release Preconditions。
- Deployment Scope。
- Deployment Steps。
- DB Deployment Steps。
- Post-deployment Validation。
- Rollback Plan。
- UAT Checklist。
- Handover / Runbook Notes。
- Open Risks。
- Gate Decision。

## Workflow

1. 確認 Change Summary、Approved Scope、Implementation Result。
2. 檢查 Test Review、DB Review、Code Review、Security Review 狀態。
3. 若存在 Blocking 或 High unresolved issue，停止 release planning 並標示 Gate Blocked。
4. 整理 Release Preconditions。
5. 產出 Deployment Scope 與 Deployment Steps。
6. 若涉及 DB / SQL / Data Flow，產出 DB Deployment Steps；若不適用，明確寫 `Not Applicable` 與理由。
7. 產出 Post-deployment Validation，並對應 Acceptance Criteria 或 known risks。
8. 產出 Rollback Plan，至少拆分 Code / File、DB、Config、Deployment、Operation。
9. 產出 UAT Checklist。
10. 產出 Handover / Runbook Notes。
11. 彙整 Open Risks 與 Required Decisions。
12. 輸出 Release → UAT 或 UAT → Handover Gate decision。

## Rollback Rules

Rollback Plan 不得只寫「回復上一版」。

必須依實際變更拆分：

| Rollback Area | Required Content |
|---|---|
| Code / File Rollback | 要還原哪些檔案、commit、build artifact 或 package |
| DB Rollback | rollback SQL、資料回復方式、不可逆風險、驗證方式 |
| Config Rollback | app config、env、feature flag、job setting、pipeline setting |
| Deployment Rollback | service、site、container、job、pipeline 回復方式 |
| Operation Rollback | 通知、暫停批次、切回舊流程、人工處置 |

若某一類不適用，需寫 `Not Applicable` 與理由。

## UAT Rules

UAT Checklist 必須對應：

- Acceptance Criteria。
- 使用者主要操作流程。
- 受影響角色。
- 受影響資料狀態。
- Edge cases。
- Release risks。

若 Acceptance Criteria 不清，必須回交 SA Agent 或標示為 Gate Blocked。

## File Output Rules

此 Skill 可能產生 Release Package、UAT checklist 或 Runbook 文件。

任何新增、修改、刪除、搬移或覆寫檔案前，必須確認使用者已明確核准該次 change proposal 或 workflow gate。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的 release 草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不執行正式部署。
- 不執行 DB mutation。
- 不修改正式環境。
- 不忽略 rollback。
- 不在 review gate 未通過時建議 release。
- 不在 Blocking 或 High unresolved issue 存在時建議 release。
- 不把缺少 evidence 的 precondition 寫成已完成。
- 不覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Release Package

## Change Summary

## Release Preconditions

| Item | Status | Evidence / Notes |
|---|---|---|
| Approved Scope | Ready / Missing | |
| Implementation Result | Ready / Missing | |
| Test Review | Pass / Blocked / Needs Evidence | |
| DB Review | Pass / Not Applicable / Blocked / Needs Evidence | |
| Code Review | Pass / Blocked / Needs Evidence | |
| Security Review | Pass / Blocked / High Risk / Needs Evidence | |
| Rollback Plan | Ready / Incomplete | |
| Deployment Target | Confirmed / Missing | |

## Deployment Scope

## Deployment Steps

| Step | Action | Target | Owner | Validation | Risk | Rollback Point |
|---|---|---|---|---|---|---|

## DB Deployment Steps

## Post-deployment Validation

| Acceptance Criteria / Risk | Validation Step | Expected Result | Failure Handling |
|---|---|---|---|

## Rollback Plan

### Code / File Rollback

### DB Rollback

### Config Rollback

### Deployment Rollback

### Operation Rollback

## UAT Checklist

| Scenario | Steps | Expected Result | Owner | Notes |
|---|---|---|---|---|

## Handover / Runbook Notes

### Monitoring Points

### Common Issues

### Troubleshooting Steps

### Follow-up Items

## Open Risks

| Severity | Risk | Impact | Required Decision |
|---|---|---|---|

## Gate Decision

- Gate: Release → UAT / UAT → Handover
- Status: Ready for Approval / Needs More Evidence / Blocked
- Reason:
- Required Next Step:
```

## Examples

```text
請依照已通過 review gate 的 SDLC 變更產出 Release Package，包含 deployment steps、post-deployment validation、rollback plan、UAT checklist 與 handover notes。
```
