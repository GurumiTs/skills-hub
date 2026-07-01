# SDLC Pipeline Usage Guide

此文件說明新人工程師取得 `skills-hub` 後，如何在 Gemini CLI 中驗證並啟動 SDLC Pipeline。

## 1. 切換分支

```bash
git checkout feature/sdlc_pipeline
git pull origin feature/sdlc_pipeline
```

## 2. 安裝與設定

```bash
npm install
```

建立 `.gemini/.env`：

```powershell
Copy-Item .gemini/.env.example .gemini/.env
```

請依實際環境填入必要變數，例如 Redmine、DB metadata、file roots、test runner commands、static analysis commands、secret scan roots 等。

## 3. 啟動 Gemini CLI

```bash
gemini
```

或：

```bash
npx @google/gemini-cli
```

## 4. 重新載入 workspace 能力

進入 Gemini CLI 後執行：

```text
/permissions trust
/memory refresh
/skills reload
/agents reload
/commands reload
/mcp reload
```

## 5. 驗證 discovery 結果

執行：

```text
/skills list
/agents list
/commands list
/mcp
```

預期應看到：

### Commands

```text
/sdlc:plan
/sdlc:run
/sdlc:implement
/sdlc:review
/sdlc:release
```

### Agents

```text
workflow-orchestrator
sa-agent
developer-agent
db-agent
test-agent
review-agent
security-agent
release-agent
incident-agent
```

### Skills

```text
sa-consultant
developer-implementer
db-engineering
test-engineer
code-reviewer
security-reviewer
release-ops
incident-rca
```

### MCP Servers

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

## 6. 加入目標專案

如果 `skills-hub` 與實際要開發的專案不同，請加入目標專案：

```text
/directory add D:\Workspace\TargetProject
/directory show
```

並確認 `.gemini/.env` 中至少設定下列 allow roots：

```text
FILE_MCP_ROOTS="D:\Workspace\TargetProject"
GIT_MCP_ROOTS="D:\Workspace\TargetProject"
TEST_RUNNER_ROOTS="D:\Workspace\TargetProject"
STATIC_ANALYSIS_ROOTS="D:\Workspace\TargetProject"
SECRET_SCAN_ROOTS="D:\Workspace\TargetProject"
```

## 7. DB Metadata 多連線設定

DB Metadata MCP 支援多組 connection alias。建議使用 `DB_METADATA_CONNECTIONS` 管理多個 read-only metadata 連線。

範例：

```env
DB_METADATA_DEFAULT_CONNECTION="dbexample-dev"
DB_METADATA_CONNECTIONS='{
  "dbexample-dev": {
    "type": "mssql",
    "displayName": "DB Example DEV",
    "description": "Development database for dbexample application metadata lookup.",
    "environment": "dev",
    "system": "dbexample",
    "database": "DBExample_DEV",
    "tags": ["dbexample", "dev", "development"],
    "connectionString": "Server=YOUR_DEV_SERVER;Database=DBExample_DEV;User Id=YOUR_READONLY_USER;Password=YOUR_PASSWORD;Encrypt=true;TrustServerCertificate=true;"
  },
  "dbexample-uat": {
    "type": "mssql",
    "displayName": "DB Example UAT",
    "description": "UAT database for dbexample application metadata lookup.",
    "environment": "uat",
    "system": "dbexample",
    "database": "DBExample_UAT",
    "tags": ["dbexample", "uat", "testing"],
    "connectionString": "Server=YOUR_UAT_SERVER;Database=DBExample_UAT;User Id=YOUR_READONLY_USER;Password=YOUR_PASSWORD;Encrypt=true;TrustServerCertificate=true;"
  }
}'
```

DB Agent / DB Engineering Skill 應先使用 `list_connections` 或 `suggest_connection` 判斷 `connection_key`。如果候選連線不明確，必須先詢問使用者確認，不可猜測。

## 8. MCP Smoke Test

可用 npm script 單獨啟動 MCP Server：

```bash
npm run dev:git
npm run dev:dbmetadata
npm run dev:testrunner
npm run dev:static
npm run dev:secrets
```

也可以用 MCP Inspector 做 tool-level 測試：

```bash
npx @modelcontextprotocol/inspector -- node ./packages/git-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/db-metadata-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/test-runner-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/static-analysis-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/secret-scan-mcp/index.js
```

DB Metadata MCP 建議先測：

```text
list_connections
suggest_connection(query_text="dbexample dev login requirement")
db_metadata_health(connection_key="dbexample-dev")
list_tables(connection_key="dbexample-dev")
```

## 9. 建議啟動方式

### 9.1 先產生計畫，不修改檔案

```text
/sdlc:plan Redmine #1234，目標專案 D:\Workspace\TargetProject。請先完成需求釐清、SA 分析、DB / Data 影響分析與開發計畫。先不要修改任何檔案。
```

預期輸出：

* Requirement Summary
* SA Analysis
* DB / Data Impact Analysis
* Implementation Plan
* Expected File Changes
* Expected DB Changes
* Test Strategy
* Risks and Rollback Direction
* Gate Decision Required

### 9.2 確認後進入開發

```text
/sdlc:implement 使用剛才確認的 plan 開始實作。
```

若尚未取得明確 approval，Gemini 應停止並要求確認。

### 9.3 執行 Review

```text
/sdlc:review 請針對目前變更執行測試規劃、DB Review、Code Review 與 Security Review。
```

### 9.4 產生 Release Package

```text
/sdlc:release 請根據本次變更產生部署步驟、回滾方式、UAT checklist 與維運交接內容。
```

### 9.5 一鍵入口，但每個 Gate 停下

```text
/sdlc:run Redmine #1234，目標專案 D:\Workspace\TargetProject。
```

`/sdlc:run` 應先進入 plan，並在每個 gate 停下要求確認，不應無人監督一路修改到 release。

## 10. 常見問題

### `/commands list` 看不到 `/sdlc:*`

請確認：

* 檔案位於 `.gemini/commands/sdlc/*.toml`
* 已執行 `/commands reload`
* Gemini CLI 是從此 repo workspace 啟動

### `/agents list` 看不到 agents

請確認：

* 檔案位於 `.gemini/agents/*.md`
* agent 檔案第一行是 `---`
* YAML frontmatter 至少包含 `name` 與 `description`
* 已執行 `/agents reload`

### `/skills list` 看不到 skills

請確認：

* 檔案位於 `.gemini/skills/<skill-name>/SKILL.md`
* `SKILL.md` 第一行是 `---`
* YAML frontmatter 至少包含 `name` 與 `description`
* 已執行 `/skills reload`

### `/mcp` 看不到 SDLC MCP servers

請確認：

* `.gemini/settings.json` 中存在 `git`、`dbMetadata`、`testRunner`、`staticAnalysis`、`secretScan`
* 已執行 `/mcp reload`
* 已執行 `npm install`
* `.gemini/.env` 中的 allow roots 與 connection string 設定正確

### DB Metadata tools 回覆要求指定 `connection_key`

代表目前設定了多組 DB alias，但沒有設定 `DB_METADATA_DEFAULT_CONNECTION`，或工具無法安全推斷。請先用 `list_connections` / `suggest_connection`，再帶入明確的 `connection_key`。

### Pipeline 沒有繼續往下跑

這通常是預期行為。只要遇到 gate、blocking issue、需求不明、DB 高風險、安全高風險或缺少使用者確認，pipeline 都應停下。
