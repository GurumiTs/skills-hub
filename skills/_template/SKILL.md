# {{SKILL_NAME}} Skill

> 這是一份 Skill 範例模板。
> 請複製到 `skills/<skill-name>/SKILL.md` 後，再依照實際用途調整內容。
>
> 注意：`skills/_template/` 只是範例資料夾，請不要在 `skills/_index.md` 中引用本檔案，避免 Gemini CLI 執行時讀到模板內容。
>
> 注意：複製成正式 Skill 後，請移除所有模板說明、範例佔位符與未填寫項目，例如 `{{PLACEHOLDER}}`、`請填寫`、不適用的範例說明等。
>
> 注意：正式啟用的 Skill 以 `skills/_index.md` 中實際 import 的 Skill 文件為準。即使 `skills/` 目錄下存在某個 Skill，若未被 `skills/_index.md` import，也不可視為正式啟用。
>
> 注意：Skill 中定義的專業角色屬於「任務層專業角色」，只能細化 Gemini 在特定任務中的工作方式，不得覆蓋根目錄 `GEMINI.md` 的共通規則、Change Control、安全限制、檔案修改前確認流程與回滾要求。

---

## 1. 專業角色定位

請指定此 Skill 啟用後，Gemini 應該扮演的專業角色。

此角色應明確描述 Gemini 在此 Skill 中的觀點、責任與輸出方向。

範例：

* Solution Architect / System Analyst Consultant
* Senior Code Reviewer
* Database Consultant
* DevOps Runbook Writer
* Security Review Assistant
* Developer Documentation Consultant
* Redmine Issue Analysis Assistant

請填寫：

當此 Skill 啟用時，Gemini 應擔任：

> {{PROFESSIONAL_ROLE_NAME}}

此專業角色的主要任務是協助使用者處理 {{ROLE_TASK_SCOPE}}。

---

### 1.1 角色責任

請列出此專業角色在任務中應主動協助的內容。

範例：

* 從 SA 角度協助釐清需求、流程、商業邏輯與系統邊界。
* 從 Code Reviewer 角度檢查正確性、可維護性、相容性與潛在風險。
* 從 DB Consultant 角度分析 SQL、Schema、資料正確性、效能與交易安全。
* 從文件顧問角度整理可讀、可維護、可交接的技術文件。

請填寫：

* {{ROLE_RESPONSIBILITY_1}}
* {{ROLE_RESPONSIBILITY_2}}
* {{ROLE_RESPONSIBILITY_3}}

---

### 1.2 角色限制

此 Skill 的專業角色不得覆蓋根目錄 `GEMINI.md` 的共通規則。

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

* {{ROLE_BOUNDARY_1}}
* {{ROLE_BOUNDARY_2}}

---

## 2. Skill 目的

簡短說明這個 Skill 要解決什麼問題。

範例：

* 協助整理技術規格文件
* 協助產生維運 Runbook
* 協助分析 Redmine 議題並整理處理建議
* 協助產生資料庫文件
* 協助進行程式碼審查
* 協助分析系統異常與排查方向

請填寫：

這個 Skill 用來協助處理 {{TASK_DESCRIPTION}}。

---

## 3. 使用時機

列出什麼情境下 Gemini 應該使用這個 Skill。

範例：

* 使用者要求整理 {{DOCUMENT_TYPE}}。
* 使用者提供 {{INPUT_SOURCE}}，希望轉成 {{OUTPUT_FORMAT}}。
* 使用者需要針對 {{SYSTEM_OR_PROCESS}} 做分析。
* 使用者要求從特定專業角度檢查程式碼、系統流程、文件或設定。
* 使用者要求產出可交付、可驗證、可維護的開發輔助內容。

請填寫：

* {{USE_CASE_1}}
* {{USE_CASE_2}}
* {{USE_CASE_3}}

---

## 4. 不使用時機

列出哪些情境不適合使用這個 Skill，避免 Gemini 誤套用。

範例：

* 使用者只是詢問簡單語法。
* 使用者只是要求翻譯。
* 使用者要的是單純聊天、摘要或非技術性內容。
* 使用者要的是實作程式碼，而不是分析、審查或文件。
* 任務明顯屬於其他 Skill。
* 任務與此 Skill 的專業角色、輸入資料或輸出格式無關。

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

範例：

| 工具能力        | 用途                             | 使用限制           |
| ----------- | ------------------------------ | -------------- |
| 專案檔案讀取      | 讀取指定程式碼、設定檔或文件                 | 僅限與任務相關範圍      |
| 文件產生        | 產生 Markdown、Runbook 或技術文件內容    | 寫檔前仍需取得使用者同意   |
| 議題系統查詢      | 查詢 Redmine、GitHub Issues 或需求來源 | 僅查詢指定或相關議題     |
| 資料庫結構查詢     | 讀取 Schema、欄位或關聯資訊              | 不得直接異動資料       |
| 流程圖產生       | 產生 Mermaid 或流程圖草稿              | 不得憑空補未確認流程     |
| Log 或錯誤資訊讀取 | 讀取錯誤訊息、Log 或系統輸出               | 不得讀取與任務無關的敏感資訊 |

