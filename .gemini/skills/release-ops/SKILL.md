---
name: release-ops
description: Use when the task requires deployment planning, rollback planning, release notes, post-deployment validation, UAT checklist, handover, or operational runbook output.
---
# Release Ops Skill

## 1. 能力定位

此 Skill 提供 Release / Operations capability。

## 2. 使用時機

使用於：

* 產生部署步驟。
* 產生部署後驗證方式。
* 產生 rollback plan。
* 產生 release note。
* 產生 UAT checklist。
* 產生 handover / runbook。

## 3. 工作流程

1. 確認變更摘要、測試結果、DB review、code review、security review。
2. 若存在 blocking 或 high-risk issue，停止 release。
3. 產生 deployment steps。
4. 產生 post-deployment validation。
5. 產生 rollback plan，包括 DB rollback。
6. 產生 UAT checklist 與 handover notes。

## 4. 輸出格式

```markdown
# Release Package

## Change Summary
## Preconditions
## Deployment Steps
## DB Deployment Steps
## Post-deployment Validation
## Rollback Plan
## UAT Checklist
## Handover / Runbook
```

## 5. 限制

* 不執行正式部署。
* 不忽略 rollback。
* 不在 review gate 未通過時建議 release。
