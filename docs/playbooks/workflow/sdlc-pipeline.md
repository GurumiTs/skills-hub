# SDLC Pipeline Playbook

此文件定義 `skills-hub` 的標準 SDLC Pipeline。它是 Commands、Agents 與 Skills 的共同參考，不是 Gemini CLI 官方內建 pipeline engine。

本 Playbook 應搭配 Gemini CLI 官方支援的 project custom commands、`@{...}` file content injection、`GEMINI.md` context hierarchy 與 MCP tools 使用；不得把本文件描述成 Gemini CLI 原生 workflow engine 或官方 Playbook Routing 功能。

## Gemini CLI Compatibility

本 repo 的 SDLC Pipeline 是建立在以下 Gemini CLI 官方能力之上的專案層規範：

| 能力 | 本 repo 的使用方式 | 邊界 |
|---|---|---|
| Project custom commands | `.gemini/commands/sdlc/*.toml` 定義 `/sdlc:*` command | 只是 reusable prompt，不是官方 pipeline engine |
| Namespaced commands | 以 `.gemini/commands/sdlc/test.toml` 形成 `/sdlc:test` | command 間狀態銜接由 prompt 與 Workflow State 管理 |
| `@{...}` file content injection | commands 可明確注入本 Playbook 或其他固定參考文件 | 不代表 CLI 會自動選擇所有 playbooks |
| `GEMINI.md` context hierarchy | 提供共通治理規則與專案脈絡 | 不應把 `GEMINI.md` 寫成 Skill / MCP registry |
| MCP tools | 提供 DB metadata、file analysis、test runner 等工具能力 | 任何 mutation、外部系統更新或高風險操作都要先取得使用者同意 |

`Playbook selection` 是本 repo 的 prompt convention，不是 Gemini CLI 官方自動 routing 功能。Agent / Skill 若需要參考技術棧、DB、testing 或 release playbook，必須在輸出中明確列出 `Playbooks Used`、判斷依據與缺口；若無法判斷，必須標示 `Needs More Evidence`。

## Available Playbooks

以下是本 repo 目前可明確引用的 Playbooks。這份清單只是專案層參考索引，不是 Gemini CLI 官方 registry，也不代表 CLI 會自動 routing。

| Area | Playbook | Use When |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | SDLC stages、gates、handoff、blocking rule |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Workflow State Snapshot、Gate Decisions、Version Context 格式 |
| Tech Stack | `docs/playbooks/tech-stacks/csharp.md` | 任務涉及 C# application、class library、service、job 或 data access code |
| Tech Stack | `docs/playbooks/tech-stacks/aspnet-framework.md` | 任務涉及 ASP.NET Framework、web.config、IIS、MVC 5、Web API 2 或 legacy web app |
| Tech Stack | `docs/playbooks/tech-stacks/webforms.md` | 任務涉及 `.aspx`、`.ascx`、`.master`、code-behind、ViewState、PostBack 或 WebForms lifecycle |
| Tech Stack | `docs/playbooks/tech-stacks/python.md` | 任務涉及 Python script、service、job、ETL、automation 或 Python test |
| Tech Stack | `docs/playbooks/tech-stacks/powershell.md` | 任務涉及 PowerShell script、module、deployment helper、maintenance automation 或 Windows operation |
| Tech Stack | `docs/playbooks/tech-stacks/java.md` | 任務涉及 Java、JDK、Maven / Gradle、Spring / Java EE、JDBC / JPA 或 Java tests |
| Tech Stack | `docs/playbooks/tech-stacks/prompting.md` | 任務涉及 Command、Agent、Skill、GEMINI.md、prompt role boundary 或 output format design |
| Testing | `docs/playbooks/testing/dry-run.md` | `/sdlc:test` 需要 dry run、測試前置條件、Not Tested / Needs More Evidence 判斷 |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | `/sdlc:test` 需要 DB read-only evidence、metadata、bounded query、BigQuery dry run 或 LookML validation evidence |
| Testing | `docs/playbooks/testing/sdlc-dry-run-scenarios.md` | 驗證 `/sdlc:*` prompt 是否正確套用 playbook selection、Version Context、DB Hosting 分離與 dry run gate |
| Testing | `docs/playbooks/testing/scenario-validation-execution-notes.md` | 執行 validation pack 時的 reload、scenario execution、檢查欄位、失敗回修路徑與 pass criteria |
| Database | `docs/playbooks/database/mssql.md` | DB Platform / Dialect 是 MSSQL / SQL Server / T-SQL |
| Database | `docs/playbooks/database/oracle.md` | DB Platform / Dialect 是 Oracle / Oracle SQL / PL/SQL |
| Database | `docs/playbooks/database/bigquery.md` | DB Platform / Dialect 是 BigQuery / GoogleSQL |
| BI / Semantic Layer | `docs/playbooks/bi/lookml.md` | 任務涉及 LookML / Looker model、view、explore、dashboard impact |

