#!/usr/bin/env node
// index.js - Git MCP Server (read-only)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

const server = new McpServer({
  name: "Git-Tools",
  version: "1.0.0",
});

const IS_WIN = process.platform === "win32";

function parseAllowedRoots() {
  const raw = process.env.GIT_MCP_ROOTS || process.env.FILE_MCP_ROOTS || "";
  const roots = raw
    ? raw.split(";").map((s) => s.trim()).filter(Boolean)
    : [process.cwd()];
  return Array.from(new Set(roots.map((r) => path.resolve(r))));
}

const ALLOWED_ROOTS = parseAllowedRoots();

function normForCompare(p) {
  const s = path.resolve(p);
  return IS_WIN ? s.toLowerCase() : s;
}

function ensureInAllowedRoots(p) {
  const resolved = path.resolve(p);
  const target = normForCompare(resolved);
  for (const root of ALLOWED_ROOTS) {
    const rootNorm = normForCompare(root);
    if (target === rootNorm || target.startsWith(rootNorm + path.sep)) return resolved;
  }
  throw new Error(`Path not allowed. "${resolved}" is outside allowed roots: ${ALLOWED_ROOTS.join(", ")}`);
}

function toUnixSlashes(p) {
  return p.replaceAll("\\", "/");
}

async function ensureGitRepo(repoPath) {
  const cwd = ensureInAllowedRoots(repoPath);
  const st = await fs.stat(cwd);
  if (!st.isDirectory()) throw new Error("repo_path is not a directory.");
  await runGit(cwd, ["rev-parse", "--is-inside-work-tree"], 5000, 2000);
  return cwd;
}

async function runGit(cwd, args, timeout = 10000, maxChars = 20000) {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd,
    timeout,
    maxBuffer: Math.max(maxChars * 2, 1024 * 1024),
    windowsHide: true,
  });
  const out = stdout || stderr || "";
  return out.length > maxChars ? out.slice(0, maxChars) + "\n...[truncated]" : out;
}

function text(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

server.tool("get_allowed_roots", {}, async () => text({ allowed_roots: ALLOWED_ROOTS.map(toUnixSlashes) }));

server.tool(
  "git_status",
  {
    repo_path: z.string().describe("Git repository path within allowed roots"),
  },
  async ({ repo_path }) => {
    try {
      const cwd = await ensureGitRepo(repo_path);
      const output = await runGit(cwd, ["status", "--short", "--branch"], 10000, 20000);
      return text({ repo_path: toUnixSlashes(cwd), status: output });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "git_changed_files",
  {
    repo_path: z.string().describe("Git repository path within allowed roots"),
  },
  async ({ repo_path }) => {
    try {
      const cwd = await ensureGitRepo(repo_path);
      const output = await runGit(cwd, ["diff", "--name-status"], 10000, 20000);
      return text({ repo_path: toUnixSlashes(cwd), changed_files: output });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "git_diff",
  {
    repo_path: z.string().describe("Git repository path within allowed roots"),
    staged: z.boolean().optional().default(false).describe("Show staged diff when true"),
    max_chars: z.number().int().min(1000).max(100000).optional().default(20000),
  },
  async ({ repo_path, staged, max_chars }) => {
    try {
      const cwd = await ensureGitRepo(repo_path);
      const args = staged ? ["diff", "--cached"] : ["diff"];
      const output = await runGit(cwd, args, 15000, max_chars);
      return text({ repo_path: toUnixSlashes(cwd), staged, diff: output });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "git_log",
  {
    repo_path: z.string().describe("Git repository path within allowed roots"),
    max_count: z.number().int().min(1).max(50).optional().default(10),
  },
  async ({ repo_path, max_count }) => {
    try {
      const cwd = await ensureGitRepo(repo_path);
      const output = await runGit(cwd, ["log", `--max-count=${max_count}`, "--oneline", "--decorate"], 10000, 20000);
      return text({ repo_path: toUnixSlashes(cwd), log: output });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
