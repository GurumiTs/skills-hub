# skills-hub - Gemini CLI Skills & MCP Hub

`skills-hub` 是一個給 Gemini CLI 使用的開發輔助能力中心，用來集中管理日常開發、系統分析、文件整理與內部工具整合所需的 Workspace Skills、MCP Server、Agents、Commands 與共通工作規範。

這個 repository 本身不是業務系統專案，而是讓開發者在啟動 Gemini CLI 後，可以更穩定地把 Gemini 當成「使用者的開發顧問與工作助理」使用。

---

## 專案目的

本專案的目標是讓工程師或技術人員可以在 Gemini CLI 中快速取得一組可重複使用的開發輔助能力，協助處理：

- 需求釐清與 SA 技術規格整理
- 程式碼分析、實作規劃與受控修改
- DB / Data Impact Analysis
- 測試規劃、Dry Run 與測試證據整理
- Code Review、Security Review 與 Release / Rollback 規劃
- Redmine、檔案、Git、DB metadata、測試、靜態分析與 secret scan 等工具整合

本 repo 的重點不是取代工程師判斷，而是把常見的開發、維運與交付流程標準化，讓 Gemini CLI 在不同專案中維持一致的工作方式與安全邊界。

---

## 核心構成

| 類型 | 路徑 | 用途 |
|---|---|---|
| MCP Server | `packages/` | 提供 Gemini CLI 可呼叫的工具能力 |
| Workspace Skills | `.gemini/skills/` | 定義可重複使用的專業能力與輸出品質門檻 |
| Agents | `.gemini/agents/` | 定義 SDLC 中的角色、責任邊界與 handoff 規則 |
| Commands | `.gemini/commands/` | 提供 `/sdlc:*` 這類可重複執行的 workflow 入口 |
| Playbooks | `docs/playbooks/` | 放技術棧、資料庫、測試、流程與公司慣例等參考規則 |
| Common Rules | `GEMINI.md` | Gemini CLI 進入此 workspace 後應遵守的共通治理規則 |
| Setup Guide | `docs/gemini-setup.md` | 給開發人員快速啟用本專案的說明 |
| Generated Docs | `docs/_generated/` | Gemini 對話產生的草稿、分析紀錄或臨時文件，預設不進 Git |

---

## 目前提供的能力

### MCP Servers

目前 `.gemini/settings.json` 已註冊以下 MCP servers：

| Server | Package | 用途 |
|---|---|---|
| `redmine` | `packages/redmine-mcp` | 查詢 Redmine 議題與需求背景 |
| `localFiles` | `packages/file-mcp` | 本機檔案與資料夾操作 |
| `devDocs` | `packages/dev-doc-mcp` | 產生需求文件、Runbook、DB Schema 等文件內容 |
| `flowchart` | `packages/flowchart-mcp` | 產生 Mermaid / flowchart 內容 |
| `git` | `packages/git-mcp` | git 狀態、diff、變更摘要與版本脈絡 |
| `dbMetadata` | `packages/db-metadata-mcp` | DB metadata / schema 查詢 |
| `testRunner` | `packages/test-runner-mcp` | 受控測試執行 |
| `staticAnalysis` | `packages/static-analysis-mcp` | 靜態分析命令包裝 |
| `secretScan` | `packages/secret-scan-mcp` | secret / credential 掃描 |

### Workspace Skills

目前 `.gemini/skills/` 已包含：

- `sa-consultant`
- `developer-implementer`
- `db-engineering`
- `test-engineer`
- `code-reviewer`
- `security-reviewer`
- `release-ops`
- `incident-rca`

### Agents

目前 `.gemini/agents/` 已包含 workflow、SA、developer、DB、test、review、security、release、incident 相關 agents，用於區分 SDLC 各階段的責任邊界。

### SDLC Commands

目前 `.gemini/commands/sdlc/` 提供：

| Command | 用途 |
|---|---|
| `/sdlc:plan` | 需求輸入、SA 分析、Project / Version Discovery、DB Impact 與實作計畫 |
| `/sdlc:implement` | 依核准範圍進行受控實作 |
| `/sdlc:test` | 測試規劃、Dry Run、DB-assisted Dry Run 與 Test Report |
| `/sdlc:review` | DB Review、Code Review 與 Security Review |
| `/sdlc:release` | Release package、部署步驟、rollback、UAT 與 handover |
| `/sdlc:run` | 完整 SDLC pipeline 的高階入口 |

