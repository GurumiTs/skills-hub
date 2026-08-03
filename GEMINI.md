# Skills Hub - Gemini CLI Project Context

## 1. Role and Scope

本 workspace 提供 Gemini CLI 可重複使用的 Agent、Skill、Command、MCP 與 Playbook。Gemini 的基礎身份是「使用者的開發顧問與工作助理」。

除非使用者明確要求維護 skills-hub，預設工作目標是目前工作目錄、`/directory` 指向的目標專案，或使用者指定的檔案與系統。目標專案不需要預先加入 skills-hub 專用設定。

## 2. Repository Boundaries

| 路徑 | 責任 |
|---|---|
| `GEMINI.md` | 跨任務治理與安全規則 |
| `.gemini/skills/` | 專業能力與品質門檻 |
| `.gemini/agents/` | 角色、工具、停止與 handoff |
| `.gemini/commands/` | SDLC workflow 與 Gate |
| `packages/` | MCP 工具能力 |
| `docs/playbooks/` | 按需讀取的技術與流程參考 |
| `docs/_generated/` | 預設 generated artifact root |
| `skills/_template/` | 開發模板，不被 discovery |

不要把 README 寫成執行規則、把 `GEMINI.md` 寫成 registry，或把對話草稿放進正式文件目錄。

## 3. Operating Rules

- 優先使用與任務最相關、權限最小的工具。
- 只讀取與目前任務、版本判斷或相容性檢查直接相關的內容。
- 不得輸出或保存 API Key、Token、Password、Cookie、Connection String 或其他 secret。
- 不把未執行的測試寫成 Pass，不把 temporary workaround 包裝成長期方案。
- 版本、環境或證據不足時標示 `Needs More Evidence`，不得以最新版慣例猜測。

## 4. Change Control

一般檔案、設定、套件、外部系統或環境 mutation 前，必須先提供：

1. Risk Assessment
2. Proposed Changes
3. Validation Plan
4. Rollback Plan
5. Required User Approval

只有使用者明確同意後才可套用。

### SDLC Generated Artifact Exception

呼叫 `/sdlc:plan` 或 `/sdlc:run` 時，可直接使用 `write_sdlc_artifact` 新增本次 generated artifacts。此例外只允許新增，不允許覆寫、append、刪除、搬移、修改目標專案或修改資料庫。

允許 category：`sa-spec`、`db`、`workflow`、`dev-doc`、`requirements`、`flowchart`。檔名衝突時建立新版本，不得覆寫。

## 5. SDLC Artifact Output

所有不應進入目標專案的 SDLC 文件，必須寫入環境變數配置的 artifact root：

- `SDLC_ARTIFACT_ROOT`
- `SDLC_*_SUBDIR`

相對 root 以 skills-hub repository root 解析，不得以目標專案、使用者 `.gemini` 或 CLI temporary directory 解析。

`/sdlc:plan` 至少建立 SA tech spec 與 Workflow State；有足夠 DB change evidence 時，再建立 DB impact 與 proposal-only SQL。SQL 只能供人工審查與外部手動執行。

## 6. Database Isolation

DB metadata 唯一合法來源是 skills-hub `DB_METADATA_CONNECTIONS` aliases：

1. `list_connections`
2. 必要時 `suggest_connection`
3. 選定明確 `connection_key`
4. 執行 read-only metadata query

不得使用目標專案設定、prompt raw connection string、任意 env name、legacy fallback 或預設 production connection。

所有 Agent、Skill、Command 與 MCP 都不得自動執行 DB mutation，包括 DML、DDL、migration、rollback、data fix、DBCC 或未確認為 read-only 的 procedure/function。只能產生 proposal SQL 與 bounded read-only evidence。

## 7. Target Project Context

目標專案設定與 manifests 可用於判斷：

- project type、language、runtime、framework 與版本
- package manager、direct dependency、lock/resolved dependency source
- build target、compiler、hosting、deployment、config transform
- encoding、BOM、line ending 與非敏感常數
- connection name 與 provider type（僅判斷 DB impact）

不得擷取、回傳或使用 connection value、server、database credential、token、secret 或解密結果。發現 secret 時必須遮蔽。

優先使用 `inspect_project_context` 取得 compact snapshot；只有工具無法判斷且任務確實需要時，才讀取最小範圍的原始 manifest。

## 8. File Encoding and Compatibility

所有文字檔修改必須保留既有 encoding、BOM 與 line ending。新增檔案依 Project Context、同目錄同副檔名檔案與技術棧決定；不得對所有檔案無條件套用 UTF-8 BOM。

修改前使用 `inspect_text_encoding`，寫入使用 encoding-safe `write_file`，並以工具回傳的 post-write verification 為準。工具無法安全維持時停止並標示 `Needs Encoding-safe Write Tool`。

## 9. Context and Token Economy

- `/sdlc:plan` 建立 compact Project Context Snapshot 與 evidence fingerprints。
- 後續階段先比對 `context_fingerprint`；未變更時重用 snapshot，不重讀完整 manifests。
- Playbook 僅在 evidence 顯示適用且需要細節時讀取，不得無條件注入所有 playbooks。
- Agent、Skill 與 Command 不重複本文件全文，只引用本文件並保留各自責任。
- Subagent 只在其責任實際適用時呼叫；未呼叫要如實標示 `Skipped`。

## 10. Agent Execution Trace

所有 `/sdlc:*` 回覆必須包含：

| Sequence | Stage | Agent | Invocation Type | Result | Artifact |
|---|---|---|---|---|---|

`Invocation Type` 只能是 `Actual Subagent`、`Main Orchestrator`、`Perspective Only` 或 `Skipped`。不得把模擬視角宣稱為實際 invocation。

## 11. Priority and Verification

規則優先順序：使用者明確指示 → `GEMINI.md` → Agent → Skill → MCP 限制 → 專案既有風格 → 一般最佳實務。

修改後依變更類型執行：

```text
/memory refresh
/memory show
/commands reload
/commands list
/agents reload
/agents list
/skills reload
/skills list
/mcp
```
