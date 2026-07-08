# Prompting Playbook

此 Playbook 定義 Prompt、Agent prompt、Skill prompt、Command prompt、system / developer / user role 邊界與輸出格式設計的 review 規則。

本 repo 的 prompts 是給 Gemini CLI 作為使用者的開發顧問與工作助理使用。設計 prompt 時不得混入本 ChatGPT 專案身分，也不得把 Gemini CLI 官方沒有的功能描述成官方能力。

## Scope

適用於：

- `.gemini/commands/**/*.toml` prompt。
- `.gemini/agents/*.md` agent 定義。
- `.gemini/skills/*/SKILL.md` skill 定義。
- `GEMINI.md` governance prompt。
- docs/playbooks 中給 Gemini CLI 參考的規則。
- MCP tool usage instructions。
- 輸出格式、Gate、Handoff、Change Control、Safety rule。

## Prompt Layering Rules

本 repo 應維持以下分層：

| Layer | Responsibility |
|---|---|
| `GEMINI.md` | 共通治理規則、Change Control、安全限制、repository-wide behavior |
| Command | 使用者可呼叫的 workflow entry，例如 `/sdlc:plan` |
| Agent | 角色、責任邊界、handoff、stop condition |
| Skill | 專業能力、workflow、output format、limitations |
| Playbook | 技術棧、DB、testing、release、incident 參考規則 |
| MCP | 實際工具能力，不應在 prompt 中假裝不存在的工具 |

不得把 README 寫成 Gemini 執行規則。不得把 `GEMINI.md` 寫成 MCP 或 Skill registry。不得把 playbook index 宣稱為 Gemini CLI 官方 routing。

## Role Boundary Rules

Prompt 應清楚區分：

- system / developer / user role。
- Agent role vs Skill capability。
- Command workflow vs MCP tool ability。
- Read-only analysis vs mutation。
- Planning / Dry Run / Execution。
- Confirmed fact vs assumption vs open question。

不應讓 Gemini 以為自己是 ChatGPT 專案工程師。應自然描述為使用者的開發顧問與工作助理。

## Official Capability Boundary

當提到 Gemini CLI 功能時，只能依已確認官方能力描述，例如：

- project custom commands。
- `@{...}` file content injection。
- `GEMINI.md` context。
- `.gemini/settings.json` configuration。
- MCP tools。

不得宣稱：

- Gemini CLI 有官方 SDLC pipeline engine，除非官方文件明確支援。
- Gemini CLI 會自動 playbook routing。
- Gemini CLI 會自動 enforcement Gate / Workflow State。
- MCP tool 一定存在或一定支援特定 DB / CI / Q System。

## Version and Context Rules

Prompt 若涉及程式開發，必須要求：

- 先確認既有專案版本。
- 不無腦套用最新版語法。
- 不把缺少版本資訊的情況視為可直接實作。
- 在輸出中列出 Version Context。
- 在輸出中列出 Playbooks Used。
- 缺少 playbook 或 evidence 時標示 `Needs More Evidence`。

## Safety and Change Control Rules

Prompt 應明確區分：

| Operation | Requirement |
|---|---|
| Read-only analysis | 可在 scope 內執行 |
| File modification | 需使用者明確同意 |
| DB metadata query | 需 read-only tool、connection_key 與 safety check |
| DB mutation | 需明確 approval、rollback、validation |
| Test execution | 需確認 mutation risk |
| Q System / external update | 需使用者明確同意 |
| Deploy / release | prompt 不得直接執行，只能產出 plan |

## Output Format Rules

Prompt output 應具備：

- 清楚標題。
- 表格化 status / gate / evidence。
- `Project / Version Context`。
- `Playbooks Used`。
- `Blocking Issues`。
- `Gate Decision Required`。
- `Required Next Command`，若在 SDLC pipeline 中。

不應產生模糊結論，例如：

```text
看起來應該可以。
```

應具體輸出：

```text
Gate Status: Ready for Approval / Blocked / Needs More Evidence
Reason: ...
```

## Prompt Review Checklist

| Area | Check |
|---|---|
| Layering | 是否符合 Command / Agent / Skill / Playbook / MCP 分層 |
| Official Boundary | 是否避免宣稱不存在的 Gemini CLI 官方功能 |
| Version Context | 是否要求既有專案版本從嚴 |
| Safety | 是否區分 read-only / mutation / external update |
| Evidence | 是否區分 confirmed facts / assumptions / open questions |
| Gate | 是否有 Gate Status 與 stop condition |
| Output | 是否有可交接的格式 |
| Identity | 是否避免混入 ChatGPT 專案身分 |

## Output Format

```markdown
# Prompt Review Notes

## Prompt Type

Command / Agent / Skill / Playbook / MCP instruction / Other

## Layering Check

## Official Capability Boundary Check

## Version Context Rule Check

## Safety / Change Control Check

## Output Format Check

## Findings

| Severity | Finding | Impact | Recommendation |
|---|---|---|---|

## Gate Recommendation
```
