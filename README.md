# skills-hub (MCP Skills Collection)

這是一個「技能集合專案」(skills hub)：
- 用 **monorepo/workspaces** 管理多個 MCP Server（每個 server = 一個 skill/package）
- 方便你後續新增/拆分工具、共用套件、版本控管
- 同時也能在 `.gemini/settings.json` 內 **加入線上的 MCP server**（HTTP / SSE / 甚至用 `npx` 直接跑遠端套件）
- 首次進 CLI 後請用 /permissions 把 skills-hub 設成 Trusted。
## 目前內建兩個 skills
- `packages/redmine-mcp`：Redmine 工具（列出議題、讀取議題）
- `packages/file-mcp`：本機檔案/資料夾讀取工具（list_files / read_file）

## 快速開始

```bash
cd skills-hub
npm install

# 直接在本機跑（測試 MCP server 是否能啟動）
npm run bootstrap #（第一次 / 依賴變動後）
npm run dev:redmine
npm run dev:file

# 執行gemini
npx -y @google/gemini-cli
```

> 提醒：`redmine-mcp` 需要 `REDMINE_API_KEY`（以及可選的 `REDMINE_URL`）

## 新增一個 skill
1. 複製 `packages/_template` 成 `packages/<new-skill>`
2. 修改 `package.json` 的 name/bin
3. 在 `index.js` 用 `server.tool(...)` 加工具

## Gemini CLI 連線
請看 `docs/gemini-settings.example.json` 與 `docs/gemini-setup.md`
