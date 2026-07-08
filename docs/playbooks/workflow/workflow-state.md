# Workflow State Playbook

Workflow State 用於記錄 `/sdlc:plan`、`/sdlc:run`、`/sdlc:implement`、`/sdlc:test`、`/sdlc:review`、`/sdlc:release` 執行過程中的階段狀態、gate 決策與交付物。

此文件定義建議格式。若要實際寫入 workflow state 檔案，仍必須遵守 `GEMINI.md` Change Control，先取得使用者明確同意。

Workflow State 是本 repo 的狀態交接格式，不是 Gemini CLI 官方內建 workflow state engine。Gemini CLI 的 project custom commands、`@{...}` file injection 與 `GEMINI.md` context 可協助載入此格式，但狀態更新、gate 判斷與交接規則由本 repo 的 Commands / Agents / Skills 定義。

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

## Version Context Rule

針對既有專案時，Workflow State 必須記錄可影響實作、測試、review 或 release 的版本資訊。

不得以最新版框架、最新版 library、最新版語法或通用最佳實務取代目標專案實際版本。

若無法判斷版本，必須標示：

```text
Version Context: Unknown
Gate Status: Needs More Evidence / Blocked
```

常見版本來源包含：

- `.sln`、`.csproj`、`web.config`、`packages.config`、`global.json`。
- `requirements.txt`、`pyproject.toml`、`Pipfile`。
- `pom.xml`、`build.gradle`。
- `.psd1`、`.psm1`、PowerShell module manifest。
- DB connection hint、SQL dialect、schema metadata、LookML model / explore / view。
- DB hosting / runtime environment，例如 Google Cloud SQL、Azure SQL、AWS RDS、VM、on-prem。
- CI / deployment / runtime 設定。

DB Platform 與 DB Hosting 必須分開記錄。`MSSQL`、`Oracle`、`BigQuery` 是 DB platform / dialect；`Google Cloud SQL` 是 hosting / managed service context，不應寫成 `MSSQL CloudSQL`。

## Playbook Reference Rule

`Playbooks Used` 是本 repo 的交接欄位，用來記錄 Agent / Skill 在該階段實際參考的文件與判斷理由。

這不是 Gemini CLI 官方自動 Playbook Routing 功能。若 command 或 agent 需要使用 playbook，必須透過 prompt 指示、`@{...}` file injection、`GEMINI.md` context 或明確讀檔行為取得內容。

若無法判斷應參考哪份 playbook，必須標示 `Needs More Evidence`，不得隨機套用不相干 playbook。

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
| Current Gate | |
| Gate Status | Pending / Ready for Approval / Approved / Rejected / Blocked / Skipped / Needs More Evidence |
| Created At | |
| Updated At | |
| Owner | |

## Requirement Summary

## Acceptance Criteria

## In Scope

## Out of Scope

## Assumptions

## Open Questions

## Project and Version Context

| Item | Value | Evidence / Source | Notes |
|---|---|---|---|
| Project Type | C# / ASP.NET Framework / WebForm / Python / PowerShell / Java / Prompting / LookML / Unknown | | |
| Runtime / Framework Version | | | |
| Language Version | | | |
| Dependency Source | NuGet / pip / Maven / Gradle / PowerShell module / Other | | |
| Build / Deployment Target | | | |
| DB Platform | MSSQL / Oracle / BigQuery / Not Applicable / Unknown | | |
| DB Hosting / Runtime Environment | Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Not Applicable / Unknown | | |
| BI / Semantic Layer | LookML / Looker / Not Applicable / Unknown | | |
| Version Risk | None / Low / Medium / High / Needs More Evidence | | |

## Playbooks Used