請填寫：

| 工具能力                  | 用途            | 使用限制        |
| --------------------- | ------------- | ----------- |
| {{TOOL_CAPABILITY_1}} | {{PURPOSE_1}} | {{LIMIT_1}} |
| {{TOOL_CAPABILITY_2}} | {{PURPOSE_2}} | {{LIMIT_2}} |

---

## 6. 預期輸入

說明使用者通常會提供哪些資料。

範例：

* 需求描述
* 問題現象
* 程式碼片段
* 專案路徑
* Redmine 議題
* 資料庫欄位
* 系統流程
* 錯誤訊息
* Log 內容
* API 規格
* 操作畫面或錯誤截圖
* 使用者希望產出的文件格式

請填寫：

* {{INPUT_1}}
* {{INPUT_2}}
* {{INPUT_3}}

---

## 7. 預期輸出

說明這個 Skill 最後應該產出什麼。

範例：

* Markdown 技術文件
* 問題分析摘要
* 修正建議
* 測試案例表
* 風險與緩解清單
* 操作步驟
* Mermaid 流程圖
* Code Review 結論
* 需求拆解結果
* 待確認問題清單
* 驗證方式與回滾方式

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

範例：

若任務目標是本 `skills-hub` repository：

```text
docs/_generated/{{skill-name}}/
```

若任務目標是其他專案：

```text
<target-project>/docs/_generated/{{skill-name}}/
```

或依使用者指定路徑輸出。

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
* 若本 Skill 的規則比根目錄 `GEMINI.md` 更嚴格，應採用較嚴格的規則。
* 若任務涉及實體檔案變更，必須先提出變更提案，並在使用者明確同意後才可套用。
* 若任務涉及正式環境、資料庫異動、部署、權限或資安，必須主動提醒風險與回滾方式。
* 不得將臨時測試方案包裝成正式長期方案。
* 不得擅自擴大任務範圍，讀取或修改與任務無關的內容。

可依 Skill 需求補充：

* {{RULE_1}}
* {{RULE_2}}

---

## 11. 輸出格式

請定義此 Skill 回覆時建議採用的輸出格式。

如果此 Skill 沒有固定格式，請描述一般輸出原則。

範例：

* 先給結論，再補充原因。
* 優先使用條列式整理重點。
* 對技術文件，應清楚區分背景、目標、範圍、設計、風險、測試與回滾。
* 對問題分析，應清楚區分現象、可能原因、驗證方式、修正建議與後續觀察。
* 對 Code Review，應清楚區分問題等級、位置、原因、影響與建議修正方式。
* 對流程圖，應優先提供 Mermaid 內容，並標示假設與待確認流程。

請填寫：

此 Skill 的建議輸出格式為：

1. {{OUTPUT_FORMAT_1}}
2. {{OUTPUT_FORMAT_2}}
3. {{OUTPUT_FORMAT_3}}

---

## 12. 範例 Prompt

提供 2 到 3 個開發者或使用者可以參考的 Prompt。

範例：

```text
請使用 {{SKILL_NAME}} Skill，幫我把以下需求整理成技術規格文件。
```

```text
請根據這個 Redmine 議題內容，整理問題背景、影響範圍與建議處理方式。
```

```text
請讀取指定檔案後，整理成一份 Markdown 說明文件。先不要寫檔，請先提出文件產生提案。
```

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

複製本模板並完成正式 Skill 內容後，請在加入 `skills/_index.md` 前檢查：

* 是否已移除所有不適用的模板說明。
* 是否已移除所有 `{{PLACEHOLDER}}`。
* 是否已移除所有未填寫的「請填寫」內容。
* 是否已確認 Skill 目的、使用時機與不使用時機清楚。
* 是否已確認此 Skill 沒有覆蓋 `GEMINI.md` 的共通規則。
* 是否已確認檔案輸出規則符合目標專案與 `skills-hub` 邊界。
* 是否已確認沒有寫死不必要的 MCP Server alias。
* 是否已確認沒有填入 API Key、Password、Token、Connection String 或其他機密資訊。
* 是否已確認此 Skill 真的需要被 `skills/_index.md` import。
* 是否已在 Gemini CLI 中執行 `/memory refresh` 與 `/memory show` 確認載入結果。

正式啟用後，請確認 `skills/_index.md` 只 import 正式 Skill，不要 import `skills/_template/SKILL.md`。
