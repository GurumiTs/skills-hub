# skills-hub - Gemini CLI Skills & MCP Hub

`skills-hub` 是一個給 Gemini CLI 使用的開發輔助能力中心，用來集中管理日常開發、系統分析、文件整理與內部工具整合所需的 Workspace Skills、MCP Server、Agents、Commands 與共通工作規範。

這個 repository 本身不是業務系統專案，而是讓開發者在啟動 Gemini CLI 後，可以更穩定地把 Gemini 當成「開發顧問與工作助理」使用。

簡單來說：

* `packages/` 解決「Gemini 可以做什麼」：MCP Server 工具能力。
* `.gemini/skills/` 解決「Gemini 可以套用哪些專業能力」：Workspace Skills。
* `.gemini/agents/` 解決「Gemini 可以切換哪些工作角色」：Agents。
* `.gemini/commands/` 解決「Gemini 可以執行哪些可重複流程」：Workflow commands。
* `docs/playbooks/` 解決「不同技術棧、框架、資料庫與內部慣例應如何處理」：References / Playbooks。
* `GEMINI.md` 解決「Gemini 在本 workspace 中必須遵守哪些共通規則」。

---

## 專案目的

這個專案希望成為日常開發時的 Gemini CLI 顧問工具箱，協助開發者把常見的開發、分析、文件與維運工作流程標準化。

可協助處理的工作包含：

* 分析程式錯誤、Log、SQL、API、WebForm、IIS、伺服器與系統整合問題
* 協助撰寫、重構、檢查與說明程式碼
* 查詢 Redmine 議題並整理需求背景
* 產生需求文件、Runbook、部署文件與 DB Schema 文件
* 整理 SA 技術規格文件
* 產生流程圖或 Mermaid 內容
* 將零散需求、問題紀錄與程式觀察整理成可交付文件
* 協助不同專案維持一致的工作規範、安全邊界與變更管制流程

此專案的核心目標是讓 Gemini CLI 在日常開發工作中能更有效率地輔助使用者，而不是讓使用者為了維護本 repository 付出過高成本。

---

## 適合使用情境

此專案適合以下使用者或團隊：

* 想把 Gemini CLI 作為日常開發助理的工程師
* 需要長期累積內部開發規範、文件模板與分析流程的團隊
* 想透過 MCP Server 串接 Redmine、檔案系統、DB metadata 或其他內部工具的開發者
* 經常需要產出 SA 規格、需求文件、Runbook、DB 文件、流程圖或問題分析文件的人員
* 希望 Gemini CLI 在不同專案中都能維持一致工作規範與安全邊界的使用者

典型使用方式：

1. Clone 此 repository。
2. 設定 `.gemini/.env` 與 `.gemini/settings.json`。
3. 啟動 Gemini CLI。
4. 透過目前工作目錄或 `/directory add` 加入目標專案。
5. 讓 Gemini 協助分析、開發、重構、撰寫文件或排查問題。
6. 視需要擴充新的 Workspace Skill、Agent、Command、Reference / Playbook 或 MCP Server。

---

## 專案結構

| 路徑 | 說明 |
|---|---|
| `packages/` | MCP Server 程式碼，每個 package 代表一個可被 Gemini CLI 呼叫的工具服務 |
| `.gemini/` | Gemini CLI 專案設定，例如 `settings.json`、`.env.example`、Workspace Skills、Agents、Commands |
| `.gemini/skills/` | Gemini CLI 會 discovery 的正式 Workspace Skills |
| `.gemini/agents/` | Agent 角色定義與多 Agent 協作規則，後續擴充用 |
| `.gemini/commands/` | Gemini CLI workflow / command 定義，後續擴充用 |
| `skills/_template/` | 給開發者複製用的 Skill 模板，不是正式 Skill，不應被 Gemini CLI discovery |
| `docs/playbooks/` | 技術棧、框架、資料庫、維運與公司內部慣例的 Reference / Playbook |
| `docs/_generated/` | Gemini 對話產生的文件輸出目錄，預設不進 Git |
| `GEMINI.md` | Gemini CLI 進入專案後讀取的專案層共通規則 |
| `README.md` | 給 GitHub 使用者與開發者看的專案說明 |

---

## 架構分層與儲存位置

