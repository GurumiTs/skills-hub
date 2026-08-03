import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  decodeDetectedBuffer,
  detectTextBuffer,
  ensureInAllowedRoots,
  inspectTextFile,
  toUnixSlashes,
} from "./file-core.js";

const MANIFEST_NAMES = new Set([
  "web.config", "packages.config", "global.json", "package.json", "package-lock.json",
  "yarn.lock", "pnpm-lock.yaml", "pyproject.toml", "requirements.txt", "poetry.lock",
  "pipfile", "pipfile.lock", "pom.xml", "build.gradle", "build.gradle.kts",
  "gradle.properties", "tsconfig.json",
]);
const PROJECT_EXTENSIONS = new Set([".sln", ".csproj", ".vbproj", ".fsproj", ".psd1", ".psm1"]);
const SOURCE_SAMPLE_EXTENSIONS = new Set([
  ".cs", ".vb", ".fs", ".aspx", ".ascx", ".master", ".asax", ".ashx", ".asmx",
  ".config", ".resx", ".js", ".jsx", ".ts", ".tsx", ".json", ".yaml", ".yml",
  ".py", ".java", ".kt", ".kts", ".ps1", ".psm1", ".psd1", ".xml", ".html",
  ".css", ".scss", ".sql", ".md",
]);
const DEFAULT_EXCLUDED_DIRS = new Set([
  ".git", ".svn", ".hg", ".gemini", "node_modules", "bin", "obj", "dist", "build",
  "target", ".next", ".nuxt", ".venv", "venv", "vendor", "coverage", ".idea", ".vs",
]);

