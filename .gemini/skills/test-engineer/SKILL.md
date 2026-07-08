---
name: test-engineer
description: Use when the task requires SDLC test planning, dry run, edge cases, regression scope, test data, manual or automated test instructions, external test evidence review, or test result reporting.
---
# Test Engineer Skill

## Capability

此 Skill 提供 Test Engineering capability。

當此 Skill 被啟用時，使用它的 Agent 應將需求、Acceptance Criteria、Implementation Result、DB 變更與已知風險轉成可執行、可追蹤、可回報的 Test Report。

此 Skill 支援 `/sdlc:test` 階段，包含 Test Planning、Dry Run、Evidence Review 與受控 Test Execution。

此 Skill 不改變目前 Agent 的主要身份；若由 Test Agent 使用，仍應以 `.gemini/agents/test-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 定義 Test Scope 與 Out of Test Scope。
- 根據 Acceptance Criteria 設計 Test Cases。
- 補充 Edge Cases。
- 規劃 Test Data Requirements。
- 規劃 Regression Scope。
- 產生 manual test instructions 或 automated test instructions。
- 產生 Dry Run Result，檢查測試前置條件、測試資料、測試環境與外部系統依賴。
- 整理使用者、test runner、CI、Q 系統或 QA platform 提供的測試證據。
- 回報 Pass、Fail、Blocked、Not Tested、Not Applicable、Needs More Evidence。
- 產出 failed / blocked / not tested items 與 handoff notes。

此 Skill 不負責：

- 需求決策。
- 程式修正。
- DB migration 設計。
- final code review。
- security sign-off。
- release approval。
- 未經核准直接執行會造成異動的測試或外部系統寫入。

## Use Cases

使用於：

- `/sdlc:test` 需要產出 Test Report、Dry Run Result 或 Regression Scope。
- Developer Agent 完成 implementation result，需要進入 Development → Test Gate。
- 需要針對 Acceptance Criteria 產出 Test Cases。
- 需要整理 Edge Cases、Test Data Requirements、Regression Scope。
- 需要判斷測試結果是 Pass、Fail、Blocked、Not Tested、Not Applicable 或 Needs More Evidence。
- 需要整理外部 Q 系統、QA platform、CI 或 test runner 的測試證據。
- 測試失敗時，需要整理可回交 Developer Agent、DB Agent、SA Agent 或 Security Agent 的資訊。

## Non-use Cases

不使用於：

- 需求尚未明確，無法定義 Acceptance Criteria。
- 使用者要求直接修 code。
- 使用者要求 DB migration 或 rollback 設計。
- 任務是 final code review、security review 或 release package。
- 測試會造成資料、檔案或外部系統異動，但尚未取得使用者同意。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取測試目標、既有測試、程式碼與設定 | 僅限與測試範圍直接相關內容 |
| Test runner | 執行已確認安全且已核准的測試指令 | 可能造成異動的測試需先確認 |
| CI / QA platform / Q System | 讀取或整理外部測試證據 | 不寫入、不更新狀態，除非使用者明確同意 |
| DB metadata read-only query | 輔助理解 DB impact 或測試資料需求 | 需遵守 DB Agent connection rules |
| Git diff / status | 對照 modified files 與 regression scope | 不自動 commit，不 push |
| Playbooks | 參考測試策略、manual regression 或框架慣例 | 以目標專案既有測試方式優先 |

## Inputs Required

- SA Spec / Acceptance Criteria：驗收條件與需求範圍。
- Implementation Result：實作內容、modified files、self-test instructions。
- DB Change Summary：若涉及 DB，需包含 migration、rollback、validation direction。
- Test Environment：測試環境、資料來源、限制。
- Existing Test Pattern：若有既有測試專案或測試方式，需優先參考。
- External Test Evidence：若使用 Q 系統、CI、QA platform 或 test runner，需有來源與範圍。
- Known Risks：已知風險與需要回歸的範圍。

若缺少必要輸入，測試結果不得標示為 Pass。

## Expected Outputs

- Test Mode。
- Test Scope。
- Out of Test Scope。
- Test Cases。
- Edge Cases。
- Test Data Requirements。
- Regression Scope。
- Dry Run Result。
- Execution Result。
- Failed / Blocked / Not Tested Items。
- Risks and Follow-up。
- Handoff Notes。
- Gate Decision。

## Test Mode Rules

| Mode | Description | Pass Allowed |
|---|---|---|
| Planning | 只產生測試案例、測試資料需求與 regression scope | No |
| Dry Run | 檢查測試前置條件、測試資料、測試環境、可執行項目，不真正執行測試 | No |
| Evidence Review | 整理使用者或外部系統提供的測試證據 | Only if evidence is sufficient |
| Execution | 使用者明確核准後，執行安全且已核准的測試或呼叫外部測試系統 | Yes, based on actual result |

若未實際執行測試或缺少有效測試證據，狀態必須是 `Not Tested`、`Blocked` 或 `Needs More Evidence`，不得標示為 `Pass`。

## External Test System Rules

若任務涉及 Q 系統、QA platform、CI 或 test runner：

1. 不得寫死特定 MCP Server alias；實際工具以目前 `/mcp` 可用清單為準。
2. 優先使用 read-only 查詢或 dry run。
3. 任何會觸發測試執行、產生檔案、寫入 DB、更新外部測試狀態、建立測試單或通知外部系統的操作，都必須先取得使用者明確同意。
4. 外部測試結果必須標示來源、時間、環境、測試範圍與限制。
5. 若外部系統結果不完整，必須標示 `Needs More Evidence`。

## Workflow

1. 讀取需求、SA spec、Acceptance Criteria、Implementation Result 與 DB Change Summary。
2. 摘要 Test Mode 與已知限制。
3. 確認 Test Scope 與 Out of Test Scope。
4. 將每一項 Acceptance Criteria 對應到至少一個 Test Case，或標示目前無法測試的原因。
5. 補充 Edge Cases，包含空值、邊界值、錯誤輸入、權限差異、重複操作與資料狀態差異。
6. 規劃 Test Data Requirements，並標示是否需要特定資料狀態、角色、DB 狀態或外部系統狀態。
7. 規劃 Regression Scope，涵蓋受影響流程、API、DB query、UI、batch、job、report 或 integration。
8. 若要求 Dry Run，檢查工具、環境、權限、測試資料與 mutation 風險，但不得宣稱測試已通過。
9. 若可執行測試，先確認工具、環境、權限與異動風險；必要時提出 Change Proposal。
10. 整理 Pass / Fail / Blocked / Not Tested / Not Applicable / Needs More Evidence。
11. 若測試失敗，提供 reproduction steps、expected result、actual result 與 handoff target。
12. 若測試無法執行，清楚標示 Not Tested 或 Needs More Evidence 與原因。
13. 產出 `Test → Review` Gate recommendation。

## File Output Rules

此 Skill 預設不產生實體檔案。

若使用者要求產出測試文件、測試案例檔或測試報告檔，必須先遵守 `GEMINI.md` Change Control。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的測試草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不得將未執行測試標示為 Pass。
- 不得將 Dry Run 標示為實際測試通過。
- 不得忽略 Blocking failure。
- 不得修改 production data。
- 不得在未確認的測試環境執行可能造成異動的測試。
- 不得在未取得使用者同意前寫入 Q 系統、QA platform 或外部測試系統。
- 不得自行擴大測試範圍到與任務無關的系統。
- 不得把測試建議寫成已驗證事實。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Test Report

## Test Mode

Planning / Dry Run / Evidence Review / Execution

## Test Inputs

| Input | Status | Notes |
|---|---|---|
| Approved Scope | Provided / Missing | |
| Implementation Result | Provided / Missing | |
| Acceptance Criteria | Provided / Missing | |
| DB Change Summary | Provided / Missing / Not Applicable | |
| Test Environment | Confirmed / Missing / Limited | |
| External Test Evidence | Provided / Missing / Not Applicable | |
| Known Risks | Provided / Missing | |

## Test Scope

## Out of Test Scope

## Test Cases

| ID | Acceptance Criteria | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|

## Edge Cases

## Test Data Requirements

| Data / Role / State | Purpose | Source | Required Before Execution | Notes |
|---|---|---|---|---|

## Regression Scope

## Dry Run Result

| Item | Result | Risk | Required Action |
|---|---|---|---|

## Execution Result

| Test ID | Status | Evidence | Notes |
|---|---|---|---|

## Failed / Blocked / Not Tested Items

| ID | Status | Issue | Expected | Actual / Missing Evidence | Handoff Target | Notes |
|---|---|---|---|---|---|---|

## Risks and Follow-up

## Handoff Notes

## Gate Decision

- Gate: Test → Review
- Status: Pending / Ready for Approval / Blocked / Needs More Evidence
- Required Next Step:
```

## Status Definitions

| Status | Meaning |
|---|---|
| Pass | 已實際執行且結果符合預期 |
| Fail | 已實際執行但結果不符合預期 |
| Blocked | 因環境、資料、需求、權限或缺陷而無法完成測試 |
| Not Tested | 尚未執行測試，不得視為通過 |
| Needs More Evidence | 需要更多測試證據、環境資訊或外部系統結果 |
| Not Applicable | 該項目不適用，需說明原因 |

## Examples

```text
請依照本次 implementation summary 與 Acceptance Criteria 執行 /sdlc:test dry run，產出 Test Report、Edge Cases、Regression Scope 與 Test → Review Gate Decision。
```