本 repository 採用分層設計，避免把所有規則、角色、工具與流程都寫在同一份 prompt 內。新增內容前，應先判斷它屬於哪一層。

### 分層責任表

| 分工類型 | 負責工作內容 | 實際儲存位置 | 是否由 Gemini CLI 自動載入 / discovery | 維護原則 |
|---|---|---|---|---|
| 共通治理規則 | 定義所有任務都要遵守的安全限制、變更控管、workspace 邊界、溝通風格、優先順序 | `GEMINI.md` | 是，作為 workspace memory / context 載入 | 不放 Skill/MCP 註冊表；不寫成操作教學；只放跨任務共通規則 |
| Workspace Skill | 定義某類專業工作能力、觸發條件、工作流程、輸出格式、限制 | `.gemini/skills/<skill-name>/SKILL.md` | 是，透過 `/skills reload` discovery | 按工作成果與品質門檻拆分，不按語言或框架無限拆分 |
| Agent | 定義 SDLC 角色、責任邊界、handoff 規則、可用工具範圍 | `.gemini/agents/<agent-name>.md` | 是，透過 `/agents reload` discovery | Agent 代表「我是誰」，不放大量技術細節 |
| MCP Server | 提供 Gemini CLI 可呼叫的工具能力，例如讀檔、查 Redmine、查 DB metadata、跑測試 | `packages/<mcp-name>/`，並在 `.gemini/settings.json` 註冊 | 是，透過 `/mcp` 檢查 | MCP 只做工具，不定義角色或文件格式 |
| Command / Workflow | 將多階段流程包成可重複執行的工作流，例如 SDLC plan / implement / review / release | `.gemini/commands/` | 是，透過 `/commands reload` discovery | Command 負責串流程，不繞過 Change Control |
| Reference / Playbook | 放技術棧、框架、語言、資料庫、Legacy 系統、公司慣例等可查閱知識 | `docs/playbooks/` 或 `.gemini/skills/<skill-name>/references/` | 否，通常由 Skill / Agent 在需要時讀取 | 不因每個語言或框架建立新 Skill，優先放 playbook |
| Template | 給開發者複製用的 Skill、Agent、MCP、Command 範本 | `skills/_template/`、未來可擴充 `templates/agent/`、`templates/mcp/` | 否 | 不得放入 `.gemini/skills/`，避免被誤 discovery |
| Generated Docs | Gemini 對話產生的草稿、分析紀錄、handoff、臨時文件 | `docs/_generated/` | 否 | 預設不進 Git；正式化前需人工確認 |

### 設計原則

| 原則 | 說明 |
|---|---|
| Agent 管角色 | Agent 定義 SA、Developer、DB、Tester、Reviewer、Security、Release 等角色責任與 handoff 規則。 |
| Skill 管能力 | Skill 定義可重複的專業工作能力，例如 SA 分析、程式實作、DB 工程、測試、Code Review、安全審查。 |
| Reference 管技術棧 | C#、ASP.NET、Java、JavaScript、SQL Server、Oracle、WebForm 等不應各自做成 Skill，應放入 playbook。 |
| MCP 管工具 | MCP 只提供可呼叫工具，例如讀檔、查議題、查 metadata、跑測試，不負責定義工作方法。 |
| Command 管流程 | Command 將多個階段串成可重複 workflow，不直接取代 Agent 或 Skill。 |
| 少量穩定 Skill | 避免每個語言、框架、文件類型都新增 Skill；新增 Skill 前先判斷是否能用既有 Skill + Playbook 解決。 |

---

## Skill / Agent 粒度原則

### 不建議新增 Skill 的情境

| 情境 | 建議放置位置 | 原因 |
|---|---|---|
| 某一種程式語言，例如 C#、Java、JavaScript | `docs/playbooks/tech-stacks/` 或 Skill references | 語言是知識，不是完整工作流程 |
| 某一種框架，例如 ASP.NET WebForms、ASP.NET Core、Spring | `docs/playbooks/tech-stacks/` | 框架慣例會被 Developer Skill 讀取，不需要獨立 Skill |
| 某一種資料庫產品，例如 SQL Server、Oracle | `docs/playbooks/database/` 或 `db-engineering/references/` | DB Skill 應處理 DB 工程流程，產品差異放 reference |
| 某一種文件格式 | `docs/playbooks/documents/` 或 templates | 文件格式不一定需要獨立 Skill |
| 某一個 prompt 變體 | `.gemini/commands/` 或 examples | 若只是固定流程入口，Command 比 Skill 更適合 |
| 某個工具使用方式 | MCP README 或 `docs/playbooks/tools/` | 工具用法不等於專業能力 |

