#!/usr/bin/env node
// index.js - File MCP Server (safe + practical)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import crypto from "crypto";

const server = new McpServer({
  name: "Local-File-Tools",
  version: "1.1.0",
});

/**
 * Security model:
 * - Allowlisted roots via env FILE_MCP_ROOTS (semicolon-separated on Windows)
 * - If not set: default to [process.cwd()]
 * - Every incoming path is resolved and must stay within at least one allowed root.
 */
function parseAllowedRoots() {
  const raw = process.env.FILE_MCP_ROOTS?.trim();
  const roots = raw
    ? raw
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
    : [process.cwd()];

  // Normalize to resolved absolute paths
  const resolved = roots.map((r) => path.resolve(r));
  return Array.from(new Set(resolved));
}

const ALLOWED_ROOTS = parseAllowedRoots();
const IS_WIN = process.platform === "win32";

function normForCompare(p) {
  const s = path.resolve(p);
  return IS_WIN ? s.toLowerCase() : s;
}

function ensureInAllowedRoots(p) {
  const resolved = path.resolve(p);
  const target = normForCompare(resolved);

  for (const root of ALLOWED_ROOTS) {
    const rootNorm = normForCompare(root);
    if (target === rootNorm) return resolved;
    if (target.startsWith(rootNorm + path.sep.toLowerCase()) || target.startsWith(rootNorm + path.sep)) {
      return resolved;
    }
  }
  throw new Error(
    `Path not allowed. "${resolved}" is outside allowed roots: ${ALLOWED_ROOTS.join(", ")}`
  );
}

function toUnixSlashes(p) {
  return p.replaceAll("\\", "/");
}

function isProbablyBinary(buffer) {
  // Heuristic: if it contains many NUL bytes early, treat as binary
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  let nulCount = 0;
  for (const b of sample) if (b === 0) nulCount++;
  return nulCount > 0;
}

async function safeStat(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch (e) {
    return null;
  }
}

async function walkDir(dir, opts) {
  const {
    recursive,
    maxDepth,
    includeHidden,
    maxEntries,
    pattern,
    results,
    depth,
  } = opts;

  if (results.length >= maxEntries) return;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (results.length >= maxEntries) break;

    const name = ent.name;
    if (!includeHidden && name.startsWith(".")) continue;

    if (pattern && !pattern.test(name)) {
      // if not matching, still need to walk directories when recursive?
      // We'll still walk directories even if dir name doesn't match, because children may.
    }

    const full = path.join(dir, name);
    const rel = full; // returning full path is often more useful for tools
    const st = await safeStat(full);

    const item = {
      path: toUnixSlashes(rel),
      name,
      type: ent.isDirectory() ? "dir" : ent.isFile() ? "file" : ent.isSymbolicLink() ? "symlink" : "other",
      size: st?.isFile() ? st.size : undefined,
      mtime: st ? new Date(st.mtimeMs).toISOString() : undefined,
    };

    // If pattern exists, filter files/dirs by name; but always include dirs if recursive to allow navigation
    if (!pattern || pattern.test(name) || ent.isDirectory()) {
      results.push(item);
    }

    if (recursive && ent.isDirectory() && depth < maxDepth) {
      await walkDir(full, { ...opts, depth: depth + 1 });
    }
  }
}

function compileNamePattern(globLike) {
  // simple wildcard: "*" => any, "?" => single char
  // Example: "*.js" "Dockerfile*" etc.
  // This is not full glob; it's name-only matching.
  if (!globLike || typeof globLike !== "string") return null;
  const escaped = globLike.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const re = "^" + escaped.replaceAll("\\*", ".*").replaceAll("\\?", ".") + "$";
  return new RegExp(re, IS_WIN ? "i" : "");
}

function splitLines(text) {
  return text.split(/\r\n|\n|\r/);
}

