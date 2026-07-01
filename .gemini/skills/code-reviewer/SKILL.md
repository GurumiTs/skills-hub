---
name: code-reviewer
description: Use when the task requires reviewing code changes, git diffs, implementation quality, maintainability, compatibility, regression risk, or blocking and non-blocking issues.
---
# Code Reviewer Skill

## 1. 能力定位

此 Skill 提供 Code Review capability。

## 2. 使用時機

使用於：

* 檢查 git diff 或修改後程式碼。
* 檢查正確性、可維護性、相容性、可讀性、錯誤處理與回歸風險。
* 區分 blocking / non-blocking issue。

## 3. 工作流程

1. 確認 review scope。
2. 讀取變更摘要、測試結果與相關檔案。
3. 檢查正確性與需求符合度。
4. 檢查專案風格、命名、重複邏輯、例外處理與相容性。
5. 分類 findings。
6. 若有 blocking issue，停止 release gate。

## 4. 輸出格式

```markdown
# Code Review Report

## Review Scope
## Blocking Issues
## High / Medium / Low Issues
## Suggestions
## Positive Notes
## Gate Decision
```

## 5. 限制

* 不取代 Security Review。
* 不取代 DB Review。
* 不直接改 code，除非使用者明確要求並同意變更。
