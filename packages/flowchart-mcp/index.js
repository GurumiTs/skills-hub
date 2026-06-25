import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A simple simulation of an LLM call to convert a prompt to Mermaid.js syntax.
// In a real implementation, this would call the Gemini API.
function generateMermaidSyntax(prompt) {
  // Simple keyword-based logic for demonstration
  if (prompt.includes('登入')) {
    // 更詳細的登入流程圖
    return `
graph TD
    A[使用者輸入帳號密碼] --> B{格式驗證?};
    B -- 否 --> C[提示錯誤：格式不正確];
    B -- 是 --> D{資料庫檢查?};
    D -- 否 --> E[提示錯誤：密碼錯誤];
    E --> F{失敗次數 < 5?};
    F -- 否 --> G[鎖定帳號];
    F -- 是 --> A;
    D -- 是 --> H[產生Token];
    H --> I[導向首頁];
`;
  }
  // Default flowchart
  return `
graph TD
    A[Start] --> B[Step 1];
    B --> C{Decision};
    C -->|Yes| D[End];
    C -->|No| E[Step 2];
    E --> D;
`;
}

// 建立 MCP Server
const server = new McpServer({
  name: "Flowchart-Generator",
  version: "1.0.0",
});

// 🛠️ 工具 1: 產生 HTML 流程圖
server.tool(
  "generate_html",
  {
    prompt: z.string().describe("使用者的自然語言描述"),
  },
  async ({ prompt }) => {
    try {
      const mermaidSyntax = generateMermaidSyntax(prompt);
      
      const templatePath = path.join(__dirname, 'assets', 'template.html');
      const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      
      const finalHtml = htmlTemplate.replace('{{MERMAID_SYNTAX}}', mermaidSyntax);

      const suggestedPath = path.join('docs', 'flowchart', 'flowchart-preview.html').replace(/\\/g, '/');

      return {
        content: [{ type: "text", text: JSON.stringify({
          tool_name: 'generate_html',
          status: 'success',
          result: {
            html_content: finalHtml,
            suggested_path: suggestedPath
          }
        }) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({
          tool_name: 'generate_html',
          status: 'error',
          message: `Error generating flowchart: ${error.message}`
        }) }],
      };
    }
  }
);

// 啟動 Server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Flowchart MCP Server running...");
