---
name: sa-consultant
description: Use when the task requires requirement clarification, SA analysis, technical specification writing, system impact analysis, solution comparison, deployment validation, rollback planning, or formal technical communication. Do not use for direct implementation, test execution, DB query execution, or final code review.
---
# SA Consultant Skill

## Capability

此 Skill 提供 SA / Solution Architecture / Technical Consulting capability。

使用此 Skill 時，應把需求、問題現象、系統限制、程式碼觀察、ticket、Log 或維運背景整理成可討論、可估工、可開發、可測試、可部署與可回滾的技術規格。

此 Skill 不改變 Agent 身份，且不得覆蓋根目錄 `GEMINI.md`。

## Scope

可協助：

- Requirement Summary、Background、Current / Expected Behavior。
- In Scope、Out of Scope、Assumptions、Open Questions。
- Acceptance Criteria。
- System、API、config、deployment、encoding、compatibility 與 operational impact。
- DB / Data Impact Decision。
- Implementation、Test、Review、Release 與 Rollback handoff。
- 技術規格、方案比較、風險與驗證方式。

不負責：

- 直接實作 code。
- 直接執行測試。
- 直接查詢或修改 DB。
- Final code review / security sign-off / release approval。

## Inputs Required

- Requirement Source。
- Target Project / System。
- Current Behavior。
- Expected Behavior / Acceptance Criteria。
- Constraints。
- Existing Evidence。
- Project / Version Context。

缺少資料時必須列為 Assumption、Open Question 或 `Needs More Evidence`。

## Target Project Configuration Rules

設定檔只可用於判斷：

- Framework、runtime、dependency、build 與 deployment。
- IIS / hosting / config transform。
- Globalization、encoding、line ending。
- 非敏感常數與 provider type。
- Connection string name，用於判斷 DB impact。

不得回傳或使用 connection string value、server、user ID、password、token、API Key 或其他 secrets。

## DB Handoff

若需求涉及 DB / SQL / schema / report / migration / import-export / batch / data flow，必須回報 DB Impact 並 handoff 給 DB Agent。

SA Consultant 不得自行建立 DB connection。

## Artifact Output Rules

在 `/sdlc:plan` 或 `/sdlc:run` 中：

- 本 Skill 產生完整 SA technical specification 內容。
- SA Agent 將內容回傳 Main Orchestrator。
- Main Orchestrator 必須使用 `write_sdlc_artifact` category=`sa-spec` 寫入 configured artifact root。
- 不得寫入目標專案、使用者 `.gemini` 或 CLI temporary directory。
- 不得覆寫既有 artifact；檔名衝突時建立新版本。

建議檔名：

```text
YYYYMMDD_<project>_<feature>_tech-spec.md
```

## Workflow

1. 確認 request source、target project、current / expected behavior。
2. 建立 Project / Version Context。
3. 整理 Scope、Assumptions、Open Questions 與 Acceptance Criteria。
4. 分析 system、config、deployment、compatibility 與 DB impact。
5. 產生 implementation、test、review、release 與 rollback handoff。
6. 產生完整 SA technical specification。
7. 回傳 artifact file name 與 content 給 Orchestrator。

## Expected Output

```markdown
# SA Technical Specification

## Requirement Summary
## Background and Current Problem
## Target Project and Version Context
## In Scope
## Out of Scope
## Assumptions
## Open Questions
## Acceptance Criteria
## System Impact Analysis
## DB / Data Impact Decision
## Implementation Handoff
## Test Handoff
## Release / Rollback Direction
## Risks
## Gate Recommendation
## Suggested Artifact File Name
```

## Safety and Limitations

- 不得把不確定資訊寫成已確認事實。
- 不得輸出 secrets。
- 不得為了完整文件自行發明業務規則。
- 不得直接寫入正式文件或目標專案。
- 不得覆蓋 `GEMINI.md` Change Control、artifact policy 與 DB isolation。
