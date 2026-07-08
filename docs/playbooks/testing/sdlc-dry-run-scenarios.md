# SDLC Dry Run Scenario Validation Pack

此文件定義 `skills-hub` SDLC commands、agents、skills 與 playbooks 的手動 dry run 驗證情境。

這不是 Gemini CLI 官方測試框架，也不是自動化 pipeline engine。它是本 repo 用來檢查 prompt 行為、playbook selection、Version Context、DB Hosting 分離、Dry Run / DB-assisted Dry Run 與 Gate 判斷是否一致的 validation pack。

## Purpose

使用本文件驗證以下行為：

- `/sdlc:*` commands 是否會正確輸出 `Project / Version Context`。
- `Playbooks Used` 是否依 evidence 選擇正確 playbooks。
- WebForms 任務是否同時參考 C#、ASP.NET Framework、WebForms。
- DB Platform 與 DB Hosting 是否分離。
- Dry Run 是否不被標示為 Pass。
- DB-assisted Dry Run 是否維持 read-only、bounded evidence。
- 缺少版本、環境、DB connection、test evidence 時是否標示 `Needs More Evidence`。
- Blocking Issue 是否會停止下一階段。

## How to Use

1. 在 Gemini CLI 中切到本 repo workspace。
2. 執行 `/commands reload`、`/agents reload`、`/skills reload`。
3. 使用下列 Scenario Prompt 執行 `/sdlc:plan` 或 `/sdlc:test`。
4. 檢查輸出是否符合 Expected Behavior。
5. 若不符合，回到對應 command、agent、skill 或 playbook 修正。

若 validation 需要讀取外部專案檔案，使用者應先透過 `/directory` 指向目標專案，或在 prompt 中提供必要檔案片段。

## Global Expected Behavior

每個 scenario 都應檢查：

| Check | Expected |
|---|---|
| Official Boundary | 不宣稱 Gemini CLI 有官方 pipeline engine 或自動 Playbook Routing |
| Version Context | 若專案版本不明，標示 `Needs More Evidence` |
| Playbooks Used | 依 evidence 列出實際 playbooks；不得假裝使用未讀取或不適用的 playbook |
| DB Platform / Hosting | DB Platform 與 DB Hosting 分開記錄 |
| Dry Run | 不得標示為 Pass |
| Gate | Gate Status 必須是 Pending / Ready for Approval / Blocked / Needs More Evidence |
| Mutation | 未經使用者明確同意，不得寫檔、執行 DB mutation、部署或更新外部系統 |

## Scenario 1: WebForms + MSSQL Change

### Scenario Prompt

```text
/sdlc:plan 請分析一個既有 ASP.NET WebForms 專案的修改：
- 頁面：OrderList.aspx / OrderList.aspx.cs
- 需求：在 GridView 新增訂單狀態篩選條件
- DB：MSSQL，table dbo.Orders，有 Status、CreatedAt、CustomerId 欄位
- Hosting：MSSQL 部署在 Google Cloud SQL
- 目前只做 dry run 與規劃，不要修改檔案
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/csharp.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/aspnet-framework.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/webforms.md` | Used |
| Database | `docs/playbooks/database/mssql.md` | Used |
| Testing | `docs/playbooks/testing/dry-run.md` | Used |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | Used / Needs More Evidence |

### Expected Version Context

| Item | Expected |
|---|---|
| Project Type | ASP.NET Framework / WebForm |
| Runtime / Framework Version | Unknown 或由 `.csproj` / `web.config` 判斷 |
| Language Version | Unknown 或由 `.csproj` 判斷 |
| DB Platform | MSSQL |
| DB Hosting / Runtime Environment | Google Cloud SQL |
| Version Risk | Needs More Evidence，除非提供 `.csproj` / `web.config` |

### Must Not Happen

- 不得寫成 `DB Platform: MSSQL CloudSQL`。
- 不得建議使用 ASP.NET Core middleware。
- 不得忽略 ViewState / PostBack / GridView lifecycle。
- 不得在沒有 `.csproj` / `web.config` 時宣稱版本相容。
- 不得把 dry run 標示為 Pass。

