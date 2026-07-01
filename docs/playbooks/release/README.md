# Release Playbooks

此目錄存放部署、回滾、UAT、Release Note 與維運交接的參考規則。

## 原則

* Release 前必須確認 test、code review、DB review、security review 狀態。
* 任何正式部署都必須具備 rollback plan。
* DB change 必須具備 DB rollback 或明確不可 rollback 的風險說明。

## 建議後續文件

| 文件 | 用途 |
|---|---|
| `release-rollback.md` | 部署與回滾標準 |
| `uat-checklist.md` | UAT checklist 標準 |
| `handover-runbook.md` | 維運交接與 Runbook 格式 |