### 建議新增 Skill 的情境

| 情境 | 例子 |
|---|---|
| 有獨立且可重複的工作流程 | `code-reviewer`、`test-engineer`、`release-ops` |
| 有明確品質門檻或 sign-off | `security-reviewer`、`db-engineering` |
| 有不同輸出格式與驗證方式 | `incident-rca`、`release-ops` |
| 有不同安全限制 | `db-engineering`、`security-reviewer` |
| 是高頻日常工程工作 | `developer-implementer`、`test-engineer` |

---

## 建議核心能力版圖

以下是本 repository 後續擴充時建議維持的核心 Agent / Skill / MCP / Reference 對應。此表是設計方向，不代表目前全部已實作。

| SDLC 角色 | Agent 建議位置 | 主要 Skill 建議位置 | 主要 MCP / 工具能力 | Reference / Playbook 建議位置 | 主要產出 |
|---|---|---|---|---|---|
| Workflow Orchestrator | `.gemini/agents/workflow-orchestrator.md` | 可協調多個 Skill，但不直接實作 | workflow-state、file、git | `docs/playbooks/workflow/` | 階段分派、handoff、品質 gate 檢查 |
| SA Consultant | `.gemini/agents/sa-agent.md` | `.gemini/skills/sa-consultant/SKILL.md` | redmine、file、flowchart、devDocs | `docs/playbooks/requirements/` | 需求釐清、SA 規格、影響分析、方案比較 |
| Software Developer | `.gemini/agents/developer-agent.md` | `.gemini/skills/developer-implementer/SKILL.md` | file、git、test-runner、static-analysis | `docs/playbooks/tech-stacks/` | 程式修改、bug fix、重構、變更摘要 |
| Database Engineer | `.gemini/agents/db-agent.md` | `.gemini/skills/db-engineering/SKILL.md` | db-metadata、file、git | `docs/playbooks/database/` | DB schema、SQL、migration、資料正確性分析 |
| Test Engineer | `.gemini/agents/test-agent.md` | `.gemini/skills/test-engineer/SKILL.md` | test-runner、file、git | `docs/playbooks/testing/` | 測試案例、Edge Case、測試執行報告 |
| Code Reviewer | `.gemini/agents/review-agent.md` | `.gemini/skills/code-reviewer/SKILL.md` | git、static-analysis、file | `docs/playbooks/review/` | blocking / non-blocking review、設計品質檢查 |
| Security Reviewer | `.gemini/agents/security-agent.md` | `.gemini/skills/security-reviewer/SKILL.md` | static-analysis、secret-scan、dependency、file | `docs/playbooks/security/` | secrets、權限、注入、依賴風險檢查 |
| Release Engineer | `.gemini/agents/release-agent.md` | `.gemini/skills/release-ops/SKILL.md` | git、ci、deployment-check、file | `docs/playbooks/release/` | 部署步驟、回滾方式、release note、維運交接 |
| Incident Engineer | `.gemini/agents/incident-agent.md` | `.gemini/skills/incident-rca/SKILL.md` | log-analyzer、file、redmine、git | `docs/playbooks/incident/` | RCA、暫時處置、長期改善方案 |

---

## SDLC Pipeline

本 repository 最終目標是讓 Gemini CLI 能輔助完整軟體開發生命週期。以下 pipeline 是建議的正式流程設計，後續可透過 `.gemini/agents/` 與 `.gemini/commands/` 逐步實作。

