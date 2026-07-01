# Security Playbooks

此目錄存放安全審查、Secrets、Injection、Auth、設定檔與依賴風險的參考規則。

## 原則

* 不得輸出 secrets 明文。
* High-risk security issue 未解決前不得進入 release。
* 臨時 workaround 不得視為正式安全方案。

## 建議後續文件

| 文件 | 用途 |
|---|---|
| `security-review.md` | 安全審查標準 |
| `secrets.md` | Secrets / credentials 處理規則 |
| `injection.md` | SQL Injection / XSS 等注入風險檢查 |
| `authorization.md` | Auth / authorization 風險檢查 |
