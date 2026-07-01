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

請依實際環境填入必要變數，例如 Redmine、DB metadata、file roots 等。

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

## 6. 加入目標專案

如果 `skills-hub` 與實際要開發的專案不同，請加入目標專案：

```text
/directory add D:\Workspace\TargetProject
/directory show
```

## 7. 建議啟動方式

### 7.1 先產生計畫，不修改檔案

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

### 7.2 確認後進入開發

```text
/sdlc:implement 使用剛才確認的 plan 開始實作。
```

若尚未取得明確 approval，Gemini 應停止並要求確認。

### 7.3 執行 Review

```text
/sdlc:review 請針對目前變更執行測試規劃、DB Review、Code Review 與 Security Review。
```

### 7.4 產生 Release Package

```text
/sdlc:release 請根據本次變更產生部署步驟、回滾方式、UAT checklist 與維運交接內容。
```

### 7.5 一鍵入口，但每個 Gate 停下

```text
/sdlc:run Redmine #1234，目標專案 D:\Workspace\TargetProject。
```

`/sdlc:run` 應先進入 plan，並在每個 gate 停下要求確認，不應無人監督一路修改到 release。

## 8. 常見問題

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

### Pipeline 沒有繼續往下跑

這通常是預期行為。只要遇到 gate、blocking issue、需求不明、DB 高風險、安全高風險或缺少使用者確認，pipeline 都應停下。
