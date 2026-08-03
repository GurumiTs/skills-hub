---
name: developer-implementer
description: Use for approved code changes, bug fixes, refactoring, or configuration changes that must follow the target project's actual language, runtime, dependency, build, and file-encoding evidence. Do not use for requirement decisions, DB connection work, final review, security sign-off, or release approval.
---
# Developer Implementer Skill

## Capability

提供受控程式實作能力。此 Skill 定義「如何判斷並實作」，角色、核准與 handoff 仍由 Developer Agent 與 `GEMINI.md` 管理。

## Evidence Priority

依下列順序判斷，不以本機已安裝最新版或一般最佳實務覆蓋專案證據：

1. Workflow State 的 Project Context Snapshot 與 fingerprint
2. Project / solution / runtime declarations
3. Package manifest
4. Lock / resolved dependency source
5. Build、compiler、hosting、deployment settings
6. Existing source syntax and project conventions
7. Same-directory / same-extension encoding evidence
8. User-provided verified context

Snapshot fingerprint 未變更時重用；只有缺失、衝突或變更時才重新分析原始 manifests。

## Compatibility Method

- C# / .NET：依 `.sln`、project files、`global.json`、`packages.config`、`web.config` 判斷；legacy ASP.NET Framework / WebForms 不得誤用 ASP.NET Core 或高版本 C#。
- Node.js / TypeScript：依 `package.json`、lock file、`tsconfig.json` 與既有 scripts。
- Python：依 `pyproject.toml`、requirements / lock files 與 runtime constraints。
- Java：依 JDK、Maven / Gradle 與 framework versions。
- PowerShell：區分 Windows PowerShell 5.1 與 PowerShell 7+。
- 技術細節只有在適用時才讀取對應 `docs/playbooks/tech-stacks/`；不得無條件載入全部 playbooks。

## Dependency Rules

- Direct dependency 以 manifest 為準，resolved dependency source 以 lock file 為準。
- 不主動新增、升級、移除 dependency 或更新 lock file。
- 需要 dependency change 時先停止，列出理由、相容性、影響與 rollback，等待核准。
- 不從 connection string、secret 或環境 credential 推導 dependency 或 DB 行為。

## Encoding Decision

1. 修改既有檔案：先 `inspect_text_encoding`，寫入時 preserve encoding、BOM、line ending。
2. 新增檔案：先檢查同目錄同副檔名；其次使用 Project Context encoding policy。
3. 無專案證據時：legacy ASP.NET Framework / WebForms 相關文字檔可使用 `utf8-bom`；JSON 與現代跨平台檔案使用 `utf8`。
4. 寫入後必須使用 file-mcp 回傳的 post-write verification；失敗時停止。

## Implementation Workflow

1. 驗證 approval、scope、target project、Acceptance Criteria 與 Project Context。
2. 只讀取本次變更直接相關檔案。
3. 依 evidence 選擇相容語法、API、dependency 與檔案格式。
4. 以最小、可 rollback 變更實作。
5. 記錄 modified files、dependency/build notes、encoding verification 與 self-test。
6. 發現 scope、DB、security、version 或 evidence 缺口時停止並 handoff。

## Quality Gate

完成前確認：

- 實作未超出 approved scope。
- Language / framework / dependency / build evidence 可追蹤。
- Connection string value 與 secrets 未被使用或輸出。
- 既有檔案 encoding / BOM / line ending 已保留。
- 新檔 encoding 有 evidence。
- 未執行測試不標示 Pass。
- 已提供 rollback direction 與 Test handoff。

## Output Contract

- Project Context Used
- Modified Files with Encoding Verification
- Dependency / Build Notes
- DB Notes
- Implementation Summary
- Self-test Instructions
- Risks / Follow-up
- Handoff and Gate Status