若任務涉及的技術棧或平台 playbook 尚未建立，必須在 `Playbooks Used` 標示 `Missing` 或 `Needs More Evidence`，不得假裝已參考。

## Playbook Selection Rules

所有 command、agent、skill 在輸出 `Playbooks Used` 時，必須依實際 evidence 選用 playbook。不得只因使用者提到單一關鍵字就忽略其他必要 playbook，也不得把尚未使用的 playbook 標示為 `Used`。

### Selection Principles

| 原則 | 說明 |
|---|---|
| Evidence first | 依檔案、副檔名、manifest、framework、DB dialect、使用者 prompt 或 Workflow State 判斷 |
| Multi-playbook allowed | 同一任務可以列多份 playbook，例如 WebForms 同時需要 C#、ASP.NET Framework、WebForms |
| Missing is explicit | 若必要 playbook 尚未建立或未讀取，必須標示 `Missing` 或 `Needs More Evidence` |
| No fake routing | 不得宣稱 Gemini CLI 自動 routing；selection 是本 repo prompt convention |
| Version before practice | 若版本不明，不得套用最新版慣例，只能標示風險或要求 evidence |

### Common Selection Matrix

| Evidence / Context | Required Playbooks |
|---|---|
| 任務是 SDLC command 或需要 Gate / Handoff | `docs/playbooks/workflow/sdlc-pipeline.md`、`docs/playbooks/workflow/workflow-state.md` |
| `.cs`、`.csproj`、`.sln`、C# service / job / class library | `docs/playbooks/tech-stacks/csharp.md` |
| `web.config`、ASP.NET Framework、IIS、MVC 5、Web API 2 | `docs/playbooks/tech-stacks/csharp.md`、`docs/playbooks/tech-stacks/aspnet-framework.md` |
| `.aspx`、`.ascx`、`.master`、code-behind、ViewState、PostBack | `docs/playbooks/tech-stacks/csharp.md`、`docs/playbooks/tech-stacks/aspnet-framework.md`、`docs/playbooks/tech-stacks/webforms.md` |
| `requirements.txt`、`pyproject.toml`、Python script / job / service | `docs/playbooks/tech-stacks/python.md` |
| `.ps1`、`.psm1`、`.psd1`、Windows operation / deployment helper | `docs/playbooks/tech-stacks/powershell.md` |
| `pom.xml`、`build.gradle`、Java service / batch / JAR / WAR | `docs/playbooks/tech-stacks/java.md` |
| command / agent / skill prompt、GEMINI.md、MCP instruction、output format | `docs/playbooks/tech-stacks/prompting.md` |
| `/sdlc:test` dry run、Not Tested / Needs More Evidence 判斷 | `docs/playbooks/testing/dry-run.md` |
| `/sdlc:test` 需要 DB metadata、bounded query、LookML validation evidence | `docs/playbooks/testing/db-assisted-dry-run.md` |
| 驗證 `/sdlc:*` prompt 行為、playbook selection 或 dry run gate | `docs/playbooks/testing/sdlc-dry-run-scenarios.md`、`docs/playbooks/testing/scenario-validation-execution-notes.md` |
| SQL Server、MSSQL、T-SQL、`.sql` 指向 SQL Server、stored procedure | `docs/playbooks/database/mssql.md` |
| Oracle SQL、PL/SQL、schema owner、package、sequence、synonym | `docs/playbooks/database/oracle.md` |
| BigQuery、GoogleSQL、dataset、partition、cluster、estimated scan | `docs/playbooks/database/bigquery.md` |
| LookML、Looker model / view / explore / dashboard impact | `docs/playbooks/bi/lookml.md`；若有 upstream DB SQL，也要加對應 DB playbook |