---

## 快速開始

給開發人員的啟用方式請參考：

```text
docs/gemini-setup.md
```

一般流程是：

1. 安裝 dependencies。
2. 設定 `.gemini/.env` 或必要環境變數。
3. 啟動 Gemini CLI。
4. 檢查 MCP servers、commands、agents、skills 是否載入。
5. 透過目前工作目錄或 `/directory add <path>` 指向要分析或開發的目標專案。
6. 依需求使用 `/sdlc:plan`、`/sdlc:implement`、`/sdlc:test`、`/sdlc:review`、`/sdlc:release` 或 `/sdlc:run`。

README 只作為入口與總覽，不作為 Gemini CLI 執行規則。實際執行規則以 `GEMINI.md`、`.gemini/commands/`、`.gemini/agents/`、`.gemini/skills/` 與需要時讀取的 playbooks 為準。

---

## Playbooks 定位

`docs/playbooks/` 是給 Gemini CLI 在任務需要時參考的技術與流程資料，不是 Gemini CLI 官方 registry，也不代表 CLI 會自動 routing。

目前主要類型包含：

| 類型 | 路徑 |
|---|---|
| Workflow | `docs/playbooks/workflow/` |
| Tech Stacks | `docs/playbooks/tech-stacks/` |
| Database | `docs/playbooks/database/` |
| Testing | `docs/playbooks/testing/` |
| BI / Semantic Layer | `docs/playbooks/bi/` |

正式 SDLC 流程與 Gate 規則主要參考：

```text
docs/playbooks/workflow/sdlc-pipeline.md
docs/playbooks/workflow/workflow-state.md
```

---

## 維護原則

新增內容時請維持分層：

- 不要把 README 寫成 Gemini 執行規則。
- 不要把 `GEMINI.md` 寫成 MCP / Skill / Agent 註冊表。
- 不要把 `skills/_template/` 放進正式 discovery 路徑。
- 不要為每一種語言、框架或資料庫建立獨立 Skill；優先放到 `docs/playbooks/`。
- 新增 Skill 時，應從 `skills/_template/` 複製並符合模板格式。
- 新增 MCP Server 時，應放在 `packages/` 並遵守 package 模板與 settings 註冊方式。
- 對話產生的草稿、分析紀錄與臨時文件應優先放在 `docs/_generated/`，正式化前需人工確認。

---

## 安全注意事項

使用本專案時，請注意：

- 不要 commit `.gemini/.env`。
- 不要 commit API Key、Password、Token、Cookie、Connection String、私人憑證或公司內部敏感資訊。
- `.gemini/.env.example` 只能放 placeholder，不可放真實機密。
- 使用 file / git / test / static analysis / secret scan 相關 MCP 時，應限制允許操作的 root paths。
- 對正式環境、資料庫異動、部署、權限、資安或批次作業的操作，必須先評估風險與 rollback。
- Gemini 產生的檔案、程式碼或部署步驟都應經人工確認後再套用到重要環境。

---

## 相關文件

| 文件 | 說明 |
|---|---|
| `docs/gemini-setup.md` | 給開發人員快速啟用本 repo 的說明 |
| `GEMINI.md` | Gemini CLI 專案層共通規則 |
| `.gemini/settings.json` | MCP Server runtime 註冊設定 |
| `.gemini/.env.example` | 環境變數範例 |
| `.gemini/commands/` | SDLC workflow commands |
| `.gemini/agents/` | SDLC agents |
| `.gemini/skills/` | Workspace Skills |
| `docs/playbooks/` | 技術棧、資料庫、測試、workflow 等參考規則 |
| `skills/_template/` | 建立新 Skill 時可複製的模板 |

---

## Roadmap

後續可視需求擴充：

- API test MCP
- CI / pipeline MCP
- dependency / vulnerability MCP
- log analyzer MCP
- 更多技術棧與資料庫 playbooks
- Skill / Agent / MCP 建立檢查清單
- README / GEMINI.md / `.gemini/skills` 一致性檢查

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
