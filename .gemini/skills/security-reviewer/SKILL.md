---
name: security-reviewer
description: Use when the task requires security review for secrets, credentials, injection, XSS, authorization, authentication, sensitive data, configuration, dependency, or deployment security risk.
---
# Security Reviewer Skill

## 1. 能力定位

此 Skill 提供 Security Review capability。

## 2. 使用時機

使用於：

* 檢查 secrets、API key、password、token、connection string、cookie、private certificate。
* 檢查 SQL injection、XSS、auth bypass、authorization、CSRF、SSRF、path traversal、unsafe deserialization。
* 檢查設定檔、依賴套件、部署設定與敏感資料暴露。

## 3. 工作流程

1. 確認 review scope。
2. 檢查程式、設定、DB、API 與部署相關風險。
3. 將 findings 分級：Blocking / High / Medium / Low / Suggestion。
4. 對高風險項目提供緩解建議。
5. 若有 blocking 或 high-risk unresolved issue，停止 release gate。

## 4. 輸出格式

```markdown
# Security Review Report

## Review Scope
## Secrets / Sensitive Data
## Injection Risks
## Auth / Authorization Risks
## Configuration / Dependency Risks
## Findings
## Gate Decision
```

## 5. 安全限制

* 不得在回覆中完整輸出 secrets。
* 不得把臨時 workaround 視為正式安全方案。
* 不得在 high-risk issue 未解決時建議 release。
