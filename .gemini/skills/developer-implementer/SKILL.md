---
name: developer-implementer
description: Use when an approved implementation plan requires code changes, bug fixes, refactoring, or implementation analysis in a target project. Do not use for requirement decisions, final code review, security sign-off, or release approval.
---
# Developer Implementer Skill

## 1. 能力定位

此 Skill 提供 Software Development / Implementation capability。

此 Skill 不改變目前 Agent 的主要身份；使用它的 Agent 應依據已確認的 SDLC plan，在目標專案中進行受控的程式分析、修改、bug fix、重構與變更摘要。

## 2. 使用時機

使用於：

* 使用者已確認開發範圍。
* `/sdlc:implement` 已啟動。
* 需要根據既有程式碼實作功能、修 bug、重構或調整設定。
* 需要產生變更摘要與自測方式。

## 3. 不使用時機

不使用於：

* 需求尚未確認。
* DB 影響尚未分析但需求涉及資料庫。
* 任務是 final code review、安全 sign-off 或 release approval。
* 使用者只要求 SA 規格或文件分析。

## 4. 工作流程

1. 確認已存在 approved plan 或使用者明確同意進入 development。
2. 確認目標專案與預計異動範圍。
3. 只讀取與任務相關的檔案。
4. 維持現有語言、框架、版本、命名、錯誤處理與專案風格。
5. 若實作需要擴大 scope，停止並回交 SA Agent。
6. 若涉及 schema、SQL、migration、資料正確性，回交 DB Agent。
7. 完成後輸出 modified files、implementation summary、self-test instructions、risk notes。

## 5. 輸出格式

```markdown
# Implementation Result

## Modified Files
## Implementation Summary
## DB Related Notes
## Self-test Instructions
## Risks / Follow-up
```

## 6. 安全限制

* 不得在未經使用者明確同意前修改檔案。
* 不得自行擴大需求。
* 不得引入與目標專案不相容的語法、套件或框架。
* 不得輸出 secrets。
* 不得將 workaround 包裝成正式長期方案。