| Area | Playbook | Selection Reason | Status |
|---|---|---|---|
| Workflow | docs/playbooks/workflow/sdlc-pipeline.md | Standard SDLC pipeline | Used |
| Workflow | docs/playbooks/workflow/workflow-state.md | Workflow state handoff format | Used |
| Tech Stack | | | Used / Missing / Needs More Evidence |
| Database | | | Used / Missing / Needs More Evidence / Not Applicable |
| Testing | | | Used / Missing / Needs More Evidence |
| Review | | | Used / Missing / Needs More Evidence |
| Security | | | Used / Missing / Needs More Evidence |
| Release | | | Used / Missing / Needs More Evidence |

## Stage Status

| Stage | Status | Owner Agent | Output / Link | Notes |
|---|---|---|---|---|
| Requirement Intake | Pending / In Progress / Done / Blocked / Needs More Evidence | Workflow Orchestrator | | |
| SA Analysis | Pending / In Progress / Done / Blocked / Needs More Evidence | SA Agent | | |
| Project / Version Discovery | Pending / In Progress / Done / Blocked / Needs More Evidence | Workflow Orchestrator / Developer Agent | | |
| DB Impact | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | DB Agent | | |
| Implementation Planning | Pending / In Progress / Done / Blocked / Needs More Evidence | Developer Agent | | |
| Development | Pending / In Progress / Done / Blocked / Needs More Evidence | Developer Agent | | |
| DB Change | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | DB Agent | | |
| Test | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | Test Agent | | Test Report / Dry Run / Evidence Review |
| DB Review | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | DB Agent | | |
| Code Review | Pending / In Progress / Done / Blocked / Needs More Evidence | Review Agent | | |
| Security Review | Pending / In Progress / Done / Blocked / Needs More Evidence | Security Agent | | |
| Release Planning | Pending / In Progress / Done / Blocked / Needs More Evidence | Release Agent | | |
| UAT Support | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | SA Agent / Test Agent | | |
| Handover | Pending / In Progress / Done / Blocked / Needs More Evidence | Release Agent | | |
| Incident / RCA | Pending / In Progress / Done / Blocked / Skipped / Needs More Evidence | Incident Agent | | |

## Gate Decisions

| Gate | Status | Decision By | Decision Time | Notes |
|---|---|---|---|---|
| Requirement Intake → SA | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| SA → Project / Version Discovery | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| Project / Version Discovery → DB Impact / Implementation Planning | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| SA / DB → Development | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| Development → Test | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| Test → Review | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| Security → Release | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| Release → UAT | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |
| UAT → Handover | Pending / Approved / Rejected / Blocked / Needs More Evidence | | | |

## Expected File Changes

| Action | Path | Reason | Status |
|---|---|---|---|

## Actual File Changes

| Action | Path | Summary |
|---|---|---|

## DB Changes

| Type | Object | Summary | Rollback |
|---|---|---|---|

## DB-assisted Dry Run Evidence

| DB Platform | Object / Table / Dataset | Query Type | Read-only Evidence | Risk / Notes |
|---|---|---|---|---|

## Test Report

| Item | Value |
|---|---|
| Test Mode | Planning / Dry Run / Evidence Review / Execution |
| Test Status | Pass / Fail / Blocked / Not Tested / Not Applicable / Needs More Evidence |
| Dry Run Result | |
| Regression Scope | |
| Failed / Blocked / Not Tested Items | |

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
| Needs More Evidence | 需要更多需求、版本、DB、測試、環境或外部系統證據，不能視為通過 |

## Gate Rule

如果 gate status 不是 `Approved`，不得進入下一個 mutating 階段。

若下一階段不是 mutating，但依賴缺失證據，仍不得把 `Needs More Evidence` 視為通過。

以下 Gate 必須特別嚴格：

- `SA / DB → Development`：沒有 approved scope、DB impact 或 Version Context，不得進入 Development。
- `Development → Test`：沒有 Implementation Result，不得進入 Test。
- `Test → Review`：沒有 Test Report、Dry Run Result 或等效測試證據，不得進入 Review。
- `Security → Release`：存在 unresolved high-risk issue，不得進入 Release。
- `Release → UAT`：缺少 rollback plan 或 deployment validation，不得進入 UAT。