### Required Output Behavior

在 `Playbooks Used` 中：

- `Status = Used` 只能表示該 playbook 已被實際讀取或由 command 明確注入。
- `Status = Missing` 表示依 evidence 應使用，但目前不存在或未被提供。
- `Status = Needs More Evidence` 表示需要更多檔案、版本、DB、環境或外部系統資訊才能判斷是否適用。
- `Status = Not Applicable` 表示該 area 經判斷不適用，必須說明理由。

### Examples

#### WebForms change

| Area | Playbook | Selection Reason | Status |
|---|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | SDLC Gate / Handoff | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Workflow State Snapshot | Used |
| Tech Stack | `docs/playbooks/tech-stacks/csharp.md` | `.aspx.cs` code-behind uses C# | Used |
| Tech Stack | `docs/playbooks/tech-stacks/aspnet-framework.md` | WebForms runs on ASP.NET Framework / IIS | Used |
| Tech Stack | `docs/playbooks/tech-stacks/webforms.md` | `.aspx` / ViewState / PostBack lifecycle affected | Used |
| Testing | `docs/playbooks/testing/dry-run.md` | Test stage requires dry run before execution | Used |

#### LookML with BigQuery upstream

| Area | Playbook | Selection Reason | Status |
|---|---|---|---|
| BI / Semantic Layer | `docs/playbooks/bi/lookml.md` | LookML model / explore affected | Used |
| Database | `docs/playbooks/database/bigquery.md` | Upstream SQL dialect is BigQuery / GoogleSQL | Used |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | Validation needs read-only evidence / dry run | Used |

## Core Principles

| 原則 | 說明 |
|---|---|
| 先規格，後實作 | 不得在需求與影響未清楚前直接修改程式 |
| 先確認版本，再套用慣例 | 針對既有專案時，必須先從專案檔、設定檔、lock file、runtime、package manifest 或 build 設定推斷實際版本，不得無腦套用最新版語法或 API |
| DB 產品與 hosting 分離 | DB Platform 應記錄 MSSQL、Oracle、BigQuery 等產品 / dialect；Google Cloud SQL、Azure SQL、AWS RDS、VM、on-prem 應記錄為 DB Hosting / Runtime Environment |
| DB 影響不可跳過 | 只要涉及資料表、SQL、匯入匯出、報表、資料流、migration，就必須進行 DB / Data Impact Analysis |
| Test Stage 獨立 | Development 後必須進入 `/sdlc:test`，產出 Test Report / Dry Run Result / Regression Scope，才可進入 Review |
| Gate 必須停下 | 每個關鍵 gate 必須回報狀態，必要時等待使用者確認 |
| Mutating 操作需確認 | 寫檔、改 DB、執行測試、部署、更新 Q 系統或外部系統都需要明確同意 |
| 有 blocking issue 就停止 | 不得帶著 blocking issue 進入下一階段 |

## Existing Project Version Rule

當任務目標是既有專案時，所有 implementation、test、review 與 release 判斷都必須優先遵守目標專案實際版本與既有慣例。

