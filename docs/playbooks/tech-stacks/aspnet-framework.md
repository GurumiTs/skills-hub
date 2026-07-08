# ASP.NET Framework Playbook

此 Playbook 定義 ASP.NET Framework 專案在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

ASP.NET Framework 不等同於 ASP.NET Core。針對既有專案時，不得使用 ASP.NET Core middleware、minimal API、modern hosting model 或新版 dependency injection 慣例取代既有架構。

## Scope

適用於：

- ASP.NET Framework web application。
- WebForms、MVC 5、Web API 2、ASHX、ASMX、Global.asax。
- `web.config`、IIS、App Pool、bin deployment。
- C# code-behind、controller、service、repository、data access。
- session、cache、forms authentication、Windows authentication。

若任務是 WebForms，應同時參考：

```text
docs/playbooks/tech-stacks/webforms.md
```

## Required Version Context

| Item | Evidence |
|---|---|
| .NET Framework Version | `.csproj`、`web.config`、target framework |
| ASP.NET Type | WebForms / MVC / Web API / mixed / unknown |
| IIS Hosting | app pool、pipeline mode、virtual directory、site binding |
| Package Style | `packages.config`、NuGet packages、bin assemblies |
| Authentication | Forms / Windows / custom / external SSO |
| Session State | InProc / StateServer / SQLServer / custom |
| Config Source | `web.config`、transform、environment config |
| DB Access | ADO.NET / EF / Dapper / stored procedure / raw SQL |

若 hosting、framework 或 package version 不明，必須標示 `Needs More Evidence`。

## Compatibility Rules

不得預設使用：

- ASP.NET Core middleware。
- `Program.cs` / modern hosting model。
- minimal API。
- Core DI container。
- appsettings.json 作為主要設定來源，除非專案既有使用。
- .NET 6+ API。

應優先維持：

- `web.config` 設定模式。
- Global.asax lifecycle。
- HttpModule / HttpHandler，如既有使用。
- IIS App Pool / bin deployment 慣例。
- 既有 authentication / session / cache 行為。

## Configuration Rules

修改 `web.config` 前必須確認：

- appSettings / connectionStrings 是否含 secrets。
- config transform 是否存在。
- deployment 環境差異。
- 是否會影響 app pool recycle。
- 是否需要 rollback config。

不得輸出完整 connection string 或 secret。

## Lifecycle and State Risks

必須注意：

- Request lifecycle。
- Session state。
- ViewState，如 WebForms。
- Cache / application state。
- Authentication cookie。
- Global.asax event。
- App pool recycle。
- Static files / handlers / modules。

## Data Access Rules

若涉及 DB：

- 優先維持既有 data access pattern。
- 確認 connection string source。
- 確認 parameterized query。
- 確認 transaction boundary。
- 確認 command timeout。
- DB 影響需 handoff 給 DB Agent。

## Testing Notes

ASP.NET Framework 測試可能需要：

- local IIS / IIS Express。
- manual UI test。
- integration test。
- web.config transform verification。
- authentication / session scenario。
- DB-assisted dry run。

若沒有測試環境，不得宣稱 Pass。

## Release Notes

Release planning 應考慮：

- bin deployment。
- web.config transform。
- app pool recycle。
- static file cache。
- DB script order。
- rollback package。
- IIS / service account permission。
- session impact。

## Review Checklist

| Area | Check |
|---|---|
| Framework | 是否符合 ASP.NET Framework，不誤用 Core 慣例 |
| Config | web.config / transform 是否安全 |
| Lifecycle | request / session / auth / cache 是否受影響 |
| Compatibility | package / API 是否符合 target framework |
| Security | auth、permission、input validation、secret handling |
| Release | app pool、config、bin、rollback 是否完整 |

## Output Format

```markdown
# ASP.NET Framework Compatibility Notes

## Version Context

| Item | Value | Evidence / Notes |
|---|---|---|
| .NET Framework Version | | |
| ASP.NET Type | WebForms / MVC / Web API / Mixed / Unknown | |
| IIS / App Pool | | |
| Package Style | | |
| Authentication | | |
| Session State | | |

## Existing Patterns

## Configuration Impact

## Lifecycle / State Risks

## DB / Data Access Notes

## Test / Dry Run Notes

## Release / Rollback Notes

## Gate Recommendation
```
