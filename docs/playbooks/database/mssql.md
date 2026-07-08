# MSSQL Database Playbook

此 Playbook 定義 Microsoft SQL Server / MSSQL / T-SQL 相關任務的分析、實作、測試、review 與 release 注意事項。

MSSQL 是 DB Platform / Dialect。若資料庫部署在 Google Cloud SQL、Azure SQL、AWS RDS、VM 或 on-prem，該資訊應記錄為 DB Hosting / Runtime Environment，不應寫成 `MSSQL CloudSQL`。

## Scope

適用於：

- SQL Server / MSSQL / T-SQL query。
- table、column、index、view、stored procedure、function、trigger。
- migration、rollback SQL、資料修補、資料驗證。
- report query、export / import、batch、job、資料同步。
- ASP.NET Framework / WebForm / C# 專案中的 MSSQL data access。
- `/sdlc:test` 的 DB-assisted Dry Run evidence。

## Version and Environment Context

開始分析前必須確認：

| Item | Examples |
|---|---|
| DB Platform / Dialect | MSSQL |
| DB Hosting / Runtime Environment | Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Unknown |
| Environment | dev / test / uat / prod / unknown |
| SQL Server Version | 2012 / 2016 / 2019 / 2022 / unknown |
| Compatibility Level | 110 / 120 / 130 / 140 / 150 / 160 / unknown |
| Connection Key | DB metadata alias，不得輸出 connection string |
| Data Sensitivity | Low / Medium / High / Unknown |

若 SQL Server version 或 compatibility level 會影響語法、query plan、function、index 或 rollback 判斷，必須標示 `Needs More Evidence`。

## Hosting Notes

若 MSSQL 部署在 Google Cloud SQL 或其他 managed service：

- SQL / T-SQL 語法仍以 MSSQL 判斷。
- Hosting 影響連線、權限、備份、restore、maintenance window、HA / failover、監控與部分功能可用性。
- 不得因為部署在 Google Cloud SQL 就把 DB Platform 改寫為 CloudSQL。
- Release / rollback 需確認 managed service 的備份、point-in-time recovery、權限與 maintenance 限制。

## Read-only Metadata Checks

優先使用 read-only metadata：

```sql
-- examples only
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES;

SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS;

SELECT name, object_id, type_desc
FROM sys.objects;
```

不得輸出 connection string、password、token 或敏感欄位完整值。

## Query Design Rules

### Required Checks

- Join 條件是否完整。
- WHERE 條件是否符合業務規則。
- NULL 處理是否符合需求。
- 日期 / 時區 / datetime 精度是否正確。
- 分頁、排序、top / offset 是否穩定。
- aggregation 是否因 join duplicate 產生錯誤。
- transaction / isolation / locking 是否可能影響 production。
- index 是否支援主要 filter / join / sort。

### Avoid by Default

- 無條件 full table scan。
- `SELECT *`。
- 未確認目的的 `WITH (NOLOCK)`。
- 未限制範圍的 update / delete。
- 未確認 transaction 與 rollback 的 data fix。
- 將 performance workaround 包裝成長期方案。

## Migration Rules

MSSQL migration 應包含：

1. 前置條件。
2. schema change。
3. data backfill / data fix，如有。
4. index / constraint 調整。
5. validation SQL。
6. rollback SQL 或 rollback direction。
7. irreversible risk。
8. deployment order。

若 rollback 不可完整還原，必須明確標示。

## Rollback Rules

Rollback Plan 應區分：

| Type | Required Notes |
|---|---|
| Schema Rollback | column / index / table / view / SP 如何還原 |
| Data Rollback | 需不需要 backup table、mapping、補償 script |
| Code Rollback | data access code 是否需同步還原 |
| Config Rollback | connection、feature flag、job setting 是否需還原 |
| Operational Rollback | 是否需暫停 batch、report、import/export |

## DB-assisted Dry Run

允許：

- metadata / schema / column / index / constraint 查詢。
- bounded row count。
- existence check。
- limited aggregate。
- bounded sample，且排除敏感欄位。

禁止：

- INSERT、UPDATE、DELETE、MERGE、TRUNCATE、DROP、ALTER。
- 大量掃描或 full dump。
- 未遮罩輸出敏感資料。
- 未確認為 read-only 的 stored procedure / function。

## Review Checklist

| Area | Check |
|---|---|
| Correctness | SQL 是否符合 Acceptance Criteria |
| Data Safety | 是否避免誤改資料、重複資料、遺漏資料 |
| Performance | filter、join、sort、index 是否合理 |
| Transaction | isolation、locking、deadlock risk 是否可接受 |
| Compatibility | SQL Server version / compatibility level 是否支援 |
| Rollback | schema / data / code rollback 是否完整 |
| Security | 是否避免敏感資料輸出與權限過大 |

## Output Format

```markdown
# MSSQL DB Analysis

## DB Context

| Item | Value | Evidence / Notes |
|---|---|---|
| DB Platform / Dialect | MSSQL | |
| DB Hosting / Runtime Environment | Google Cloud SQL / Azure SQL / AWS RDS / VM / On-prem / Unknown | |
| SQL Server Version | | |
| Compatibility Level | | |
| Environment | | |
| Connection Key | | |

## Affected Objects

| Object Type | Object Name | Impact | Notes |
|---|---|---|---|

## SQL / Schema Analysis

## Data Correctness Risks

## Performance / Locking Risks

## Migration Direction

## Rollback Direction

## Validation SQL / Method

## DB-assisted Dry Run Evidence

## Open Questions

## Gate Recommendation
```