| 階段 | 主責 Agent | 主要 Skill | 主要 MCP / 工具能力 | 輸入 | 輸出 / Gate |
|---|---|---|---|---|---|
| 1. 需求輸入 | Workflow Orchestrator | 視需要使用 `sa-consultant` | redmine、file | 使用者需求、Redmine、問題描述、現有文件 | 任務摘要、目標、限制、是否需要 SA 分析 |
| 2. 需求釐清 / SA 分析 | SA Agent | `sa-consultant` | redmine、file、flowchart | 需求摘要、問題背景、限制條件 | SA 規格、In Scope、Out of Scope、Assumptions、Open Questions |
| 3. DB / Data 影響分析 | DB Agent | `db-engineering` | db-metadata、file | SA 規格、資料表、SQL、資料流 | DB 影響分析、Table / Column / Index / SQL / migration 初步評估 |
| 4. 技術方案與開發計畫 | SA Agent + Developer Agent + DB Agent | `sa-consultant`、`developer-implementer`、`db-engineering` | file、git、db-metadata | SA 規格、DB 影響分析、現有程式碼 | 實作計畫、預計異動檔案、DB 變更計畫、風險與驗證方式 |
| 5. 程式開發 | Developer Agent | `developer-implementer` | file、git | 已確認的實作計畫 | 程式變更、變更摘要、自測方式 |
| 6. DB 變更實作 | DB Agent 或 Developer Agent | `db-engineering` | db-metadata、file、git | DB 變更計畫、schema、SQL | SQL script、migration plan、資料驗證方式、回滾 SQL |
| 7. 測試設計 | Test Agent | `test-engineer` | file、test-runner | SA 規格、實作摘要、DB 變更摘要 | 測試案例、Edge Case、測試資料需求 |
| 8. 測試執行 | Test Agent | `test-engineer` | test-runner、file | 測試案例、程式變更 | 測試結果、失敗清單、回交 Developer / DB Agent 的問題 |
| 9. Code Review | Review Agent | `code-reviewer` | git、static-analysis、file | git diff、變更摘要、測試結果 | blocking / non-blocking issues、可維護性與 design pattern 檢查 |
| 10. DB Review | DB Agent | `db-engineering` | db-metadata、static-analysis、file | SQL / migration、DB 變更摘要 | SQL 效能、交易安全、資料正確性、回滾可行性檢查 |
| 11. Security Review | Security Agent | `security-reviewer` | secret-scan、static-analysis、dependency、file | 程式 diff、設定檔、DB 變更、API 變更 | secrets、注入、權限、依賴弱點、安全風險結論 |
| 12. Release / Rollback Planning | Release Agent | `release-ops` | git、ci、deployment-check、file | 已通過 review 的變更、測試報告 | 部署步驟、部署後驗證、回滾方式、release note |
| 13. UAT / 驗收支援 | SA Agent + Test Agent | `sa-consultant`、`test-engineer` | file、redmine | UAT 情境、驗收標準 | UAT checklist、使用者溝通說明、驗收結果整理 |
| 14. 維運交接 | Release Agent | `release-ops` | file、log-analyzer | Release 文件、部署結果 | Runbook、監控點、常見問題、排查步驟 |
| 15. Incident / RCA | Incident Agent | `incident-rca` | log-analyzer、redmine、file、git | 正式區異常、Log、使用者回報 | RCA、暫時處置、長期改善、後續追蹤事項 |

### Pipeline Gate 原則

| Gate | 進入下一階段前必須確認 |
|---|---|
| SA → Development | 需求範圍、Out of Scope、Acceptance Criteria、主要風險已清楚 |
| SA / DB → Development | 若涉及資料表、SQL、migration，DB 影響分析已完成 |
| Development → Test | 程式變更完成，且有變更摘要與自測方式 |
| DB Change → Test | DB script、migration、資料驗證方式與回滾方式已準備 |
| Test → Review | 測試通過，或失敗項目已明確記錄並回交修正 |
| Code Review → Security | 無 blocking code review issue |
| DB Review → Security | 無高風險資料正確性、交易或回滾問題 |
| Security → Release | 無高風險 secrets、注入、權限或依賴弱點 |
| Release → UAT | 部署步驟、部署後驗證與回滾方式完整 |
| UAT → Handover | 驗收結果、使用者溝通事項與維運注意事項已整理 |

---

## 目前功能

### MCP Servers

MCP Server 用來提供 Gemini CLI 可呼叫的工具能力。MCP Server 的實際註冊設定集中在 `.gemini/settings.json`。

