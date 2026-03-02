# Skill Template – GEMINI.md

> Purpose: This file provides **per-skill rules & usage notes** for Gemini CLI when interacting with this MCP server.
> Copy this file into a new skill folder (e.g., `packages/<new-skill>/GEMINI.md`) and update placeholders.

---

## 1) Skill Overview

- **Skill Name:** {{SKILL_NAME}}
- **MCP Server Alias (in .gemini/settings.json):** {{SERVER_ALIAS}}
- **Description:** {{SHORT_DESCRIPTION}}
- **Primary Use Cases:**
  - {{USE_CASE_1}}
  - {{USE_CASE_2}}
  - {{USE_CASE_3}}

---

## 2) Environment Variables

This skill expects the following environment variables to be available via:
- `skills-hub/.gemini/.env` (recommended for project-level secrets)
- AND/OR OS environment variables (for machine-wide secrets)

**Required**
- {{ENV_REQUIRED_1}}=
- {{ENV_REQUIRED_2}}=

**Optional**
- {{ENV_OPTIONAL_1}}=
- {{ENV_OPTIONAL_2}}=

**Notes**
- Do **not** commit real secrets into git.
- Provide `.env.example` for teammates / deployment reference.

---

## 3) Tools

> Tool names shown here use the typical `{{SERVER_ALIAS}}__{{TOOL_NAME}}` pattern.
> Always verify actual tool names in Gemini CLI with `/mcp`.

### Read-only tools (safe)
- `{{SERVER_ALIAS}}__{{READ_TOOL_1}}` – {{READ_TOOL_1_DESC}}
- `{{SERVER_ALIAS}}__{{READ_TOOL_2}}` – {{READ_TOOL_2_DESC}}

### Mutating tools (may change data/files)
- `{{SERVER_ALIAS}}__{{MUTATE_TOOL_1}}` – {{MUTATE_TOOL_1_DESC}}
- `{{SERVER_ALIAS}}__{{MUTATE_TOOL_2}}` – {{MUTATE_TOOL_2_DESC}}

---

## 4) Safety & Approval Policy

### 4.1 Read-only operations
For read-only actions (e.g., listing, reading, inspecting), you may proceed directly.
- Always minimize scope: prefer a specific file/path/query rather than scanning wide directories/projects.
- Avoid returning huge outputs; summarize and offer to fetch specific sections.

### 4.2 Mutating operations (MUST ask for approval first)
Before calling any tool that **modifies** data or filesystem (write/append/delete/move/copy/create/update), you MUST:

1) **Do not call the tool yet.**
2) Provide a short proposal including:
   - The exact tool name(s) you plan to call
   - Target path(s)/record(s)
   - What will change (brief summary)
   - Risks (overwrite, data loss, wrong scope, permission issues)
   - Rollback plan (how to revert)
3) Ask: **"Do you approve executing these changes?"**
4) Only proceed after the user explicitly approves.

---

## 5) Usage Examples (copy/paste friendly)

### Example A – read-only
**User request**
- "Read {{EXAMPLE_TARGET}} and summarize key points."

**Expected approach**
- Call `{{SERVER_ALIAS}}__{{READ_TOOL_1}}` with a narrow target.
- Summarize; if large, propose extracting only relevant sections.

### Example B – mutating (requires approval first)
**User request**
- "Update {{EXAMPLE_TARGET}} with these changes: ..."

**Expected approach**
1) Provide proposal:
   - Tools: `{{SERVER_ALIAS}}__{{MUTATE_TOOL_1}}`
   - Changes: ...
   - Risks: ...
   - Rollback: ...
2) Ask for approval
3) After approval, execute tool call(s)
4) Report what changed + how to verify

---

## 6) Verification Checklist (for the user)

After changes (when approved), provide:
- List of modified targets (files/records)
- What to test and how:
  - {{VERIFY_STEP_1}}
  - {{VERIFY_STEP_2}}
- Rollback instructions:
  - {{ROLLBACK_STEP_1}}

---

## 7) Troubleshooting

- If tools do not appear, check:
  1) `.gemini/settings.json` points to correct `command/args/cwd`
  2) required env vars exist in `.gemini/.env`
  3) folder is **Trusted** (run `/permissions`)
  4) run `/mcp` to confirm server is connected

- If paths are blocked:
  - Ensure the target directory is included in workspace scope (e.g., `/directory add <path>`)
  - Or restrict to allowed roots if the skill enforces allowlisting