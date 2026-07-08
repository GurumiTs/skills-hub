# Scenario Validation Execution Notes

此文件定義如何在 Gemini CLI 中執行 `docs/playbooks/testing/sdlc-dry-run-scenarios.md` 的手動驗證。

這不是 Gemini CLI 官方測試框架，也不是自動化 pipeline engine。它是本 repo 的驗證操作說明，用來協助維護者確認 `/sdlc:*` commands、agents、skills 與 playbooks 的 prompt 行為是否一致。

## Purpose

使用本文件確認：

- Gemini CLI 是否能載入最新 commands / agents / skills。
- `/sdlc:*` 是否正確讀取 workflow playbooks。
- Playbook selection 是否符合 `sdlc-pipeline.md` 的 selection matrix。
- Version Context 是否從嚴。
- Dry Run 是否不被標示為 Pass。
- DB Platform 與 DB Hosting 是否分離。
- Missing evidence 是否正確停在 `Needs More Evidence`。
- Mutation 是否停在 approval / Change Proposal 前。

## Preconditions

驗證前應確認：

| Item | Required |
|---|---|
| Branch | 使用目前待驗證分支，例如 `feature/sdlc_pipeline_prompt_refine_20260707` |
| Gemini CLI Workspace | 位於本 `skills-hub` repository root |
| Commands Reloaded | `/commands reload` |
| Agents Reloaded | `/agents reload` |
| Skills Reloaded | `/skills reload` |
| MCP Status Checked | `/mcp`，只確認可用工具，不因工具不存在而假裝成功 |
| External Project Context | 若 scenario 需要外部專案，先使用 `/directory` 指向或提供必要檔案片段 |

## Reload and Discovery Steps

在 Gemini CLI 中先執行：

```text
/commands reload
/commands list
/agents reload
/agents list
/skills reload
/skills list
/mcp
```

應確認至少能看到：

| Type | Expected |
|---|---|
| Commands | `/sdlc:plan`、`/sdlc:implement`、`/sdlc:test`、`/sdlc:review`、`/sdlc:release`、`/sdlc:run` |
| Skills | `sa-consultant`、`developer-implementer`、`db-engineering`、`test-engineer`、`code-reviewer`、`security-reviewer`、`release-ops`、`incident-rca` |
| Agents | workflow / SA / developer / DB / test / review / security / release / incident agents |
| MCP | 依 `.gemini/settings.json` 實際可用工具為準 |

若 reload / list 結果不符合預期，先停止 scenario validation，回修 `.gemini/commands`、`.gemini/agents`、`.gemini/skills` 或 settings。

## Execution Order

建議依以下順序執行：

1. Scenario 6: Prompt Change for Skill / Command。
2. Scenario 7: Missing Version Context Blocking。
3. Scenario 8: DB Platform / Hosting Separation。
4. Scenario 1: WebForms + MSSQL Change。
5. Scenario 2: Python + BigQuery Job。
6. Scenario 3: LookML + BigQuery Upstream。
7. Scenario 4: PowerShell Deployment Helper。
8. Scenario 5: Java + Oracle Stored Procedure。

原因：先驗證 prompt boundary、blocking rule、DB platform 分離，再驗證複合技術棧情境。

## Per-scenario Execution Steps

每個 scenario 用同一套流程：

1. 從 `docs/playbooks/testing/sdlc-dry-run-scenarios.md` 複製 Scenario Prompt。
2. 在 Gemini CLI 執行 prompt。
3. 不要補額外資訊，除非 scenario 明確要求。
4. 保存輸出到臨時驗證紀錄。若需要寫檔，應放在 `docs/_generated/workflows/<validation-id>/`，不要放入正式 playbook 目錄。
5. 使用本文件的 validation checklist 檢查輸出。
6. 若不符合，記錄 Observed Issue 與 Suggested Fix Target。

## Required Output Checks

每個 scenario 都必須檢查以下欄位：

| Check | Required Evidence |
|---|---|
| Project / Version Context | 是否列出 project type、runtime / framework、language、dependency、DB platform、DB hosting、version risk |
| Playbooks Used | 是否列出正確 playbooks 與 selection reason |
| Status Accuracy | `Used`、`Missing`、`Needs More Evidence`、`Not Applicable` 是否合理 |
| Dry Run Boundary | Dry Run / DB-assisted Dry Run 是否沒有被標示為 Pass |
| DB Safety | 是否只允許 read-only / bounded evidence |
| Mutation Boundary | 寫檔、DB mutation、test execution、deployment、Q system update 是否停在 approval 前 |
| Gate Decision | Gate status 是否符合 evidence，不可跳過 gate |
| Official Boundary | 不宣稱 Gemini CLI 有官方 pipeline engine 或 automatic playbook routing |

## Scenario-specific Checks

### Scenario 1: WebForms + MSSQL Change

必須看到：

- `csharp.md`、`aspnet-framework.md`、`webforms.md`、`mssql.md`、`dry-run.md`。
- DB Platform = `MSSQL`。
- DB Hosting / Runtime Environment = `Google Cloud SQL`。
- Version Risk = `Needs More Evidence`，除非提供 `.csproj` / `web.config`。
- 不得出現 ASP.NET Core middleware / minimal API。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 少列 WebForms / ASP.NET Framework playbook | `docs/playbooks/workflow/sdlc-pipeline.md` selection matrix |
| 使用 ASP.NET Core 慣例 | `docs/playbooks/tech-stacks/webforms.md` 或 `aspnet-framework.md` |
| DB Platform / Hosting 混在一起 | `workflow-state.md`、`sdlc-pipeline.md`、相關 command |

