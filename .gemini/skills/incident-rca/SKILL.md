---
name: incident-rca
description: Use when the task involves production incidents, abnormal behavior, logs, outage analysis, root cause analysis, temporary mitigation, long-term corrective actions, or incident follow-up.
---
# Incident RCA Skill

## Capability

此 Skill 提供 Incident Analysis / RCA capability。

當此 Skill 被啟用時，使用它的 Agent 應協助整理 incident timeline、impact scope、confirmed facts、assumptions、unknowns、root cause hypotheses、temporary mitigation、long-term corrective actions 與 follow-up tracking。

此 Skill 不改變目前 Agent 的主要身份；若由 Incident Agent 使用，仍應以 `.gemini/agents/incident-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 整理 incident summary。
- 建立 incident timeline。
- 分析 impact scope。
- 區分 confirmed facts、assumptions、unknowns、hypotheses 與 decisions。
- 分析 possible root cause，但不得在證據不足時宣稱 root cause confirmed。
- 提出 temporary mitigation options。
- 提出 corrective actions 與 preventive actions。
- 列出 evidence needed 與 follow-up tracking items。
- 產出 RCA draft。

此 Skill 不負責：

- 直接修改 production。
- 直接執行 DB mutation。
- 直接部署 hotfix。
- 直接取代 Developer、DB、Security 或 Release Agent 的專業工作。

## Use Cases

使用於：

- production incident 或 high-impact issue。
- 服務中斷、功能異常、資料異常或使用者大量回報。
- 需要分析 logs、monitoring、deploy records、DB records 或 tickets。
- 需要 temporary mitigation 與 long-term corrective actions。
- 需要 RCA report draft。
- 需要 follow-up items 與 owner / priority tracking。

## Non-use Cases

不使用於：

- 一般功能需求分析。
- 一般 code implementation。
- 一般 release planning。
- 證據不足卻要求直接指定 root cause。
- 使用者要求直接修改 production，但尚未明確核准。
- 任務只是單純 code review、security review 或 DB migration design。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| Read logs / files | 讀取使用者提供或指定的 incident evidence | 不讀取與 incident 無關的資料 |
| Git / deployment history reading | 比對 incident window 與近期變更 | 不自動 rollback，不部署 |
| DB metadata read-only query | 輔助分析資料結構或資料流 | 需遵守 DB Agent connection rules，不修改資料 |
| Issue / ticket reading | 整理使用者回報與處理紀錄 | 不擴大讀取無關議題 |
| File output | 產生 RCA draft 或 follow-up tracking 草稿 | 寫檔前必須遵守 `GEMINI.md` Change Control |

## Inputs Required

- Incident Description：使用者描述的問題或告警內容。
- Time Window：發生時間、發現時間、恢復時間，若已知。
- Affected System：受影響系統、模組、API、job、DB、流程。
- Symptoms：錯誤訊息、異常行為、使用者回報、監控告警。
- Impact：受影響使用者、資料、交易、營運流程。
- Evidence：logs、metrics、screenshots、tickets、deploy records、DB records。
- Recent Changes：最近部署、設定、資料、批次、外部系統變更。
- Current Mitigation：已執行或正在執行的處置。
- Constraints：是否可停機、是否可 rollback、是否有維運限制。

若缺少關鍵資訊，必須標示為 Unknown，不得自行補成事實。

## Expected Outputs

- Incident Summary。
- Current Status。
- Timeline。
- Impact Analysis。
- Confirmed Facts。
- Assumptions。
- Unknowns。
- Root Cause Hypotheses。
- Immediate Actions。
- Temporary Mitigation Options。
- Evidence Needed。
- Handoff Recommendation。
- Corrective Actions。
- Follow-up Tracking。
- RCA Draft。
- Next Required Decision。

## Workflow

1. 整理 incident description、time window、affected system 與 current status。
2. 建立 timeline，標示每個事件的 evidence 與 uncertainty。
3. 分析 impact scope，包含受影響使用者、流程、資料、交易與系統。
4. 區分 confirmed facts、assumptions、unknowns、hypotheses 與 decisions。
5. 提出 root cause hypotheses，並列出 supporting evidence、missing evidence 與 confidence。
6. 提出 immediate actions 與 temporary mitigation options。
7. 判斷 mitigation 是否需要使用者或 system owner 明確核准。
8. 列出 required evidence，協助後續確認 root cause。
9. 判斷是否需 handoff 給 SA、Developer、DB、Test、Security、Release 或 Workflow Orchestrator。
10. 產出 corrective actions、preventive actions 與 follow-up tracking。
11. 產出 RCA draft，但若證據不足，只能寫 Root Cause Hypothesis，不得寫 Root Cause Confirmed。

## Evidence Rules

Incident RCA 必須區分：

| Category | Meaning |
|---|---|
| Confirmed Facts | 已由 log、metric、程式碼、DB metadata、使用者回報或部署紀錄支撐 |
| Assumptions | 合理推測，但尚未有證據確認 |
| Unknowns | 尚未取得資訊 |
| Hypotheses | 可能 root cause，需要後續驗證 |
| Decisions | 使用者或團隊已明確做出的處置決定 |

不可把 assumptions 或 hypotheses 寫成 confirmed root cause。

## File Output Rules

此 Skill 可能產生 RCA report、incident summary 或 follow-up tracking 文件。

任何新增、修改、刪除、搬移或覆寫檔案前，必須確認使用者已明確核准該次 change proposal 或 workflow gate。

若 Gemini 是協助維護本 `skills-hub` repository，對話產生的 RCA 草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 不隱藏不確定性。
- 不得在證據不足時斷言 root cause。
- 不得直接執行 production change。
- 不得直接執行 DB mutation。
- 不得直接部署 hotfix。
- 不得在未確認 impact scope 時建議高風險處置。
- 不得輸出 secrets、connection string、password、token 或敏感資料。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# Incident RCA Report

## Incident Summary

## Current Status

| Item | Value |
|---|---|
| Severity | Critical / High / Medium / Low / Unknown |
| Status | Ongoing / Mitigated / Resolved / Monitoring / Unknown |
| First Detected At | |
| Started At | |
| Recovered At | |
| Affected System | |
| Affected Users / Scope | |

## Timeline

| Time | Event | Evidence | Notes |
|---|---|---|---|

## Impact Analysis

## Confirmed Facts

## Assumptions

## Unknowns

## Root Cause Hypotheses

| Hypothesis | Supporting Evidence | Missing Evidence | Confidence |
|---|---|---|---|

## Immediate Actions

## Temporary Mitigation Options

| Option | Expected Benefit | Risk | Requires Approval |
|---|---|---|---|

## Evidence Needed

| Evidence | Purpose | Owner / Source | Priority |
|---|---|---|---|

## Handoff Recommendation

| Area | Agent | Reason |
|---|---|---|

## Corrective Actions

| Action | Type | Priority | Owner | Notes |
|---|---|---|---|---|
|  | Temporary / Long-term / Preventive |  |  |  |

## Follow-up Tracking

## RCA Draft

### What Happened

### Why It Happened

### How It Was Detected

### What Was Done

### What Should Be Improved

## Next Required Decision
```

## Examples

```text
請依照目前 incident 描述與 logs，整理 Incident RCA Report，先區分 confirmed facts、assumptions、unknowns，並提出 root cause hypotheses 與 evidence needed。
```