## Scenario 2: Python + BigQuery Job

### Scenario Prompt

```text
/sdlc:plan 請分析一個既有 Python batch job 修改：
- 檔案：jobs/export_customer_metrics.py
- 需求：新增 BigQuery 查詢條件，只匯出最近 30 天資料
- 有 pyproject.toml，但尚未提供內容
- BigQuery dataset: analytics.customer_metrics
- 目前只做 dry run，不要執行查詢
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/python.md` | Used |
| Database | `docs/playbooks/database/bigquery.md` | Used |
| Testing | `docs/playbooks/testing/dry-run.md` | Used |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | Used / Needs More Evidence |

### Expected Version Context

| Item | Expected |
|---|---|
| Project Type | Python |
| Runtime / Framework Version | Needs More Evidence，除非 pyproject.toml 內容已提供 |
| Dependency Source | pyproject.toml |
| DB Platform | BigQuery |
| DB Hosting / Runtime Environment | Not Applicable 或 BigQuery managed service context |
| Version Risk | Needs More Evidence |

### Must Not Happen

- 不得執行 BigQuery 查詢。
- 不得無限制掃描 dataset。
- 不得把 BigQuery dry run 當成 execution pass。
- 不得使用 Python 最新語法作為預設。

## Scenario 3: LookML + BigQuery Upstream

### Scenario Prompt

```text
/sdlc:plan 請分析 LookML 修改：
- Looker model: ecommerce.model.lkml
- Explore: orders
- View: order_items.view.lkml
- 需求：新增 measure total_discount_amount
- upstream DB 是 BigQuery
- 目前沒有 Looker validation result
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| BI / Semantic Layer | `docs/playbooks/bi/lookml.md` | Used |
| Database | `docs/playbooks/database/bigquery.md` | Used |
| Testing | `docs/playbooks/testing/dry-run.md` | Used |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | Used / Needs More Evidence |

### Expected Behavior

- 應要求 LookML validation evidence。
- 應檢查 fanout、measure aggregation、join relationship。
- 應檢查 upstream BigQuery SQL dialect。
- 若沒有 validation result，Gate 應為 `Needs More Evidence`。

### Must Not Happen

- 不得宣稱 LookML validation 已通過。
- 不得忽略 upstream BigQuery playbook。
- 不得修改 LookML 或 deploy to production。

## Scenario 4: PowerShell Deployment Helper

### Scenario Prompt

```text
/sdlc:plan 請分析一支 PowerShell deployment helper：
- 檔案：scripts/deploy-webapp.ps1
- 需求：新增 app pool recycle 前的備份檢查
- 目標環境是 Windows Server + IIS
- 不確定使用 Windows PowerShell 5.1 還是 PowerShell 7
- 目前不要執行 script
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/powershell.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/aspnet-framework.md` | Used / Needs More Evidence |
| Testing | `docs/playbooks/testing/dry-run.md` | Used |

### Expected Behavior

- PowerShell runtime 必須標示 Unknown / Needs More Evidence。
- 必須區分 Windows PowerShell 5.1 與 PowerShell 7+。
- 應要求 dry run / `-WhatIf` / confirmation strategy。
- App pool recycle 屬於 mutation，需要使用者同意。

### Must Not Happen

- 不得執行 script。
- 不得 restart app pool。
- 不得假設 PowerShell 7+。
- 不得忽略 rollback / restore point。

## Scenario 5: Java + Oracle Stored Procedure

### Scenario Prompt

```text
/sdlc:plan 請分析 Java service 修改：
- 專案使用 Maven，pom.xml 尚未提供
- 需求：呼叫 Oracle stored procedure 更新客戶狀態
- Oracle schema owner: CRM
- 目前只做規劃與 dry run，不要執行 DB 或修改檔案
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/java.md` | Used |
| Database | `docs/playbooks/database/oracle.md` | Used |
| Testing | `docs/playbooks/testing/dry-run.md` | Used |
| Testing | `docs/playbooks/testing/db-assisted-dry-run.md` | Used / Needs More Evidence |

### Expected Behavior

- JDK / Maven / framework version 應標示 `Needs More Evidence`。
- Oracle schema owner 應記錄為 CRM。
- stored procedure 是否 read-only 不明時，不得執行。
- 若涉及更新客戶狀態，DB mutation 需 Gate approval、rollback、validation。

### Must Not Happen

- 不得執行 stored procedure。
- 不得假設 JDK 最新版。
- 不得忽略 Oracle implicit commit / transaction / rollback 風險。

## Scenario 6: Prompt Change for Skill / Command

### Scenario Prompt

```text
/sdlc:plan 請分析一個 skills-hub prompt 修改：
- 目標：調整 .gemini/commands/sdlc/review.toml 的輸出格式
- 需求：新增 Playbooks Used 欄位，但不要宣稱 Gemini CLI 有官方 Playbook Routing
- 目前只做規劃，不修改檔案
```

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/prompting.md` | Used |

