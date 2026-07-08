# BigQuery Database Playbook

此 Playbook 定義 BigQuery / GoogleSQL 相關任務的分析、測試、review 與 release 注意事項。

BigQuery 是 DB Platform / Dialect。它同時具有 cloud data warehouse 與 managed service 特性，因此 release / cost / scan / permission 風險需要特別標示。

## Scope

適用於：

- BigQuery Standard SQL / GoogleSQL query。
- project、dataset、table、view、materialized view。
- partition、cluster、policy tag、authorized view。
- scheduled query、dataform / dbt style transformation、report query。
- Looker / LookML 使用 BigQuery 作為資料來源的情境。
- `/sdlc:test` 的 BigQuery dry run / explain / estimated scan evidence。

## Version and Environment Context

開始分析前必須確認：

| Item | Examples |
|---|---|
| DB Platform / Dialect | BigQuery |
| Project | GCP project id |
| Dataset | dataset name |
| Region | asia-east1 / US / EU / unknown |
| Environment | dev / test / uat / prod / unknown |
| Table Type | table / view / materialized view / external table |
| Partition / Cluster | Required for scan risk |
| Access Context | service account / user / Looker connection / unknown |
| Data Sensitivity | Low / Medium / High / Unknown |

若 project、dataset、region 或 access context 不明，必須標示 `Needs More Evidence`。

## Cost and Scan Safety

BigQuery review 必須考慮 query cost 與 bytes processed。

優先使用：

- dry run。
- explain。
- estimated bytes processed。
- partition filter check。
- cluster usage check。
- limited metadata query。

禁止無腦執行：

- 未限制 partition 的大表查詢。
- full scan 探索性查詢。
- `SELECT *` 對大表或敏感表。
- 將 dry run 當作 execution pass。

## Query Design Rules

必須檢查：

- 是否使用 Standard SQL / GoogleSQL。
- partition filter 是否存在。
- cluster key 是否有助於主要 filter。
- join 是否造成 row explosion。
- aggregation 是否因重複資料產生錯誤。
- timezone / date / timestamp 行為是否符合需求。
- nested / repeated fields 是否正確 unnest。
- wildcard table 是否限制 `_TABLE_SUFFIX`。
- query result 是否可能輸出敏感欄位。

## Data Modeling Notes

| Area | Notes |
|---|---|
| Partition | 日期分區需確認 filter 是否使用分區欄位 |
| Cluster | 大量資料查詢需確認 cluster 欄位與 filter / join 相關 |
| Nested / Repeated | `UNNEST` 可能造成資料倍增 |
| Materialized View | 更新延遲與限制需確認 |
| External Table | performance、permission、schema drift 需標示 |
| Authorized View | 權限與資料遮罩需確認 |
| Policy Tag | 敏感欄位 governance 不得忽略 |

## Migration / Release Rules

BigQuery 變更應包含：

1. project / dataset / table context。
2. DDL / query / view / scheduled query 變更內容。
3. partition / cluster / policy tag 影響。
4. downstream Looker / report / export impact。
5. dry run / explain / estimated scan evidence。
6. rollback direction。
7. cost / scan risk。
8. permission / service account impact。

## Rollback Rules

| Type | Required Notes |
|---|---|
| View Rollback | 還原 view SQL 或 previous definition |
| Table Schema Rollback | 欄位新增 / 修改 / 刪除的可逆性 |
| Data Rollback | 是否需要 snapshot、backup table、time travel、補償 query |
| Scheduled Query Rollback | 停用、還原 schedule 或 query version |
| Permission Rollback | IAM、authorized view、policy tag 是否需還原 |
| Looker Rollback | LookML / explore / dashboard 是否需同步還原 |

若 data change 不可逆或超過 time travel / backup 可用範圍，必須標示 high risk。

## DB-assisted Dry Run

允許：

- dry run。
- explain。
- estimated bytes processed。
- metadata / INFORMATION_SCHEMA 查詢。
- bounded aggregate。
- limited sample，且排除敏感欄位。

禁止：

- 無限制 full scan。
- 對敏感欄位輸出完整值。
- DDL / DML mutation，除非已有明確 approval 與 rollback。
- 把 dry run 結果標示為實際測試 Pass。

## Review Checklist

| Area | Check |
|---|---|
| Correctness | Query 是否符合 Acceptance Criteria |
| Scan Cost | 是否有 estimated bytes processed |
| Partition / Cluster | 是否正確使用 partition / cluster |
| Data Safety | 是否避免敏感欄位與 unintended exposure |
| Performance | join / unnest / aggregation 風險 |
| Compatibility | Standard SQL / LookML / downstream report 相容 |
| Rollback | view / table / scheduled query / permission rollback |

## Output Format

```markdown
# BigQuery Analysis

## DB Context

| Item | Value | Evidence / Notes |
|---|---|---|
| DB Platform / Dialect | BigQuery | |
| Project | | |
| Dataset | | |
| Region | | |
| Environment | | |
| Table Type | | |
| Partition / Cluster | | |

## Affected Objects

## Query / Schema Analysis

## Cost / Scan Risk

## Partition / Cluster Check

## Data Correctness Risks

## Security / Permission Risks

## Dry Run / Explain Evidence

## Migration Direction

## Rollback Direction

## Downstream Impact

## Open Questions

## Gate Recommendation
```
