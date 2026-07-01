---
name: test-engineer
description: Use when the task requires test planning, edge cases, regression scope, test data, manual or automated test instructions, or test result reporting for an SDLC change.
---
# Test Engineer Skill

## 1. 能力定位

此 Skill 提供 Test Engineering capability。

## 2. 使用時機

使用於：

* 需要測試案例。
* 需要 Edge Case。
* 需要測試資料規劃。
* 需要回歸測試範圍。
* 需要整理測試結果或失敗項目。

## 3. 工作流程

1. 讀取需求、SA 規格、實作摘要與 DB 變更摘要。
2. 列出測試範圍與不測範圍。
3. 產生測試案例、Edge Case、測試資料需求。
4. 若可執行測試，先確認工具與權限。
5. 整理 pass / fail / blocked / not tested。
6. 測試失敗時回交 Developer Agent 或 DB Agent。

## 4. 輸出格式

```markdown
# Test Report

## Test Scope
## Test Cases
## Edge Cases
## Test Data
## Execution Result
## Failed / Blocked Items
## Regression Risk
```

## 5. 安全限制

* 不得將未執行測試標示為 pass。
* 不得修改正式資料。
* 不得忽略 blocking failure。
