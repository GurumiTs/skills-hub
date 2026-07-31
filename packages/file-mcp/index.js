#!/usr/bin/env node
// index.js - File MCP Server (safe + practical)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import crypto from "crypto";

const server = new McpServer({ name: "Local-File-Tools", version: "1.2.0" });
const IS_WIN = process.platform === "win32";
const SKILLS_HUB_ROOT = path.resolve(process.cwd());

function toUnixSlashes(value) { return value.replaceAll("\\", "/"); }
function normForCompare(value) {
  const resolved = path.resolve(value);
  return IS_WIN ? resolved.toLowerCase() : resolved;
}
function isPathInside(root, target) {
  const rootNorm = normForCompare(root);
  const targetNorm = normForCompare(target);
  return targetNorm === rootNorm || targetNorm.startsWith(rootNorm + path.sep);
}
function parseAllowedRoots() {
  const raw = process.env.FILE_MCP_ROOTS?.trim();
  const roots = raw ? raw.split(";").map((value) => value.trim()).filter(Boolean) : [process.cwd()];
  return Array.from(new Set(roots.map((value) => path.resolve(value))));
}
const ALLOWED_ROOTS = parseAllowedRoots();
function ensureInAllowedRoots(targetPath) {
  const resolved = path.resolve(targetPath);
  if (ALLOWED_ROOTS.some((root) => isPathInside(root, resolved))) return resolved;
  throw new Error(`Path not allowed. "${resolved}" is outside allowed roots: ${ALLOWED_ROOTS.join(", ")}`);
}
function normalizeSubdir(value, fallback) {
  const raw = String(value || fallback).trim().replaceAll("\\", "/");
  if (!raw || raw.startsWith("/") || /^[a-zA-Z]:\//.test(raw)) {
    throw new Error(`Invalid SDLC artifact subdirectory: ${raw || "(empty)"}`);
  }
  const normalized = path.posix.normalize(raw);
  if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`SDLC artifact subdirectory cannot escape its root: ${raw}`);
  }
  return normalized.replace(/^\.\//, "");
}
function buildArtifactConfig() {
  const configuredRoot = process.env.SDLC_ARTIFACT_ROOT?.trim() || "docs/_generated";
  const artifactRoot = path.isAbsolute(configuredRoot)
    ? path.resolve(configuredRoot)
    : path.resolve(SKILLS_HUB_ROOT, configuredRoot);
  const subdirs = {
    "sa-spec": normalizeSubdir(process.env.SDLC_SA_SPEC_SUBDIR, "sa-specs"),
    db: normalizeSubdir(process.env.SDLC_DB_SUBDIR, "db"),
    workflow: normalizeSubdir(process.env.SDLC_WORKFLOW_SUBDIR, "workflows"),
    "dev-doc": normalizeSubdir(process.env.SDLC_DEV_DOC_SUBDIR, "dev-docs"),
    requirements: normalizeSubdir(process.env.SDLC_REQUIREMENTS_SUBDIR, "requirements"),
    flowchart: normalizeSubdir(process.env.SDLC_FLOWCHART_SUBDIR, "flowchart"),
  };
  return {
    artifactRoot,
    subdirs,
    categories: Object.fromEntries(
      Object.entries(subdirs).map(([category, subdir]) => [category, path.resolve(artifactRoot, subdir)])
    ),
  };
}
const ARTIFACT_CONFIG = buildArtifactConfig();
function sanitizeArtifactRelativePath(relativePath) {
  const raw = String(relativePath || "").trim().replaceAll("\\", "/");
  if (!raw) throw new Error("relative_path is required.");
  if (raw.startsWith("/") || /^[a-zA-Z]:\//.test(raw)) throw new Error("relative_path must not be absolute.");
  const normalized = path.posix.normalize(raw).replace(/^\.\//, "");
  if (normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error("relative_path cannot escape the configured artifact directory.");
  }
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("relative_path contains an invalid path segment.");
  }
  if (parts.some((part) => part.toLowerCase() === ".gemini")) {
    throw new Error("SDLC artifacts cannot be written into a .gemini directory.");
  }
  return normalized;
}
async function resolveArtifactTarget(category, relativePath) {
  const categoryRoot = ARTIFACT_CONFIG.categories[category];
  if (!categoryRoot) throw new Error(`Unknown SDLC artifact category: ${category}`);
  const safeRelativePath = sanitizeArtifactRelativePath(relativePath);
  await fs.mkdir(categoryRoot, { recursive: true });
  const realCategoryRoot = await fs.realpath(categoryRoot);
  const target = path.resolve(categoryRoot, safeRelativePath);
  if (!isPathInside(realCategoryRoot, target)) throw new Error("Artifact target escaped the configured category root.");
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const realParent = await fs.realpath(parent);
  if (!isPathInside(realCategoryRoot, realParent)) {
    throw new Error("Artifact parent resolves outside the configured category root.");
  }
  return { target, safeRelativePath, categoryRoot: realCategoryRoot };
}
function isProbablyBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  let nulCount = 0;
  for (const byte of sample) if (byte === 0) nulCount += 1;
  return nulCount > 0;
}
async function safeStat(targetPath) {
  try { return await fs.stat(targetPath); } catch { return null; }
}
function compileNamePattern(globLike) {
  if (!globLike || typeof globLike !== "string") return null;
  const escaped = globLike.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replaceAll("\\*", ".*").replaceAll("\\?", ".") + "$", IS_WIN ? "i" : "");
}
function splitLines(text) { return text.split(/\r\n|\n|\r/); }
async function readTextFileLimited(filePath, encoding, maxBytes) {
  const allowedPath = ensureInAllowedRoots(filePath);
  const stat = await fs.stat(allowedPath);
  if (!stat.isFile()) throw new Error("Target is not a file.");
  const handle = await fs.open(allowedPath, "r");
  try {
    const bytesToRead = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
    const used = buffer.subarray(0, bytesRead);
    if (isProbablyBinary(used)) throw new Error("File appears to be binary. Use read_file_base64 instead.");
    return { text: used.toString(encoding), truncated: stat.size > maxBytes, size: stat.size };
  } finally { await handle.close(); }
}
async function walkDirectory(directory, options) {
  if (options.results.length >= options.maxEntries) return;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (options.results.length >= options.maxEntries) break;
    if (!options.includeHidden && entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    const stat = await safeStat(fullPath);
    const item = {
      path: toUnixSlashes(fullPath),
      name: entry.name,
      type: entry.isDirectory() ? "dir" : entry.isFile() ? "file" : entry.isSymbolicLink() ? "symlink" : "other",
      size: stat?.isFile() ? stat.size : undefined,
      mtime: stat ? new Date(stat.mtimeMs).toISOString() : undefined,
    };
    if (!options.pattern || options.pattern.test(entry.name) || entry.isDirectory()) options.results.push(item);
    if (options.recursive && entry.isDirectory() && options.depth < options.maxDepth) {
      await walkDirectory(fullPath, { ...options, depth: options.depth + 1 });
    }
  }
}

