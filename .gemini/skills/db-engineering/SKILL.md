---
name: db-engineering
description: Use when the task involves database schema, SQL, migration, rollback SQL, data correctness, transactions, reporting data, import/export data, DB performance impact, or DB metadata connection selection. Do not use as a general coding skill.
---
# DB Engineering Skill

## 1. 能力定位

此 Skill 提供 Database Engineering capability。

使用它的 Agent 應分析資料庫、SQL、migration、資料正確性、交易安全、效能與回滾設計。

## 2. 使用時機

使用於：

* 新增、修改或刪除 table、column、index、view、stored procedure。
* 修改 SQL、report query、import/export、資料同步或資料流。
* 需要 migration plan、rollback SQL、data validation。
* 需要評估 transaction、locking、performance、backward compatibility。
* 需要從多組 DB metadata aliases 中判斷應使用哪一組連線。

## 3. 不使用時機

不使用於：

* 單純 UI 或前端文字調整。
* 不涉及資料持久化或 SQL 的一般程式修改。
* 未經確認要直接修改正式資料。

## 4. 工作流程

1. 判斷 DB 影響範圍。
2. 若需要查 DB metadata，先使用 `list_connections` 查看可用 aliases。
3. 若存在多個 aliases，使用 `suggest_connection` 搭配使用者需求文字推測候選連線。
4. 只有當 alias、description、environment、system、database 或 tags 明確符合時，才可選定 `connection_key`。
5. 若候選連線不明確，必須先詢問使用者確認 `connection_key`，不可猜測。
6. 列出受影響 table / column / index / view / stored procedure / query。
7. 分析資料正確性、交易、效能、相容性與回滾風險。
8. 若需變更 DB，提出 migration plan 與 rollback SQL。
9. 提供 data validation SQL 或驗證方式。
10. 如果業務資料規則不明，回交 SA Agent 或使用者確認。

## 5. 輸出格式

```markdown
# DB Engineering Report

## Selected DB Metadata Connection

## DB Impact Summary
## Affected Objects
## Migration Plan
## Rollback Plan
## Data Validation
## Risks
## Open Questions
```

## 6. 安全限制

* 預設 read-only。
* 不得執行 destructive SQL。
* 不得修改正式資料。
* 不得在 rollback 不完整時建議 release。
* 不得在 DB alias 不明確時查詢 metadata。
* 不得輸出 connection string、password、token 或任何 secrets。
