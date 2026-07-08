# C# Playbook

此 Playbook 定義 C# 專案在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

C# 不等同於最新版 .NET 或最新版 language feature。針對既有專案時，必須先確認 target framework、C# language version、NuGet package version 與 build target。

## Scope

適用於：

- C# application code。
- .NET Framework、.NET、class library、console app、service、job、batch。
- ASP.NET Framework / WebForms 的 code-behind 與 business logic。
- ADO.NET、Dapper、Entity Framework 或其他資料存取程式。
- `/sdlc:implement`、`/sdlc:test`、`/sdlc:review` 的 C# version compatibility 判斷。

若任務是 ASP.NET Framework 或 WebForms，應同時參考：

```text
docs/playbooks/tech-stacks/aspnet-framework.md
docs/playbooks/tech-stacks/webforms.md
```

## Required Version Context

開始實作或 review 前必須確認：

| Item | Evidence |
|---|---|
| Target Framework | `.csproj`、`TargetFrameworkVersion`、`TargetFramework` |
| C# Language Version | `.csproj`、`LangVersion`、compiler setting、既有語法風格 |
| Project Type | app、library、web app、service、job、test project |
| NuGet Packages | `packages.config`、`PackageReference`、lock file |
| Build Tool | MSBuild、dotnet CLI、Visual Studio version、CI |
| Runtime Hosting | IIS、Windows Service、scheduled task、container、VM |
| DB Access Pattern | ADO.NET、EF、Dapper、stored procedure、raw SQL |

若版本會影響語法或 API 但無法確認，必須標示 `Needs More Evidence`。

## Version Compatibility Rules

不得無腦使用：

- 目標專案不支援的 C# syntax。
- 目標 framework 不支援的 BCL / API。
- 未確認可用的 nullable reference types。
- 未確認可用的 records、init-only setters、top-level statements、global using。
- 未確認可用的 async stream、pattern matching 新語法。
- 未確認可用的 .NET 6+ / .NET 8 API。

若專案是 .NET Framework，應優先遵守既有 framework 與 packages，而不是套用 modern .NET 慣例。

## Coding Conventions

實作時應優先維持：

- 既有 namespace 與 folder structure。
- 既有 naming convention。
- 既有 exception handling pattern。
- 既有 logging pattern。
- 既有 dependency injection 或 service locator pattern。
- 既有 data access pattern。
- 既有 synchronous / asynchronous style。

不要為了小改動引入新架構、新套件或大範圍重構。

## Error Handling

必須檢查：

- 是否吞掉 exception。
- 是否輸出 sensitive data。
- 是否保留足夠 troubleshooting context。
- 是否符合既有 logging pattern。
- 是否會改變既有錯誤處理語意。

## Data Access Rules

若涉及 DB：

- 不得直接拼接 SQL 造成 injection risk。
- 優先使用既有 parameterized query pattern。
- 確認 connection / transaction / command timeout 行為。
- 確認 stored procedure input / output / return code。
- 確認 MSSQL / Oracle / BigQuery dialect。
- DB 影響需 handoff 給 DB Agent。

## Testing Notes

測試應依既有專案支援的測試框架：

- MSTest。
- NUnit。
- xUnit。
- integration test。
- manual test。
- WebForms manual / IIS test。

若沒有既有 test project，不得假設可以直接新增測試框架；應先提出 Change Proposal。

## Review Checklist

| Area | Check |
|---|---|
| Version | 語法與 API 是否符合 target framework / language version |
| Scope | 是否只改 approved scope |
| Compatibility | 是否維持既有 public API / behavior |
| Error Handling | exception / logging 是否符合既有風格 |
| Data Access | SQL parameterization、transaction、timeout 是否安全 |
| Maintainability | 是否避免過度抽象或大規模重構 |
| Testing | 是否有 self-test / dry run / Test Report |

## Output Format

```markdown
# C# Compatibility Notes

## Version Context

| Item | Value | Evidence / Notes |
|---|---|---|
| Target Framework | | |
| C# Language Version | | |
| Project Type | | |
| NuGet Package Style | packages.config / PackageReference / Unknown | |
| Build Tool | | |

## Existing Patterns

## Implementation Constraints

## DB / Data Access Notes

## Testing Notes

## Compatibility Risks

## Gate Recommendation
```
