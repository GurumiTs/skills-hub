# dev-doc-mcp

A practical MCP server for day-to-day software/web development documentation:

- Requirements docs (stakeholder + developer versions)
- Runbook + Deploy guide
- MsSQL schema documentation (dictionary + Mermaid ER + JSON snapshot)

## Install
From repo root:

```bash
npm install
```

## Run locally

```bash
node packages/dev-doc-mcp/index.js
```

## Configure Gemini CLI
Add a server in `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "devDocs": {
      "command": "node",
      "args": ["./packages/dev-doc-mcp/index.js"],
      "cwd": ".",
      "env": {
        "MSSQL_CONN": "$MSSQL_CONN"
      },
      "trust": false
    }
  }
}
```

## Examples
See:
- `packages/dev-doc-mcp/examples/feature_input.json`
- `packages/dev-doc-mcp/examples/runbook_input.json`
- `packages/dev-doc-mcp/examples/dbdoc_input.json`
