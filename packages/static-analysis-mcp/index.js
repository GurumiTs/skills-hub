#!/usr/bin/env node
// index.js - Static Analysis MCP Server (allowlisted commands + lightweight project inspection)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

const server = new McpServer({
  name: "Static-Analysis-Tools",
  version: "1.0.0",
});

const IS_WIN = process.platform === "win32";

function parseAllowedRoots() {
  const raw = process.env.STATIC_ANALYSIS_ROOTS || process.env.FILE_MCP_ROOTS || "";
  const roots = raw ? raw.split(";").map((s) => s.trim()).filter(Boolean) : [process.cwd()];
  return Array.from(new Set(roots.map((r) => path.resolve(r))));
}

function parseCommands() {
  const raw = process.env.STATIC_ANALYSIS_COMMANDS?.trim();
  if (!raw) {
    return {
      "npm-lint": ["npm", "run", "lint"],
      "npm-build": ["npm", "run", "build"],
      "dotnet-build": ["dotnet", "build"],
    };
  }
  const parsed = JSON.parse(raw);
  const normalized = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (Array.isArray(value) && value.every((x) => typeof x === "string")) normalized[key] = value;
    else throw new Error(`Invalid STATIC_ANALYSIS_COMMANDS entry for ${key}. Expected string array.`);
  }
  return normalized;
}

const ALLOWED_ROOTS = parseAllowedRoots();
const ALLOWED_COMMANDS = parseCommands();

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

function text(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

async function ensureDirectory(projectPath) {
  const cwd = ensureInAllowedRoots(projectPath);
  const st = await fs.stat(cwd);
  if (!st.isDirectory()) throw new Error("project_path is not a directory.");
  return cwd;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

server.tool("list_static_analysis_commands", {}, async () =>
  text({
    allowed_roots: ALLOWED_ROOTS.map(toUnixSlashes),
    commands: Object.fromEntries(Object.entries(ALLOWED_COMMANDS).map(([k, v]) => [k, v.join(" ")])),
  })
);

server.tool(
  "detect_project_stack",
  {
    project_path: z.string().describe("Project directory path within allowed roots"),
  },
  async ({ project_path }) => {
    try {
      const cwd = await ensureDirectory(project_path);
      const markers = {
        node: await fileExists(path.join(cwd, "package.json")),
        dotnet_solution: (await fs.readdir(cwd)).some((x) => x.endsWith(".sln")),
        dotnet_project: (await fs.readdir(cwd)).some((x) => x.endsWith(".csproj")),
        java_maven: await fileExists(path.join(cwd, "pom.xml")),
        java_gradle: await fileExists(path.join(cwd, "build.gradle")) || await fileExists(path.join(cwd, "build.gradle.kts")),
        python: await fileExists(path.join(cwd, "pyproject.toml")) || await fileExists(path.join(cwd, "requirements.txt")),
      };
      return text({ project_path: toUnixSlashes(cwd), markers });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "run_static_analysis_command",
  {
    project_path: z.string().describe("Project directory path within allowed roots"),
    command_key: z.string().describe("Key from list_static_analysis_commands"),
    extra_args: z.array(z.string()).optional().default([]),
    timeout_seconds: z.number().int().min(1).max(1800).optional().default(300),
    max_chars: z.number().int().min(1000).max(100000).optional().default(30000),
  },
  async ({ project_path, command_key, extra_args, timeout_seconds, max_chars }) => {
    try {
      const cwd = await ensureDirectory(project_path);
      const command = ALLOWED_COMMANDS[command_key];
      if (!command) throw new Error(`Command key not allowed: ${command_key}`);
      const [bin, ...args] = [...command, ...extra_args];
      const { stdout, stderr } = await execFileAsync(bin, args, {
        cwd,
        timeout: timeout_seconds * 1000,
        maxBuffer: Math.max(max_chars * 2, 1024 * 1024),
        windowsHide: true,
      });
      const output = `${stdout || ""}${stderr ? `\n[stderr]\n${stderr}` : ""}`;
      return text({
        project_path: toUnixSlashes(cwd),
        command_key,
        command: [bin, ...args],
        output: output.length > max_chars ? output.slice(0, max_chars) + "\n...[truncated]" : output,
      });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
