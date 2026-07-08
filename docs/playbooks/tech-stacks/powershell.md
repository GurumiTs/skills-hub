# PowerShell Playbook

此 Playbook 定義 PowerShell 腳本、模組、維運自動化、部署輔助與排程任務在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

PowerShell 必須區分 Windows PowerShell 5.1 與 PowerShell 7+。不得在未確認 runtime 時使用不相容語法、module 或跨平台行為。

## Scope

適用於：

- `.ps1` script。
- `.psm1` module。
- `.psd1` module manifest。
- deployment helper script。
- maintenance / operation script。
- Windows scheduled task、IIS / Windows service 操作。
- DB / API / file automation。

## Required Version Context

| Item | Evidence |
|---|---|
| PowerShell Runtime | Windows PowerShell 5.1 / PowerShell 7+ / unknown |
| OS Context | Windows Server / Linux / container / unknown |
| Module Manifest | `.psd1` |
| Required Modules | `#Requires`、Import-Module、module version |
| Execution Policy | Restricted / RemoteSigned / Bypass / unknown |
| Permission Context | user、service account、admin、least privilege |
| Script Purpose | deploy、maintenance、diagnostic、data operation、automation |
| External Systems | IIS、Windows Service、DB、API、file share、cloud CLI |

若 runtime、permission 或 target environment 不明，必須標示 `Needs More Evidence`。

## Runtime Compatibility Rules

必須確認：

- 是否只能在 Windows PowerShell 5.1 執行。
- 是否需要 PowerShell 7+。
- module 是否支援該 runtime。
- path / encoding / newline / culture 是否會影響結果。
- `ForEach-Object -Parallel` 等功能是否可用。
- error handling 是否符合 `$ErrorActionPreference`。

不得無腦使用 PowerShell 7+ 語法或 module。

## Safety and Mutation Boundary

PowerShell 常用於高風險操作，實作前必須分清楚：

| Operation | Default |
|---|---|
| Read file / list status | Read-only allowed |
| Write file / overwrite config | Needs approval |
| Restart service / IIS / app pool | Needs approval |
| Update registry | Needs approval |
| Invoke DB mutation | Needs approval and DB review |
| Delete / move / archive files | Needs approval |
| Update remote system | Needs approval |

優先提供 `-WhatIf`、`-Confirm`、dry run 或 read-only mode。

## Coding Conventions

應優先維持：

- approved verbs。
- parameter block。
- comment-based help，如既有使用。
- strict mode，如既有使用。
- logging / transcript pattern。
- exit code behavior。
- module import pattern。

## Error Handling

必須檢查：

- `$ErrorActionPreference`。
- try / catch。
- non-terminating error。
- exit code。
- external process return code。
- retry / timeout。
- log 是否輸出 secrets。

## Testing Notes

可使用：

- dry run。
- `-WhatIf`。
- Pester tests，如既有專案使用。
- mock external command。
- read-only validation。
- sample input / output。

未實際執行時不得宣稱 Pass。

## Review Checklist

| Area | Check |
|---|---|
| Runtime | Windows PowerShell 5.1 / PowerShell 7+ 是否相容 |
| Permission | 是否需要 admin / service account |
| Mutation | 是否提供 dry run / WhatIf / confirmation |
| Error Handling | terminating / non-terminating error 是否處理 |
| Security | secrets、credential、token 是否安全 |
| Idempotency | 重複執行是否安全 |
| Rollback | 檔案、設定、service 狀態是否可回復 |

## Output Format

```markdown
# PowerShell Compatibility Notes

## Version Context

| Item | Value | Evidence / Notes |
|---|---|---|
| PowerShell Runtime | Windows PowerShell 5.1 / PowerShell 7+ / Unknown | |
| OS Context | | |
| Required Modules | | |
| Execution Policy | | |
| Permission Context | | |
| Script Purpose | | |

## Existing Patterns

## Mutation Risk

## Dry Run / WhatIf Plan

## Security Notes

## Test Notes

## Rollback Notes

## Gate Recommendation
```
