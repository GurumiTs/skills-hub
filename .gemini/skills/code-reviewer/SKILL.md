---
name: code-reviewer
description: Use when the task requires reviewing code changes, git diffs, implementation quality, maintainability, compatibility, regression risk, or blocking and non-blocking issues.
---
# Code Reviewer Skill

## Capability

此 Skill 提供 Code Review capability。

當此 Skill 被啟用時，使用它的 Agent 應審查已實作變更、git diff、implementation summary 或 modified files，確認變更是否符合 approved scope、是否維持專案品質，並找出 blocking / non-blocking issues。

此 Skill 不改變目前 Agent 的主要身份；若由 Review Agent 使用，仍應以 `.gemini/agents/review-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 審查 modified files 或 git diff。
- 檢查 correctness、maintainability、compatibility、readability、error handling 與 regression risk。
- 判斷變更是否符合 approved scope 與 Acceptance Criteria。
- 檢查是否有未預期行為、過度修改、重複邏輯、命名不清或架構不一致。
- 將 findings 分成 Blocking、High、Medium、Low、Suggestion。
- 產出 gate decision 與 handoff notes。

此 Skill 不負責：

- 直接實作修正，除非使用者明確核准。
- 取代 DB Review。
- 取代 Security Review。
- 取代 Release Approval。

## Use Cases

使用於：

- `/sdlc:review` 需要 Code Review。
- Developer Agent 已完成 implementation result，需要進入 review stage。
- 使用者要求檢查 git diff、modified files 或實作摘要。
- 需要判斷是否有 blocking / non-blocking issues。
- 需要整理可回交 Developer Agent 的 remediation direction。

## Non-use Cases

不使用於：

- 需求尚未確認，無法判斷變更是否正確。
- 使用者要求直接實作新功能。
- 任務主要是 DB schema、SQL、migration 或資料正確性 review。
- 任務主要是 security review 或 release planning。
- 缺少 modified files、diff 或 implementation summary，導致 review scope 不清。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取 modified files 與直接相關上下文 | 不無目的掃描整個 repository |
| Git diff / status | 確認實際變更與 review scope | 不自動 commit，不 push |
| Test result reading | 理解測試證據與 failed items | 不將未執行測試寫成已通過 |
| Playbooks | 參考 code review severity、語言與框架慣例 | 以目標專案既有風格優先 |
| File modification | 僅在使用者明確要求並核准時套用修正 | 必須遵守 `GEMINI.md` Change Control |

## Inputs Required

- Approved Scope：本次核准範圍。
- Modified Files / Diff：變更檔案或差異。
- Implementation Summary：實作摘要。
- Acceptance Criteria：需求驗收條件。
- Test Result：測試結果或 Not Tested 項目。
- DB Change Notes：若涉及 DB，需知道 DB 變更摘要。
- Known Risks：已知風險或 follow-up。

若缺少 review scope，不得宣稱 review 完成。

## Expected Outputs

- Review Scope。
- Reviewed Inputs。
- Blocking Issues。
- High / Medium / Low Issues。
- Suggestions。
- Positive Notes。
- Gate Decision。
- Handoff Notes。

## Workflow

1. 確認 review scope、approved scope、modified files 與 implementation summary。
2. 對照 Acceptance Criteria，判斷變更是否符合需求。
3. 檢查是否有超出 approved scope 的變更。
4. 檢查 correctness、maintainability、compatibility、readability、error handling、regression risk。
5. 參考目標專案既有風格、語言版本、框架慣例與命名方式。
6. 若涉及 DB / SQL / migration，確認 DB Review 是否已完成；未完成時標示風險並 handoff 給 DB Agent。
7. 若涉及 sensitive data、permission、configuration 或 dependency risk，handoff 給 Security Agent。
8. 將 findings 分級，並提供具體 remediation direction。
9. 若有 Blocking issue，Gate 必須 Blocked。
10. 若無 Blocking issue，輸出是否可進入 Security Review 或 Release Planning。

## Severity Rules

| Severity | Definition | Gate Impact |
|---|---|---|
| Blocking | 會造成需求不符、主要功能失效、資料錯誤、無法測試或不可接受的 regression risk | 必須停止 release gate |
| High | 高機率造成重大缺陷或維護風險，但仍需進一步確認 | 原則上需修正或明確接受風險 |
| Medium | 需要改善，但可評估是否延後處理 | 可進入下一階段，但需列入 open risks |
| Low | 小型品質、命名、可讀性或文件問題 | 可進入下一階段 |
| Suggestion | 不影響本次 Gate 的改善建議 | 可進入下一階段 |

## File Output Rules

此 Skill 預設不產生實體檔案。

若使用者要求產出 review report 檔案，必須先遵守 `GEMINI.md` Change Control。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的 review 草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不直接修改 code，除非使用者明確要求並同意變更。
- 不取代 DB Review。
- 不取代 Security Review。
- 不取代 Release Agent。
- 不在 Blocking issue 存在時建議 release。
- 不把缺少測試證據的項目寫成已驗證。
- 不覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Code Review Report

## Review Scope

## Reviewed Inputs

| Input | Status | Notes |
|---|---|---|
| Approved Scope | Provided / Missing | |
| Modified Files / Diff | Provided / Missing | |
| Implementation Summary | Provided / Missing | |
| Test Result | Provided / Missing / Not Executed | |
| DB Change Notes | Provided / Missing / Not Applicable | |

## Blocking Issues

## High / Medium / Low Issues

| Severity | File / Area | Finding | Recommendation | Gate Impact |
|---|---|---|---|---|

## Suggestions

## Positive Notes

## Gate Decision

- Gate: Code Review
- Status: Pass / Needs More Evidence / Blocked
- Reason:
- Required Next Step:

## Handoff Notes
```

## Examples

```text
請針對本次 implementation result 進行 Code Review，檢查 correctness、maintainability、compatibility、regression risk，並區分 blocking 與 non-blocking issues。
```