server.tool("get_allowed_roots", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify({
    allowed_roots: ALLOWED_ROOTS.map(toUnixSlashes),
    note: "Set FILE_MCP_ROOTS env (semicolon-separated) to control generic file roots.",
  }, null, 2) }],
}));

server.tool("get_sdlc_artifact_config", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify({
    skills_hub_root: toUnixSlashes(SKILLS_HUB_ROOT),
    artifact_root: toUnixSlashes(ARTIFACT_CONFIG.artifactRoot),
    categories: Object.fromEntries(
      Object.entries(ARTIFACT_CONFIG.categories).map(([key, value]) => [key, toUnixSlashes(value)])
    ),
    overwrite_policy: "deny",
    note: "Relative SDLC_ARTIFACT_ROOT values are resolved from the skills-hub repository root, not the target project.",
  }, null, 2) }],
}));

server.tool(
  "write_sdlc_artifact",
  {
    category: z.enum(["sa-spec", "db", "workflow", "dev-doc", "requirements", "flowchart"]),
    relative_path: z.string().describe("Relative path under the configured category directory."),
    content: z.string().describe("UTF-8 text content to write."),
  },
  async ({ category, relative_path, content }) => {
    try {
      const { target, safeRelativePath, categoryRoot } = await resolveArtifactTarget(category, relative_path);
      if (fssync.existsSync(target)) {
        throw new Error("Artifact already exists. Generate a new versioned file name; overwrite is not allowed.");
      }
      await fs.writeFile(target, content, { encoding: "utf8", flag: "wx" });
      return { content: [{ type: "text", text: JSON.stringify({
        written: true,
        category,
        relative_path: safeRelativePath,
        path: toUnixSlashes(target),
        category_root: toUnixSlashes(categoryRoot),
        encoding: "utf8",
        overwrite: false,
      }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: SDLC artifact 寫入失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "list_directory",
  {
    directory_path: z.string(),
    recursive: z.boolean().optional().default(false),
    max_depth: z.number().int().min(0).max(50).optional().default(5),
    max_entries: z.number().int().min(1).max(5000).optional().default(500),
    include_hidden: z.boolean().optional().default(false),
    name_pattern: z.string().optional(),
  },
  async (args) => {
    try {
      const directory = ensureInAllowedRoots(args.directory_path);
      const stat = await fs.stat(directory);
      if (!stat.isDirectory()) throw new Error("Target is not a directory.");
      const results = [];
      await walkDirectory(directory, {
        recursive: args.recursive,
        maxDepth: args.max_depth,
        maxEntries: args.max_entries,
        includeHidden: args.include_hidden,
        pattern: args.name_pattern ? compileNamePattern(args.name_pattern) : null,
        results,
        depth: 0,
      });
      return { content: [{ type: "text", text: JSON.stringify({
        directory: toUnixSlashes(directory), count: results.length, items: results,
      }, null, 2) }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: ${error.message}` }] }; }
  }
);

server.tool(
  "read_file",
  {
    file_path: z.string(),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    max_bytes: z.number().int().min(100).max(2_000_000).optional().default(200_000),
  },
  async ({ file_path, encoding, max_bytes }) => {
    try {
      const result = await readTextFileLimited(file_path, encoding === "utf-8" ? "utf8" : encoding, max_bytes);
      const hint = result.truncated ? `\n\n[已截斷：檔案大小 ${result.size} bytes，僅讀取前 ${max_bytes} bytes]` : "";
      return { content: [{ type: "text", text: result.text + hint }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 無法讀取檔案 - ${error.message}` }] }; }
  }
);

server.tool(
  "read_file_base64",
  { file_path: z.string(), max_bytes: z.number().int().min(100).max(5_000_000).optional().default(500_000) },
  async ({ file_path, max_bytes }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      const stat = await fs.stat(allowedPath);
      if (!stat.isFile()) throw new Error("Target is not a file.");
      const handle = await fs.open(allowedPath, "r");
      try {
        const bytesToRead = Math.min(stat.size, maxBytes);
        const buffer = Buffer.alloc(bytesToRead);
        const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
        return { content: [{ type: "text", text: JSON.stringify({
          file: toUnixSlashes(allowedPath),
          size: stat.size,
          read_bytes: bytesRead,
          truncated: stat.size > maxBytes,
          base64: buffer.subarray(0, bytesRead).toString("base64"),
        }, null, 2) }] };
      } finally { await handle.close(); }
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 無法讀取檔案(base64) - ${error.message}` }] }; }
  }
);

server.tool(
  "write_file",
  {
    file_path: z.string(), content: z.string(),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    overwrite: z.boolean().optional().default(false), create_dirs: z.boolean().optional().default(true),
  },
  async ({ file_path, content, encoding, overwrite, create_dirs }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      if (create_dirs) await fs.mkdir(path.dirname(allowedPath), { recursive: true });
      if (fssync.existsSync(allowedPath) && !overwrite) throw new Error("File exists. Set overwrite=true to replace it.");
      await fs.writeFile(allowedPath, content, { encoding: encoding === "utf-8" ? "utf8" : encoding });
      return { content: [{ type: "text", text: `已寫入: ${toUnixSlashes(allowedPath)}` }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 寫入失敗 - ${error.message}` }] }; }
  }
);

server.tool(
  "append_file",
  {
    file_path: z.string(), content: z.string(),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    create_dirs: z.boolean().optional().default(true),
  },
  async ({ file_path, content, encoding, create_dirs }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      if (create_dirs) await fs.mkdir(path.dirname(allowedPath), { recursive: true });
      await fs.appendFile(allowedPath, content, { encoding: encoding === "utf-8" ? "utf8" : encoding });
      return { content: [{ type: "text", text: `已附加寫入: ${toUnixSlashes(allowedPath)}` }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 附加寫入失敗 - ${error.message}` }] }; }
  }
);

server.tool("create_directory", {
  directory_path: z.string(), recursive: z.boolean().optional().default(true),
}, async ({ directory_path, recursive }) => {
  try {
    const directory = ensureInAllowedRoots(directory_path);
    await fs.mkdir(directory, { recursive });
    return { content: [{ type: "text", text: `已建立資料夾: ${toUnixSlashes(directory)}` }] };
  } catch (error) { return { content: [{ type: "text", text: `錯誤: 建立資料夾失敗 - ${error.message}` }] }; }
});

server.tool("stat_path", { target_path: z.string() }, async ({ target_path }) => {
  try {
    const target = ensureInAllowedRoots(target_path);
    const stat = await fs.lstat(target);
    return { content: [{ type: "text", text: JSON.stringify({
      path: toUnixSlashes(target), isFile: stat.isFile(), isDirectory: stat.isDirectory(),
      isSymlink: stat.isSymbolicLink(), size: stat.size,
      mtime: new Date(stat.mtimeMs).toISOString(), ctime: new Date(stat.ctimeMs).toISOString(),
    }, null, 2) }] };
  } catch (error) { return { content: [{ type: "text", text: `錯誤: stat 失敗 - ${error.message}` }] }; }
});

server.tool(
  "delete_path",
  { target_path: z.string(), recursive: z.boolean().optional().default(false), force: z.boolean().optional().default(false) },
  async ({ target_path, recursive, force }) => {
    try {
      const target = ensureInAllowedRoots(target_path);
      const stat = await safeStat(target);
      if (!stat) {
        if (force) return { content: [{ type: "text", text: `目標不存在，已忽略: ${toUnixSlashes(target)}` }] };
        throw new Error("Target does not exist.");
      }
      if (stat.isDirectory() && !recursive) throw new Error("Target is a directory. Set recursive=true to delete directory.");
      await fs.rm(target, { recursive: stat.isDirectory() ? recursive : false, force });
      return { content: [{ type: "text", text: `已刪除: ${toUnixSlashes(target)}` }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 刪除失敗 - ${error.message}` }] }; }
  }
);