async function readTextFileLimited(filePath, encoding, maxBytes) {
  const allowedPath = ensureInAllowedRoots(filePath);
  const st = await fs.stat(allowedPath);
  if (!st.isFile()) throw new Error("Target is not a file.");

  // Read up to maxBytes
  const fd = await fs.open(allowedPath, "r");
  try {
    const bytesToRead = Math.min(st.size, maxBytes);
    const buf = Buffer.alloc(bytesToRead);
    const { bytesRead } = await fd.read(buf, 0, bytesToRead, 0);
    const used = buf.subarray(0, bytesRead);

    if (isProbablyBinary(used)) {
      throw new Error("File appears to be binary. Use read_file_base64 instead.");
    }

    const text = used.toString(encoding);
    const truncated = st.size > maxBytes;

    return { text, truncated, size: st.size };
  } finally {
    await fd.close();
  }
}

/* ---------------- Tools ---------------- */

server.tool(
  "get_allowed_roots",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            allowed_roots: ALLOWED_ROOTS.map(toUnixSlashes),
            note: "Set FILE_MCP_ROOTS env (semicolon-separated) to control allowed roots.",
          },
          null,
          2
        ),
      },
    ],
  })
);

server.tool(
  "list_directory",
  {
    directory_path: z.string().describe("要列出的資料夾路徑（必須在允許根目錄內）"),
    recursive: z.boolean().optional().default(false).describe("是否遞迴列出子資料夾"),
    max_depth: z.number().int().min(0).max(50).optional().default(5).describe("遞迴最大深度"),
    max_entries: z.number().int().min(1).max(5000).optional().default(500).describe("最多回傳多少筆"),
    include_hidden: z.boolean().optional().default(false).describe("是否包含 . 開頭的隱藏項目"),
    name_pattern: z.string().optional().describe('檔名過濾（簡易 * ? 通配），例: "*.js"'),
  },
  async (args) => {
    try {
      const dir = ensureInAllowedRoots(args.directory_path);
      const st = await fs.stat(dir);
      if (!st.isDirectory()) throw new Error("Target is not a directory.");

      const pattern = args.name_pattern ? compileNamePattern(args.name_pattern) : null;

      const results = [];
      await walkDir(dir, {
        recursive: args.recursive,
        maxDepth: args.max_depth,
        includeHidden: args.include_hidden,
        maxEntries: args.max_entries,
        pattern,
        results,
        depth: 0,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                directory: toUnixSlashes(dir),
                count: results.length,
                items: results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: ${error.message}` }] };
    }
  }
);

server.tool(
  "read_file",
  {
    file_path: z.string().describe("檔案完整路徑（必須在允許根目錄內）"),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    max_bytes: z.number().int().min(100).max(2_000_000).optional().default(200_000).describe("最多讀取 bytes（避免爆量）"),
  },
  async ({ file_path, encoding, max_bytes }) => {
    try {
      const { text, truncated, size } = await readTextFileLimited(file_path, encoding === "utf-8" ? "utf8" : encoding, max_bytes);
      const hint = truncated ? `\n\n[已截斷：檔案大小 ${size} bytes，僅讀取前 ${max_bytes} bytes]` : "";
      return { content: [{ type: "text", text: text + hint }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 無法讀取檔案 - ${error.message}` }] };
    }
  }
);

