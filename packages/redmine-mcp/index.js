#!/usr/bin/env node

// redmine-server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// ==========================================
// 🔴 設定區域 (優先從環境變數讀取)
// ==========================================
const REDMINE_URL = process.env.REDMINE_URL || "https://itproject.ennoconn.com"; 
const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

if (!REDMINE_API_KEY) {
  console.error("錯誤: 找不到環境變數 REDMINE_API_KEY。請確保已在設定檔中提供。");
  process.exit(1);
}
// ==========================================

// 設定 axios 預設值 (自動帶入 Key)
const client = axios.create({
  baseURL: REDMINE_URL,
  headers: {
    "X-Redmine-API-Key": REDMINE_API_KEY,
    "Content-Type": "application/json",
  },
});

// 建立 MCP Server
const server = new McpServer({
  name: "Redmine-Integration",
  version: "1.0.0",
});

// 🛠️ 工具 1: 列出議題 (List Issues)
server.tool(
  "redmine_list_issues",
  {
    limit: z.number().optional().describe("要列出的數量 (預設 5)"),
    status_id: z.string().optional().describe("狀態 ID (open, closed, 或數字 ID)"),
    assigned_to_me: z.boolean().optional().describe("是否只列出指派給我的 (true/false)"),
  },
  async ({ limit = 5, status_id = "open", assigned_to_me = false }) => {
    try {
      const params = {
        limit: limit,
        status_id: status_id,
        sort: "updated_on:desc", // 依更新時間排序
      };

      if (assigned_to_me) {
        params.assigned_to_id = "me";
      }

      const response = await client.get("/issues.json", { params });
      
      // 整理回傳資料，讓 Gemini 容易閱讀
      const issues = response.data.issues.map(i => 
        `[#${i.id}] ${i.subject} (狀態: ${i.status.name}, 指派給: ${i.assigned_to?.name || '無'})`
      ).join("\n");

      return {
        content: [{ type: "text", text: `找到以下議題:\n${issues}` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `❌ 查詢失敗: ${error.message}` }],
      };
    }
  }
);

// 🛠️ 工具 2: 讀取特定議題詳情 (Get Issue Detail)
server.tool(
  "redmine_get_issue",
  { issue_id: z.number().describe("議題的 ID (例如 12345)") },
  async ({ issue_id }) => {
    try {
      const response = await client.get(`/issues/${issue_id}.json`);
      const issue = response.data.issue;

      const detail = `
      標題: ${issue.subject}
      描述: ${issue.description}
      狀態: ${issue.status.name}
      優先權: ${issue.priority.name}
      建立者: ${issue.author.name}
      開始日期: ${issue.start_date}
      `;

      return {
        content: [{ type: "text", text: detail }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `❌ 讀取失敗 (ID可能不存在): ${error.message}` }],
      };
    }
  }
);

// 啟動 Server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Redmine MCP Server running...");