# Gemini CLI：連線 skills-hub (MCP)

## 1) 在你的工作目錄建立設定檔
在你要用 Gemini CLI 的專案根目錄建立：

- `.gemini/settings.json`

你可以直接複製本 repo 的 `.gemini/settings.json`（再依你的路徑與需求調整）。

## 2) 設定環境變數（避免把 Key 寫死）

### Windows PowerShell
```powershell
$env:REDMINE_API_KEY = "<your_key>"
$env:MSSQL_CONN = "Server=...;Database=...;User Id=...;Password=...;Encrypt=true;TrustServerCertificate=true;"
```

### Windows CMD
```bat
set REDMINE_API_KEY=<your_key>
set MSSQL_CONN=Server=...;Database=...;User Id=...;Password=...;Encrypt=true;TrustServerCertificate=true;
```

### macOS / Linux
```bash
export REDMINE_API_KEY="<your_key>"
export MSSQL_CONN="Server=...;Database=...;User Id=...;Password=...;Encrypt=true;TrustServerCertificate=true;"
```

## 3) 在 Gemini CLI 內確認 MCP server
進入 Gemini CLI 後，可以用 `/mcp` 看目前已配置的 servers 與工具清單。

## 4) 安全建議（很重要）
- `file-mcp` 這種讀/寫檔工具很強大，建議你：
  - 在 server 端加「允許的 root dir 白名單」
  - 或在 Gemini settings 把 `trust` 設成 `false`，每次呼叫都需要你確認

- `dev-doc-mcp` / `redmine-mcp` 通常可維持 `trust=false`，避免工具被無意間大量呼叫。
