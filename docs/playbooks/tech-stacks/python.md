# Python Playbook

此 Playbook 定義 Python 專案在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

Python 不等同於最新版 Python。針對既有專案時，必須先確認 Python runtime、dependency manager、package versions、execution environment 與既有 coding pattern。

## Scope

適用於：

- Python application、script、batch、job、service。
- data processing、ETL、automation、CLI。
- FastAPI、Flask、Django 或其他 Python framework，如既有專案使用。
- pytest、unittest、nose 或自訂測試方式。
- BigQuery、MSSQL、Oracle、Looker / API integration。

## Required Version Context

| Item | Evidence |
|---|---|
| Python Runtime | `.python-version`、runtime image、CI、README、deployment config |
| Dependency Source | `requirements.txt`、`pyproject.toml`、`Pipfile`、`poetry.lock`、`uv.lock` |
| Framework | FastAPI / Flask / Django / Airflow / custom / none |
| Package Versions | lock file、requirements pinning、constraints file |
| Execution Mode | script、job、service、notebook、container、serverless |
| Test Framework | pytest / unittest / existing custom runner |
| Type Checking | mypy / pyright / none |
| Data Platform | MSSQL / Oracle / BigQuery / file / API / unknown |

若 Python version 或 dependency version 不明，必須標示 `Needs More Evidence`。

## Version Compatibility Rules

不得無腦使用：

- 目標 runtime 不支援的 syntax。
- 目標 runtime 不支援的 standard library API。
- 未確認 dependency version 才有的 API。
- 未確認可用的 typing 語法。
- 未確認可用的 async pattern。
- 未確認可用的新 package。

常見風險：

- Python 3.8 / 3.9 / 3.10 / 3.11 / 3.12 語法差異。
- timezone-aware datetime。
- pandas / numpy / SQLAlchemy / requests / pydantic version 差異。
- Windows / Linux path 差異。
- encoding / newline 差異。

## Coding Conventions

應優先維持：

- 既有 package structure。
- 既有 import style。
- 既有 logging pattern。
- 既有 config loading pattern。
- 既有 exception handling。
- 既有 data access 或 API client pattern。
- 既有 type hint 風格。

不要為小改動引入新 dependency、formatter 或架構重組。

## Configuration and Secrets

必須檢查：

- secrets 是否來自 env、secret manager 或 config file。
- 不得 commit token、password、connection string。
- log 不得輸出敏感值。
- config default 不得指向 production。

## Data Access Rules

若涉及 DB / Data：

- 應確認 DB platform：MSSQL、Oracle、BigQuery 或其他。
- 使用 parameterized query。
- 避免 full table scan 或 unbounded export。
- 確認 connection lifecycle。
- 確認 batch retry / idempotency。
- DB 影響需 handoff 給 DB Agent。

## Testing Notes

測試需依既有專案：

- pytest。
- unittest。
- integration test。
- dry run script。
- sample input / output。
- DB-assisted dry run。

若無法執行測試，應標示 `Not Tested` 或 `Needs More Evidence`。

## Review Checklist

| Area | Check |
|---|---|
| Runtime | 語法與 API 是否符合 Python version |
| Dependency | 是否符合 lock / requirements |
| Error Handling | exception、logging、retry 是否合理 |
| Data Safety | DB / file / API 操作是否 bounded |
| Compatibility | OS path、encoding、timezone 是否處理 |
| Testing | pytest / unittest / dry run evidence 是否完整 |
| Security | secrets、input validation、dependency risk |

## Output Format

```markdown
# Python Compatibility Notes

## Version Context

| Item | Value | Evidence / Notes |
|---|---|---|
| Python Runtime | | |
| Dependency Source | | |
| Framework | | |
| Execution Mode | | |
| Test Framework | | |
| Data Platform | | |

## Existing Patterns

## Implementation Constraints

## Data / Integration Notes

## Test / Dry Run Notes

## Compatibility Risks

## Gate Recommendation
```
