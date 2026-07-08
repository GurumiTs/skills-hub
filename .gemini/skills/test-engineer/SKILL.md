---
name: test-engineer
description: Use when the task requires test planning, edge cases, regression scope, test data, manual or automated test instructions, or test result reporting for an SDLC change.
---
# Test Engineer Skill

## Capability

此 Skill 提供 Test Engineering capability。

當此 Skill 被啟用時，使用它的 Agent 應將需求、Acceptance Criteria、實作摘要、DB 變更與已知風險轉成可執行、可追蹤、可回報的測試設計與測試結果。

此 Skill 不改變目前 Agent 的主要身份；若由 Test Agent 使用，仍應以 `.gemini/agents/test-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 定義 Test Scope 與 Out of Test Scope。
- 根據 Acceptance Criteria 設計測試案例。
- 補充 Edge Cases。
- 規劃 Test Data。
- 規劃 Regression Scope。
- 整理 manual test instructions 或 automated test instructions。
- 回報 Pass、Fail、Blocked、Not Tested。
- 產出 failed / blocked items 與 handoff notes。

此 Skill 不負責：

- 需求決策。
- 程式修正。
- DB migration 設計。
- final code review。
- security sign-off。
- release approval。

## Use Cases

使用於：

- `/sdlc:review` 需要測試設計或測試結果整理。
- Developer Agent 完成 implementation result，需要進入 Development → Test Gate。
- 需要針對 Acceptance Criteria 產出測試案例。
- 需要整理 Edge Cases、Test Data、Regression Scope。
- 需要判斷測試結果是 Pass、Fail、Blocked 或 Not Tested。
- 測試失敗時，需要整理可回交 Developer Agent 或 DB Agent 的資訊。

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
| Test runner | 執行已確認安全的測試指令 | 可能造成異動的測試需先確認 |
| DB metadata read-only query | 輔助理解 DB impact 或測試資料需求 | 需遵守 DB Agent connection rules |
| Git diff / status | 對照 modified files 與 regression scope | 不自動 commit，不 push |
| Playbooks | 參考測試策略、manual regression 或框架慣例 | 以目標專案既有測試方式優先 |

## Inputs Required

- SA Spec / Acceptance Criteria：驗收條件與需求範圍。
- Implementation Summary：實作內容與 modified files。
- DB Change Summary：若涉及 DB，需包含 migration、rollback、validation direction。
- Test Environment：測試環境、資料來源、限制。
- Known Risks：已知風險與需要回歸的範圍。
- Existing Test Pattern：若有既有測試專案或測試方式，需優先參考。

若缺少必要輸入，測試結果不得標示為 Pass。

## Expected Outputs

- Test Scope。
- Out of Test Scope。
- Test Cases。
- Edge Cases。
- Test Data。
- Execution Result。
- Failed / Blocked Items。
- Regression Risk。
- Handoff Notes。

## Workflow

1. 讀取需求、SA spec、Acceptance Criteria、implementation summary 與 DB change summary。
2. 確認 Test Scope 與 Out of Test Scope。
3. 將每一項 Acceptance Criteria 對應到至少一個測試案例或標示目前無法測試的原因。
4. 補充 Edge Cases，包含空值、邊界值、錯誤輸入、權限差異、重複操作與資料狀態差異。
5. 規劃 Test Data，並標示是否需要特定資料狀態。
6. 規劃 Regression Scope，涵蓋受影響流程、API、DB query、UI、batch、job 或 integration。
7. 若可執行測試，先確認工具、環境、權限與異動風險。
8. 整理 Pass / Fail / Blocked / Not Tested。
9. 若測試失敗，提供 reproduction steps、expected result、actual result 與 handoff target。
10. 若測試無法執行，清楚標示 Not Tested 與原因。

## File Output Rules

此 Skill 預設不產生實體檔案。

若使用者要求產出測試文件、測試案例檔或測試報告檔，必須先遵守 `GEMINI.md` Change Control。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的測試草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不得將未執行測試標示為 Pass。
- 不得忽略 Blocking failure。
- 不得修改 production data。
- 不得在未確認的測試環境執行可能造成異動的測試。
- 不得自行擴大測試範圍到與任務無關的系統。
- 不得把測試建議寫成已驗證事實。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Test Report

## Test Scope

## Out of Test Scope

## Test Cases

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|

## Edge Cases

## Test Data

## Execution Result

## Failed / Blocked Items

| ID | Issue | Expected | Actual | Handoff Target | Notes |
|---|---|---|---|---|---|

## Regression Risk

## Handoff Notes
```

## Status Definitions

| Status | Meaning |
|---|---|
| Pass | 已實際執行且結果符合預期 |
| Fail | 已實際執行但結果不符合預期 |
| Blocked | 因環境、資料、需求、權限或缺陷而無法完成測試 |
| Not Tested | 尚未執行測試，不得視為通過 |
| Not Applicable | 該項目不適用，需說明原因 |

## Examples

```text
請依照本次 implementation summary 與 Acceptance Criteria 產出 Test Report，包含測試案例、Edge Cases、Regression Scope 與 Not Tested 項目。
```