| MCP Server | 路徑 | 狀態 | 用途 |
|---|---|---|---|
| Redmine MCP | `packages/redmine-mcp` | 已建立 | 查詢 Redmine 議題 |
| File MCP | `packages/file-mcp` | 已建立 | 本機檔案與資料夾操作 |
| Dev Docs MCP | `packages/dev-doc-mcp` | 已建立 | 產生需求文件、Runbook、DB Schema 文件內容 |
| Flowchart MCP | `packages/flowchart-mcp` | 已建立 | 產生流程圖或 Mermaid 內容 |

進入 Gemini CLI 後，可以使用以下指令確認目前已載入的 MCP Server 與 tools：

```text
/mcp
```

若調整 `.gemini/settings.json` 後需要重新載入 MCP Server，可使用：

```text
/mcp reload
```

### Workspace Skills

Workspace Skill 用來定義 Gemini 在特定工作情境下可套用的專業能力、工作流程、輸出格式與限制。

正式 Workspace Skills 應放在：

```text
.gemini/skills/<skill-name>/SKILL.md
```

目前已建立：

| Skill | 路徑 | 狀態 | 用途 |
|---|---|---|---|
| SA Consultant | `.gemini/skills/sa-consultant/SKILL.md` | 已建立 | SA 顧問、需求分析、技術規格、系統影響分析與回滾規劃 |

修改或新增 Workspace Skill 後，請在 Gemini CLI 中執行：

```text
/skills reload
/skills list
```

確認新的 Skill 是否已被 Gemini CLI discovery。

> 注意：`skills/_template/` 只作為開發者建立新 Skill 時的範例模板，不是正式 Workspace Skill。

### Agents

Agent 用來定義 SDLC 中的工作角色，例如 SA、Developer、DB Engineer、Tester、Code Reviewer、Security Reviewer、Release Engineer。

目前本 repository 尚未建立正式 Agent。後續若要啟用多 Agent 協作，建議放在：

```text
.gemini/agents/
```

新增或修改 Agent 後，請在 Gemini CLI 中執行：

```text
/agents reload
/agents list
```

---

## 快速開始

以下步驟適合第一次 clone 本 repository 的開發者，用來完成安裝、環境變數設定、Gemini CLI 啟動、MCP Server 驗證，以及 `GEMINI.md` / Workspace Skills 載入確認。

### 1. Clone repository

```bash
git clone https://github.com/GurumiTs/skills-hub.git
cd skills-hub
```

### 2. 安裝 dependencies

```bash
npm install
```

### 3. 建立環境變數檔案

本專案建議將 Gemini CLI 與 MCP Server 需要的環境變數集中放在 `.gemini/.env`。

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
| `GEMINI_API_KEY` | Gemini CLI API Key，建議由系統環境變數提供 |
| `REDMINE_URL` | Redmine 網址 |
| `REDMINE_API_KEY` | Redmine API Key |
| `FILE_MCP_ROOTS` | file-mcp 允許讀寫的根目錄 |
| `MSSQL_CONN` | dev-doc-mcp 查詢 DB metadata 使用的連線字串 |

請不要將真實 API Key、Password、Token、Cookie 或 Connection String commit 到 GitHub。

### 4. 檢查 Gemini CLI 專案設定

Gemini CLI 的專案設定放在：

```text
.gemini/settings.json
```

此檔案主要用來註冊 MCP Server runtime 設定。

### 5. 測試 MCP Server 是否能單獨啟動

可依需求分別測試目前已提供的 MCP Server：

```bash
npm run dev:redmine
npm run dev:file
npm run dev:devdocs
```

如果 repository 中已建立 Flowchart MCP 的啟動 script，也可以執行：

```bash
npm run dev:flowchart
```

若上述指令失敗，請先檢查：

* root `package.json` 的 `scripts` 是否存在對應項目
* MCP Server package 路徑是否正確
* `.gemini/.env` 是否已填入必要環境變數
* Node.js / npm 版本是否符合專案需求
* MCP Server 是否有缺少 dependencies

### 6. 使用 MCP Inspector 測試工具

可使用 MCP Inspector 測試單一 MCP Server 的 tools 是否能正常啟動與回應。

例如測試 `dev-doc-mcp`：

```bash
npx @modelcontextprotocol/inspector -- node ./packages/dev-doc-mcp/index.js
```

其他 MCP Server 可依照實際 package 路徑替換：