必須優先讀取或要求使用者提供：

- 專案檔：`.sln`、`.csproj`、`web.config`、`packages.config`、`global.json`、`pom.xml`、`build.gradle`、`requirements.txt`、`pyproject.toml`、`package.json`、`*.psd1` 等。
- Runtime / framework：.NET Framework、ASP.NET Framework、WebForms、Python、PowerShell、Java 等實際版本。
- Dependency version：NuGet、pip、Maven、Gradle、PowerShell module 或其他 dependency manifest。
- Build / deployment settings：CI 設定、IIS / service / job 設定、環境變數、feature flag、Looker / LookML validation 方式。
- DB dialect / platform：MSSQL、Oracle、BigQuery 或 LookML 對應 SQL dialect。
- DB hosting / runtime environment：Google Cloud SQL、Azure SQL、AWS RDS、VM、on-prem 或其他代管 / 部署環境。

若版本不可判斷，必須標示 `Version Context: Unknown` 或 `Needs More Evidence`，不得使用最新版語法、套件、API 或框架慣例作為預設。

## Pipeline Stages

| 階段 | 主責 Agent | 主要 Skill | 輸入 | 輸出 / Gate |
|---|---|---|---|---|
| 1. Requirement Intake | Workflow Orchestrator | 視需要使用 `sa-consultant` | 使用者需求、Redmine、問題描述、現有文件 | 任務摘要、目標、限制、是否需要 SA 分析 |
| 2. SA Analysis | SA Agent | `sa-consultant` | 需求摘要、問題背景、限制條件 | SA 規格、In Scope、Out of Scope、Assumptions、Open Questions、Acceptance Criteria |
| 3. Project / Version Discovery | Workflow Orchestrator + Developer Agent | `developer-implementer`，僅做 read-only 判斷 | 目標專案檔案、framework / runtime / dependency manifest、build 設定 | Version Context、Project Constraints、Compatibility Notes、Playbooks Used |
| 4. DB / Data Impact Analysis | DB Agent | `db-engineering` | SA 規格、資料表、SQL、資料流、DB dialect / platform、DB hosting context | DB 影響分析、Table / Column / Index / SQL / Migration 初步評估 |
| 5. Implementation Planning | SA Agent + Developer Agent + DB Agent | `sa-consultant`、`developer-implementer`、`db-engineering` | SA 規格、DB 影響分析、Version Context、現有程式碼 | 實作計畫、預計異動檔案、DB 變更計畫、風險與驗證方式 |
| 6. Development | Developer Agent | `developer-implementer` | 已確認的實作計畫、Approved Scope、Version Context | 程式變更、變更摘要、自測方式 |
| 7. DB Change Implementation | DB Agent 或 Developer Agent | `db-engineering` | DB 變更計畫、schema、SQL、rollback direction | SQL script、migration plan、資料驗證方式、rollback SQL |
| 8. Test | Test Agent | `test-engineer` | Implementation Result、Acceptance Criteria、DB 變更摘要、Version Context | Test Report、Dry Run Result、Regression Scope、Failed / Blocked / Not Tested Items、`Test → Review` Gate |
| 9. DB Review | DB Agent | `db-engineering` | Test Report、SQL / migration、DB 變更摘要 | SQL 效能、交易安全、資料正確性、rollback 可行性檢查 |
| 10. Code Review | Review Agent | `code-reviewer` | git diff、變更摘要、Test Report、Version Context | blocking / non-blocking issues、可維護性與 compatibility 檢查 |
| 11. Security Review | Security Agent | `security-reviewer` | 程式 diff、設定檔、DB 變更、API 變更、Test Report | sensitive data、input validation、permission、config、dependency risk 結論 |
| 12. Release / Rollback Planning | Release Agent | `release-ops` | 已通過 review 的變更、Test Report、Review Report | 部署步驟、部署後驗證、rollback、release note |
| 13. UAT / Acceptance Support | SA Agent + Test Agent | `sa-consultant`、`test-engineer` | UAT 情境、驗收標準、Test Report | UAT checklist、使用者溝通說明、驗收結果整理 |
| 14. Handover / Maintenance | Release Agent | `release-ops` | Release 文件、部署結果 | Runbook、監控點、常見問題、排查步驟 |
| 15. Incident / RCA | Incident Agent | `incident-rca` | 正式區異常、Log、使用者回報 | RCA、暫時處置、長期改善、後續追蹤事項 |

