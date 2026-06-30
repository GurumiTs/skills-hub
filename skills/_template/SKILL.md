---
name: {{SKILL_NAME}}
description: {{SKILL_DESCRIPTION}}
---

# {{SKILL_DISPLAY_NAME}} Skill

> 這是一份 Skill 範例模板。
> 請複製到 `.gemini/skills/<skill-name>/SKILL.md` 後，再依照實際用途調整內容。
>
> 注意：正式 Gemini CLI workspace skills 應放在 `.gemini/skills/<skill-name>/SKILL.md`，並使用 `/skills reload` 與 `/skills list` 驗證是否被 discovery。
>
> 注意：本模板位於 `skills/_template/`，只是給開發者複製用的範例，不是正式 Skill，不應放入 `.gemini/skills/`，避免被 Gemini CLI 誤掃描。
>
> 注意：複製成正式 Skill 後，請移除所有模板說明、範例佔位符與未填寫項目，例如 `{{PLACEHOLDER}}`、`請填寫`、不適用的範例說明等。
>
> 注意：Skill 只應定義「能力、工作流程、輸出格式與限制」，不應取代 Agent 的主要身份。Agent 的角色、責任與 handoff 邊界應由 `.gemini/agents/` 中的 Agent 定義決定。
>
> 注意：Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與回滾要求。

---

## 1. 能力定位

請指定此 Skill 提供哪一種專業能力。

此 Skill 不應宣告「Gemini 應擔任某個角色」，而應描述「使用此 Skill 時，Agent 應套用哪一種能力或工作方法」。

範例：

* SA / Solution Architecture 分析能力
* Developer Implementation 能力
* Code Review 能力
* Test Engineering 能力
* Security Review 能力
* Release / Ops 能力
* Incident RCA 能力

請填寫：

此 Skill 提供以下能力：

> {{CAPABILITY_NAME}}

當此 Skill 被啟用時，使用它的 Agent 應套用 {{CAPABILITY_METHOD}}，協助使用者處理 {{CAPABILITY_TASK_SCOPE}}。

此 Skill 不改變目前 Agent 的主要身份；若本 Skill 由特定 Agent 使用，仍應以該 Agent 的角色定義為主。

---

### 1.1 能力範圍

請列出此 Skill 在任務中應主動協助的內容。

範例：

* 釐清需求、流程、商業邏輯與系統邊界。
* 檢查程式碼正確性、可維護性、相容性與潛在風險。
* 分析 SQL、Schema、資料正確性、效能與交易安全。
* 整理可讀、可維護、可交接的技術文件。

請填寫：

* {{CAPABILITY_SCOPE_1}}
* {{CAPABILITY_SCOPE_2}}
* {{CAPABILITY_SCOPE_3}}

---

### 1.2 使用邊界

此 Skill 不得覆蓋根目錄 `GEMINI.md` 的共通規則，也不得取代 Agent 的主要角色定義。

Gemini 啟用此 Skill 時，仍必須遵守：

* 涉及實體檔案變更時，必須先提出變更提案。
* 不得在使用者明確同意前新增、修改、刪除、搬移或覆寫任何檔案。
* 不得在使用者明確同意前執行會造成檔案異動的指令。
* 不得輸出 API Key、Password、Token、Connection String 或其他敏感資訊。
* 不確定的資訊必須標示為假設，不得寫成已確認事實。
* 若需要寫入檔案，必須先說明風險、變更清單、變更摘要、驗證方式與回滾方式。
* 若 Skill 規則與 `GEMINI.md` 衝突，必須優先遵守 `GEMINI.md`。
* 若 Skill 規則比 `GEMINI.md` 更嚴格，應採用較嚴格的規則。

可依 Skill 需求補充：

* {{CAPABILITY_BOUNDARY_1}}
* {{CAPABILITY_BOUNDARY_2}}

---

## 2. Skill 目的

簡短說明這個 Skill 要解決什麼問題。

請填寫：

這個 Skill 用來協助處理 {{TASK_DESCRIPTION}}。

---

## 3. 使用時機

列出什麼情境下 Gemini 應該使用這個 Skill。

請填寫：

* {{USE_CASE_1}}
* {{USE_CASE_2}}
* {{USE_CASE_3}}

---

## 4. 不使用時機

列出哪些情境不適合使用這個 Skill，避免 Gemini 誤套用。

請填寫：

* {{NON_USE_CASE_1}}
* {{NON_USE_CASE_2}}

---

## 5. 可搭配的工具能力

此 Skill 不應綁定特定 MCP Server 名稱。

請描述此 Skill 在需要外部輔助時，可能會用到哪些「工具能力」，而不是寫死特定 MCP Server alias。

實際可用 MCP Server 應以當前 Gemini CLI 環境、`/mcp` 查詢結果與根目錄 `GEMINI.md` 的 MCP 使用規則為準。

如果此 Skill 不需要任何 MCP Server，也可以明確寫：

> 此 Skill 預設不依賴特定 MCP Server。若任務需要外部資訊，Gemini 應依目前環境中可用的 read-only 工具能力輔助分析，並遵守 `GEMINI.md` 的 MCP 使用規則。

請填寫：

