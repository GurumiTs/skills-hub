# LookML / Looker Playbook

此 Playbook 定義 LookML / Looker 相關任務的分析、測試、review 與 release 注意事項。

LookML 是 BI / Semantic Layer，不應被當成一般 DB Platform。若 LookML 連接 BigQuery、MSSQL、Oracle 或其他資料庫，應同時記錄 upstream DB Platform 與 Looker connection context。

## Scope

適用於：

- LookML model、view、explore、dimension、measure、filter、parameter。
- join、relationship、sql_on、derived table、PDT、datagroup。
- access_filter、required_access_grants、row-level access。
- dashboard / Look / explore query impact。
- Looker semantic layer 對 BigQuery、MSSQL、Oracle 等資料來源的對應。
- `/sdlc:test` 的 LookML validation evidence。

## Required Context

開始分析前必須確認：

| Item | Examples |
|---|---|
| BI / Semantic Layer | LookML / Looker |
| Looker Project | project name |
| Model | model file |
| Explore | explore name |
| View | view file |
| Upstream DB Platform | BigQuery / MSSQL / Oracle / Unknown |
| Connection | Looker connection name / unknown |
| Environment | dev / test / prod / unknown |
| Access Context | role / group / permission / unknown |

若 model、explore、view 或 upstream DB Platform 不明，必須標示 `Needs More Evidence`。

## LookML Change Areas

| Area | Risk |
|---|---|
| Dimension | field type、sql、datatype、hidden、drill_fields 可能影響報表 |
| Measure | aggregation、filters、sql_distinct_key 可能影響數字正確性 |
| Join | relationship 設錯可能造成 fanout 或少資料 |
| Explore | explore source / joins / always_filter 影響所有使用者查詢 |
| Access Filter | 權限或 row-level data exposure 風險 |
| Derived Table / PDT | SQL、refresh、datagroup、persist_for 影響效能與資料新鮮度 |
| Datagroup | cache invalidation 與排程風險 |
| Dashboard / Look | field rename / removal 可能造成內容壞掉 |

## Validation Rules

LookML validation 應優先使用 read-only evidence：

- LookML syntax validation。
- model / explore validation。
- content validation result。
- SQL generation preview。
- 使用者提供的 Looker validation result。
- downstream dashboard / Look impact list。

若目前沒有可用 Looker / LookML MCP 或 CLI 工具，不得假裝已驗證；應標示 `Needs More Evidence` 或請使用者提供 validation result。

## Upstream DB Rules

LookML 變更若涉及 SQL、derived table、sql_on、dimension SQL 或 measure SQL，必須同時判斷 upstream DB dialect：

| Upstream DB | Required Playbook |
|---|---|
| BigQuery | `docs/playbooks/database/bigquery.md` |
| MSSQL | `docs/playbooks/database/mssql.md` |
| Oracle | `docs/playbooks/database/oracle.md` |

不得用 BigQuery SQL 慣例套用到 MSSQL / Oracle，也不得用 MSSQL T-SQL 套用到 BigQuery。

## Fanout and Aggregation Checks

必須檢查：

- join relationship 是否正確：one_to_one、many_to_one、one_to_many、many_to_many。
- measure 是否可能因 join fanout 造成重複計算。
- 是否需要 `sql_distinct_key`。
- filters / always_filter / conditionally_filter 是否影響資料範圍。
- derived table 是否改變粒度。
- dimension group 是否處理時間區間與 timezone。

## Access and Security Checks

必須檢查：

- access_filter 是否被移除或放寬。
- required_access_grants 是否正確。
- 敏感欄位是否 hidden 或受權限控制。
- row-level access 是否仍有效。
- dashboard / explore 是否可能暴露不該看的欄位。

## Release and Rollback Rules

LookML release 應包含：

1. changed model / view / explore list。
2. affected fields。
3. affected dashboards / Looks / schedules。
4. upstream DB impact。
5. validation evidence。
6. cache / PDT / datagroup impact。
7. rollback plan。
8. UAT checklist。

Rollback 應說明：

- 還原哪些 LookML files。
- 是否需重跑 validation。
- 是否需 rebuild PDT。
- 是否需通知 dashboard owner。
- 是否需回復 access filter 或 permission 設定。

## DB-assisted Dry Run / Evidence

允許：

- 整理 Looker validation result。
- 整理 SQL generation preview。
- 整理 downstream content impact。
- 使用 upstream DB playbook 做 read-only evidence。

禁止：

- 未經同意修改 LookML。
- 未經同意 deploy to production。
- 未經同意更新 dashboard、Look、schedule 或 permission。
- 把 validation 未執行標示為 pass。

## Review Checklist

| Area | Check |
|---|---|
| Syntax | LookML 是否語法正確 |
| Model / Explore | join、relationship、access、filter 是否合理 |
| Field Correctness | dimension / measure SQL 是否符合需求 |
| Fanout | 是否可能造成重複計算 |
| Security | access_filter、required_access_grants、hidden fields |
| Upstream DB | SQL dialect 是否符合 BigQuery / MSSQL / Oracle |
| Content Impact | dashboard / Look / schedule 是否受影響 |
| Rollback | LookML、PDT、cache、content owner 是否可回復 |

## Output Format

```markdown
# LookML Analysis

## Looker Context

| Item | Value | Evidence / Notes |
|---|---|---|
| BI / Semantic Layer | LookML / Looker | |
| Looker Project | | |
| Model | | |
| Explore | | |
| View | | |
| Upstream DB Platform | BigQuery / MSSQL / Oracle / Unknown | |
| Connection | | |
| Environment | | |

## Affected LookML Files

## Field / Explore Impact

## Upstream DB Impact

## Fanout / Aggregation Risk

## Access / Security Risk

## Validation Evidence

## Content Impact

## Release Direction

## Rollback Direction

## UAT Checklist

## Open Questions

## Gate Recommendation
```
