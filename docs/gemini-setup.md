# Gemini CLI：快速啟用 skills-hub

本文件提供開發人員取得 `skills-hub` 後，快速啟動 Gemini CLI 與 MCP servers 的基本步驟。

這份文件只作為啟用說明，不是 Gemini CLI 的執行規則；實際工作規則由 `GEMINI.md`、`.gemini/commands/`、`.gemini/agents/`、`.gemini/skills/` 與必要 playbooks 定義。

---

## 1. 安裝 dependencies

在 repository root 執行：

```bash
npm install
```

或：

```bash
npm run bootstrap
```

---

## 2. 準備環境變數

本 repo 提供範例檔：

```text
.gemini/.env.example
```

可複製成：

```text
.gemini/.env
```

Linux / macOS：

```bash
cp .gemini/.env.example .gemini/.env
```

Windows PowerShell：

```powershell
Copy-Item .gemini/.env.example .gemini/.env
```

常見需要設定的變數包含：

| 變數 | 用途 |
|---|---|
| `GEMINI_API_KEY` | Gemini CLI API Key，建議由系統環境變數或安全的本機 `.env` 提供 |
| `REDMINE_URL` | Redmine 網址 |
| `REDMINE_API_KEY` | Redmine API Key |
| `FILE_MCP_ROOTS` | file / git / test / static / secret scan 等工具允許操作的根目錄 |
| `GIT_MCP_ROOTS` | git-mcp 允許操作的 repository root |
| `SDLC_ARTIFACT_ROOT` | SDLC generated artifacts 的根目錄；相對路徑以 skills-hub repository root 解析 |
| `SDLC_*_SUBDIR` | SA、DB、Workflow、Dev Docs、Requirements、Flowchart 的子目錄名稱 |
| `DB_METADATA_CONNECTIONS` | db-metadata-mcp 唯一允許的 configured connection aliases |
| `DB_METADATA_DEFAULT_CONNECTION` | db-metadata-mcp 的預設 connection key |
| `TEST_RUNNER_ROOTS` | test-runner-mcp 允許執行測試的根目錄 |
| `TEST_RUNNER_COMMANDS` | test-runner-mcp 允許執行的測試命令白名單 |
| `STATIC_ANALYSIS_ROOTS` | static-analysis-mcp 允許分析的根目錄 |
| `STATIC_ANALYSIS_COMMANDS` | static-analysis-mcp 允許執行的靜態分析命令 |
| `SECRET_SCAN_ROOTS` | secret-scan-mcp 允許掃描的根目錄 |

請不要將真實 API Key、Password、Token、Cookie 或 Connection String commit 到 GitHub。

---

## 3. 確認 Gemini CLI 設定

Gemini CLI 的 project settings 位於：

```text
.gemini/settings.json
```

目前已註冊的 MCP servers 包含：

```text
redmine
localFiles
devDocs
flowchart
git
dbMetadata
testRunner
staticAnalysis
secretScan
```

多數工具預設 `trust=false`，讓工具呼叫保留人工確認，避免未確認的檔案、測試、DB 或掃描操作。

---

## 4. 測試 MCP Server 是否能啟動

可依需求單獨測試：

```bash
npm run dev:redmine
npm run dev:file
npm run dev:devdocs
npm run dev:flowchart
npm run dev:git
npm run dev:dbmetadata
npm run dev:testrunner
npm run dev:static
npm run dev:secrets
```

若啟動失敗，請先檢查：

- `package.json` scripts 是否存在。
- 對應 `packages/<mcp-name>/index.js` 是否存在。
- `.gemini/.env` 或系統環境變數是否已填入必要值。
- root path 與 command whitelist 是否設定正確。
- Node.js / npm 版本是否符合需求。

---

## 5. 啟動 Gemini CLI

在 repository root 啟動 Gemini CLI：

```bash
gemini
```

啟動後可檢查：

```text
/mcp
/commands reload
/commands list
/agents reload
/agents list
/skills reload
/skills list
/memory refresh
/memory show
```

預期可看到：

| 類型 | 內容 |
|---|---|
| MCP Servers | redmine、localFiles、devDocs、flowchart、git、dbMetadata、testRunner、staticAnalysis、secretScan |
| Commands | `/sdlc:plan`、`/sdlc:implement`、`/sdlc:test`、`/sdlc:review`、`/sdlc:release`、`/sdlc:run` |
| Skills | `sa-consultant`、`developer-implementer`、`db-engineering`、`test-engineer`、`code-reviewer`、`security-reviewer`、`release-ops`、`incident-rca` |
| Agents | workflow、SA、developer、DB、test、review、security、release、incident 相關 agents |

---

## 6. 指向要協助的目標專案

若要讓 Gemini 協助其他專案，可以在 Gemini CLI 中加入目標專案路徑：

```text
/directory add <target-project-path>
/directory show
```

加入後即可請 Gemini 協助分析、規劃、開發、測試或整理文件。SDLC 產生的 SA spec、DB proposal 與 Workflow State 不會寫入目標專案，而會依 `SDLC_ARTIFACT_ROOT` 與相關 subdir 設定輸出。

---

## 7. 開始使用

常見入口：

```text
/sdlc:plan <需求或問題描述>
/sdlc:implement <已核准的實作範圍>
/sdlc:test <測試需求或 Implementation Result>
/sdlc:review <Review Scope、Test Report 或 git diff>
/sdlc:release <Release Scope 或 Review Report>
/sdlc:run <完整 SDLC 任務描述>
```

也可以直接提出一般開發輔助需求，例如：

```text
請分析目前專案的登入流程與相關檔案。
```

```text
請根據這段錯誤 Log 判斷可能原因，並列出檢查步驟。
```

```text
請根據目前需求整理一份 SA 技術規格文件。
```

---

## 8. 安全提醒

- 不要 commit `.gemini/.env`。
- 不要 commit API Key、Password、Token、Cookie、Connection String 或公司內部敏感資訊。
- `FILE_MCP_ROOTS`、`GIT_MCP_ROOTS`、`TEST_RUNNER_ROOTS`、`STATIC_ANALYSIS_ROOTS`、`SECRET_SCAN_ROOTS` 應限制在必要目錄。
- DB metadata 只能使用 `DB_METADATA_CONNECTIONS` 中已配置的 aliases；不得使用目標專案 `web.config`、`appsettings.json` 或 raw connection string 建立連線。
- 所有 Agent 與 SDLC Commands 都不得直接執行 DB mutation；migration / rollback / validation SQL 只能產生 proposal artifact，交由人員審查與手動執行。
- 測試執行、DB 查詢、靜態分析與 secret scan 都可能涉及敏感資訊或系統負載，應保留人工確認。
- 涉及正式環境、部署、權限、資安或批次作業時，應先評估風險與 rollback。
- Gemini 產生的檔案、程式碼或部署步驟都應經人工確認後再套用到重要環境。