server.tool(
  "copy_path",
  { src_path: z.string(), dest_path: z.string(), overwrite: z.boolean().optional().default(false), recursive: z.boolean().optional().default(true) },
  async ({ src_path, dest_path, overwrite, recursive }) => {
    try {
      const source = ensureInAllowedRoots(src_path);
      const destination = ensureInAllowedRoots(dest_path);
      if (fssync.existsSync(destination) && !overwrite) throw new Error("Destination exists. Set overwrite=true to replace.");
      const stat = await fs.stat(source);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      if (stat.isDirectory()) {
        if (!recursive) throw new Error("Source is directory. Set recursive=true to copy directory.");
        await fs.cp(source, destination, { recursive: true, force: overwrite });
      } else { await fs.copyFile(source, destination); }
      return { content: [{ type: "text", text: `已複製: ${toUnixSlashes(source)} -> ${toUnixSlashes(destination)}` }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 複製失敗 - ${error.message}` }] }; }
  }
);

server.tool(
  "move_path",
  { src_path: z.string(), dest_path: z.string(), overwrite: z.boolean().optional().default(false) },
  async ({ src_path, dest_path, overwrite }) => {
    try {
      const source = ensureInAllowedRoots(src_path);
      const destination = ensureInAllowedRoots(dest_path);
      if (fssync.existsSync(destination) && !overwrite) throw new Error("Destination exists. Set overwrite=true to replace.");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      if (fssync.existsSync(destination) && overwrite) await fs.rm(destination, { recursive: true, force: true });
      await fs.rename(source, destination);
      return { content: [{ type: "text", text: `已搬移: ${toUnixSlashes(source)} -> ${toUnixSlashes(destination)}` }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 搬移失敗 - ${error.message}` }] }; }
  }
);

