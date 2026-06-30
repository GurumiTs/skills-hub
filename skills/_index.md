# Skills Index

此檔案是本專案正式啟用 Skills 的唯一載入入口。

只有在本檔案中以 `@` import 的 Skill，才視為已正式啟用，並會被 Gemini CLI 載入為可使用的工作流。

`skills/_template/` 只是給開發者複製用的範例模板，不應在本檔案中引用。

---

## Enabled Skills

@./sa-consultant/SKILL.md

---

<!--

## Notes
新增 Skill 時，請先在 `skills/<skill-name>/SKILL.md` 建立正式 Skill 文件。

確認該 Skill 已完成內容檢查後，再於本檔案加入 import：

@./<skill-name>/SKILL.md

移除或停用 Skill 時，請從本檔案移除對應 import。

修改本檔案後，請在 Gemini CLI 中執行：

`/memory refresh`

再使用：

`/memory show`

確認新的 Skill 是否已載入。

如果在 memory 中看到 `skills/_template/SKILL.md`，代表本檔案誤引用了模板，應立即移除。

-->