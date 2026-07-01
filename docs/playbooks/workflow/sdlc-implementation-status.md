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

## Known Limitations

| Limitation | Notes |
|---|---|
| MCP Phase 3 not yet implemented | Git MCP, DB Metadata MCP, Test Runner MCP, Static Analysis MCP, Secret Scan MCP are still future work |
| Pipeline is command-driven, not deterministic engine | `/sdlc:*` commands guide Gemini CLI through the workflow but do not replace user gate decisions |
| Physical file changes still require approval | Commands and agents must follow `GEMINI.md` Change Control |
| README current feature table may need follow-up sync | This status file records the feature branch implementation state |

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
