# ASP.NET WebForms Playbook

此 Playbook 定義 ASP.NET WebForms 專案在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

WebForms 是 ASP.NET Framework 的 legacy web UI 技術，不應被當成 ASP.NET Core、MVC、Razor Pages 或 SPA 架構處理。

## Scope

適用於：

- `.aspx` page。
- `.ascx` user control。
- `.master` master page。
- code-behind：`.aspx.cs`、`.ascx.cs`、`.master.cs`。
- server controls、GridView、Repeater、DropDownList、Button、TextBox。
- ViewState、PostBack、Page Lifecycle。
- validators、UpdatePanel、ScriptManager、AJAX Control Toolkit。
- WebForms 與 ADO.NET / stored procedure / MSSQL / Oracle 的整合。

## Required Version Context

| Item | Evidence |
|---|---|
| .NET Framework Version | `.csproj`、`web.config` |
| Page / Control Type | `.aspx`、`.ascx`、`.master` |
| Code-behind Pattern | partial class、designer file、event handler |
| ViewState Usage | page / control / grid state |
| PostBack Flow | IsPostBack、event lifecycle |
| Data Binding Pattern | SqlDataSource、ObjectDataSource、manual bind、GridView |
| Authentication / Session | forms auth、session、role、permission |
| Browser / Frontend Constraints | legacy JS、jQuery、UpdatePanel、IE compatibility，如有 |

若 page lifecycle 或 ViewState 會影響修正但不可判斷，必須標示 `Needs More Evidence`。

## WebForms Lifecycle Rules

實作前必須考慮：

1. Page Init。
2. LoadViewState。
3. LoadPostData。
4. Page Load。
5. Control events。
6. PreRender。
7. SaveViewState。
8. Render。

常見風險：

- 在每次 Page_Load 重綁資料導致使用者輸入被覆蓋。
- 忘記檢查 `IsPostBack`。
- 動態控制項建立時機錯誤。
- ViewState 過大或資料不同步。
- GridView paging / sorting / selection 狀態錯誤。
- UpdatePanel partial postback 行為與 full postback 不一致。

## Code-behind Rules

應維持既有：

- event handler 命名。
- partial class pattern。
- designer file 不手動亂改，除非明確需要。
- data binding 位置。
- validation flow。
- permission check flow。

不得為小改動導入 MVC / SPA / ASP.NET Core 架構。

## Data Binding Rules

必須確認：

- 資料綁定是否只在正確 lifecycle 執行。
- filter / sort / paging 是否保留。
- GridView / Repeater 欄位是否與資料來源一致。
- dropdown selected value 是否在 postback 後保留。
- hidden field / ViewState / Session 是否有安全風險。

## Security Notes

必須檢查：

- ViewState MAC / validation 是否未被破壞。
- Request validation / input validation。
- XSS：Label、Literal、Response.Write、innerHTML。
- CSRF，如有狀態改變操作。
- 權限檢查是否在 server-side 執行。
- hidden field 不可視為可信資料。

## Testing Notes

WebForms 測試多半需要 manual / integration dry run：

- 首次載入。
- PostBack。
- Validation failure。
- Grid paging / sorting。
- Session expired。
- 權限不同角色。
- DB data state 差異。
- Browser compatibility，如 legacy requirement 存在。

Dry Run 不可標示為 Pass；未實際執行 UI / integration test 時應標示 `Not Tested`。

## Release Notes

Release 應考慮：

- `.aspx`、`.ascx`、`.master`、code-behind、designer 是否同步。
- bin deployment。
- web.config。
- app pool recycle。
- ViewState / Session compatibility。
- static script / CSS cache。
- rollback file list。

## Review Checklist

| Area | Check |
|---|---|
| Lifecycle | Page_Load / IsPostBack / event order 是否正確 |
| ViewState | 狀態是否過大、錯誤或有安全風險 |
| Data Binding | paging、sort、selected value 是否維持 |
| Compatibility | 是否維持 WebForms / ASP.NET Framework 模式 |
| Security | XSS、CSRF、server-side permission、hidden field trust |
| Release | aspx / code-behind / designer / bin / config 是否同步 |

## Output Format

```markdown
# WebForms Compatibility Notes

## Page / Control Context

| Item | Value | Evidence / Notes |
|---|---|---|
| Page / Control | | |
| Code-behind | | |
| Master Page | | |
| ViewState Usage | | |
| PostBack Flow | | |
| Data Binding Pattern | | |

## Lifecycle Risks

## Data Binding Risks

## Security Notes

## Test / Dry Run Notes

## Release / Rollback Notes

## Gate Recommendation
```
