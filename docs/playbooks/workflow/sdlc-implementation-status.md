# SDLC Pipeline Implementation Status

本文件記錄 `feature/sdlc_pipeline` 分支目前已落地的 SDLC Pipeline 內容。

## Branch

```text
feature/sdlc_pipeline
```

## Implemented Commands

| Command | File | Purpose |
|---|---|---|
| `/sdlc:plan` | `.gemini/commands/sdlc/plan.toml` | Read-only planning: requirement intake, SA analysis, DB impact, implementation plan |
| `/sdlc:run` | `.gemini/commands/sdlc/run.toml` | Controlled full pipeline orchestration with gate checks |
| `/sdlc:implement` | `.gemini/commands/sdlc/implement.toml` | Implement an approved plan |
| `/sdlc:review` | `.gemini/commands/sdlc/review.toml` | Test, DB review, code review, security review |
| `/sdlc:release` | `.gemini/commands/sdlc/release.toml` | Release, rollback, UAT, handover package |

## Implemented Agents

| Agent | File |
|---|---|
| Workflow Orchestrator | `.gemini/agents/workflow-orchestrator.md` |
| SA Agent | `.gemini/agents/sa-agent.md` |
| Developer Agent | `.gemini/agents/developer-agent.md` |
| DB Agent | `.gemini/agents/db-agent.md` |
| Test Agent | `.gemini/agents/test-agent.md` |
| Review Agent | `.gemini/agents/review-agent.md` |
| Security Agent | `.gemini/agents/security-agent.md` |
| Release Agent | `.gemini/agents/release-agent.md` |
| Incident Agent | `.gemini/agents/incident-agent.md` |

## Implemented Skills

| Skill | File |
|---|---|
| SA Consultant | `.gemini/skills/sa-consultant/SKILL.md` |
| Developer Implementer | `.gemini/skills/developer-implementer/SKILL.md` |
| DB Engineering | `.gemini/skills/db-engineering/SKILL.md` |
| Test Engineer | `.gemini/skills/test-engineer/SKILL.md` |
| Code Reviewer | `.gemini/skills/code-reviewer/SKILL.md` |
| Security Reviewer | `.gemini/skills/security-reviewer/SKILL.md` |
| Release Ops | `.gemini/skills/release-ops/SKILL.md` |
| Incident RCA | `.gemini/skills/incident-rca/SKILL.md` |

## Implemented MCP Servers

| MCP Server | File | Purpose | Safety Model |
|---|---|---|---|
| Git MCP | `packages/git-mcp/index.js` | Read-only git status, diff, changed files, log | Allow roots via `GIT_MCP_ROOTS` / `FILE_MCP_ROOTS` |
| DB Metadata MCP | `packages/db-metadata-mcp/index.js` | SQL Server metadata: tables, columns, indexes, routines | Metadata-only queries, requires read-only connection |
| Test Runner MCP | `packages/test-runner-mcp/index.js` | Run allowlisted test commands | Allow roots + allowlisted command arrays |
| Static Analysis MCP | `packages/static-analysis-mcp/index.js` | Detect project stack and run allowlisted lint/build commands | Allow roots + allowlisted command arrays |
| Secret Scan MCP | `packages/secret-scan-mcp/index.js` | Local read-only secret pattern scanning with masked findings | Allow roots, masked output, excludes common generated folders |

## Implemented Playbooks

| Playbook | File |
|---|---|
| SDLC Pipeline | `docs/playbooks/workflow/sdlc-pipeline.md` |
| Workflow State | `docs/playbooks/workflow/workflow-state.md` |
| SDLC Usage | `docs/playbooks/workflow/sdlc-usage.md` |
| Tech Stack Index | `docs/playbooks/tech-stacks/README.md` |
| Database Index | `docs/playbooks/database/README.md` |
| Testing Index | `docs/playbooks/testing/README.md` |
| Review Index | `docs/playbooks/review/README.md` |
| Security Index | `docs/playbooks/security/README.md` |
| Release Index | `docs/playbooks/release/README.md` |
| Incident Index | `docs/playbooks/incident/README.md` |

## Updated Runtime Files

| File | Change |
|---|---|
| `package.json` | Added npm dev scripts for SDLC MCP servers |
| `.gemini/settings.json` | Registered Git, DB Metadata, Test Runner, Static Analysis, and Secret Scan MCP servers |
| `.gemini/.env.example` | Added environment variable examples for SDLC MCP servers |

## Known Limitations

| Limitation | Notes |
|---|---|
| Pipeline is command-driven, not deterministic engine | `/sdlc:*` commands guide Gemini CLI through the workflow but do not replace user gate decisions |
| Physical file changes still require approval | Commands, agents, and MCP tools must follow `GEMINI.md` Change Control |
| DB Metadata MCP currently targets SQL Server | Oracle / BigQuery support can be added later as separate metadata adapters or MCP tools |
| Test / static analysis commands are allowlist-based | Users must configure project-appropriate commands in `.gemini/.env` |
| Secret scan is heuristic | It helps detect common patterns but does not replace dedicated enterprise secret scanning |
| Content quality still needs tuning | User has confirmed discovery works; detailed prompt compliance review remains future refinement |

## Validation Checklist

Run in Gemini CLI after checking out this branch:

```text
/permissions trust
/memory refresh
/skills reload
/agents reload
/commands reload
/mcp reload
/skills list
/agents list
/commands list
/mcp
```

Expected commands:

```text
/sdlc:plan
/sdlc:run
/sdlc:implement
/sdlc:review
/sdlc:release
```

Expected MCP servers:

```text
git
dbMetadata
testRunner
staticAnalysis
secretScan
```

## Local MCP Smoke Test Commands

```bash
npm install
npm run dev:git
npm run dev:dbmetadata
npm run dev:testrunner
npm run dev:static
npm run dev:secrets
```

For interactive tool-level testing, use MCP Inspector. Example:

```bash
npx @modelcontextprotocol/inspector -- node ./packages/git-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/db-metadata-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/test-runner-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/static-analysis-mcp/index.js
npx @modelcontextprotocol/inspector -- node ./packages/secret-scan-mcp/index.js
```
