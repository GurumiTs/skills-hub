---
name: db-engineering
description: Use when the task involves database schema, SQL, migration, rollback SQL, data correctness, transactions, reporting data, import/export data, or DB performance impact. Do not use as a general coding skill.
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

## 3. 不使用時機

不使用於：

* 單純 UI 或前端文字調整。
* 不涉及資料持久化或 SQL 的一般程式修改。
* 未經確認要直接修改正式資料。

## 4. 工作流程

1. 判斷 DB 影響範圍。
2. 列出受影響 table / column / index / view / stored procedure / query。
3. 分析資料正確性、交易、效能、相容性與回滾風險。
4. 若需變更 DB，提出 migration plan 與 rollback SQL。
5. 提供 data validation SQL 或驗證方式。
6. 如果業務資料規則不明，回交 SA Agent 或使用者確認。

## 5. 輸出格式

```markdown
# DB Engineering Report

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
