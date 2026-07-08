# DB-assisted Dry Run Playbook

此 Playbook 定義 `/sdlc:test` 中需要 DB evidence 時的 read-only dry run 規則。

DB-assisted Dry Run 是由 Test Agent 與 DB Agent 協作完成的測試證據整理流程。它不是 DB mutation、不是正式資料修補，也不是完整測試通過證明。

## Purpose

使用 DB-assisted Dry Run 來確認：

- 測試需要的 table、schema、dataset、view、stored procedure、LookML view / explore 是否存在。
- 欄位、型別、索引、constraint、partition、權限或資料狀態是否足以支撐測試。
- Test Data Requirements 是否可被 read-only evidence 支撐。
- SQL / LookML / report / export / import 相關變更是否有初步驗證依據。
- 是否存在資料敏感性、權限、掃描成本、production risk 或 rollback 風險。

## Supported Evidence Types

優先使用以下 read-only evidence：

| Evidence Type | Description |
|---|---|
| Metadata | schema、table、column、type、constraint、index、view definition 摘要 |
| Existence Check | 特定 table / dataset / view / stored procedure 是否存在 |
| Bounded Row Count | 有限制條件的筆數檢查 |
| Limited Aggregate | count、min、max、group count 等低風險統計 |
| Bounded Sample | 遮罩或排除敏感欄位的小量樣本 |
| BigQuery Dry Run / Explain | estimated scan、partition / cluster 使用狀況 |
| LookML Validation Evidence | model / explore / view 的 read-only validation 或既有結果整理 |

## DB Platform and Hosting Separation

必須分開記錄：

```text
DB Platform / Dialect: MSSQL / Oracle / BigQuery / LookML / Unknown
DB Hosting / Runtime Environment: Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Unknown / Not Applicable
```

`MSSQL` 是 DB platform / dialect；`Google Cloud SQL` 是 hosting / managed service context。不得寫成 `MSSQL CloudSQL`。

## Tool Capability Boundary

目前 repository 內建的 `db-metadata-mcp` 以 MSSQL read-only metadata 為主。若任務是 Oracle、BigQuery 或 LookML：

- 若目前 Gemini CLI `/mcp` 中沒有對應 read-only 工具，必須標示 `Needs More Evidence` 或使用使用者提供的 evidence。
- 不得假裝已查詢 Oracle / BigQuery / Looker。
- 不得把 MSSQL metadata tool 套用到非 MSSQL 平台。

## Required Checks Before Query

執行任何 DB-assisted evidence 前，必須確認：

| Item | Required | If Missing |
|---|---|---|
| DB Platform / Dialect | Yes | Needs More Evidence |
| DB Hosting / Runtime Environment | Preferred | 標示 Unknown，不得混入 DB Platform |
| Connection Key / Environment | Yes | 不得查詢 |
| Read-only Capability | Yes | 不得查詢 |
| Object Ownership / Schema / Dataset | Preferred | 只能查 metadata 或要求補充 |
| Data Sensitivity | Yes | 不得輸出敏感欄位完整值 |
| Query Bound | Yes | 不得執行 unbounded query |

## Allowed Query Patterns

### Metadata First

優先查 metadata：

```sql
-- concept only, actual dialect must match DB Platform
list schemas
describe table
list columns
list indexes
list constraints
```

### Bounded Evidence Only

必要時允許：

```sql
-- concept only
SELECT COUNT(*) FROM table WHERE bounded_condition;
SELECT MIN(date_col), MAX(date_col) FROM table WHERE bounded_condition;
SELECT status, COUNT(*) FROM table WHERE bounded_condition GROUP BY status;
```

Sample 必須：

- 明確限制筆數。
- 避免 `SELECT *`。
- 排除或遮罩敏感欄位。
- 說明查詢目的。

## Forbidden Operations

禁止：

- INSERT、UPDATE、DELETE、MERGE、TRUNCATE、DROP、ALTER。
- 建立或修改 table / index / view / stored procedure。
- 大量掃描或 full dump。
- 未遮罩輸出敏感資料。
- 未確認 read-only 的 stored procedure / function。
- 對 production data 造成 mutation。
- 直接用 production connection 做探索性查詢。

## Platform Notes

### MSSQL

- 優先查 `INFORMATION_SCHEMA`、`sys.tables`、`sys.columns`、`sys.indexes`、`sys.foreign_keys`。
- 注意 `WITH (NOLOCK)` 不應被無腦使用；可能造成 dirty read。
- transaction / isolation / locking 風險需交給 DB Review。

### Oracle

- 需要 schema / owner context。
- 優先使用 read-only dictionary views，例如 `ALL_TABLES`、`ALL_TAB_COLUMNS`、`ALL_INDEXES`。
- 注意 synonym、sequence、package、function、procedure 與權限。

### BigQuery

- 優先使用 dry run、explain、estimated bytes processed、partition / cluster evidence。
- 必須避免無限制掃描。
- 必須標示 dataset、project、region 與 billing / scan risk。

### LookML / Looker

- 優先使用 model / view / explore validation evidence。
- 不得修改 LookML、content、dashboard 或 schedule。
- 需注意 field definition、join、access_filter、datagroup、derived table 影響。

## Output Format

```markdown
# DB-assisted Dry Run Evidence

## DB Context

| Item | Value | Evidence / Notes |
|---|---|---|
| DB Platform / Dialect | MSSQL / Oracle / BigQuery / LookML / Unknown | |
| DB Hosting / Runtime Environment | Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Unknown / Not Applicable | |
| Connection Key | | |
| Environment | dev / test / uat / prod / unknown | |
| Read-only Capability | Confirmed / Missing / Needs More Evidence | |
| Data Sensitivity | Low / Medium / High / Unknown | |

## Evidence Collected

| Object / Table / Dataset | Evidence Type | Read-only Evidence | Risk / Notes |
|---|---|---|---|

## Query Safety Check

| Check | Status | Notes |
|---|---|---|
| Bounded Query | Yes / No / Not Applicable | |
| Sensitive Fields Excluded | Yes / No / Not Applicable | |
| Mutation Risk | None / Low / Medium / High | |
| Scan / Performance Risk | None / Low / Medium / High / Unknown | |

## Dry Run Decision

Ready / Blocked / Needs More Evidence

## Handoff Notes
```
