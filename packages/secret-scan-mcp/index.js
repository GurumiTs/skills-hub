#!/usr/bin/env node
// index.js - Secret Scan MCP Server (read-only local scanner)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

const server = new McpServer({
  name: "Secret-Scan-Tools",
  version: "1.0.0",
});

const IS_WIN = process.platform === "win32";
const EXCLUDED_DIRS = new Set([".git", "node_modules", "bin", "obj", "dist", "build", ".next", ".nuxt", "coverage"]);

const SECRET_PATTERNS = [
  { name: "generic_assignment_secret", severity: "high", regex: /(?:api[_-]?key|secret|token|password|passwd|pwd|connection[_-]?string)\s*[:=]\s*["']?[^"'\s]{8,}/i },
  { name: "aws_access_key_id", severity: "high", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "github_token", severity: "high", regex: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: "jwt", severity: "medium", regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "private_key_header", severity: "critical", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "sql_connection_string", severity: "high", regex: /Server=.*;(?:Database|Initial Catalog)=.*;(?:User Id|UID)=.*;(?:Password|PWD)=.*;/i },
];

function parseAllowedRoots() {
  const raw = process.env.SECRET_SCAN_ROOTS || process.env.FILE_MCP_ROOTS || "";
  const roots = raw ? raw.split(";").map((s) => s.trim()).filter(Boolean) : [process.cwd()];
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

function text(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

function maskSecret(line) {
  if (line.length <= 12) return "[masked]";
  return line.slice(0, 6) + "...[masked]..." + line.slice(-4);
}

function shouldScanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const allowed = new Set([
    ".js", ".ts", ".jsx", ".tsx", ".json", ".cs", ".config", ".xml", ".yml", ".yaml", ".env", ".txt", ".md", ".sql", ".ps1", ".sh", ".java", ".properties", ".toml"
  ]);
  return allowed.has(ext) || path.basename(filePath).toLowerCase().includes("env");
}

async function walk(dir, options, results) {
  if (results.files_scanned >= options.max_files) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (results.files_scanned >= options.max_files) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      await walk(full, options, results);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!shouldScanFile(full)) continue;
    const st = await fs.stat(full);
    if (st.size > options.max_bytes_per_file) continue;
    results.files_scanned++;
    await scanFile(full, options, results);
  }
}

async function scanFile(filePath, options, results) {
  const content = await fs.readFile(filePath, "utf8").catch(() => null);
  if (content == null) return;
  const lines = content.split(/\r\n|\n|\r/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        results.findings.push({
          file: toUnixSlashes(filePath),
          line: i + 1,
          pattern: pattern.name,
          severity: pattern.severity,
          preview: maskSecret(line.trim()),
        });
      }
    }
  }
}

server.tool("get_allowed_roots", {}, async () => text({ allowed_roots: ALLOWED_ROOTS.map(toUnixSlashes) }));

server.tool(
  "scan_secrets",
  {
    root_path: z.string().describe("Directory path to scan within allowed roots"),
    max_files: z.number().int().min(1).max(20000).optional().default(3000),
    max_bytes_per_file: z.number().int().min(1024).max(1024 * 1024).optional().default(256 * 1024),
  },
  async ({ root_path, max_files, max_bytes_per_file }) => {
    try {
      const root = ensureInAllowedRoots(root_path);
      const st = await fs.stat(root);
      if (!st.isDirectory()) throw new Error("root_path is not a directory.");
      const results = { root: toUnixSlashes(root), files_scanned: 0, findings: [] };
      await walk(root, { max_files, max_bytes_per_file }, results);
      return text(results);
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
