# Testing Dry Run Playbook

此 Playbook 定義 SDLC Test Stage 中的 Dry Run 規則。

Dry Run 是測試前置檢查與測試設計驗證，不等同於實際測試執行，也不得被標示為 `Pass`。

## Purpose

使用 Dry Run 來確認：

- Acceptance Criteria 是否可被測試。
- Implementation Result 是否提供足夠資訊。
- Test Environment 是否可判斷。
- Test Data Requirements 是否清楚。
- Project / Version Context 是否足以支撐測試方式。
- 是否需要 DB-assisted Dry Run。
- 是否需要外部 Q System、CI、test runner 或 QA platform evidence。

## When to Use

在以下情境使用：

- `/sdlc:test` 被要求先做 dry run。
- 使用者尚未允許真正執行測試。
- 測試可能造成檔案、DB、外部系統或 Q System 異動。
- 測試環境、測試資料或權限尚未完全確認。
- 需要先確認既有專案版本是否支援建議的測試方式。

## Not for Pass / Fail Sign-off

Dry Run 不得輸出：

```text
Test Status: Pass
```

除非後續使用者明確同意執行測試，且有實際執行證據，否則狀態應為：

```text
Not Tested / Blocked / Needs More Evidence / Not Applicable
```

## Required Inputs

| Input | Required | Notes |
|---|---|---|
| Approved Scope | Yes | 必須知道本次測試範圍 |
| Acceptance Criteria | Yes | 每個 AC 應至少能對應測試案例，否則標示缺口 |
| Implementation Result | Yes | 包含 modified files、implementation summary、DB notes |
| Project / Version Context | Yes | 必須知道 runtime、framework、language、dependency、DB platform |
| Test Environment | Preferred | 若缺失，Dry Run 可繼續，但不能宣稱可執行 |
| Test Data Requirements | Preferred | 若涉及 DB，需判斷是否要 DB-assisted Dry Run |
| External Evidence | Optional | 例如 Q System、CI、manual test result |

## Version-aware Test Design

Dry Run 必須依目標專案實際版本設計測試方式：

| Stack | Required Check |
|---|---|
| C# / ASP.NET Framework / WebForm | 不得預設 ASP.NET Core 測試方式；需考慮 code-behind、ViewState、PostBack、web.config、IIS |
| Python | 依 runtime 與 dependency version 決定 pytest、unittest 或現有測試方式 |
| PowerShell | 區分 Windows PowerShell 5.1 與 PowerShell 7+ |
| Java | 依 JDK、Maven / Gradle、JUnit / framework version 判斷 |
| DB / BI | 依 MSSQL、Oracle、BigQuery、LookML dialect 設計 validation |

若版本資訊不足，標示 `Needs More Evidence`。

## Dry Run Workflow

1. 確認 Test Mode 為 `Dry Run`。
2. 摘要 Approved Scope、Acceptance Criteria 與 Implementation Result。
3. 檢查 Project / Version Context 是否足夠。
4. 將每個 Acceptance Criteria 對應 Test Case。
5. 檢查每個 Test Case 的前置條件、測試資料、權限與環境。
6. 判斷是否需要 DB-assisted Dry Run。
7. 判斷是否需要 test runner、CI 或 Q System。
8. 標示哪些測試可執行、哪些 blocked、哪些 not tested。
9. 產出 Regression Scope。
10. 停在 `Test → Review` Gate 前，要求使用者確認是否接受 evidence 或是否執行測試。

## Mutation Boundary

Dry Run 禁止：

- 修改檔案。
- 寫入 DB。
- 執行會改變狀態的測試。
- 建立、更新或關閉 Q System 測試單。
- 更新外部 QA platform 狀態。
- 執行 destructive command。

若需要 mutation，必須先輸出 Change Proposal 並取得使用者同意。

## Output Format

```markdown
# Dry Run Result

## Test Mode

Dry Run

## Version Context Check

| Item | Status | Evidence / Notes |
|---|---|---|
| Runtime / Framework | Confirmed / Missing / Needs More Evidence | |
| Language Version | Confirmed / Missing / Needs More Evidence | |
| DB Platform | Confirmed / Missing / Not Applicable | |
| DB Hosting | Confirmed / Missing / Not Applicable | |

## Test Case Dry Run

| Test ID | Acceptance Criteria | Dry Run Result | Blocker / Risk | Required Action |
|---|---|---|---|---|

## Test Data Requirements

## DB-assisted Dry Run Needed

Yes / No / Needs More Evidence

## Regression Scope

## Not Tested Items

## Gate Recommendation

- Gate: Test → Review
- Status: Ready for Approval / Blocked / Needs More Evidence
- Reason:
```

## Handoff Rules

| Issue | Handoff Target |
|---|---|
| Acceptance Criteria 不清 | SA Agent |
| 實作結果不足 | Developer Agent |
| DB evidence 不足 | DB Agent |
| 測試環境 / Q System 不足 | Test Agent / Workflow Orchestrator |
| Sensitive data / permission risk | Security Agent |
