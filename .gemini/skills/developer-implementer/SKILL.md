---
name: developer-implementer
description: Use when an approved implementation plan requires code changes, bug fixes, refactoring, or implementation analysis in a target project. Do not use for requirement decisions, final code review, security sign-off, or release approval.
---
# Developer Implementer Skill

## Capability

此 Skill 提供 Software Development / Implementation capability。

當此 Skill 被啟用時，使用它的 Agent 應依據已核准、可追蹤、scope 清楚且版本脈絡明確的開發輸入，在目標專案中進行受控的程式分析、程式修改、bug fix、重構或設定調整。

此 Skill 不改變目前 Agent 的主要身份；若由 Developer Agent 使用，仍應以 `.gemini/agents/developer-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 依據 approved scope 分析相關程式碼。
- 實作已核准的功能、bug fix、小型重構或設定調整。
- 維持目標專案既有語言、框架、runtime、dependency、版本、命名、錯誤處理與目錄風格。
- 根據 Project / Version Context 避免誤用最新版語法、framework、library 或 API。
- 整理 Playbooks Used、modified files、implementation summary、compatibility notes 與 self-test instructions。
- 發現 scope、版本、DB、測試或 release 風險時，停止並回交對應 Agent。

此 Skill 不負責：

- 需求決策。
- DB impact 最終判斷。
- final code review。
- security sign-off。
- release approval。

## Use Cases

使用於：

- `/sdlc:implement` 已啟動，且 `SA / DB → Development` Gate 已核准。
- 使用者在目前對話中明確同意進行指定範圍的實作。
- Workflow State 顯示 development stage 可開始，且 Project / Version Context 足以支撐實作。
- 需要根據既有程式碼實作功能、修 bug、重構或調整設定。
- 需要產生 implementation summary、modified files list、compatibility notes 與 self-test instructions。

## Non-use Cases

不使用於：

- 需求、Scope 或 Acceptance Criteria 尚未確認。
- Project / Version Context 缺失，且版本會影響語法、API、framework、dependency 或 build 判斷。
- DB 影響尚未分析，但任務涉及資料表、SQL、migration、LookML 或資料流。
- 使用者只要求 SA 規格、需求分析或文件整理。
- 使用者只要求測試案例或測試報告。
- 任務是 final code review、security sign-off 或 release approval。
- 任務需要新增大量架構設計，但尚未有 approved plan。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取與 approved scope、版本判斷直接相關的程式碼與設定 | 不無目的掃描整個 repository |
| Read project manifests | 判斷 runtime、framework、language、dependency、build target、DB platform、DB hosting | 不以最新版預設取代實際專案版本 |
| Modify files | 套用 approved scope 內的變更 | 必須先符合 `GEMINI.md` Change Control 與使用者核准 |
| Git diff / status | 確認實際變更與預期範圍一致 | 不自動 commit，不 push |
| Test runner | 執行已核准且安全的測試指令 | 可能造成異動的測試需先確認 |
| Tech-stack playbook | 參考語言、框架或 legacy 專案慣例 | 以目標專案既有版本與風格優先；未建立時標示 Missing |

## Inputs Required

- Approval Evidence：使用者明確核准、approved SDLC Plan 或 Workflow State Gate Approved。
- Target Project：目標專案路徑或 `/directory` context。
- Approved Scope：本次允許實作的範圍。
- Not Allowed Scope：本次不得處理的範圍。
- Project / Version Context：runtime、framework、language、dependency、DB platform / dialect、DB hosting、build target 或其缺口。
- Playbooks Used：已參考的 workflow / tech stack / DB playbooks，以及缺失狀態。
- Expected File Changes：預期新增、修改或刪除的檔案。
- Acceptance Criteria：驗收條件或預期行為。
- DB Impact Result：若涉及 DB / SQL / Data Flow，需有 DB Agent 分析結果。

若缺少 Approval Evidence，不得修改實體檔案。

若 Project / Version Context 缺失且會影響實作，不得用最新版語法或 API 猜測實作。

## Expected Outputs

- Approval Evidence summary。
- Project / Version Context Used。
- Playbooks Used。
- Approved Scope Used。
- Not Allowed Scope。
- Modified Files。
- DB Related Notes。
- Implementation Summary。
- Compatibility Notes。
- Self-test Instructions。
- Risks / Follow-up。
- Handoff Notes。

## Version Compatibility Rules

- C# / ASP.NET Framework / WebForm：不得預設 ASP.NET Core、.NET 最新版或新版 C# 語法；必須依 `.sln`、`.csproj`、`web.config`、`packages.config`、IIS / WebForm lifecycle 判斷。
- Python：不得使用目標 runtime 或 dependency 不支援的語法、typing、stdlib 或 third-party API。
- PowerShell：必須區分 Windows PowerShell 5.1 與 PowerShell 7+ 行為差異。
- Java：必須依 JDK、Maven / Gradle 與 framework version 選擇 API。
- Prompting：必須維持 system / developer / user prompt 邊界，不得混入本 ChatGPT 專案身分。
- DB / BI：必須依 MSSQL、Oracle、BigQuery 或 LookML dialect 判斷 SQL / data access / validation 方式；Google Cloud SQL 等代管環境應記錄為 DB Hosting，不得混入 DB Platform。

## Workflow

1. 確認 approved plan、Workflow State 或使用者明確同意。
2. 確認 target project、approved scope、not allowed scope、Project / Version Context 與 Playbooks Used。
3. 只讀取與任務、版本判斷、相容性檢查直接相關的檔案。
4. 分析目標專案既有語言、框架、runtime、dependency、版本、命名、錯誤處理與目錄慣例。
5. 在 approved scope 內套用最小必要變更。
6. 若需要擴大 scope、調整架構、新增套件、更新 lock file、修改設定、改 runtime target 或改 build target，先停止並提出新的 Change Proposal。
7. 若涉及 DB / SQL / Data Flow 且尚未有 DB impact result，停止並 handoff 給 DB Agent。
8. 完成後整理 modified files、implementation summary、compatibility notes、self-test instructions。
9. 停在 Development → Test Gate，交給 Test Agent 或 `/sdlc:test`。

## File Output Rules

此 Skill 可能會修改目標專案檔案。

任何新增、修改、刪除、搬移或覆寫檔案前，必須確認使用者已明確核准該次 change proposal 或 workflow gate。

若 Gemini 是協助維護本 `skills-hub` repository，不得把對話產生的草稿直接放入正式文件目錄；草稿應優先放入 `docs/_generated/`，除非使用者明確指定正式化。

## Safety and Limitations

- 不得在未經使用者明確同意前修改檔案。
- 不得自行擴大需求。
- 不得在版本脈絡不明時引入新版語法、套件、framework 或 API。
- 不得引入與目標專案不相容的語法、套件或框架。
- 不得輸出 secrets、connection string、password、token 或敏感資訊。
- 不得將 workaround 包裝成正式長期方案。
- 不得把未執行的測試寫成已通過。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Implementation Result

## Approval Evidence

## Project / Version Context Used

| Item | Value | Evidence / Source | Notes |
|---|---|---|---|
| Project Type | | | |
| Runtime / Framework Version | | | |
| Language Version | | | |
| Dependency Source | | | |
| DB Platform | MSSQL / Oracle / BigQuery / Not Applicable / Unknown | | |
| DB Hosting / Runtime Environment | Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Not Applicable / Unknown | | |
| Version Risk | None / Low / Medium / High / Needs More Evidence | | |

## Playbooks Used

| Area | Playbook | Selection Reason | Status |
|---|---|---|---|

## Approved Scope Used

## Not Allowed Scope

## Modified Files

| Action | Path | Summary | Reason |
|---|---|---|---|

## DB Related Notes

## Implementation Summary

## Compatibility Notes

## Self-test Instructions

| Test | Steps | Expected Result | Status |
|---|---|---|---|

## Risks / Follow-up

## Handoff Notes
```

## Examples

```text
請依照已核准的 SDLC Plan 與 Project / Version Context 進行 /sdlc:implement，僅修改 Approved Scope 中列出的檔案，完成後提供變更摘要、版本相容說明與自測方式。
```
