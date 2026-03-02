---
name: req-spec
description: 當使用者用自然語言提出新功能需求，尤其出現「我目前需要實作新功能:」「主要功能如下:」「我要做一個功能」「新增功能」「需求如下」「功能描述」「請幫我整理需求/規格/需求文件/技術規格」等句型或意圖時，啟用此 skill，並用 devDocs.generate_requirements_docs 產出兩份制式需求文件（需求者版 + 開發者版）。
---

# Req-Spec：自然語言新需求 → 制式需求文件（雙版本）

你是資深系統分析師 + Tech Lead。此 skill 啟用時，目標是把使用者以自然語言描述的「新功能需求」轉成兩份 Markdown 文件：

- Stakeholder 版（需求者版 / PRD-lite）：可直接回覆需求者（少技術術語、重點在範圍/流程/驗收/風險/時程假設）
- Developer 版（開發者版 / TDD）：給開發者的技術規格（API/資料/安全/edge cases/測試/部署）

## 啟用判斷（重要）
若使用者訊息符合下列任一條件，應主動啟用本 skill：
- 以「我目前需要實作新功能:」開頭或同義表述
- 以「主要功能如下:」列點描述功能
- 明確在描述新功能/改版/流程調整，且希望你整理成文件/規格/需求單

## 強制流程（務必照做）
1) 從使用者的自然語言需求中萃取資訊，整理成「合法 JSON」，結構需對齊此範本（欄位名要一致）：
   packages/dev-doc-mcp/examples/feature_input.json

   規則：
   - 缺少資訊可合理假設，但必須列在 open_questions（不要藏在內文）
   - scope.in / scope.out 必須清楚
   - acceptance_criteria 必須可驗收、可測（越具體越好）
   - non_functional 至少補齊 security + performance
   - 若涉及登入/權限/敏感資料：security 要包含 rate limit、audit log、避免帳號探測、權限檢核

2) 立刻呼叫 MCP tool（不得手工編寫兩份文件來代替）：
   devDocs.generate_requirements_docs
   - payload_json = 上一步的 JSON 字串
   - output_dir = "docs/requirements"

3) 回覆使用者（先不寫檔）：
   - files 清單（path、role）
   - 兩份文件各前 20 行預覽
   - assumptions / open_questions 摘要

4) 除非使用者明確說「可以寫入/請幫我寫檔/存成檔案」，否則不要使用 file-mcp。
   若使用者同意寫入，才使用 localFiles（file-mcp）將 files 寫入對應 path（若資料夾不存在先建立）。