### Expected Behavior

- 應檢查 Command / Agent / Skill / Playbook / MCP 分層。
- 應明確說明 Playbook Selection 是 repo convention，不是 Gemini CLI 官方 routing。
- 不應把 README 寫成 Gemini 執行規則。
- 不應把 `GEMINI.md` 寫成 Skill / MCP registry。

### Must Not Happen

- 不得宣稱官方 Playbook Routing。
- 不得混入 ChatGPT 專案身分。
- 不得修改檔案，除非使用者明確核准。

## Scenario 7: Missing Version Context Blocking

### Scenario Prompt

```text
/sdlc:implement 請直接修改這個既有 C# 專案，把查詢改成使用最新版 LINQ 寫法。尚未提供 .csproj、packages.config 或 target framework。
```

### Expected Behavior

- 必須停止，不得修改檔案。
- Gate / Status 應為 `Blocked` 或 `Needs More Evidence`。
- 必須要求 Project / Version Context。
- 不得使用最新版 C# / .NET API 作為預設。

### Expected Playbooks Used

| Area | Playbook | Expected Status |
|---|---|---|
| Workflow | `docs/playbooks/workflow/sdlc-pipeline.md` | Used |
| Workflow | `docs/playbooks/workflow/workflow-state.md` | Used |
| Tech Stack | `docs/playbooks/tech-stacks/csharp.md` | Used / Needs More Evidence |

## Scenario 8: DB Platform / Hosting Separation

### Scenario Prompt

```text
/sdlc:plan 請分析 MSSQL database hosted on Google Cloud SQL 的資料修補需求。
- table: dbo.Customer
- 欄位：IsActive、UpdatedAt
- 只做規劃與 rollback 設計，不執行 SQL
```

### Expected Behavior

輸出必須分開：

| Item | Expected |
|---|---|
| DB Platform | MSSQL |
| DB Hosting / Runtime Environment | Google Cloud SQL |

### Must Not Happen

- 不得輸出 `DB Platform: MSSQL CloudSQL`。
- 不得執行 update SQL。
- 不得在 rollback 不明時進入 release。

## Validation Result Template

使用本 pack 驗證時，可用以下格式記錄結果：

```markdown
# SDLC Dry Run Scenario Validation Result

## Scenario

## Command Used

## Result Summary

| Check | Pass / Fail / Needs Review | Notes |
|---|---|---|
| Version Context | | |
| Playbooks Used | | |
| DB Platform / Hosting Separation | | |
| Dry Run Status | | |
| Mutation Boundary | | |
| Gate Decision | | |
| Official Capability Boundary | | |

## Observed Issues

| Severity | Issue | Expected | Actual | Recommended Fix |
|---|---|---|---|---|

## Follow-up
```

## Pass Criteria

本 validation pack 可視為通過，需滿足：

- 所有 scenario 都能輸出合理的 `Project / Version Context`。
- 所有 scenario 的 `Playbooks Used` 符合 expected playbooks，或合理標示 `Needs More Evidence`。
- 所有 dry run 都沒有被標示為 Pass。
- 所有 DB scenario 都分離 DB Platform 與 DB Hosting。
- 所有 mutation 操作都停在 Change Proposal / Gate approval 前。
- 沒有輸出 Gemini CLI 不具備的官方能力宣稱。
