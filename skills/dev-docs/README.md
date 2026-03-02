# dev-docs – 常用文件工作流

這裡放的是「用 Gemini 做文件」的建議流程（不綁任何公司/專案）。

## 推薦流程
1) 先把需求文字收斂成固定 JSON（避免每次生成格式亂掉）
2) 用 `dev-doc-mcp` 產文件內容（先 review）
3) 再用 `file-mcp` 寫入 repo（依你的規範先提案→同意→寫檔）

## 固定格式範例
請直接參考：
- `packages/dev-doc-mcp/examples/feature_input.json`
- `packages/dev-doc-mcp/examples/runbook_input.json`
- `packages/dev-doc-mcp/examples/dbdoc_input.json`
