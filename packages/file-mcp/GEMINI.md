## Policy: file-mcp (localFiles) – approval required for mutating operations

### Read-only operations (no pre-approval required)
When using file-mcp / localFiles for **read-only** actions, you may proceed without asking for approval:
- `localFiles__read_file`
- `localFiles__read_file_base64`
- `localFiles__list_directory`
- `localFiles__stat_path`
- `localFiles__head_file`
- `localFiles__tail_file`
- `localFiles__search_text`
- `localFiles__compute_hash`
- `localFiles__get_allowed_roots`

### Mutating operations (MUST ask for approval first)
Before calling any file-mcp / localFiles tool that **modifies** the filesystem, you MUST:
1) **Do not call the tool yet.**
2) Provide a short proposal including:
   - Tool name(s) you plan to call (full tool names)
   - Target path(s)
   - What will change (summary of changes)
   - Risk(s): overwrite / data loss / wrong path / unintended scope
   - Rollback plan (how to revert)
3) Ask: **"Do you approve executing these file-mcp changes?"**
4) Only proceed after the user explicitly approves.

Mutating tools include (but are not limited to):
- `localFiles__write_file`
- `localFiles__append_file`
- `localFiles__delete_path`
- `localFiles__move_path`
- `localFiles__copy_path`
- `localFiles__create_directory`