server.tool(
  "search_text",
  {
    root_dir: z.string(), query: z.string(), use_regex: z.boolean().optional().default(false),
    case_sensitive: z.boolean().optional().default(false), include_hidden: z.boolean().optional().default(false),
    max_depth: z.number().int().min(0).max(50).optional().default(8),
    max_results: z.number().int().min(1).max(500).optional().default(50),
    max_file_size: z.number().int().min(100).max(5_000_000).optional().default(300_000),
    include_extensions: z.array(z.string()).optional(),
    exclude_dirs: z.array(z.string()).optional().default(["node_modules", ".git"]),
  },
  async (args) => {
    try {
      const root = ensureInAllowedRoots(args.root_dir);
      const stat = await fs.stat(root);
      if (!stat.isDirectory()) throw new Error("root_dir is not a directory.");
      const flags = args.case_sensitive ? "g" : "gi";
      const regex = args.use_regex ? new RegExp(args.query, flags) : null;
      const needle = args.case_sensitive ? args.query : args.query.toLowerCase();
      const results = [];
      async function walk(current, depth) {
        if (results.length >= args.max_results || depth > args.max_depth) return;
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= args.max_results) break;
          if (!args.include_hidden && entry.name.startsWith(".")) continue;
          const fullPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            if (!args.exclude_dirs.includes(entry.name)) await walk(fullPath, depth + 1);
            continue;
          }
          if (!entry.isFile()) continue;
          if (args.include_extensions?.length && !args.include_extensions.includes(path.extname(entry.name))) continue;
          const fileStat = await fs.stat(fullPath);
          if (fileStat.size > args.max_file_size) continue;
          const buffer = await fs.readFile(fullPath);
          if (isProbablyBinary(buffer)) continue;
          const text = buffer.toString("utf8");
          const matched = regex
            ? new RegExp(regex.source, regex.flags).test(text)
            : (args.case_sensitive ? text : text.toLowerCase()).includes(needle);
          if (!matched) continue;
          const hits = [];
          for (const [index, line] of splitLines(text).entries()) {
            const lineMatched = regex
              ? new RegExp(regex.source, regex.flags).test(line)
              : (args.case_sensitive ? line : line.toLowerCase()).includes(needle);
            if (lineMatched) hits.push({ line_no: index + 1, text: line.slice(0, 300) });
            if (hits.length >= 5) break;
          }
          results.push({ file: toUnixSlashes(fullPath), size: fileStat.size, hits });
        }
      }
      await walk(root, 0);
      return { content: [{ type: "text", text: JSON.stringify({
        root: toUnixSlashes(root), query: args.query, count: results.length, results,
      }, null, 2) }] };
    } catch (error) { return { content: [{ type: "text", text: `錯誤: 搜尋失敗 - ${error.message}` }] }; }
  }
);

