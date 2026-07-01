# Database Playbooks

此目錄存放資料庫設計、SQL、migration、rollback、資料正確性與資料庫產品差異的參考規則。

## 原則

* DB Engineering Skill 負責 DB 工程流程。
* SQL Server、Oracle、BigQuery 等產品差異放在 playbook，不拆成 Skill。
* 所有 DB 變更都必須考慮 migration、rollback、data validation、transaction safety 與相容性。

## 建議後續文件

| 文件 | 用途 |
|---|---|
| `sql-server.md` | SQL Server schema、index、transaction、migration 原則 |
| `oracle.md` | Oracle schema、SQL、transaction、migration 原則 |
| `migration.md` | DB migration 與 rollback 標準格式 |
| `transaction-safety.md` | 交易安全、locking、資料一致性檢查 |
