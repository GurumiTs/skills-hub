# flowchart-mcp – 流程圖產生器

此 skill 可將自然語言描述轉換為可預覽的 HTML 流程圖。

## 1) Server Alias
在 `.gemini/settings.json` 建議使用：`flowchart`

## 2) Tools
### `flowchart__generate_html`
**目的**：接收使用者描述流程的 prompt，回傳一個包含 Mermaid.js 流程圖的完整 HTML 字串。
**輸入**: `prompt` (string) - 使用者的自然語言描述。
**輸出**: `html_content` (string) - 可直接存成 .html 檔案的內容。

## 3) 使用流程
1. 當使用者提出繪製流程圖的需求時，啟用此 skill。
2. 呼叫 `flowchart__generate_html` 工具，並將使用者的需求作為 `prompt` 傳入。
3. 取得回傳的 `html_content`。
4. **提案寫入檔案**：遵循專案規範，向使用者提案要將此 HTML 內容寫入一個暫存檔案（例如 `temp-flowchart.html`）。
5. 待使用者同意後，使用 `localFiles__write_file` 寫入檔案。
6. 告知使用者檔案已產生，並可自行在瀏覽器中開啟查看。