server.tool("head_file", {
  file_path: z.string(), lines: z.number().int().min(1).max(500).optional().default(50),
  max_bytes: z.number().int().min(100).max(2_000_000).optional().default(300_000),
}, async ({ file_path, lines, max_bytes }) => {
  try {
    const result = await readTextFileLimited(file_path, "utf8", max_bytes);
    const hint = result.truncated ? `\n\n[注意：檔案 ${result.size} bytes，讀取時已截斷]` : "";
    return { content: [{ type: "text", text: splitLines(result.text).slice(0, lines).join("\n") + hint }] };
  } catch (error) { return { content: [{ type: "text", text: `錯誤: head 失敗 - ${error.message}` }] }; }
});

server.tool("tail_file", {
  file_path: z.string(), lines: z.number().int().min(1).max(500).optional().default(50),
  max_bytes: z.number().int().min(100).max(2_000_000).optional().default(300_000),
}, async ({ file_path, lines, max_bytes }) => {
  try {
    const result = await readTextFileLimited(file_path, "utf8", max_bytes);
    const allLines = splitLines(result.text);
    const hint = result.truncated ? `\n\n[注意：檔案 ${result.size} bytes，讀取時已截斷]` : "";
    return { content: [{ type: "text", text: allLines.slice(Math.max(0, allLines.length - lines)).join("\n") + hint }] };
  } catch (error) { return { content: [{ type: "text", text: `錯誤: tail 失敗 - ${error.message}` }] }; }
});

server.tool(
  "compute_hash",
  {
    file_path: z.string(), algorithm: z.enum(["sha256", "sha1", "md5"]).optional().default("sha256"),
    max_bytes: z.number().int().min(100).max(50_000_000).optional().default(10_000_000),
  },
  async ({ file_path, algorithm, max_bytes }) => {
    try {
      const target = ensureInAllowedRoots(file_path);
      const stat = await fs.stat(target);
      if (!stat.isFile()) throw new Error("Target is not a file.");
      const bytesToRead = Math.min(stat.size, maxBytes);
      const handle = await fs.open(target, "r");
      try {
        const buffer = Buffer.alloc(bytesToRead);
        const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
        return { content: [{ type: "text", text: JSON.stringify({
          file: toUnixSlashes(target), algorithm,
          hash: crypto.createHash(algorithm).update(buffer.subarray(0, bytesRead)).digest("hex"),
          size: stat.size, hashed_bytes: bytesRead, truncated: stat.size > maxBytes,
        }, null, 2) }] };
      } finally { await handle.close(); }
    } catch (error) { return { content: [{ type: "text", text: `錯誤: hash 失敗 - ${error.message}` }] }; }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `MCP File Server running...\nAllowed roots:\n- ${ALLOWED_ROOTS.map(toUnixSlashes).join("\n- ")}\nSDLC artifact root:\n- ${toUnixSlashes(ARTIFACT_CONFIG.artifactRoot)}`
);
