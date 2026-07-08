---
name: developer-implementer
description: Use when an approved implementation plan requires code changes, bug fixes, refactoring, or implementation analysis in a target project. Do not use for requirement decisions, final code review, security sign-off, or release approval.
---
# Developer Implementer Skill

## Capability

此 Skill 提供 Software Development / Implementation capability。

當此 Skill 被啟用時，使用它的 Agent 應依據已核准、可追蹤、scope 清楚的開發輸入，在目標專案中進行受控的程式分析、程式修改、bug fix、重構或設定調整。

此 Skill 不改變目前 Agent 的主要身份；若由 Developer Agent 使用，仍應以 `.gemini/agents/developer-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 依據 approved scope 分析相關程式碼。
- 實作已核准的功能、bug fix、小型重構或設定調整。
- 維持目標專案既有語言、框架、版本、命名、錯誤處理與目錄風格。
- 整理 modified files、implementation summary、compatibility notes 與 self-test instructions。
- 發現 scope、DB、測試或 release 風險時，停止並回交對應 Agent。

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
- Workflow State 顯示 development stage 可開始。
- 需要根據既有程式碼實作功能、修 bug、重構或調整設定。
- 需要產生 implementation summary、modified files list 與 self-test instructions。

## Non-use Cases

不使用於：

- 需求、Scope 或 Acceptance Criteria 尚未確認。
- DB 影響尚未分析，但任務涉及資料表、SQL、migration 或資料流。
- 使用者只要求 SA 規格、需求分析或文件整理。
- 使用者只要求測試案例或測試報告。
- 任務是 final code review、security sign-off 或 release approval。
- 任務需要新增大量架構設計，但尚未有 approved plan。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取與 approved scope 直接相關的程式碼與設定 | 不無目的掃描整個 repository |
| Modify files | 套用 approved scope 內的變更 | 必須先符合 `GEMINI.md` Change Control 與使用者核准 |
| Git diff / status | 確認實際變更與預期範圍一致 | 不自動 commit，不 push |
| Test runner | 執行已核准且安全的測試指令 | 可能造成異動的測試需先確認 |
| Tech-stack playbook | 參考語言、框架或 legacy 專案慣例 | 以目標專案既有風格優先 |

## Inputs Required

- Approval Evidence：使用者明確核准、approved SDLC Plan 或 Workflow State Gate Approved。
- Target Project：目標專案路徑或 `/directory` context。
- Approved Scope：本次允許實作的範圍。
- Not Allowed Scope：本次不得處理的範圍。
- Expected File Changes：預期新增、修改或刪除的檔案。
- Acceptance Criteria：驗收條件或預期行為。
- DB Impact Result：若涉及 DB / SQL / Data Flow，需有 DB Agent 分析結果。

若缺少 Approval Evidence，不得修改實體檔案。

## Expected Outputs

- Approval Evidence summary。
- Approved Scope Used。
- Not Allowed Scope。
- Modified Files。
- DB Related Notes。
- Implementation Summary。
- Compatibility Notes。
- Self-test Instructions。
- Risks / Follow-up。
- Handoff Notes。

## Workflow

1. 確認 approved plan、Workflow State 或使用者明確同意。
2. 確認 target project、approved scope、not allowed scope。
3. 只讀取與任務直接相關的檔案。
4. 分析目標專案既有語言、框架、版本、命名、錯誤處理與目錄慣例。
5. 在 approved scope 內套用最小必要變更。
6. 若需要擴大 scope、調整架構、新增套件、更新 lock file 或修改設定，先停止並提出新的 Change Proposal。
7. 若涉及 DB / SQL / Data Flow 且尚未有 DB impact result，停止並 handoff 給 DB Agent。
8. 完成後整理 modified files、implementation summary、compatibility notes、self-test instructions。
9. 停在 Development → Test Gate，交給 Test Agent 或 `/sdlc:review`。

## File Output Rules

此 Skill 可能會修改目標專案檔案。

任何新增、修改、刪除、搬移或覆寫檔案前，必須確認使用者已明確核准該次 change proposal 或 workflow gate。

若 Gemini 是協助維護本 `skills-hub` repository，不得把對話產生的草稿直接放入正式文件目錄；草稿應優先放入 `docs/_generated/`，除非使用者明確指定正式化。

## Safety and Limitations

- 不得在未經使用者明確同意前修改檔案。
- 不得自行擴大需求。
- 不得引入與目標專案不相容的語法、套件或框架。
- 不得輸出 secrets、connection string、password、token 或敏感資訊。
- 不得將 workaround 包裝成正式長期方案。
- 不得把未執行的測試寫成已通過。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Implementation Result

## Approval Evidence

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
請依照已核准的 SDLC Plan 進行 /sdlc:implement，僅修改 Approved Scope 中列出的檔案，完成後提供變更摘要與自測方式。
```
