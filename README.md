# skills-hub (MCP Skills Collection)

這是一個「技能集合專案」(skills hub)：
- 用 **monorepo/workspaces** 管理多個 MCP Server（每個 server = 一個 skill/package）
- 方便你後續新增/拆分工具、共用套件、版本控管
- 在 `.gemini/settings.json` 內註冊各個 MCP server，讓 Gemini CLI 可以呼叫工具

> 首次進 Gemini CLI 後請用 `/permissions` 把 skills-hub 設為 Trusted（或依你的安全策略維持 `trust=false`）。

## 目前內建 skills
- `packages/redmine-mcp`：Redmine 工具（列出議題、讀取議題）
- `packages/file-mcp`：本機檔案/資料夾工具（list/read/write 等）
- `packages/dev-doc-mcp`：文件產生工具（需求文件/Runbook/Deploy guide/MsSQL schema docs）

## 快速開始

```bash
cd skills-hub
npm install

# 測試 MCP server 是否能啟動
npm run dev:redmine
npm run dev:file
npm run dev:devdocs

# MCP Inspector測試呼叫工具 (根目錄執行)
npx @modelcontextprotocol/inspector -- node ./packages/dev-doc-mcp/index.js

# 執行 gemini
npx -y @google/gemini-cli
```

> 提醒：`redmine-mcp` 需要 `REDMINE_API_KEY`（以及可選的 `REDMINE_URL`）

## 新增一個 skill
1. 複製 `packages/_template` 成 `packages/<new-skill>`
2. 修改 `package.json` 的 name/bin
3. 在 `index.js` 用 `server.tool(...)` 加工具
4. 在 `.gemini/settings.json` 註冊 server

## Gemini CLI 連線
請參考：
- `docs/gemini-setup.md`
- `.gemini/settings.json`（本 repo 也放了一份可直接用的設定）