```bash
npx @modelcontextprotocol/inspector -- node ./packages/<mcp-package>/index.js
```

### 7. 啟動 Gemini CLI

可直接使用 `npx` 啟動：

```bash
npx @google/gemini-cli
```

或先全域安裝：

```bash
npm install -g @google/gemini-cli
gemini
```

第一次進入 Gemini CLI 後，建議將此 repository 所在資料夾設為 trusted workspace：

```text
/permissions trust
```

### 8. 確認 MCP Server 是否載入

進入 Gemini CLI 後執行：

```text
/mcp
```

若有調整 MCP 設定，可執行：

```text
/mcp reload
```

### 9. 確認 Workspace Skills 是否載入

正式 Workspace Skills 放在：

```text
.gemini/skills/
```

進入 Gemini CLI 後執行：

```text
/skills reload
/skills list
```

確認 `sa-consultant` 是否出現在 skills 清單中。

### 10. 確認 GEMINI.md 是否載入

修改 `GEMINI.md` 後，請在 Gemini CLI 中執行：

```text
/memory refresh
/memory show
```

確認 Gemini CLI 是否已載入最新共通規則。

### 11. 開始使用

啟動完成後，可以直接在 Gemini CLI 中提出開發輔助需求，例如：

```text
請分析目前專案的登入流程與相關檔案。
```

```text
請根據這段錯誤 Log 判斷可能原因，並列出檢查步驟。
```

```text
請根據目前需求整理一份 SA 技術規格文件。
```

```text
請查詢 Redmine issue #1234，整理需求背景、待確認問題與開發影響。
```

```text
請根據這個資料表結構產生 DB Schema 文件。
```

```text
請把這段流程整理成 Mermaid flowchart。
```

若要讓 Gemini 協助其他專案，請在 Gemini CLI 中切換到目標專案目錄，或使用 `/directory add <path>` 將目標專案加入 workspace。

---

## 新增 Workspace Skill

Gemini CLI 會 discovery 的正式 Workspace Skill 應放在：

```text
.gemini/skills/<skill-name>/SKILL.md
```

### 1. 複製模板

Linux / macOS：

```bash
mkdir -p .gemini/skills/<new-skill>
cp skills/_template/SKILL.md .gemini/skills/<new-skill>/SKILL.md
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force -Path ".gemini\skills\<new-skill>"
Copy-Item skills\_template\SKILL.md .gemini\skills\<new-skill>\SKILL.md
```

### 2. 修改 Skill frontmatter

`SKILL.md` 第一行必須是 YAML frontmatter，並至少包含：

```md
---
name: <new-skill>
description: Use when ...
---
```

`description` 是 Gemini CLI 判斷是否要啟用 Skill 的重要依據，請避免寫得過度寬泛。

### 3. 修改 Skill 內容

Skill 應定義「能力、使用時機、工作流程、輸出格式與限制」，不應取代 Agent 的主要身份。

建議至少包含：

* 能力定位
* 能力範圍
* 使用邊界
* Skill 目的
* 使用時機
* 不使用時機
* 可搭配的工具能力
* 預期輸入與輸出
* 工作流程
* 檔案輸出規則
* 安全限制
* 輸出格式
* 範例 Prompt

### 4. 重新載入 Skills

進入 Gemini CLI 後執行：

```text
/skills reload
/skills list
```

確認新的 Skill 是否已被 discovery。

> 注意：不要再透過 `skills/_index.md` 註冊 Skill。`skills/_index.md` 已不作為 Gemini CLI 的 Skill registry。

---

## 新增 Agent

Agent 用來定義工作角色，例如 SA、Developer、DB Engineer、Tester、Code Reviewer、Security Reviewer、Release Engineer。

建議放在：

```text
.gemini/agents/
```

Agent 應定義：

* 角色定位
* 責任範圍
* 不負責事項
* 可使用的工具或 MCP Server 範圍
* 何時需要 handoff 給其他 Agent
* 何時需要回報使用者確認
* 是否允許提出檔案變更提案

新增或修改 Agent 後，進入 Gemini CLI 執行：

```text
/agents reload
/agents list
```

---

## 新增 MCP Server

MCP Server 放在 `packages/` 底下，用來提供 Gemini CLI 可呼叫的工具能力。

