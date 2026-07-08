# Oracle Database Playbook

此 Playbook 定義 Oracle Database / Oracle SQL / PL/SQL 相關任務的分析、測試、review 與 release 注意事項。

Oracle 是 DB Platform / Dialect。Hosting / runtime environment 應另外記錄，例如 VM、on-prem、Oracle Cloud、AWS RDS 或其他代管環境。

## Scope

適用於：

- Oracle SQL query。
- schema、owner、table、column、index、view、materialized view。
- sequence、synonym、package、procedure、function、trigger。
- migration、rollback SQL、資料修補、資料驗證。
- report query、batch、job、import/export、integration data flow。
- `/sdlc:test` 中 Oracle 相關 DB-assisted Dry Run evidence。

## Version and Environment Context

開始分析前必須確認：

| Item | Examples |
|---|---|
| DB Platform / Dialect | Oracle |
| DB Hosting / Runtime Environment | VM / On-prem / Oracle Cloud / AWS RDS / Unknown |
| Environment | dev / test / uat / prod / unknown |
| Oracle Version | 11g / 12c / 19c / 21c / 23ai / unknown |
| Schema / Owner | Required for object lookup |
| NLS / Date Settings | 若任務涉及日期、字串、排序，需確認 |
| Connection Key | DB metadata alias，不得輸出 connection string |
| Data Sensitivity | Low / Medium / High / Unknown |

若 Oracle version、schema owner 或 NLS 設定會影響判斷但不可確認，必須標示 `Needs More Evidence`。

## Oracle-specific Risk Areas

| Area | Notes |
|---|---|
| Schema / Owner | Oracle object resolution 依 schema / owner，不可只看 table name |
| Synonym | public / private synonym 可能影響實際物件 |
| Sequence | insert / migration 可能依賴 sequence state |
| Package / Procedure | logic 可能藏在 PL/SQL package body |
| Date Handling | `DATE` 含時間，`TIMESTAMP` 精度與時區需確認 |
| Empty String | Oracle 將空字串視為 NULL，需特別注意 |
| Transaction | DDL 可能 implicit commit |
| Case Sensitivity | quoted identifier 會造成大小寫敏感 |

## Read-only Metadata Checks

優先使用 read-only dictionary views：

```sql
-- examples only
SELECT owner, table_name
FROM all_tables
WHERE owner = :owner;

SELECT owner, table_name, column_name, data_type, nullable
FROM all_tab_columns
WHERE owner = :owner AND table_name = :table_name;

SELECT owner, index_name, table_name, uniqueness
FROM all_indexes
WHERE owner = :owner;
```

若無法確認 schema / owner，先標示 `Needs More Evidence`。

## Query Design Rules

必須檢查：

- schema / owner 是否正確。
- join 條件是否完整。
- NULL / empty string 行為是否符合需求。
- date / timestamp / timezone 是否正確。
- row limiting 語法是否符合 Oracle 版本。
- sequence / trigger 是否影響資料新增。
- implicit commit 風險。
- execution plan / index 是否合理。

避免：

- 無條件 full table scan。
- `SELECT *`。
- 未確認 schema 的 table reference。
- 未確認 transaction 的 data fix。
- 未確認 rollback 的 DDL 或 data migration。

## Migration Rules

Oracle migration 應包含：

1. schema / owner。
2. object dependency。
3. DDL / DML 順序。
4. sequence / synonym / trigger / package 影響。
5. validation SQL。
6. rollback SQL 或 rollback direction。
7. implicit commit / irreversible risk。
8. required grants。

## Rollback Rules

Rollback Plan 應區分：

| Type | Required Notes |
|---|---|
| Schema Rollback | table / column / index / view / package 如何還原 |
| Data Rollback | 是否需要 backup table、flashback、補償 script |
| Grant Rollback | 權限是否需要還原 |
| Sequence Rollback | sequence state 是否可回復，或需補償 |
| Code Rollback | PL/SQL package / app code 是否需同步還原 |

若 DDL 已 implicit commit 且 rollback 不完整，必須明確標示 high risk。

## DB-assisted Dry Run

允許：

- `ALL_TABLES`、`ALL_TAB_COLUMNS`、`ALL_INDEXES`、`ALL_CONSTRAINTS` 等 metadata 查詢。
- bounded row count。
- existence check。
- limited aggregate。
- bounded sample，且排除敏感欄位。

禁止：

- INSERT、UPDATE、DELETE、MERGE、TRUNCATE、DROP、ALTER。
- 未限制資料量的查詢。
- 未遮罩輸出敏感資料。
- 未確認 read-only 的 procedure / function。

## Review Checklist

| Area | Check |
|---|---|
| Correctness | SQL / PL/SQL 是否符合 Acceptance Criteria |
| Object Resolution | owner、synonym、package dependency 是否清楚 |
| Data Safety | NULL、empty string、date、sequence 風險是否處理 |
| Performance | index、join、execution plan 風險 |
| Transaction | implicit commit / locking / rollback 風險 |
| Compatibility | Oracle version 是否支援語法 |
| Security | grants、sensitive data、least privilege |

## Output Format

```markdown
# Oracle DB Analysis

## DB Context

| Item | Value | Evidence / Notes |
|---|---|---|
| DB Platform / Dialect | Oracle | |
| DB Hosting / Runtime Environment | VM / On-prem / Oracle Cloud / AWS RDS / Unknown | |
| Oracle Version | | |
| Schema / Owner | | |
| Environment | | |
| Connection Key | | |

## Affected Objects

## SQL / PL/SQL Analysis

## Data Correctness Risks

## Performance / Transaction Risks

## Migration Direction

## Rollback Direction

## Validation SQL / Method

## DB-assisted Dry Run Evidence

## Open Questions

## Gate Recommendation
```