## Pipeline Gates

| Gate | 進入下一階段前必須確認 |
|---|---|
| Requirement Intake → SA | 需求來源、目標系統、主要目標與限制已清楚 |
| SA → Project / Version Discovery | 目標專案或待分析檔案已知；若未知，必須標示 blocker |
| Project / Version Discovery → DB Impact / Implementation Planning | Version Context 已確認，或已明確標示 `Unknown` 與風險 |
| SA → DB Impact | 判斷是否涉及資料庫、SQL、資料流、報表、匯入匯出或 migration |
| SA / DB → Development | 需求範圍、Out of Scope、Acceptance Criteria、主要風險、Version Context 與 DB 影響已清楚 |
| Development → Test | 程式變更完成，且有 Implementation Result、變更摘要、DB notes、自測方式與版本相容性說明 |
| DB Change → Test | DB script、migration、資料驗證方式與 rollback 已準備 |
| Test → Review | Test Report 完整；Dry Run / Execution Result / Not Tested / Failed / Blocked 項目已清楚；無 unresolved blocking failure |
| DB Review → Security | 無高風險資料正確性、交易或 rollback 問題 |
| Code Review → Security | 無 blocking code review issue |
| Security → Release | 無高風險 sensitive data、input validation、permission、configuration 或 dependency issue |
| Release → UAT | 部署步驟、部署後驗證、rollback 與 UAT checklist 完整 |
| UAT → Handover | 驗收結果、使用者溝通事項與維運注意事項已整理 |

## DB-assisted Dry Run Rule

若 `/sdlc:test` 或使用者 prompt 提到特定 DB table、schema、dataset、query、stored procedure、LookML explore / view，且 dry run 需要 DB evidence，必須交由 DB Agent 判斷是否可進行 read-only 查詢。

允許的 DB-assisted dry run 僅限：

- metadata / schema / column / constraint / index 查詢。
- bounded row count、existence check、limited aggregate check。
- bounded sample query，且必須避免敏感欄位、避免 `SELECT *`、明確限制筆數。
- BigQuery dry run / explain / estimated scan check。
- LookML / Looker validation evidence 的 read-only 查詢或既有結果整理。

禁止預設執行：

- INSERT、UPDATE、DELETE、MERGE、TRUNCATE、DROP、ALTER。
- 大量資料掃描或 full dump。
- 未遮罩輸出敏感欄位完整值。
- 未確認為 read-only 的 stored procedure / function。
- 對 production data 造成 mutation 的測試。

若 connection、environment、table ownership、資料敏感性或 DB dialect 不明，必須停在 `Needs More Evidence`，不得猜測查詢。

## Blocking Rule

以下情況必須停止 pipeline：

- 需求或 Acceptance Criteria 不清楚。
- Target Project、Version Context、framework/runtime/dependency 版本不清楚，且會影響實作或測試判斷。
- DB 欄位、資料規則、migration 或 rollback 不清楚。
- Test Report 缺失、不完整、主要項目 `Not Tested` 且風險未被接受。
- 測試失敗且未修正。
- Code Review 有 blocking issue。
- DB Review 有高風險資料正確性、交易或 rollback 問題。
- Security Review 有 high-risk issue。
- Release 缺少 rollback plan。
- 使用者尚未同意 mutating operation、測試執行、Q 系統寫入、DB mutation 或部署。
