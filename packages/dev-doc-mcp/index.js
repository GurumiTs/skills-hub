#!/usr/bin/env node
// index.js - Dev Docs MCP Server (content generation only; no direct DB connections)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new McpServer({
  name: "Dev-Docs",
  version: "1.2.0",
});

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function asString(value, fallback = "") {
  if (value == null) return fallback;
  return String(value);
}

function slugify(value) {
  return asString(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "document";
}

function nowIso() {
  return new Date().toISOString();
}

function escapeMarkdownCell(value) {
  return asString(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function markdownList(values) {
  const items = asArray(values).map((item) => asString(item).trim()).filter(Boolean);
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- (none)";
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(escapeMarkdownCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeMarkdownCell).join(" | ")} |`),
  ].join("\n");
}

function parsePayload(payload, payloadJson) {
  return payload ?? (payloadJson ? safeJsonParse(payloadJson) : null);
}

function generatedFile(category, relativePath, role, content) {
  return {
    category,
    relative_path: relativePath,
    role,
    content,
  };
}

function buildRequirementsDocuments(raw) {
  const feature = raw && typeof raw === "object" ? raw : {};
  const id = asString(feature.id, "FEAT-000");
  const title = asString(feature.title, "Untitled Feature");
  const base = `${id}_${slugify(title)}`;
  const scope = feature.scope && typeof feature.scope === "object" ? feature.scope : {};

  const stakeholder = [
    `# ${id} - ${title}`,
    "",
    `> Generated: ${nowIso()}`,
    "",
    "## Background",
    asString(feature.background, "(none)"),
    "",
    "## Goals",
    markdownList(feature.goals),
    "",
    "## Non-goals",
    markdownList(feature.non_goals ?? feature.nonGoals),
    "",
    "## In Scope",
    markdownList(scope.in),
    "",
    "## Out of Scope",
    markdownList(scope.out),
    "",
    "## Acceptance Criteria",
    markdownList(feature.acceptance_criteria ?? feature.acceptanceCriteria),
    "",
    "## Open Questions",
    markdownList(feature.open_questions ?? feature.openQuestions),
  ].join("\n");

  const developer = [
    `# ${id} - ${title} (Developer Specification)`,
    "",
    `> Generated: ${nowIso()}`,
    "",
    "## Overview",
    asString(feature.background, "(none)"),
    "",
    "## Goals",
    markdownList(feature.goals),
    "",
    "## User Stories",
    markdownList(asArray(feature.user_stories ?? feature.userStories).map((story) => {
      if (typeof story === "string") return story;
      if (!story || typeof story !== "object") return "";
      const role = story.as ?? story.role ?? "user";
      const want = story.want ?? "";
      const reason = story.so_that ?? story.soThat ?? "";
      return `As ${role}, I want ${want}${reason ? `, so that ${reason}` : ""}`;
    })),
    "",
    "## Acceptance Criteria",
    markdownList(feature.acceptance_criteria ?? feature.acceptanceCriteria),
    "",
    "## Integrations",
    markdownList(asArray(feature.integrations).map((item) => typeof item === "string" ? item : `${item?.name || "Integration"}: ${item?.notes || ""}`)),
    "",
    "## Data Entities",
    markdownList(asArray(feature.data_entities ?? feature.dataEntities).map((item) => typeof item === "string" ? item : asString(item?.name, "Entity"))),
    "",
    "## Testing Direction",
    "- Derive tests from Acceptance Criteria.",
    "- Record Not Executed / Needs More Evidence honestly.",
    "",
    "## Deployment / Rollback Direction",
    "- Confirm environment configuration and secrets injection.",
    "- Document deployment validation and rollback steps.",
    "",
    "## Open Questions",
    markdownList(feature.open_questions ?? feature.openQuestions),
  ].join("\n");

  return [
    generatedFile("requirements", `${base}_stakeholder.md`, "stakeholder", stakeholder),
    generatedFile("requirements", `${base}_developer.md`, "developer", developer),
  ];
}

function buildRunbookDocuments(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const serviceName = asString(input.service_name ?? input.serviceName, "your-service");
  const base = slugify(serviceName);
  const build = input.build && typeof input.build === "object" ? input.build : {};
  const deploy = input.deploy && typeof input.deploy === "object" ? input.deploy : {};
  const rollback = input.rollback && typeof input.rollback === "object" ? input.rollback : {};
  const observability = input.observability && typeof input.observability === "object" ? input.observability : {};

  const runbook = [
    `# Runbook - ${serviceName}`,
    "",
    `> Generated: ${nowIso()}`,
    "",
    "## Service Overview",
    markdownTable(["Field", "Value"], [
      ["Name", serviceName],
      ["Type", asString(input.type, "web")],
      ["Stack", asArray(input.stack).join(", ") || "(none)"],
      ["Environments", asArray(input.environments).join(", ") || "(none)"],
    ]),
    "",
    "## Health Checks",
    markdownList(observability.health_endpoint ?? observability.healthEndpoint),
    "",
    "## Logs",
    markdownList(observability.logs),
    "",
    "## Metrics",
    markdownList(observability.metrics),
    "",
    "## Common Incident Checks",
    "- Check application and dependency logs.",
    "- Check recent deployment and configuration changes.",
    "- Check DB connectivity using configured read-only metadata aliases only.",
    "",
    "## Rollback",
    markdownList(rollback.steps),
  ].join("\n");

  const deployment = [
    `# Deploy Guide - ${serviceName}`,
    "",
    `> Generated: ${nowIso()}`,
    "",
    "## Build",
    markdownList(build.steps),
    "",
    "## Deploy Strategy",
    asString(deploy.strategy, "(TBD)"),
    "",
    "## Deploy Steps",
    markdownList(deploy.steps),
    "",
    "## Rollback Steps",
    markdownList(rollback.steps),
    "",
    "## Post-deploy Validation",
    "- Check health endpoint.",
    "- Verify key user flows.",
    "- Monitor error rate and latency.",
  ].join("\n");

  return [
    generatedFile("dev-doc", `${base}_runbook.md`, "runbook", runbook),
    generatedFile("dev-doc", `${base}_deploy-guide.md`, "deploy-guide", deployment),
  ];
}

function normalizeMetadataSnapshot(raw) {
  const root = raw && typeof raw === "object" ? raw : {};
  const snapshot = root.metadata_snapshot ?? root.metadataSnapshot ?? root.snapshot ?? root;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;

  const tables = asArray(snapshot.tables).map((table) => ({
    schema: asString(table?.schema ?? table?.schema_name, "dbo"),
    name: asString(table?.name ?? table?.table_name, "unknown_table"),
    columns: asArray(table?.columns),
    indexes: asArray(table?.indexes),
    foreignKeys: asArray(table?.foreignKeys ?? table?.foreign_keys),
  }));

  return {
    connection_key: asString(root.connection_key ?? snapshot.connection_key, ""),
    databaseName: asString(snapshot.databaseName ?? snapshot.database_name, "database"),
    generatedAt: asString(snapshot.generatedAt ?? snapshot.generated_at, nowIso()),
    tables,
  };
}

function buildDbDictionary(snapshot) {
  const lines = [
    `# DB Dictionary - ${snapshot.databaseName}`,
    "",
    `> Generated: ${snapshot.generatedAt}`,
    `> Connection alias: ${snapshot.connection_key || "(not supplied)"}`,
    "",
    `Total tables: ${snapshot.tables.length}`,
    "",
  ];

  for (const table of snapshot.tables) {
    lines.push(`## ${table.schema}.${table.name}`, "");
    const columnRows = table.columns.map((column) => [
      asString(column?.name ?? column?.column_name),
      asString(column?.typeName ?? column?.data_type),
      asString(column?.isNullable ?? column?.is_nullable),
      asString(column?.defaultDefinition ?? column?.column_default),
    ]);
    lines.push(columnRows.length
      ? markdownTable(["Column", "Type", "Nullable", "Default"], columnRows)
      : "- Column details were not provided.");
    lines.push("");
  }
  return lines.join("\n");
}

function buildMermaidEr(snapshot) {
  const lines = ["erDiagram"];
  for (const table of snapshot.tables) {
    const entity = `${table.schema}_${table.name}`.replace(/[^A-Za-z0-9_]/g, "_");
    lines.push(`  ${entity} {`);
    for (const column of table.columns.slice(0, 20)) {
      const type = asString(column?.typeName ?? column?.data_type, "string").replace(/[^A-Za-z0-9_]/g, "_");
      const name = asString(column?.name ?? column?.column_name, "column").replace(/[^A-Za-z0-9_]/g, "_");
      lines.push(`    ${type} ${name}`);
    }
    lines.push("  }");
  }
  return lines.join("\n");
}

server.tool(
  "generate_requirements_docs",
  {
    payload_json: z.string().optional(),
    payload: z.any().optional(),
    output_dir: z.string().optional().describe("Deprecated. Artifact path is controlled by SDLC artifact configuration."),
  },
  async ({ payload_json, payload }) => {
    const raw = parsePayload(payload, payload_json);
    if (!raw) return { content: [{ type: "text", text: "Missing payload or valid payload_json." }] };
    return { content: [{ type: "text", text: JSON.stringify({
      files: buildRequirementsDocuments(raw),
      note: "Content only. Write with localFiles.write_sdlc_artifact after review.",
    }, null, 2) }] };
  }
);

server.tool(
  "generate_runbook_docs",
  {
    payload_json: z.string().optional(),
    payload: z.any().optional(),
    output_dir: z.string().optional().describe("Deprecated. Artifact path is controlled by SDLC artifact configuration."),
  },
  async ({ payload_json, payload }) => {
    const raw = parsePayload(payload, payload_json);
    if (!raw) return { content: [{ type: "text", text: "Missing payload or valid payload_json." }] };
    return { content: [{ type: "text", text: JSON.stringify({
      files: buildRunbookDocuments(raw),
      note: "Content only. Write with localFiles.write_sdlc_artifact after review.",
    }, null, 2) }] };
  }
);

server.tool(
  "generate_db_schema_docs",
  {
    payload_json: z.string().optional(),
    payload: z.any().optional().describe("Must contain metadata_snapshot produced from configured DB metadata aliases."),
    dry_run: z.boolean().optional(),
    output_dir: z.string().optional().describe("Deprecated. Artifact path is controlled by SDLC artifact configuration."),
  },
  async ({ payload_json, payload, dry_run }) => {
    if (dry_run) {
      return { content: [{ type: "text", text: JSON.stringify({
        mode: "format-only",
        db_connection_allowed: false,
        required_input: "payload.metadata_snapshot",
        note: "This MCP never establishes DB connections. Query metadata with db-metadata-mcp configured aliases first.",
      }, null, 2) }] };
    }

    const raw = parsePayload(payload, payload_json);
    const snapshot = normalizeMetadataSnapshot(raw);
    if (!snapshot) {
      return { content: [{ type: "text", text:
        "Missing metadata_snapshot. Direct connection strings and arbitrary environment variables are not accepted. Use db-metadata-mcp with a configured connection_key, then pass the read-only snapshot here."
      }] };
    }

    const base = slugify(snapshot.databaseName);
    const files = [
      generatedFile("db", `${base}_schema.json`, "db-schema-json", JSON.stringify(snapshot, null, 2)),
      generatedFile("db", `${base}_dictionary.md`, "db-dictionary-md", buildDbDictionary(snapshot)),
      generatedFile("db", `${base}_er.mmd`, "db-er-mermaid", buildMermaidEr(snapshot)),
    ];

    return { content: [{ type: "text", text: JSON.stringify({
      connection_policy: "configured-alias-only",
      connection_key: snapshot.connection_key || null,
      files,
      note: "Content only. Write with localFiles.write_sdlc_artifact after review.",
    }, null, 2) }] };
  }
);

server.tool(
  "scaffold_examples",
  {
    target_dir: z.string().optional().describe("Directory to copy example JSON files into."),
  },
  async ({ target_dir }) => {
    const sourceDirectory = path.join(__dirname, "examples");
    const destinationDirectory = path.resolve(process.cwd(), target_dir?.trim() || "docs/_examples");
    try {
      await fs.mkdir(destinationDirectory, { recursive: true });
      const names = ["feature_input.json", "runbook_input.json", "dbdoc_input.json"];
      const copied = [];
      for (const name of names) {
        const source = path.join(sourceDirectory, name);
        const destination = path.join(destinationDirectory, name);
        await fs.copyFile(source, destination);
        copied.push(destination.replaceAll("\\", "/"));
      }
      return { content: [{ type: "text", text: JSON.stringify({ copied }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to scaffold examples: ${error.message}` }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Dev-Docs MCP Server running in content-generation-only mode.");