server.tool(
  "read_file_base64",
  {
    file_path: z.string().describe("二進位檔案完整路徑（必須在允許根目錄內）"),
    max_bytes: z.number().int().min(100).max(5_000_000).optional().default(500_000),
  },
  async ({ file_path, max_bytes }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      const st = await fs.stat(allowedPath);
      if (!st.isFile()) throw new Error("Target is not a file.");

      const fd = await fs.open(allowedPath, "r");
      try {
        const bytesToRead = Math.min(st.size, max_bytes);
        const buf = Buffer.alloc(bytesToRead);
        const { bytesRead } = await fd.read(buf, 0, bytesToRead, 0);
        const used = buf.subarray(0, bytesRead);

        const b64 = used.toString("base64");
        const truncated = st.size > max_bytes;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  file: toUnixSlashes(allowedPath),
                  size: st.size,
                  read_bytes: bytesRead,
                  truncated,
                  base64: b64,
                },
                null,
                2
              ),
            },
          ],
        };
      } finally {
        await fd.close();
      }
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 無法讀取檔案(base64) - ${error.message}` }] };
    }
  }
);

server.tool(
  "write_file",
  {
    file_path: z.string().describe("要寫入的檔案路徑（必須在允許根目錄內）"),
    content: z.string().describe("要寫入的文字內容"),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    overwrite: z.boolean().optional().default(false).describe("檔案已存在時是否覆寫"),
    create_dirs: z.boolean().optional().default(true).describe("是否自動建立上層資料夾"),
  },
  async ({ file_path, content, encoding, overwrite, create_dirs }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      const parent = path.dirname(allowedPath);

      if (create_dirs) {
        await fs.mkdir(parent, { recursive: true });
      }

      const exists = fssync.existsSync(allowedPath);
      if (exists && !overwrite) {
        throw new Error("File exists. Set overwrite=true to replace it.");
      }

      await fs.writeFile(allowedPath, content, { encoding: encoding === "utf-8" ? "utf8" : encoding });
      return { content: [{ type: "text", text: `已寫入: ${toUnixSlashes(allowedPath)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 寫入失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "append_file",
  {
    file_path: z.string().describe("要附加寫入的檔案路徑（必須在允許根目錄內）"),
    content: z.string().describe("要附加的文字內容"),
    encoding: z.enum(["utf8", "utf-8", "utf16le", "latin1"]).optional().default("utf8"),
    create_dirs: z.boolean().optional().default(true).describe("是否自動建立上層資料夾"),
  },
  async ({ file_path, content, encoding, create_dirs }) => {
    try {
      const allowedPath = ensureInAllowedRoots(file_path);
      const parent = path.dirname(allowedPath);
      if (create_dirs) await fs.mkdir(parent, { recursive: true });

      await fs.appendFile(allowedPath, content, { encoding: encoding === "utf-8" ? "utf8" : encoding });
      return { content: [{ type: "text", text: `已附加寫入: ${toUnixSlashes(allowedPath)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 附加寫入失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "create_directory",
  {
    directory_path: z.string().describe("要建立的資料夾路徑（必須在允許根目錄內）"),
    recursive: z.boolean().optional().default(true),
  },
  async ({ directory_path, recursive }) => {
    try {
      const dir = ensureInAllowedRoots(directory_path);
      await fs.mkdir(dir, { recursive });
      return { content: [{ type: "text", text: `已建立資料夾: ${toUnixSlashes(dir)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 建立資料夾失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "stat_path",
  {
    target_path: z.string().describe("檔案/資料夾路徑（必須在允許根目錄內）"),
  },
  async ({ target_path }) => {
    try {
      const p = ensureInAllowedRoots(target_path);
      const st = await fs.lstat(p);
      const info = {
        path: toUnixSlashes(p),
        isFile: st.isFile(),
        isDirectory: st.isDirectory(),
        isSymlink: st.isSymbolicLink(),
        size: st.size,
        mtime: new Date(st.mtimeMs).toISOString(),
        ctime: new Date(st.ctimeMs).toISOString(),
      };
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: stat 失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "delete_path",
  {
    target_path: z.string().describe("要刪除的檔案/資料夾（必須在允許根目錄內）"),
    recursive: z.boolean().optional().default(false).describe("刪除資料夾時是否遞迴"),
    force: z.boolean().optional().default(false).describe("忽略不存在等錯誤（較危險）"),
  },
  async ({ target_path, recursive, force }) => {
    try {
      const p = ensureInAllowedRoots(target_path);
      const st = await safeStat(p);
      if (!st) {
        if (force) return { content: [{ type: "text", text: `目標不存在，已忽略: ${toUnixSlashes(p)}` }] };
        throw new Error("Target does not exist.");
      }

      if (st.isDirectory()) {
        if (!recursive) throw new Error("Target is a directory. Set recursive=true to delete directory.");
        await fs.rm(p, { recursive: true, force });
      } else {
        await fs.rm(p, { force });
      }

      return { content: [{ type: "text", text: `已刪除: ${toUnixSlashes(p)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 刪除失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "copy_path",
  {
    src_path: z.string().describe("來源路徑（必須在允許根目錄內）"),
    dest_path: z.string().describe("目的路徑（必須在允許根目錄內）"),
    overwrite: z.boolean().optional().default(false),
    recursive: z.boolean().optional().default(true).describe("來源是資料夾時是否遞迴複製"),
  },
  async ({ src_path, dest_path, overwrite, recursive }) => {
    try {
      const src = ensureInAllowedRoots(src_path);
      const dest = ensureInAllowedRoots(dest_path);

      const destExists = fssync.existsSync(dest);
      if (destExists && !overwrite) throw new Error("Destination exists. Set overwrite=true to replace.");

      const st = await fs.stat(src);
      await fs.mkdir(path.dirname(dest), { recursive: true });

      if (st.isDirectory()) {
        if (!recursive) throw new Error("Source is directory. Set recursive=true to copy directory.");
        // Node 16+ supports fs.cp
        await fs.cp(src, dest, { recursive: true, force: overwrite });
      } else {
        await fs.copyFile(src, dest);
      }

      return { content: [{ type: "text", text: `已複製: ${toUnixSlashes(src)} -> ${toUnixSlashes(dest)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 複製失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "move_path",
  {
    src_path: z.string().describe("來源路徑（必須在允許根目錄內）"),
    dest_path: z.string().describe("目的路徑（必須在允許根目錄內）"),
    overwrite: z.boolean().optional().default(false),
  },
  async ({ src_path, dest_path, overwrite }) => {
    try {
      const src = ensureInAllowedRoots(src_path);
      const dest = ensureInAllowedRoots(dest_path);

      const destExists = fssync.existsSync(dest);
      if (destExists && !overwrite) throw new Error("Destination exists. Set overwrite=true to replace.");

      await fs.mkdir(path.dirname(dest), { recursive: true });

      if (destExists && overwrite) {
        await fs.rm(dest, { recursive: true, force: true });
      }

      await fs.rename(src, dest);
      return { content: [{ type: "text", text: `已搬移: ${toUnixSlashes(src)} -> ${toUnixSlashes(dest)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 搬移失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "search_text",
  {
    root_dir: z.string().describe("要搜尋的根目錄（必須在允許根目錄內）"),
    query: z.string().describe("要搜尋的文字（或 regex pattern）"),
    use_regex: z.boolean().optional().default(false),
    case_sensitive: z.boolean().optional().default(false),
    include_hidden: z.boolean().optional().default(false),
    max_depth: z.number().int().min(0).max(50).optional().default(8),
    max_results: z.number().int().min(1).max(500).optional().default(50),
    max_file_size: z.number().int().min(100).max(5_000_000).optional().default(300_000),
    include_extensions: z.array(z.string()).optional().describe('只搜尋指定副檔名，例如 [".js",".yml",".json"]'),
    exclude_dirs: z.array(z.string()).optional().default(["node_modules", ".git"]).describe("排除的資料夾名稱（name match）"),
  },
  async (args) => {
    try {
      const root = ensureInAllowedRoots(args.root_dir);
      const st = await fs.stat(root);
      if (!st.isDirectory()) throw new Error("root_dir is not a directory.");

      const flags = args.case_sensitive ? "g" : "gi";
      const re = args.use_regex ? new RegExp(args.query, flags) : null;
      const needle = args.case_sensitive ? args.query : args.query.toLowerCase();

      const results = [];
      async function walk(current, depth) {
        if (results.length >= args.max_results) return;
        if (depth > args.max_depth) return;

        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const ent of entries) {
          if (results.length >= args.max_results) break;

          const name = ent.name;
          if (!args.include_hidden && name.startsWith(".")) continue;

          const full = path.join(current, name);

          if (ent.isDirectory()) {
            if (args.exclude_dirs?.includes(name)) continue;
            await walk(full, depth + 1);
            continue;
          }

          if (!ent.isFile()) continue;

          if (args.include_extensions?.length) {
            const ext = path.extname(name);
            if (!args.include_extensions.includes(ext)) continue;
          }

          const stFile = await fs.stat(full);
          if (stFile.size > args.max_file_size) continue;

          const buf = await fs.readFile(full);
          if (isProbablyBinary(buf)) continue;

          const text = buf.toString("utf8");
          let matched = false;

          if (re) {
            matched = re.test(text);
          } else {
            matched = (args.case_sensitive ? text : text.toLowerCase()).includes(needle);
          }

          if (matched) {
            // collect a few match lines
            const lines = splitLines(text);
            const hitLines = [];
            for (let i = 0; i < lines.length && hitLines.length < 5; i++) {
              const line = lines[i];
              const ok = re
                ? re.test(line)
                : (args.case_sensitive ? line : line.toLowerCase()).includes(needle);
              if (ok) hitLines.push({ line_no: i + 1, text: line.slice(0, 300) });
            }

            results.push({
              file: toUnixSlashes(full),
              size: stFile.size,
              hits: hitLines,
            });
          }
        }
      }

      await walk(root, 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                root: toUnixSlashes(root),
                query: args.query,
                count: results.length,
                results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: 搜尋失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "head_file",
  {
    file_path: z.string().describe("檔案完整路徑（必須在允許根目錄內）"),
    lines: z.number().int().min(1).max(500).optional().default(50),
    max_bytes: z.number().int().min(100).max(2_000_000).optional().default(300_000),
  },
  async ({ file_path, lines, max_bytes }) => {
    try {
      const { text, truncated, size } = await readTextFileLimited(file_path, "utf8", max_bytes);
      const out = splitLines(text).slice(0, lines).join("\n");
      const hint = truncated ? `\n\n[注意：檔案 ${size} bytes，讀取時已截斷]` : "";
      return { content: [{ type: "text", text: out + hint }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: head 失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "tail_file",
  {
    file_path: z.string().describe("檔案完整路徑（必須在允許根目錄內）"),
    lines: z.number().int().min(1).max(500).optional().default(50),
    max_bytes: z.number().int().min(100).max(2_000_000).optional().default(300_000),
  },
  async ({ file_path, lines, max_bytes }) => {
    try {
      const { text, truncated, size } = await readTextFileLimited(file_path, "utf8", max_bytes);
      const arr = splitLines(text);
      const out = arr.slice(Math.max(0, arr.length - lines)).join("\n");
      const hint = truncated ? `\n\n[注意：檔案 ${size} bytes，讀取時已截斷]` : "";
      return { content: [{ type: "text", text: out + hint }] };
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: tail 失敗 - ${error.message}` }] };
    }
  }
);

server.tool(
  "compute_hash",
  {
    file_path: z.string().describe("檔案完整路徑（必須在允許根目錄內）"),
    algorithm: z.enum(["sha256", "sha1", "md5"]).optional().default("sha256"),
    max_bytes: z.number().int().min(100).max(50_000_000).optional().default(10_000_000).describe("避免對超大檔造成卡頓"),
  },
  async ({ file_path, algorithm, max_bytes }) => {
    try {
      const p = ensureInAllowedRoots(file_path);
      const st = await fs.stat(p);
      if (!st.isFile()) throw new Error("Target is not a file.");

      const bytesToRead = Math.min(st.size, max_bytes);
      const fd = await fs.open(p, "r");
      try {
        const buf = Buffer.alloc(bytesToRead);
        const { bytesRead } = await fd.read(buf, 0, bytesToRead, 0);
        const used = buf.subarray(0, bytesRead);

        const h = crypto.createHash(algorithm).update(used).digest("hex");
        const truncated = st.size > max_bytes;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  file: toUnixSlashes(p),
                  algorithm,
                  hash: h,
                  size: st.size,
                  hashed_bytes: bytesRead,
                  truncated,
                },
                null,
                2
              ),
            },
          ],
        };
      } finally {
        await fd.close();
      }
    } catch (error) {
      return { content: [{ type: "text", text: `錯誤: hash 失敗 - ${error.message}` }] };
    }
  }
);

/* ---------------- Start ---------------- */

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `MCP File Server running...
Allowed roots:
- ${ALLOWED_ROOTS.map(toUnixSlashes).join("\n- ")}`
);