| 工具能力 | 用途 | 使用限制 |
|---|---|---|
| {{TOOL_CAPABILITY_1}} | {{PURPOSE_1}} | {{LIMIT_1}} |
| {{TOOL_CAPABILITY_2}} | {{PURPOSE_2}} | {{LIMIT_2}} |

---

## 6. 預期輸入

說明使用者通常會提供哪些資料。

請填寫：

* {{INPUT_1}}
* {{INPUT_2}}
* {{INPUT_3}}

---

## 7. 預期輸出

說明這個 Skill 最後應該產出什麼。

請填寫：

* {{OUTPUT_1}}
* {{OUTPUT_2}}
* {{OUTPUT_3}}

---

## 8. 工作流程

用簡短步驟描述 Gemini 應該怎麼處理任務。

範例：

1. 先確認任務目標、目標專案與使用者期望輸出。
2. 整理已知資訊、限制、假設與待確認事項。
3. 判斷是否需要使用 read-only MCP 工具補充上下文。
4. 若需要讀取專案檔案，僅讀取與任務相關的範圍。
5. 產出分析、建議、文件草稿、測試案例或其他預期輸出。
6. 若需要寫入、修改、刪除、搬移或覆寫任何檔案，必須先提出變更提案並等待使用者明確同意。
7. 完成後回報實際處理內容、驗證方式、風險與必要的回滾方式。

請調整成此 Skill 適用的流程：

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{STEP_4}}

---

## 9. 檔案輸出規則

如果這個 Skill 會產生檔案，請指定預設輸出位置與檔案產生規則。

檔案輸出位置應依任務目標判斷：

* 若 Gemini 是協助使用者處理某個目標專案，輸出位置應優先依照該目標專案的文件結構、使用者指定路徑或該專案既有慣例。
* 若 Gemini 是協助維護本 `skills-hub` repository，對話產生的 Markdown 文件預設放在 `docs/_generated/` 底下。
* 若使用者未指定輸出位置，且任務只是產生草稿、分析紀錄或臨時規格，應優先放在 `_generated`、`drafts`、`temp` 或類似草稿目錄。
* 如果目標路徑可能被 Git 追蹤，寫入前必須提醒使用者。
* 任何實體檔案新增、修改、刪除、搬移或覆寫，都必須先遵守根目錄 `GEMINI.md` 的 Change Control。

請填寫：

預設輸出位置：`{{DEFAULT_OUTPUT_PATH}}`

如果此 Skill 不會產生檔案，請寫：

此 Skill 預設不產生實體檔案。

---

## 10. 安全與限制

列出此 Skill 需要注意的限制。

建議至少保留以下原則：

* 不要輸出 API Key、Password、Token、Connection String、Cookie、私人憑證或其他敏感資訊。
* 寫入、刪除、搬移、覆寫檔案前，必須先取得使用者明確同意。
* 不得在使用者明確同意前執行會造成檔案異動的指令。
* 不確定的資訊請標示為假設，不要寫成已確認事實。
* 如果目標路徑可能被 Git 追蹤，寫檔前必須提醒使用者。
* 若本 Skill 的規則與根目錄 `GEMINI.md` 衝突，必須優先遵守 `GEMINI.md`。
* 若任務涉及正式環境、資料庫異動、部署、權限或資安，必須主動提醒風險與回滾方式。
* 不得將臨時測試方案包裝成正式長期方案。
* 不得擅自擴大任務範圍，讀取或修改與任務無關的內容。

可依 Skill 需求補充：

* {{RULE_1}}
* {{RULE_2}}

---

## 11. 輸出格式

請定義此 Skill 回覆時建議採用的輸出格式。

請填寫：

此 Skill 的建議輸出格式為：

1. {{OUTPUT_FORMAT_1}}
2. {{OUTPUT_FORMAT_2}}
3. {{OUTPUT_FORMAT_3}}

---

## 12. 範例 Prompt

提供 2 到 3 個開發者或使用者可以參考的 Prompt。

請填寫：

```text
{{EXAMPLE_PROMPT_1}}
```

```text
{{EXAMPLE_PROMPT_2}}
```

```text
{{EXAMPLE_PROMPT_3}}
```

---

## 13. 正式化前檢查清單

複製本模板並完成正式 Skill 內容後，請在放入 `.gemini/skills/<skill-name>/SKILL.md` 前檢查：

* 是否已保留 YAML frontmatter，且 `name` 與 `description` 已填寫完成。
* 是否已移除所有不適用的模板說明。
* 是否已移除所有 `{{PLACEHOLDER}}`。
* 是否已移除所有未填寫的「請填寫」內容。
* 是否已確認 Skill 目的、使用時機與不使用時機清楚。
* 是否已確認此 Skill 沒有覆蓋 `GEMINI.md` 的共通規則。
* 是否已確認此 Skill 不會取代 Agent 的主要身份。
* 是否已確認檔案輸出規則符合目標專案與 `skills-hub` 邊界。
* 是否已確認沒有寫死不必要的 MCP Server alias。
* 是否已確認沒有填入 API Key、Password、Token、Connection String 或其他機密資訊。
* 是否已在 Gemini CLI 中執行 `/skills reload` 與 `/skills list` 確認載入結果。