### Scenario 2: Python + BigQuery Job

必須看到：

- `python.md`、`bigquery.md`、`dry-run.md`、`db-assisted-dry-run.md`。
- Python runtime / dependency 缺失時為 `Needs More Evidence`。
- 不執行 BigQuery 查詢。
- 不把 dry run / BigQuery dry run 當成 Pass。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 未列 BigQuery playbook | `sdlc-pipeline.md` selection matrix |
| 使用最新版 Python 語法 | `python.md`、`developer-implementer` |
| Dry Run 被標示 Pass | `test-engineer`、`/sdlc:test`、`dry-run.md` |

### Scenario 3: LookML + BigQuery Upstream

必須看到：

- `lookml.md` 與 `bigquery.md` 同時出現。
- 沒有 Looker validation result 時為 `Needs More Evidence`。
- 應檢查 fanout、measure aggregation、join relationship。
- 不得宣稱 LookML validation pass。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 忽略 upstream DB playbook | `lookml.md`、`sdlc-pipeline.md` selection matrix |
| 未要求 validation evidence | `lookml.md`、`test-engineer` |
| 假裝 validation pass | `dry-run.md`、`db-assisted-dry-run.md` |

### Scenario 4: PowerShell Deployment Helper

必須看到：

- `powershell.md`。
- Windows PowerShell 5.1 / PowerShell 7+ 未知時為 `Needs More Evidence`。
- App pool recycle 被視為 mutation。
- 建議 dry run / `-WhatIf` / confirmation strategy。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 假設 PowerShell 7+ | `powershell.md`、`developer-implementer` |
| 直接執行 script | `/sdlc:plan`、`powershell.md`、`GEMINI.md` |
| 忽略 app pool mutation | `aspnet-framework.md`、`release-ops` |

### Scenario 5: Java + Oracle Stored Procedure

必須看到：

- `java.md`、`oracle.md`、`dry-run.md`、`db-assisted-dry-run.md`。
- JDK / Maven / framework 未知時為 `Needs More Evidence`。
- stored procedure 不確認 read-only 時不得執行。
- DB mutation 需 rollback / validation / gate approval。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 假設最新版 JDK | `java.md`、`developer-implementer` |
| 忽略 Oracle schema / owner | `oracle.md`、`db-engineering` |
| 執行 stored procedure | `db-assisted-dry-run.md`、`db-engineering` |

### Scenario 6: Prompt Change for Skill / Command

必須看到：

- `prompting.md`。
- 明確說明 Playbook Selection 是 repo convention。
- 不宣稱 Gemini CLI 官方 Playbook Routing。
- 不混入 ChatGPT 專案身分。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 宣稱官方 routing | `prompting.md`、`sdlc-pipeline.md` |
| 分層錯誤 | `prompting.md`、對應 command / skill |
| 改 README 成執行規則 | README draft / prompt instructions |

### Scenario 7: Missing Version Context Blocking

必須看到：

- `/sdlc:implement` 停止。
- 不修改檔案。
- 不使用最新版 C# / .NET API 作為預設。
- Gate / Status = `Blocked` 或 `Needs More Evidence`。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 直接實作 | `/sdlc:implement`、`developer-implementer` |
| 沒有要求 Version Context | `workflow-state.md`、`sdlc-pipeline.md` |
| 用最新版語法 | `csharp.md`、`developer-implementer` |

### Scenario 8: DB Platform / Hosting Separation

必須看到：

- DB Platform = `MSSQL`。
- DB Hosting / Runtime Environment = `Google Cloud SQL`。
- 不執行 update SQL。
- rollback 不清楚時不得進入 release。

若失敗，優先回修：

| Issue | Fix Target |
|---|---|
| 輸出 MSSQL CloudSQL | `workflow-state.md`、`sdlc-pipeline.md`、commands output format |
| 直接執行 SQL | `db-engineering`、`db-assisted-dry-run.md` |
| rollback 不清仍放行 | `release-ops`、`/sdlc:release` |

## Validation Result File Location

若需要保存驗證結果，建議放在：

```text
docs/_generated/workflows/sdlc-validation-<YYYYMMDD>/scenario-<number>.md
```

`docs/_generated/` 預設不應進 Git。不要把單次驗證輸出放入正式 playbook 目錄。

## Failure Severity

| Severity | Definition | Required Action |
|---|---|---|
| Blocking | 會導致錯誤實作、錯誤 DB mutation、錯誤 release、假測試通過或宣稱不存在的官方功能 | 必須回修後重測 |
| High | 會造成 playbook selection 不完整、版本風險漏判或 dry run 語意不清 | 建議回修後重測 |
| Medium | 輸出格式不一致但不影響安全 gate | 可排入後續修正 |
| Low | 文字、命名、排序或可讀性問題 | 可排入後續修正 |

## Pass Criteria

本 execution validation 可視為通過，需滿足：

- 8 個 scenario 均已執行或逐項人工模擬檢查。
- 沒有 Blocking issue。
- High issue 均已回修或明確記錄為 accepted risk。
- 所有 scenario 都有合理 `Project / Version Context`。
- `Playbooks Used` 符合 expected playbooks，或合理標示 `Needs More Evidence`。
- Dry Run / DB-assisted Dry Run 沒有被標示為 Pass。
- DB Platform / DB Hosting 分離。
- Mutation 停在 approval / Change Proposal 前。
- 沒有宣稱 Gemini CLI 不具備的官方能力。

## Recommended Next Step After Validation

若 validation 通過，下一步才進行 README 更新。

若 validation 失敗，先回修對應 command / skill / playbook，再重新執行失敗 scenario。
