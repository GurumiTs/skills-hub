---
name: db-engineering
description: Use when the task involves database schema, SQL, migration, rollback SQL, data correctness, transactions, reporting data, import/export data, DB performance impact, or DB metadata connection selection. Do not use as a general coding skill.
---
# DB Engineering Skill

## Capability

此 Skill 提供 Database Engineering capability。

當此 Skill 被啟用時，使用它的 Agent 應分析資料庫、SQL、migration、資料正確性、效能、相容性、驗證方式與 rollback 設計。

此 Skill 不改變目前 Agent 的主要身份；若由 DB Agent 使用，仍應以 `.gemini/agents/db-agent.md` 的角色、handoff 與 stop conditions 為準。

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與 rollback 要求。

## Scope

此 Skill 可協助：

- 判斷 DB / Data Impact 是否存在。
- 分析 table、column、index、view、stored procedure、function、trigger、query、report、import/export、資料同步與資料流影響。
- 評估 data correctness、performance、compatibility 與 rollback risk。
- 設計 migration plan、rollback direction 與 data validation。
- 在需要 DB metadata 時，協助選擇正確的 `connection_key`。
- 產出可交給 Developer、Test、Review、Release 的 DB handoff notes。

此 Skill 不負責：

- 一般程式實作。
- 未經確認的業務資料規則決策。
- release approval。
- 實際修改 production data。

## Use Cases

使用於：

- 新增、修改或移除 table、column、index、view、stored procedure、function 或 trigger。
- 修改 SQL、report query、filter、sort、paging、aggregation 或 join。
- 需要 migration plan、rollback SQL / direction 或 data validation。
- 需要評估資料正確性、效能、相容性或資料流。
- 任務涉及 import / export、資料同步、批次、排程或資料轉換。
- 需要從多組 DB metadata aliases 中判斷應使用哪一組 `connection_key`。

## Non-use Cases

不使用於：

- 單純 UI、文字、樣式或前端 layout 調整。
- 不涉及資料持久化、SQL、report、import/export 或資料流的一般程式修改。
- 需求或資料規則尚未確認，且使用者要求直接實作。
- 使用者要求直接修改 production data。
- 任務只是 final code review、security sign-off 或 release approval。

## Tool Capability Boundaries

此 Skill 不綁定特定 MCP Server 名稱。實際可用工具以目前 Gemini CLI `/mcp` 查詢結果與 `GEMINI.md` 規則為準。

| Tool Capability | Purpose | Boundary |
|---|---|---|
| DB metadata list connections | 查看可用 DB metadata aliases | 不得預設 production |
| DB metadata suggest connection | 根據需求文字推測候選連線 | 多個候選時必須要求使用者確認 |
| DB metadata read-only query | 讀取 schema / table / column / object metadata | 只允許 read-only metadata，用於 impact analysis |
| Project file reading | 讀取 migration、SQL、repository、data access code | 僅限與任務直接相關範圍 |
| File modification | 產出或調整 approved SQL / migration / rollback 檔案 | 必須遵守 `GEMINI.md` Change Control |

## DB Connection Selection Rules

當需要使用 DB metadata 工具時，必須遵守：

1. 先使用 `list_connections` 查看可用 aliases。
2. 當有多個 aliases 時，使用 `suggest_connection` 搭配使用者需求文字取得候選連線。
3. 只有當 alias、description、environment、system、database 或 tags 明確符合時，才可選定 `connection_key`。
4. 若多個 aliases 都可能符合，必須要求使用者確認 `connection_key`。
5. 不得預設 production。
6. 不得在 DB alias 不明確時查詢 metadata。
7. DB output 必須列出 selected `connection_key`，讓 downstream agents 可追蹤資料來源。

## Inputs Required

- Requirement / SA Spec：需求、資料規則、流程或 Acceptance Criteria。
- Target System：目標系統、模組、資料庫或環境描述。
- DB Objects：可能受影響的 table、column、view、SP、query。
- Current SQL / Schema：既有 SQL、schema、metadata 或 migration。
- Change Goal：要新增、調整、移除或修正的資料行為。
- Rollback Expectation：是否需要 rollback SQL、資料回復或版本回復。
- Connection Context：若需要 DB metadata，需有明確 `connection_key` 或可判斷的 alias context。

## Expected Outputs

- Selected DB Metadata Connection。
- DB Impact Summary。
- Affected Objects。
- SQL / Schema Analysis。
- Data Correctness Analysis。
- Performance Risks。
- Migration Plan。
- Rollback Plan。
- Data Validation。
- Risks。
- Open Questions。
- Handoff Notes。

## Workflow

1. 判斷任務是否涉及 DB / SQL / Data Flow。
2. 整理已知 requirement、資料規則與 affected objects。
3. 若需要 DB metadata，先依 DB Connection Selection Rules 選定 `connection_key`。
4. 只讀取與任務直接相關的 DB metadata、SQL、migration 或 data access code。
5. 分析 schema、SQL、data correctness、performance、compatibility 與 rollback risk。
6. 若資料規則不清，停止並 handoff 給 SA Agent 或要求使用者確認。
7. 若需要 DB 變更，產出 migration plan、rollback direction 與 validation method。
8. 若 DB 變更需要對應程式調整，handoff 給 Developer Agent。
9. 若 DB review 通過或仍有風險，清楚標示 Gate recommendation。

## File Output Rules

此 Skill 可能產生 SQL、migration、rollback 或 data validation 相關檔案。

任何新增、修改、刪除、搬移或覆寫檔案前，必須確認使用者已明確核准該次 change proposal 或 workflow gate。

若只是產生草稿，且 Gemini 是協助維護本 `skills-hub` repository，草稿應優先放入 `docs/_generated/`，除非使用者明確要求正式化。

## Safety and Limitations

- 預設 read-only。
- 不得直接修改 production data。
- 不得在 rollback 不完整時建議 release。
- 不得在 DB alias 不明確時查詢 metadata。
- 不得自行決定未確認的業務資料規則。
- 不得輸出 connection string、password、token 或敏感資訊。
- 不得覆蓋 `GEMINI.md` 的 Change Control 與安全限制。

## Output Format

```markdown
# DB Engineering Report

## Selected DB Metadata Connection

## DB Impact Summary

## Affected Objects

| Object Type | Object Name | Impact | Notes |
|---|---|---|---|

## SQL / Schema Analysis

## Data Correctness Analysis

## Performance Risks

## Migration Plan

## Rollback Plan

## Data Validation

## Risks

## Open Questions

## Handoff Notes
```

## Examples

```text
請針對這次 SDLC Plan 的 DB 影響進行分析，確認 affected tables、SQL 風險、migration direction、rollback direction 與 validation method。
```