新增 MCP Server 時，建議同時確認以下內容：

* MCP Server package 是否建立完成
* root `package.json` 是否加入對應啟動 script
* `.gemini/settings.json` 是否註冊 MCP Server
* `.gemini/.env.example` 是否補上必要環境變數範例
* README 是否更新功能表與啟動方式
* MCP Server 是否能透過 Gemini CLI `/mcp` 正常載入

### 1. 建立 package 目錄

建議命名：

```text
packages/<new-name>-mcp
```

例如：

* `packages/jira-mcp`
* `packages/db-mcp`
* `packages/api-test-mcp`

### 2. 建立基本檔案

通常至少需要：

* `packages/<new-name>-mcp/package.json`
* `packages/<new-name>-mcp/index.js`

### 3. 在 root `package.json` 加入 script

例如：

```json
{
  "scripts": {
    "dev:<name>": "node packages/<new-name>-mcp/index.js"
  }
}
```

### 4. 在 `.gemini/settings.json` 註冊 MCP Server

在 `mcpServers` 底下加入新的 server 設定。

請避免將真實 API Key、Token、Password、Connection String 或其他機密資訊直接寫入 `.gemini/settings.json`。

### 5. 驗證 MCP Server

可先用 npm script 單獨啟動：

```bash
npm run dev:<name>
```

也可以使用 MCP Inspector 測試：

```bash
npx @modelcontextprotocol/inspector -- node ./packages/<new-name>-mcp/index.js
```

啟動 Gemini CLI 後執行：

```text
/mcp
```

---

## 文件產出規則

若 Gemini 是在協助維護本 `skills-hub` repository，對話產生的 Markdown 文件預設應放在：

```text
docs/_generated/
```

若 Gemini 是協助其他目標專案，例如透過目前工作目錄或 `/directory add` 指向某個業務系統專案，文件應優先依照該目標專案的文件結構與使用者指定路徑產出。

本 repository 中的 `docs/_generated/` 主要用於存放與 `skills-hub` 本身相關的草稿、分析紀錄或臨時規格，預設不建議 commit 到 GitHub。

常見目錄：

| 類型 | 建議輸出位置 |
|---|---|
| SA 技術規格 | `docs/_generated/sa-specs/` |
| 一般開發文件 | `docs/_generated/dev-docs/` |
| DB 文件 | `docs/_generated/db/` |
| 需求文件 | `docs/_generated/requirements/` |
| 流程圖文件 | `docs/_generated/flowchart/` |
| Workflow handoff | `docs/_generated/workflows/` |

如果某份文件未來要成為正式文件，建議先人工檢查內容，再移到正式文件目錄並 commit。

---

## 變更管制原則

本 repository 的根目錄 `GEMINI.md` 定義了 Gemini CLI 執行任務時的共通規則與變更管制原則。

凡是涉及建立、修改、刪除或搬移實體檔案的操作，Gemini 應先提出變更提案，等使用者明確同意後，才能實際套用。

此規則適用於：

* 本 `skills-hub` repository
* 使用者目前所在的工作目錄
* 使用者透過 `/directory add` 加入的目標專案
* 使用者明確指定要分析或修改的專案
* 任何透過 MCP Server、CLI 指令或檔案工具可能造成異動的檔案或外部系統資料

變更提案應包含：

* 風險評估
* 預計修改檔案
* 修改摘要
* 驗證方式
* 回滾方式

---

## 安全注意事項

使用本專案時，請注意：

* 不要 commit `.gemini/.env`
* 不要 commit API Key、Password、Token、Cookie、Connection String、私人憑證或公司內部敏感資訊
* `.gemini/.env.example` 只能放 placeholder，不可放真實機密
* 使用 file-mcp 時，建議限制 `FILE_MCP_ROOTS`，避免 Gemini 讀寫到不相關或敏感目錄
* 寫入檔案前應確認目標路徑是否應被 Git 追蹤
* 對話生成文件應優先放在 `_generated`、`drafts`、`temp` 或使用者指定的草稿目錄
* 若 repository 內含公司內部資訊，請確認 repository visibility 與權限設定
* 涉及正式環境、資料庫異動、部署、權限、資安或批次作業時，應先評估風險與回滾方式

