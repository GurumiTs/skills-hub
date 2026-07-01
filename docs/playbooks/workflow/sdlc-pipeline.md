# SDLC Pipeline Playbook

此文件定義 `skills-hub` 的標準 SDLC Pipeline。它是 Commands、Agents 與 Skills 的共同參考，不是 Gemini CLI 官方內建 pipeline engine。

## 核心原則

| 原則 | 說明 |
|---|---|
| 先規格，後實作 | 不得在需求與影響未清楚前直接修改程式 |
| DB 影響不可跳過 | 只要涉及資料表、SQL、匯入匯出、報表、資料流、migration，就必須進行 DB / Data Impact Analysis |
| Gate 必須停下 | 每個關鍵 gate 必須回報狀態，必要時等待使用者確認 |
| Mutating 操作需確認 | 寫檔、改 DB、部署、更新外部系統都需要明確同意 |
| 有 blocking issue 就停止 | 不得帶著 blocking issue 進入下一階段 |

## Pipeline Stages

| 階段 | 主責 Agent | 主要 Skill | 輸入 | 輸出 / Gate |
|---|---|---|---|---|
| 1. Requirement Intake | Workflow Orchestrator | 視需要使用 `sa-consultant` | 使用者需求、Redmine、問題描述、現有文件 | 任務摘要、目標、限制、是否需要 SA 分析 |
| 2. SA Analysis | SA Agent | `sa-consultant` | 需求摘要、問題背景、限制條件 | SA 規格、In Scope、Out of Scope、Assumptions、Open Questions、Acceptance Criteria |
| 3. DB / Data Impact Analysis | DB Agent | `db-engineering` | SA 規格、資料表、SQL、資料流 | DB 影響分析、Table / Column / Index / SQL / Migration 初步評估 |
| 4. Implementation Planning | SA Agent + Developer Agent + DB Agent | `sa-consultant`、`developer-implementer`、`db-engineering` | SA 規格、DB 影響分析、現有程式碼 | 實作計畫、預計異動檔案、DB 變更計畫、風險與驗證方式 |
| 5. Development | Developer Agent | `developer-implementer` | 已確認的實作計畫 | 程式變更、變更摘要、自測方式 |
| 6. DB Change Implementation | DB Agent 或 Developer Agent | `db-engineering` | DB 變更計畫、schema、SQL | SQL script、migration plan、資料驗證方式、rollback SQL |
| 7. Test Planning | Test Agent | `test-engineer` | SA 規格、實作摘要、DB 變更摘要 | 測試案例、Edge Case、測試資料需求 |
| 8. Test Execution | Test Agent | `test-engineer` | 測試案例、程式變更 | 測試結果、失敗清單、回交項目 |
| 9. Code Review | Review Agent | `code-reviewer` | git diff、變更摘要、測試結果 | blocking / non-blocking issues、可維護性與 design quality 檢查 |
| 10. DB Review | DB Agent | `db-engineering` | SQL / migration、DB 變更摘要 | SQL 效能、交易安全、資料正確性、rollback 可行性檢查 |
| 11. Security Review | Security Agent | `security-reviewer` | 程式 diff、設定檔、DB 變更、API 變更 | secrets、注入、權限、依賴弱點、安全風險結論 |
| 12. Release / Rollback Planning | Release Agent | `release-ops` | 已通過 review 的變更、測試報告 | 部署步驟、部署後驗證、rollback、release note |
| 13. UAT / Acceptance Support | SA Agent + Test Agent | `sa-consultant`、`test-engineer` | UAT 情境、驗收標準 | UAT checklist、使用者溝通說明、驗收結果整理 |
| 14. Handover / Maintenance | Release Agent | `release-ops` | Release 文件、部署結果 | Runbook、監控點、常見問題、排查步驟 |
| 15. Incident / RCA | Incident Agent | `incident-rca` | 正式區異常、Log、使用者回報 | RCA、暫時處置、長期改善、後續追蹤事項 |

## Pipeline Gates

| Gate | 進入下一階段前必須確認 |
|---|---|
| Requirement Intake → SA | 需求來源、目標系統、主要目標與限制已清楚 |
| SA → DB Impact | 判斷是否涉及資料庫、SQL、資料流、報表、匯入匯出或 migration |
| SA / DB → Development | 需求範圍、Out of Scope、Acceptance Criteria、主要風險與 DB 影響已清楚 |
| Development → Test | 程式變更完成，且有變更摘要與自測方式 |
| DB Change → Test | DB script、migration、資料驗證方式與 rollback 已準備 |
| Test → Review | 測試通過，或失敗項目已明確記錄並回交修正 |
| Code Review → Security | 無 blocking code review issue |
| DB Review → Security | 無高風險資料正確性、交易或 rollback 問題 |
| Security → Release | 無高風險 secrets、注入、權限或依賴弱點 |
| Release → UAT | 部署步驟、部署後驗證與 rollback 完整 |
| UAT → Handover | 驗收結果、使用者溝通事項與維運注意事項已整理 |

## Blocking Rule

以下情況必須停止 pipeline：

* 需求或 Acceptance Criteria 不清楚。
* DB 欄位、資料規則、migration 或 rollback 不清楚。
* 測試失敗且未修正。
* Code Review 有 blocking issue。
* DB Review 有高風險資料正確性、交易或 rollback 問題。
* Security Review 有 high-risk issue。
* Release 缺少 rollback plan。
* 使用者尚未同意 mutating operation。