function addUnique(target, value) {
  if (value && !target.includes(value)) target.push(value);
}
function firstMatch(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim() || null;
}
function relativeEvidence(root, filePath) { return toUnixSlashes(path.relative(root, filePath) || path.basename(filePath)); }
function hashBuffer(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }
async function readManifestText(filePath, maxBytes = 1_000_000) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length > maxBytes) throw new Error(`Manifest exceeds ${maxBytes} bytes.`);
  const detection = detectTextBuffer(buffer);
  if (detection.is_binary || detection.encoding === "unknown-8bit" || detection.encoding === "utf16be") {
    throw new Error(`Unsupported manifest encoding: ${detection.encoding}`);
  }
  return { text: decodeDetectedBuffer(buffer, detection), buffer, detection };
}
function redactDependencySpec(value) {
  return String(value || "")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)([^/@\s]+)@/gi, "$1<redacted>@")
    .replace(/([?&](?:token|access_token|api[_-]?key|password)=)[^&\s]+/gi, "$1<redacted>");
}
function pushDependency(context, dependency, maxDependencies) {
  dependency.version = redactDependencySpec(dependency.version);
  context.dependencies.total_detected += 1;
  if (context.dependencies.direct.length >= maxDependencies) {
    context.dependencies.truncated = true;
    return;
  }
  const key = `${dependency.name}|${dependency.scope}|${dependency.source}`;
  if (!context._dependencyKeys.has(key)) {
    context._dependencyKeys.add(key);
    context.dependencies.direct.push(dependency);
  }
}
function parseJsonSafely(text) {
  try { return JSON.parse(text); } catch { return null; }
}
function extractXmlDependencies(text, source, context, maxDependencies) {
  const regex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]+)<\/version>)?/gsi;
  for (const match of text.matchAll(regex)) {
    pushDependency(context, {
      name: `${match[1].trim()}:${match[2].trim()}`,
      version: match[3]?.trim() || "managed/unknown",
      scope: "direct",
      source,
    }, maxDependencies);
  }
}
function extractConnectionMetadata(text, context, evidence) {
  const section = firstMatch(text, /<connectionStrings\b[^>]*>([\s\S]*?)<\/connectionStrings>/i);
  if (!section) return;
  for (const match of section.matchAll(/<add\b([^>]+)>/gi)) {
    const attrs = match[1];
    const name = firstMatch(attrs, /\bname\s*=\s*["']([^"']+)["']/i);
    const provider = firstMatch(attrs, /\bproviderName\s*=\s*["']([^"']+)["']/i);
    if (name) addUnique(context.database_references.connection_names, name);
    if (provider) addUnique(context.database_references.providers, provider);
  }
  addUnique(context.database_references.evidence, evidence);
}
function analyzeManifest({ root, filePath, text, context, maxDependencies }) {
  const name = path.basename(filePath);
  const lowerName = name.toLowerCase();
  const ext = path.extname(lowerName);
  const evidence = relativeEvidence(root, filePath);
  addUnique(context.evidence_files, evidence);

  if (ext === ".sln") {
    addUnique(context.project_types, "dotnet-solution");
    addUnique(context.languages, "C#/.NET");
  }
  if ([".csproj", ".vbproj", ".fsproj"].includes(ext)) {
    addUnique(context.project_types, "dotnet-project");
    addUnique(context.languages, ext === ".vbproj" ? "VB.NET" : ext === ".fsproj" ? "F#" : "C#");
    const sdk = firstMatch(text, /<Project\b[^>]*\bSdk\s*=\s*["']([^"']+)["']/i);
    const target = firstMatch(text, /<TargetFrameworks?>\s*([^<]+)\s*<\/TargetFrameworks?>/i)
      || firstMatch(text, /<TargetFrameworkVersion>\s*([^<]+)\s*<\/TargetFrameworkVersion>/i);
    const lang = firstMatch(text, /<LangVersion>\s*([^<]+)\s*<\/LangVersion>/i);
    const platform = firstMatch(text, /<PlatformTarget>\s*([^<]+)\s*<\/PlatformTarget>/i);
    if (sdk) addUnique(context.frameworks, sdk);
    if (target) addUnique(context.runtimes, target);
    if (lang) addUnique(context.language_versions, lang);
    if (platform) addUnique(context.build_targets, platform);
    if (/System\.Web|ProjectTypeGuids|UseIISExpress/i.test(text)) {
      addUnique(context.project_types, "aspnet-framework");
      addUnique(context.hosting, "IIS/IIS Express");
    }
  }
  if (lowerName === "web.config") {
    addUnique(context.project_types, "aspnet-framework");
    addUnique(context.hosting, "IIS");
    const target = firstMatch(text, /<(?:compilation|httpRuntime)\b[^>]*\btargetFramework\s*=\s*["']([^"']+)["']/i);
    if (target) addUnique(context.runtimes, `.NET Framework ${target}`);
    if (/<pages\b|<system\.web\b|\.aspx/i.test(text)) addUnique(context.project_types, "webforms-or-aspnet-framework");
    extractConnectionMetadata(text, context, evidence);
  }
  if (lowerName === "packages.config") {
    addUnique(context.package_managers, "NuGet packages.config");
    addUnique(context.dependency_sources, evidence);
    for (const match of text.matchAll(/<package\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*\bversion\s*=\s*["']([^"']+)["']/gi)) {
      pushDependency(context, { name: match[1], version: match[2], scope: "direct", source: evidence }, maxDependencies);
    }
  }
  if (lowerName === "global.json") {
    const json = parseJsonSafely(text);
    if (json?.sdk?.version) addUnique(context.runtimes, `.NET SDK ${json.sdk.version}`);
  }
  if (lowerName === "package.json") {
    const json = parseJsonSafely(text);
    addUnique(context.project_types, "nodejs");
    addUnique(context.languages, "JavaScript/TypeScript");
    addUnique(context.package_managers, "npm-compatible");
    addUnique(context.dependency_sources, evidence);
    if (json?.engines?.node) addUnique(context.runtimes, `Node.js ${json.engines.node}`);
    for (const [scope, values] of [["runtime", json?.dependencies], ["development", json?.devDependencies], ["peer", json?.peerDependencies]]) {
      for (const [depName, version] of Object.entries(values || {})) {
        pushDependency(context, { name: depName, version: String(version), scope, source: evidence }, maxDependencies);
      }
    }
  }
  if (["package-lock.json", "yarn.lock", "pnpm-lock.yaml"].includes(lowerName)) {
    addUnique(context.resolved_dependency_sources, evidence);
    addUnique(context.package_managers, lowerName.startsWith("yarn") ? "Yarn" : lowerName.startsWith("pnpm") ? "pnpm" : "npm");
  }
  if (lowerName === "tsconfig.json") {
    addUnique(context.languages, "TypeScript");
    const json = parseJsonSafely(text);
    if (json?.compilerOptions?.target) addUnique(context.build_targets, `TypeScript ${json.compilerOptions.target}`);
  }
  if (lowerName === "pyproject.toml") {
    addUnique(context.project_types, "python");
    addUnique(context.languages, "Python");
    addUnique(context.package_managers, "pyproject");
    addUnique(context.dependency_sources, evidence);
    const python = firstMatch(text, /requires-python\s*=\s*["']([^"']+)["']/i);
    if (python) addUnique(context.runtimes, `Python ${python}`);
    const dependencyBlock = firstMatch(text, /dependencies\s*=\s*\[([\s\S]*?)\]/i);
    for (const match of (dependencyBlock || "").matchAll(/["']([^"']+)["']/g)) {
      const spec = match[1].trim();
      const depName = spec.split(/[<>=!~\[]/, 1)[0].trim();
      pushDependency(context, { name: depName, version: spec.slice(depName.length).trim() || "unspecified", scope: "direct", source: evidence }, maxDependencies);
    }
  }
  if (lowerName === "requirements.txt") {
    addUnique(context.project_types, "python");
    addUnique(context.languages, "Python");
    addUnique(context.package_managers, "pip requirements");
    addUnique(context.dependency_sources, evidence);
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("-") || line.includes("git+") || line.includes("://")) continue;
      const depName = line.split(/[<>=!~\[]/, 1)[0].trim();
      if (depName) pushDependency(context, { name: depName, version: line.slice(depName.length).trim() || "unspecified", scope: "direct", source: evidence }, maxDependencies);
    }
  }
  if (["poetry.lock", "pipfile.lock"].includes(lowerName)) addUnique(context.resolved_dependency_sources, evidence);
  if (lowerName === "pom.xml") {
    addUnique(context.project_types, "java-maven");
    addUnique(context.languages, "Java");
    addUnique(context.package_managers, "Maven");
    addUnique(context.dependency_sources, evidence);
    const javaVersion = firstMatch(text, /<(?:maven\.compiler\.(?:source|target)|java\.version)>\s*([^<]+)\s*<\//i);
    if (javaVersion) addUnique(context.language_versions, `Java ${javaVersion}`);
    extractXmlDependencies(text, evidence, context, maxDependencies);
  }
  if (["build.gradle", "build.gradle.kts"].includes(lowerName)) {
    addUnique(context.project_types, "java-gradle");
    addUnique(context.languages, "Java/Kotlin");
    addUnique(context.package_managers, "Gradle");
    addUnique(context.dependency_sources, evidence);
    const javaVersion = firstMatch(text, /(?:sourceCompatibility|targetCompatibility)\s*=\s*["']?([^\s"']+)/i);
    if (javaVersion) addUnique(context.language_versions, `Java ${javaVersion}`);
  }
  if (ext === ".psd1" || ext === ".psm1") {
    addUnique(context.project_types, "powershell-module");
    addUnique(context.languages, "PowerShell");
    addUnique(context.package_managers, "PowerShell module manifest");
    addUnique(context.dependency_sources, evidence);
    const version = firstMatch(text, /PowerShellVersion\s*=\s*["']([^"']+)["']/i);
    if (version) addUnique(context.runtimes, `PowerShell ${version}`);
  }
}
export async function inspectProjectContext(targetRoot, maxDepth, maxDependencies, maxEncodingSamples) {
  const root = ensureInAllowedRoots(targetRoot);
  const stat = await fs.stat(root);
  if (!stat.isDirectory()) throw new Error("target_root is not a directory.");
  const manifestFiles = [];
  const encodingSamples = [];
  const warnings = [];

  async function walk(current, depth) {
    if (depth > maxDepth) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!DEFAULT_EXCLUDED_DIRS.has(entry.name.toLowerCase())) await walk(path.join(current, entry.name), depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const fullPath = path.join(current, entry.name);
      const lowerName = entry.name.toLowerCase();
      const ext = path.extname(lowerName);
      if (MANIFEST_NAMES.has(lowerName) || PROJECT_EXTENSIONS.has(ext)) manifestFiles.push(fullPath);
      if (encodingSamples.length < maxEncodingSamples && SOURCE_SAMPLE_EXTENSIONS.has(ext)) encodingSamples.push(fullPath);
    }
  }
  await walk(root, 0);
  manifestFiles.sort();

  const context = {
    target_root: toUnixSlashes(root),
    project_types: [],
    languages: [],
    language_versions: [],
    runtimes: [],
    frameworks: [],
    package_managers: [],
    dependency_sources: [],
    resolved_dependency_sources: [],
    dependencies: { direct: [], total_detected: 0, truncated: false },
    build_targets: [],
    hosting: [],
    database_references: { connection_names: [], providers: [], evidence: [], values_redacted: true },
    encoding_policy: {},
    evidence_files: [],
    evidence_fingerprints: [],
    warnings,
    _dependencyKeys: new Set(),
  };

  for (const filePath of manifestFiles) {
    try {
      const { text, buffer } = await readManifestText(filePath);
      analyzeManifest({ root, filePath, text, context, maxDependencies });
      context.evidence_fingerprints.push({
        path: relativeEvidence(root, filePath),
        sha256: hashBuffer(buffer),
        size: buffer.length,
      });
    } catch (error) {
      warnings.push(`${relativeEvidence(root, filePath)}: ${error.message}`);
    }
  }

  const encodingCounts = new Map();
  const lineEndingCounts = new Map();
  let inspectedSamples = 0;
  for (const filePath of encodingSamples) {
    try {
      const info = await inspectTextFile(filePath, 500_000);
      if (info.is_binary || info.truncated) continue;
      encodingCounts.set(info.encoding, (encodingCounts.get(info.encoding) || 0) + 1);
      lineEndingCounts.set(info.line_ending, (lineEndingCounts.get(info.line_ending) || 0) + 1);
      inspectedSamples += 1;
    } catch {}
  }
  const dominant = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
  const dominantEncoding = dominant(encodingCounts);
  const dominantLineEnding = dominant(lineEndingCounts);
  const legacyWeb = context.project_types.some((value) => ["aspnet-framework", "webforms-or-aspnet-framework"].includes(value));
  const recommendedNewFileEncoding = legacyWeb
    ? "utf8-bom-for-legacy-web-files"
    : dominantEncoding !== "Unknown" && dominantEncoding !== "Mixed" ? dominantEncoding : "utf8";
  context.encoding_policy = {
    sample_count: inspectedSamples,
    observed_encodings: Object.fromEntries(encodingCounts),
    dominant_encoding: dominantEncoding,
    dominant_line_ending: dominantLineEnding,
    existing_file_rule: "preserve",
    recommended_new_file_encoding: recommendedNewFileEncoding,
    note: "Inspect same-directory and same-extension siblings before creating a file.",
  };
  context.context_fingerprint = hashBuffer(Buffer.from(
    context.evidence_fingerprints.map((item) => `${item.path}:${item.sha256}`).sort().join("\n"),
    "utf8"
  ));
  delete context._dependencyKeys;
  return context;
}
