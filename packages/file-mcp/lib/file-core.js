import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { TextDecoder } from "util";

const IS_WIN = process.platform === "win32";
export const SKILLS_HUB_ROOT = path.resolve(process.cwd());
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const UTF16LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16BE_BOM = Buffer.from([0xfe, 0xff]);

export function toUnixSlashes(value) { return value.replaceAll("\\", "/"); }
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
export const ALLOWED_ROOTS = parseAllowedRoots();
export function ensureInAllowedRoots(targetPath) {
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
export const ARTIFACT_CONFIG = buildArtifactConfig();
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
export async function resolveArtifactTarget(category, relativePath) {
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
function startsWithBytes(buffer, prefix) {
  return buffer.length >= prefix.length && prefix.every((value, index) => buffer[index] === value);
}
export function isProbablyBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  if (startsWithBytes(sample, UTF16LE_BOM) || startsWithBytes(sample, UTF16BE_BOM)) return false;
  let nulCount = 0;
  for (const byte of sample) if (byte === 0) nulCount += 1;
  return sample.length > 0 && nulCount / sample.length > 0.02;
}
function isValidUtf8(buffer) {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}
function swapUtf16Bytes(buffer) {
  const evenLength = buffer.length - (buffer.length % 2);
  const output = Buffer.alloc(evenLength);
  for (let index = 0; index < evenLength; index += 2) {
    output[index] = buffer[index + 1];
    output[index + 1] = buffer[index];
  }
  return output;
}
function detectLineEndings(text) {
  const crlf = (text.match(/\r\n/g) || []).length;
  const withoutCrlf = text.replaceAll("\r\n", "");
  const lf = (withoutCrlf.match(/\n/g) || []).length;
  const cr = (withoutCrlf.match(/\r/g) || []).length;
  const styles = [crlf > 0 ? "CRLF" : null, lf > 0 ? "LF" : null, cr > 0 ? "CR" : null].filter(Boolean);
  return {
    style: styles.length === 0 ? "None" : styles.length === 1 ? styles[0] : "Mixed",
    counts: { crlf, lf, cr },
  };
}
export function decodeDetectedBuffer(buffer, detection) {
  if (detection.encoding === "utf8-bom") return buffer.subarray(3).toString("utf8");
  if (detection.encoding === "utf8") return buffer.toString("utf8");
  if (detection.encoding === "utf16le") {
    const content = detection.has_bom ? buffer.subarray(2) : buffer;
    return content.toString("utf16le");
  }
  if (detection.encoding === "utf16be") {
    const content = detection.has_bom ? buffer.subarray(2) : buffer;
    return swapUtf16Bytes(content).toString("utf16le");
  }
  if (detection.encoding === "latin1") return buffer.toString("latin1");
  throw new Error(`Unsupported or unknown text encoding: ${detection.encoding}`);
}
export function detectTextBuffer(buffer) {
  let encoding = "unknown-8bit";
  let hasBom = false;
  let bomHex = null;
  let utf8Valid = false;

  if (startsWithBytes(buffer, UTF8_BOM)) {
    encoding = "utf8-bom";
    hasBom = true;
    bomHex = "EFBBBF";
    utf8Valid = isValidUtf8(buffer.subarray(3));
  } else if (startsWithBytes(buffer, UTF16LE_BOM)) {
    encoding = "utf16le";
    hasBom = true;
    bomHex = "FFFE";
  } else if (startsWithBytes(buffer, UTF16BE_BOM)) {
    encoding = "utf16be";
    hasBom = true;
    bomHex = "FEFF";
  } else if (!isProbablyBinary(buffer) && isValidUtf8(buffer)) {
    encoding = "utf8";
    utf8Valid = true;
  } else if (!isProbablyBinary(buffer)) {
    encoding = "unknown-8bit";
  }

  const binary = isProbablyBinary(buffer) && !hasBom;
  let lineEndings = { style: "Unknown", counts: { crlf: 0, lf: 0, cr: 0 } };
  if (!binary && encoding !== "unknown-8bit") {
    try { lineEndings = detectLineEndings(decodeDetectedBuffer(buffer, { encoding, has_bom: hasBom })); } catch {}
  }
  return {
    encoding,
    has_bom: hasBom,
    bom_hex: bomHex,
    utf8_valid: utf8Valid,
    is_binary: binary,
    line_ending: lineEndings.style,
    line_ending_counts: lineEndings.counts,
  };
}
export async function inspectTextFile(filePath, maxBytes = 10_000_000) {
  const allowedPath = ensureInAllowedRoots(filePath);
  const stat = await fs.stat(allowedPath);
  if (!stat.isFile()) throw new Error("Target is not a file.");
  const bytesToRead = Math.min(stat.size, maxBytes);
  const handle = await fs.open(allowedPath, "r");
  try {
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
    const used = buffer.subarray(0, bytesRead);
    return {
      file: toUnixSlashes(allowedPath),
      size: stat.size,
      inspected_bytes: bytesRead,
      truncated: stat.size > maxBytes,
      ...detectTextBuffer(used),
    };
  } finally { await handle.close(); }
}
function normalizeLineEndings(text, mode) {
  if (mode === "preserve" || mode === "none") return text;
  const normalized = text.replace(/\r\n|\r|\n/g, "\n");
  return mode === "crlf" ? normalized.replaceAll("\n", "\r\n") : normalized;
}
function resolveLineEndingMode(requestedMode, existingInfo) {
  if (requestedMode !== "preserve") return requestedMode;
  if (!existingInfo) return "lf";
  if (existingInfo.line_ending === "CRLF") return "crlf";
  if (existingInfo.line_ending === "LF") return "lf";
  return "none";
}
function resolveEncodingMode(requestedMode, existingInfo) {
  if (requestedMode !== "preserve") return { encoding: requestedMode, includeBom: requestedMode === "utf8-bom" };
  if (!existingInfo) return { encoding: "utf8", includeBom: false };
  if (existingInfo.encoding === "utf8-bom") return { encoding: "utf8", includeBom: true };
  if (existingInfo.encoding === "utf8") return { encoding: "utf8", includeBom: false };
  if (existingInfo.encoding === "utf16le") return { encoding: "utf16le", includeBom: existingInfo.has_bom };
  if (existingInfo.encoding === "latin1") return { encoding: "latin1", includeBom: false };
  throw new Error(`Cannot safely preserve ${existingInfo.encoding}; use an encoding-safe external tool.`);
}
function encodeText(text, resolvedEncoding) {
  if (resolvedEncoding.encoding === "utf8") {
    const body = Buffer.from(text, "utf8");
    return resolvedEncoding.includeBom ? Buffer.concat([UTF8_BOM, body]) : body;
  }
  if (resolvedEncoding.encoding === "utf16le") {
    const body = Buffer.from(text, "utf16le");
    return resolvedEncoding.includeBom ? Buffer.concat([UTF16LE_BOM, body]) : body;
  }
  if (resolvedEncoding.encoding === "latin1") return Buffer.from(text, "latin1");
  throw new Error(`Unsupported encoding mode: ${resolvedEncoding.encoding}`);
}
export async function writeTextFileSafe({
  filePath, content, encodingMode, lineEndingMode, overwrite, createDirs, append = false,
}) {
  const allowedPath = ensureInAllowedRoots(filePath);
  const exists = fssync.existsSync(allowedPath);
  if (!append && exists && !overwrite) throw new Error("File exists. Set overwrite=true to replace it.");
  if (createDirs) await fs.mkdir(path.dirname(allowedPath), { recursive: true });

  const before = exists ? await inspectTextFile(allowedPath) : null;
  const resolvedEncoding = resolveEncodingMode(encodingMode, before);
  const resolvedLineEnding = resolveLineEndingMode(lineEndingMode, before);
  const normalizedContent = normalizeLineEndings(content, resolvedLineEnding);
  let outputBuffer = encodeText(normalizedContent, resolvedEncoding);

  if (append && exists && resolvedEncoding.includeBom) {
    outputBuffer = outputBuffer.subarray(resolvedEncoding.encoding === "utf8" ? 3 : 2);
  }
  if (append) await fs.appendFile(allowedPath, outputBuffer);
  else await fs.writeFile(allowedPath, outputBuffer);

  const after = await inspectTextFile(allowedPath);
  const expectedEncoding = resolvedEncoding.encoding === "utf8" && resolvedEncoding.includeBom
    ? "utf8-bom"
    : resolvedEncoding.encoding;
  const encodingVerified = after.encoding === expectedEncoding;
  const lineEndingVerified = resolvedLineEnding === "none"
    || after.line_ending === (resolvedLineEnding === "crlf" ? "CRLF" : "LF")
    || after.line_ending === "None";
  if (!encodingVerified || !lineEndingVerified) {
    throw new Error(`Post-write verification failed: encoding=${after.encoding}, lineEnding=${after.line_ending}`);
  }
  return { path: toUnixSlashes(allowedPath), before, after };
}
export async function safeStat(targetPath) {
  try { return await fs.stat(targetPath); } catch { return null; }
}
export function compileNamePattern(globLike) {
  if (!globLike || typeof globLike !== "string") return null;
  const escaped = globLike.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replaceAll("\\*", ".*").replaceAll("\\?", ".") + "$", IS_WIN ? "i" : "");
}
export function splitLines(text) { return text.split(/\r\n|\n|\r/); }
export async function readTextFileLimited(filePath, encoding, maxBytes) {
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
export async function walkDirectory(directory, options) {
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
