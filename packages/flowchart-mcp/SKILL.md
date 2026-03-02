---
name: flowchart-generator
description: 當使用者想要繪製流程圖、序列圖或任何基於文字描述的圖表時啟用。觸發詞包括：「流程圖」、「畫圖」、「flowchart」、「diagram」、「sequence diagram」。
---
# 流程圖產生器 Skill

當使用者提出繪製流程圖的需求時，請遵循以下流程：

1.  **取得使用者需求**：將使用者描述圖表的完整需求文字，作為 `prompt` 參數。

2.  **呼叫工具**：直接呼叫 `flowchart__generate_html` 工具。
    ```tool_code
print(default_api.flowchart__generate_html(prompt = "<使用者的完整需求>"))
    ```

3.  **處理回傳結果**：工具會回傳一個名為 `html_content` 的完整 HTML 字串。

4.  **提案寫檔**：
    *   根據全域的檔案變更政策，你 **必須先提案**，詢問使用者是否同意將這段 HTML 內容儲存成一個檔案。
    *   提案內容應包含：
        *   **工具**：`localFiles__write_file`
        *   **檔案路徑**：建議一個臨時路徑，例如 `./temp-flowchart-preview.html`
        *   **風險**：覆寫同名檔案的風險。
        *   **驗證方式**：告知使用者可以在瀏覽器中開啟此檔案來預覽流程圖。
    *   最後務必詢問：「是否要我開始套用變更？」

5.  **執行寫檔**：只有在使用者明確同意後，才可執行 `localFiles__write_file`。
