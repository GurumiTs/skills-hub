---
name: security-reviewer
description: Use when the task requires security review for sensitive data, credential-like values, input validation, authorization, authentication, configuration, dependency, or deployment security risk.
---
# Security Reviewer Skill

## Capability

此 Skill 提供 Security Review capability。

當此 Skill 被啟用時，使用它的 Agent 應審查已核准 SDLC 變更是否引入明顯安全風險，並將 findings 分級，支援 Security → Release Gate 判斷。

此 Skill 不改變目前 Agent 的主要身份；若由 Security Agent 使用，仍應以 `.gemini/agents/security-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 檢查 modified files、configuration、dependency、API、資料存取或 deployment setting 是否有安全風險。
- 檢查 sensitive data 或 credential-like values 是否被寫入程式碼、設定、log、文件或範例。
- 檢查 input validation、permission、authentication、authorization、error handling 與 logging 風險。
- 將 findings 分成 Blocking、High、Medium、Low、Suggestion。
- 產出 remediation direction、open risks 與 gate decision。

此 Skill 不負責：

- 直接修正 code，除非使用者明確核准。
- 取代 Code Review。
- 取代 DB Review。
- 取代 Release Agent 的 release package。
- 最終 release approval。

## Use Cases

使用於：

- `/sdlc:review` 需要 Security Review。
- Code Review 完成後，需要判斷是否可進入 Release Planning。
- 本次變更涉及權限、登入狀態、角色、外部輸入、設定、dependency、API 或資料存取。
- 需要檢查是否有 sensitive data、credential-like values 或 private configuration 出現在不應出現的位置。
- 需要輸出 Security Review Report 與 Security → Release Gate decision。

## Non-use Cases

不使用於：

- 一般功能實作。
- 單純 DB schema / SQL correctness review。
- 單純 release planning。
- 缺少 modified files、implementation summary 或 review scope。
- 使用者要求直接套用安全修正，但尚未核准檔案變更。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read project files | 讀取 modified files 與直接相關設定 | 不無目的掃描整個 repository |
| Git diff / status | 確認本次變更範圍 | 不自動 commit，不 push |
| Static analysis | 輔助檢查安全或品質風險 | 結果需人工判讀，不可當成唯一依據 |
| Secret scan | 輔助發現疑似 sensitive data | 不在回覆中完整輸出疑似值 |
| Dependency / config reading | 檢查 dependency、environment 或 release setting | 不修改設定，不讀取無關敏感檔案 |

## Inputs Required

- Approved Scope：本次已核准的變更範圍。
- Modified Files / Diff：實際變更檔案或差異。
- Implementation Summary：Developer Agent 產出的實作摘要。
- Test Result：Test Agent 產出的測試結果或 Not Tested 項目。
- Code Review Result：Review Agent 產出的 review findings。
- DB Change Notes：若涉及 DB，需要 DB Agent 的變更摘要與 rollback direction。
- Config Changes：若涉及設定，需要設定變更摘要。
- Release Target：若已知，需知道目標環境或 release 範圍。

若缺少必要輸入，不能宣稱 security review 已通過，只能標示 `Needs More Evidence`。

## Expected Outputs

- Review Scope。
- Inputs Used。
- Sensitive Data Review。
- Input Validation Review。
- Permission and Access Control Review。
- Configuration and Dependency Review。
- Error Handling and Logging Review。
- Findings。
- Blocking Issues。
- Open Risks。
- Gate Decision。
- Handoff Notes。

## Workflow

1. 確認 review scope、approved scope、modified files 與 implementation summary。
2. 檢查是否有 sensitive data 或 credential-like values 出現在程式碼、設定、log、文件或範例中。
3. 檢查外部輸入、查詢條件、URL、path、command argument 或 request data 是否有合理驗證與邊界處理。
4. 檢查 authentication、authorization、role / permission 相關邏輯是否符合既有系統模式。
5. 檢查 configuration、environment、feature flag、dependency 或 deployment setting 是否有 release 風險。
6. 檢查 error message 與 logging 是否可能暴露過多 internal context。
7. 將 findings 分級為 Blocking、High、Medium、Low、Suggestion。
8. 若有 Blocking 或 High unresolved issue，Security → Release Gate 必須 Blocked。
9. 若無 Blocking / High issue，產出是否可進入 Release Agent 的 gate recommendation。

## Severity Rules

| Severity | Definition | Gate Impact |
|---|---|---|
| Blocking | 已確認會造成重大安全風險、敏感資訊暴露、權限繞過或不可接受的 release 風險 | 必須停止 release gate |
| High | 高機率造成重大安全或資料風險，但仍需進一步確認細節 | 原則上不得 release，除非使用者明確接受風險並補上處理計畫 |
| Medium | 有安全改善必要，但可在明確記錄與風險接受後延後 | 可進入 release，但必須列為 open risk |
| Low | 小型安全品質、文件、設定或可維護性問題 | 可進入 release |
| Suggestion | 不影響本次 Gate 的改善建議 | 可進入 release |

## File Output Rules

此 Skill 預設不產生實體檔案。

若使用者要求產出 Security Review Report 檔案，必須先遵守 `GEMINI.md` Change Control。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的 review 草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不得在回覆中完整輸出 sensitive data、credential-like values、connection string、password、token、private key 或憑證內容。
- 不得把 temporary workaround 視為正式安全方案。
- 不得在 Blocking 或 High unresolved issue 存在時建議 release。
- 不得直接修改 code，除非使用者明確要求並同意變更。
- 不取代 Code Review。
- 不取代 DB Review。
- 不取代 Release Agent。
- 不覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Security Review Report

## Review Scope

## Inputs Used

| Input | Status | Notes |
|---|---|---|
| Approved Scope | Provided / Missing | |
| Modified Files / Diff | Provided / Missing | |
| Implementation Summary | Provided / Missing | |
| Test Result | Provided / Missing | |
| Code Review Result | Provided / Missing | |
| DB Change Notes | Provided / Missing / Not Applicable | |
| Config Changes | Provided / Missing / Not Applicable | |

## Sensitive Data Review

## Input Validation Review

## Permission and Access Control Review

## Configuration and Dependency Review

## Error Handling and Logging Review

## Findings

| Severity | Area | Finding | Recommendation | Gate Impact |
|---|---|---|---|---|

## Blocking Issues

## Open Risks

## Gate Decision

- Gate: Security → Release
- Status: Ready for Approval / Needs More Evidence / Blocked
- Reason:
- Required Next Step:

## Handoff Notes
```

## Examples

```text
請針對本次 modified files 進行 Security Review，檢查 sensitive data、input validation、permission、configuration 與 dependency risk，並輸出 Gate Decision。
```
