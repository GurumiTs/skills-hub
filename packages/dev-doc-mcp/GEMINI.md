# dev-doc-mcp – 需求/維運/DB文件產生器（MCP）

此 skill 提供「一般軟體/網頁開發團隊常用」的文件產生工具，輸入固定 JSON 格式，即可產出 Markdown 文件內容。

> 注意：本 MCP **不會寫入任何檔案**。
> 若要落地成檔案，請用 `file-mcp` 進行 write（依你的規範：write/delete 等高風險操作需先詢問同意）。

---

## 1) Server Alias
在 `.gemini/settings.json` 建議使用：`devDocs`

---

## 2) Environment Variables

### 必要（只有 DB schema 工具會用到）
- `MSSQL_CONN`：SQL Server connection string（建議唯讀帳號）

### 可選
- 你也可以在 tool input 直接傳 `connection_string`，但不建議（避免把 secrets 寫進文件或對話紀錄）。

---

## 3) Tools

### 3.1 `devDocs__generate_requirements_docs`
**目的**：把需求整理成兩份文件
- 對需求者：Stakeholder 版（PRD-lite）
- 對開發者：Developer 版（TDD-lite）

**輸入**：`payload`（object）或 `payload_json`（JSON string）
- 範例：`packages/dev-doc-mcp/examples/feature_input.json`

**輸出**：回傳 JSON（含建議 path 與 markdown content）

---

### 3.2 `devDocs__generate_runbook_docs`
**目的**：整理部署/維運文件
- Runbook（維運手冊）
- Deploy Guide（部署指南）

**輸入範例**：`packages/dev-doc-mcp/examples/runbook_input.json`

---

### 3.3 `devDocs__generate_mssql_schema_docs`
**目的**：從 MsSQL metadata 產出
- DB Dictionary (`.md`)
- ER Diagram (`.mmd` / Mermaid)
- Schema Snapshot (`.json`)

**輸入範例**：`packages/dev-doc-mcp/examples/dbdoc_input.json`

> 安全建議：只讀 metadata，不查資料列；使用唯讀帳號；不要把連線字串硬寫進 repo。

---

### 3.4 `devDocs__scaffold_examples`（便利工具）
**目的**：把 examples 複製到 `docs/_examples`，方便在你的實際專案中改。

---

## 4) 使用流程（推薦）

### Step A：把需求/issue 內容整理成固定 JSON
你可以直接手動填 JSON，或先讓 Gemini 幫你把需求文字「收斂」成 JSON 格式（再呼叫 tool）。

### Step B：呼叫 dev-doc-mcp 產出文件內容
（先檢視輸出內容是否符合你的需求）

### Step C：需要寫檔時，再呼叫 file-mcp
⚠️ 依你的規範：任何 write/delete 都要先提案、等你同意。

---

## 5) Copy/Paste 範例

### 5.1 產生需求文件（兩份）
1) 先讀入範例 JSON 參考：
- `packages/dev-doc-mcp/examples/feature_input.json`

2) 呼叫：
- `devDocs__generate_requirements_docs(payload=<object>)`

3) 取得輸出後，再用 `file-mcp` 寫入：
- `docs/requirements/<id>_<slug>_stakeholder.md`
- `docs/requirements/<id>_<slug>_developer.md`

---

### 5.2 產生 Runbook / Deploy Guide
- `devDocs__generate_runbook_docs(payload=<object>)`

---

### 5.3 產生 MsSQL Schema 文件
- 先設定 `MSSQL_CONN`
- 再呼叫：`devDocs__generate_mssql_schema_docs(payload=<object>)`

如果你只想先看「會用哪些 SQL 查 metadata」：
- `devDocs__generate_mssql_schema_docs(payload=<object>, dry_run=true)`