若不小心將機密資訊 commit 到 GitHub，應立即移除該機密、重新產生新的 key / token，並視情況清理 Git history。

---

## 常用指令

### npm

```bash
npm install
npm run dev:redmine
npm run dev:file
npm run dev:devdocs
```

若有建立 Flowchart MCP 啟動 script：

```bash
npm run dev:flowchart
```

### Gemini CLI

```text
/mcp
/mcp reload
/skills reload
/skills list
/agents reload
/agents list
/memory refresh
/memory show
/permissions trust
/directory add <path>
/directory show
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector -- node ./packages/dev-doc-mcp/index.js
```

---

## 相關文件

* `docs/gemini-setup.md`：Gemini CLI 連線與設定說明
* `.gemini/settings.json`：MCP Server runtime 註冊設定
* `.gemini/.env.example`：環境變數範例，不包含真實機密
* `GEMINI.md`：Gemini CLI 專案層共通規則
* `.gemini/skills/`：正式 Workspace Skills
* `.gemini/agents/`：正式 Agents，後續擴充用
* `.gemini/commands/`：Workflow commands，後續擴充用
* `skills/_template/`：建立新 Skill 時可複製的模板
* `docs/playbooks/`：技術棧、資料庫、測試、維運等參考規則，後續擴充用

---

## Roadmap

後續可視需求擴充以下方向。

### MCP Server

* Git 操作輔助 MCP
* DB Metadata MCP
* Test Runner MCP
* Static Analysis MCP
* Secret Scan MCP
* Dependency / Vulnerability MCP
* API 測試 MCP
* CI / Pipeline MCP
* Log Analyzer MCP
* Jira / GitHub Issues MCP

### Workspace Skills

* Developer Implementer Skill
* DB Engineering Skill
* Test Engineer Skill
* Code Review Skill
* Security Review Skill
* Release / Ops Skill
* Incident / RCA Skill

### Agents

* Workflow Orchestrator Agent
* SA Consultant Agent
* Developer Agent
* DB Engineer Agent
* Test Engineer Agent
* Code Reviewer Agent
* Security Reviewer Agent
* Release Engineer Agent
* Incident Engineer Agent

### Reference / Playbook

* C# / ASP.NET WebForms Playbook
* ASP.NET Core Playbook
* Java / Spring Playbook
* JavaScript / jQuery Playbook
* SQL Server Playbook
* Oracle Playbook
* Legacy System Maintenance Playbook
* DB Migration Playbook
* Testing Strategy Playbook
* Release / Rollback Playbook

### 文件與維護流程

* 自動化文件輸出流程
* 專案初始化腳本
* Skill 建立檢查清單
* Agent 建立檢查清單
* MCP Server 建立檢查清單
* README / GEMINI.md / `.gemini/skills` 一致性檢查

---

## Copyright and Disclaimer / 著作權與免責聲明

### 中文

Copyright © 2026 GurumiTs. All rights reserved.

除非本 repository 另有提供 `LICENSE` 檔案或取得作者書面授權，否則本專案之程式碼、文件、設定範本與相關內容均保留所有權利。未經授權，不得任意複製、散布、修改、再授權或用於商業用途。

本專案以「現狀」提供，作者不保證其完整性、正確性、適用性、安全性或可用性。使用者應自行評估使用風險，並自行負責 API Key、連線字串、內部資料、公司機密與系統權限之保護。因使用或修改本專案所造成的任何直接或間接損失，作者不承擔責任。

若本專案後續加入正式開源授權，請以 repository 根目錄中的 `LICENSE` 檔案為準。

### English

Copyright © 2026 GurumiTs. All rights reserved.

Unless a `LICENSE` file is provided in this repository or written permission is granted by the author, all source code, documentation, configuration templates, and related materials in this project are protected by copyright. No permission is granted to copy, distribute, modify, sublicense, or use this project for commercial purposes without authorization.

This project is provided “as is”, without warranty of any kind, including but not limited to correctness, completeness, fitness for a particular purpose, security, or availability. Users are responsible for evaluating their own risks and for protecting API keys, connection strings, internal data, company confidential information, and system permissions. The author shall not be liable for any direct or indirect damages arising from the use or modification of this project.

If an official open-source license is added later, the `LICENSE` file in the repository root shall take precedence.
