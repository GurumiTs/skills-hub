#!/usr/bin/env node
// index.js - Dev Docs MCP Server (requirements/runbook/db schema)

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
  version: "1.1.0",
});

// ------------------------------
// Helpers
// ------------------------------

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function asArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function asString(v, fallback = "") {
  if (v == null) return fallback;
  return String(v);
}

function escapeMd(s) {
  return asString(s, "").replaceAll("|", "\\|");
}

function mdList(items) {
  const arr = asArray(items).map((x) => asString(x).trim()).filter(Boolean);
  if (arr.length === 0) return "- (none)";
  return arr.map((x) => `- ${x}`).join("\n");
}

function mdTable(headers, rows) {
  const h = headers.map(escapeMd);
  const sep = headers.map(() => "---");
  const body = rows.map((r) => r.map(escapeMd));
  return [
    `| ${h.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

function slugify(s) {
  return asString(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "doc";
}

function nowIso() {
  return new Date().toISOString();
}

async function loadMssql() {
  try {
    const pkg = await import("mssql");
    return pkg?.default ?? pkg;
  } catch {
    return null;
  }
}

function normalizeFeatureInput(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  return {
    id: asString(o.id, "FEAT-000"),
    title: asString(o.title, "Untitled Feature"),
    background: asString(o.background, ""),
    goals: asArray(o.goals),
    non_goals: asArray(o.non_goals ?? o.nonGoals),
    stakeholders: o.stakeholders && typeof o.stakeholders === "object" ? o.stakeholders : {},
    users: asArray(o.users),
    scope: o.scope && typeof o.scope === "object" ? o.scope : { in: [], out: [] },
    user_stories: asArray(o.user_stories ?? o.userStories),
    acceptance_criteria: asArray(o.acceptance_criteria ?? o.acceptanceCriteria),
    non_functional: o.non_functional && typeof o.non_functional === "object" ? o.non_functional : {},
    integrations: asArray(o.integrations),
    data_entities: asArray(o.data_entities ?? o.dataEntities),
    open_questions: asArray(o.open_questions ?? o.openQuestions),
  };
}

function normalizeRunbookInput(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  return {
    service_name: asString(o.service_name ?? o.serviceName, "your-service"),
    type: asString(o.type, "web"),
    stack: asArray(o.stack),
    environments: asArray(o.environments),
    build: o.build && typeof o.build === "object" ? o.build : {},
    config: o.config && typeof o.config === "object" ? o.config : {},
    database: o.database && typeof o.database === "object" ? o.database : {},
    deploy: o.deploy && typeof o.deploy === "object" ? o.deploy : {},
    rollback: o.rollback && typeof o.rollback === "object" ? o.rollback : {},
    observability: o.observability && typeof o.observability === "object" ? o.observability : {},
    support: o.support && typeof o.support === "object" ? o.support : {},
  };
}

function buildRequirementsStakeholderMd(f) {
  const scopeIn = mdList(f.scope?.in);
  const scopeOut = mdList(f.scope?.out);

  const stakeholders = Object.entries(f.stakeholders || {})
    .map(([k, v]) => `- ${k}: ${asString(v)}`)
    .join("\n") || "- (none)";

  return [
    `# ${f.id} – ${f.title}`,
    ``,
    `> Generated: ${nowIso()}`,
    ``,
    `## Background`,
    f.background ? f.background : "(none)",
    ``,
    `## Goals`,
    mdList(f.goals),
    ``,
    `## Non-goals`,
    mdList(f.non_goals),
    ``,
    `## Stakeholders`,
    stakeholders,
    ``,
    `## Scope`,
    `### In scope`,
    scopeIn,
    ``,
    `### Out of scope`,
    scopeOut,
    ``,
    `## Acceptance Criteria`,
    mdList(f.acceptance_criteria),
    ``,
    `## Risks & Notes`,
    `- Dependencies: ${asArray(f.integrations).length ? "See Integrations" : "(none)"}`,
    `- Security / compliance: ${Object.keys(f.non_functional || {}).length ? "See Appendix" : "(none)"}`,
    ``,
    `## Open Questions`,
    mdList(f.open_questions),
    ``,
    `## Appendix`,
    `### Integrations`,
    mdList(asArray(f.integrations).map((x) => (typeof x === "string" ? x : `${x.name ?? "Integration"}: ${x.notes ?? ""}`.trim()))),
    ``,
    `### Non-functional`,
    `**Security**`,
    mdList(f.non_functional?.security),
    ``,
    `**Performance**`,
    mdList(f.non_functional?.performance),
  ].join("\n");
}

function buildRequirementsDeveloperMd(f) {
  const stories = asArray(f.user_stories)
    .map((s) => {
      if (typeof s === "string") return `- ${s}`;
      if (s && typeof s === "object") {
        const asRole = s.as ?? s.role ?? "user";
        const want = s.want ?? "";
        const so = s.so_that ?? s.soThat ?? "";
        return `- As ${asRole}, I want ${want}${so ? `, so that ${so}` : ""}`;
      }
      return null;
    })
    .filter(Boolean);

  const entities = asArray(f.data_entities).map((e) => {
    if (typeof e === "string") return { name: e, fields: [] };
    if (e && typeof e === "object") return { name: e.name ?? "Entity", fields: asArray(e.fields) };
    return { name: "Entity", fields: [] };
  });

  const entityMd = entities.length
    ? entities
        .map((e) => {
          const fields = asArray(e.fields).length ? mdList(e.fields) : "- (TBD)";
          return `#### ${e.name}\n\n${fields}`;
        })
        .join("\n\n")
    : "(none)";

  const nf = f.non_functional || {};
  const sec = mdList(nf.security);
  const perf = mdList(nf.performance);

  return [
    `# ${f.id} – ${f.title} (Developer Spec)`,
    ``,
    `> Generated: ${nowIso()}`,
    ``,
    `## Overview`,
    f.background ? f.background : "(none)",
    ``,
    `## Goals`,
    mdList(f.goals),
    ``,
    `## User Stories`,
    stories.length ? stories.join("\n") : "- (none)",
    ``,
    `## Proposed API Contract (draft)`,
    `> Keep this section generic. Replace with real endpoints once you confirm routes & auth strategy.`,
    ``,
    mdTable(
      ["Endpoint", "Method", "Auth", "Notes"],
      [
        ["/api/<feature>", "GET", "TBD", "list/read"],
        ["/api/<feature>", "POST", "TBD", "create/action"],
        ["/api/<feature>/{id}", "PUT", "TBD", "update"],
      ]
    ),
    ``,
    `## Data Model (draft)`,
    entityMd,
    ``,
    `## Acceptance Criteria (dev-ready)`,
    mdList(f.acceptance_criteria),
    ``,
    `## Non-functional Requirements`,
    `### Security`,
    sec,
    ``,
    `### Performance`,
    perf,
    ``,
    `## Logging & Observability`,
    `- Log important state transitions (create/update/approve) with correlation IDs.`,
    `- Emit error logs with safe redaction (no secrets/tokens).`,
    `- Add basic health checks if applicable.`,
    ``,
    `## Error Handling`,
    mdTable(
      ["Scenario", "User-facing", "HTTP/Return", "Notes"],
      [
        ["Validation error", "Show field errors", "400", "Do not leak internals"],
        ["Auth/permission denied", "Access denied", "401/403", ""],
        ["Unexpected error", "Try again later", "500", "Log stack"],
      ]
    ),
    ``,
    `## Testing Plan`,
    `- Unit tests for core validation & calculations`,
    `- Integration tests for API + DB (if used)`,
    `- Security tests: rate limit / brute-force / injection checks`,
    `- Acceptance test walkthrough based on criteria`,
    ``,
    `## Deployment Notes`,
    `- Confirm config/secrets injection (env vars / key vault).`,
    `- Plan DB migrations (scripts or migration tool).`,
    `- Rollback strategy documented in runbook.`,
    ``,
    `## Open Questions`,
    mdList(f.open_questions),
  ].join("\n");
}

function normalizeDbDocInput(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const connection = o.connection && typeof o.connection === "object" ? o.connection : {};
  const options = o.options && typeof o.options === "object" ? o.options : {};
  const output = options.output && typeof options.output === "object" ? options.output : {};

  return {
    connection: {
      connection_string: asString(connection.connection_string ?? connection.connectionString, ""),
      from_env: asString(connection.from_env ?? connection.fromEnv, "MSSQL_CONN"),
      timeout_ms: Number(connection.timeout_ms ?? connection.timeoutMs ?? 15000),
    },
    options: {
      schemas: asArray(options.schemas).map((s) => asString(s).trim()).filter(Boolean),
      include_tables: asArray(options.include_tables ?? options.includeTables).map(asString),
      exclude_tables: asArray(options.exclude_tables ?? options.excludeTables).map(asString),
      include_views: Boolean(options.include_views ?? options.includeViews ?? false),
      max_tables: Number(options.max_tables ?? options.maxTables ?? 200),
      output: {
        markdown: Boolean(output.markdown ?? true),
        json: Boolean(output.json ?? true),
        mermaid_er: Boolean(output.mermaid_er ?? output.mermaidEr ?? true),
      },
    },
  };
}

function pickConnectionString(dbInput) {
  if (dbInput.connection.connection_string) return dbInput.connection.connection_string;
  const envName = dbInput.connection.from_env || "MSSQL_CONN";
  return process.env[envName] || "";
}

function tableMatchesFilter({ schema, name }, { schemas, include_tables, exclude_tables }) {
  if (schemas.length && !schemas.includes(schema)) return false;

  const full = `${schema}.${name}`;
  const inc = include_tables.map((x) => x.toLowerCase());
  const exc = exclude_tables.map((x) => x.toLowerCase());

  // include filter supports either table name or schema.table
  if (inc.length) {
    const ok = inc.includes(name.toLowerCase()) || inc.includes(full.toLowerCase());
    if (!ok) return false;
  }
  if (exc.includes(name.toLowerCase()) || exc.includes(full.toLowerCase())) return false;
  return true;
}

async function mssqlQuery(pool, sqlText, params = {}) {
  const req = pool.request();
  for (const [k, v] of Object.entries(params)) {
    req.input(k, v);
  }
  const result = await req.query(sqlText);
  return result.recordset;
}

function buildDbDictionaryMd(schemaSnapshot) {
  const { databaseName, generatedAt, tables } = schemaSnapshot;

  const lines = [];
  lines.push(`# DB Dictionary – ${databaseName}`);
  lines.push("");
  lines.push(`> Generated: ${generatedAt}`);
  lines.push("");
  lines.push(`Total tables: ${tables.length}`);
  lines.push("");

  for (const t of tables) {
    lines.push(`## ${t.schema}.${t.name}`);
    if (t.description) {
      lines.push("");
      lines.push(t.description);
    }
    lines.push("");

    const colRows = t.columns.map((c) => {
      const type = c.maxLength != null && c.typeName && /char|binary/i.test(c.typeName)
        ? `${c.typeName}(${c.maxLength === -1 ? "max" : c.maxLength})`
        : c.precision != null && c.scale != null && /decimal|numeric/i.test(c.typeName)
          ? `${c.typeName}(${c.precision},${c.scale})`
          : c.typeName;

      const flags = [
        c.isPrimaryKey ? "PK" : "",
        c.isIdentity ? "IDENTITY" : "",
        c.isNullable ? "NULL" : "NOT NULL",
      ].filter(Boolean).join(", ");

      return [
        c.name,
        type,
        flags,
        c.defaultDefinition || "",
        c.description || "",
      ];
    });

    lines.push(mdTable(["Column", "Type", "Flags", "Default", "Description"], colRows));
    lines.push("");

    if (t.foreignKeys.length) {
      lines.push("### Foreign Keys");
      lines.push(mdTable(
        ["FK", "From", "To"],
        t.foreignKeys.map((fk) => [
          fk.name,
          `${t.schema}.${t.name}(${fk.columns.map((c) => c.from).join(",")})`,
          `${fk.refSchema}.${fk.refTable}(${fk.columns.map((c) => c.to).join(",")})`,
        ])
      ));
      lines.push("");
    }

    if (t.indexes.length) {
      lines.push("### Indexes");
      lines.push(mdTable(
        ["Index", "Type", "Unique", "Columns"],
        t.indexes.map((ix) => [
          ix.name,
          ix.typeDesc,
          ix.isUnique ? "Yes" : "No",
          ix.columns.join(", "),
        ])
      ));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function buildMermaidEr(schemaSnapshot) {
  const { tables } = schemaSnapshot;

  const nameMap = new Map();
  const entityName = (schema, table) => {
    const key = `${schema}.${table}`;
    if (!nameMap.has(key)) {
      // Mermaid entity names: keep it simple
      nameMap.set(key, `${schema}_${table}`.replace(/[^A-Za-z0-9_]/g, "_"));
    }
    return nameMap.get(key);
  };

  const lines = [];
  lines.push("erDiagram");

  for (const t of tables) {
    const en = entityName(t.schema, t.name);
    lines.push(`  ${en} {`);

    // Keep ER compact: list PK + FK + a few key columns
    const pkCols = t.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    const fkCols = new Set();
    for (const fk of t.foreignKeys) {
      for (const c of fk.columns) fkCols.add(c.from);
    }

    const important = [];
    for (const c of t.columns) {
      if (pkCols.includes(c.name) || fkCols.has(c.name)) important.push(c);
    }

    const fallbackCols = t.columns.slice(0, 8);
    const chosen = important.length ? important : fallbackCols;

    for (const c of chosen) {
      const type = c.typeName;
      const tags = [];
      if (c.isPrimaryKey) tags.push("PK");
      if (fkCols.has(c.name)) tags.push("FK");
      const tagStr = tags.length ? ` ${tags.join(" ")}` : "";
      lines.push(`    ${type} ${c.name}${tagStr}`);
    }

    lines.push("  }");
  }

  // Relations
  for (const t of tables) {
    const fromEntity = entityName(t.schema, t.name);
    for (const fk of t.foreignKeys) {
      const toEntity = entityName(fk.refSchema, fk.refTable);
      // Many-to-one: many rows in child table point to one parent
      lines.push(`  ${toEntity} ||--o{ ${fromEntity} : "${fk.name}"`);
    }
  }

  return lines.join("\n");
}

// ------------------------------
// Tool: generate_requirements_docs
// ------------------------------

server.tool(
  "generate_requirements_docs",
  {
    payload_json: z
      .string()
      .optional()
      .describe("Feature input JSON string. If omitted, use payload object."),
    payload: z
      .any()
      .optional()
      .describe("Feature input object (preferred)."),
    output_dir: z
      .string()
      .optional()
      .describe("Suggested output directory for docs (default: docs/requirements)."),
  },
  async ({ payload_json, payload, output_dir }) => {
    const raw = payload ?? (payload_json ? safeJsonParse(payload_json) : null);
    if (!raw) {
      return {
        content: [
          {
            type: "text",
            text:
              "❌ Missing input. Provide `payload` (object) or `payload_json` (JSON string).\n\n" +
              "Tip: Start from packages/dev-doc-mcp/examples/feature_input.json",
          },
        ],
      };
    }

    const f = normalizeFeatureInput(raw);
    const dir = output_dir?.trim() || "docs/requirements";

    const base = `${f.id}_${slugify(f.title)}`;
    const stakeholderPath = `${dir}/${base}_stakeholder.md`;
    const developerPath = `${dir}/${base}_developer.md`;

    const stakeholderMd = buildRequirementsStakeholderMd(f);
    const developerMd = buildRequirementsDeveloperMd(f);

    const result = {
      files: [
        { path: stakeholderPath, role: "stakeholder", content: stakeholderMd },
        { path: developerPath, role: "developer", content: developerMd },
      ],
      note:
        "This tool does NOT write files. Use file-mcp to write after reviewing output.",
    };

    return {
      content: [
        {
          type: "text",
          text:
            `✅ Generated 2 documents (review then write with file-mcp).\n\n` +
            `\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`,
        },
      ],
    };
  }
);

// ------------------------------
// Tool: generate_runbook_docs
// ------------------------------

server.tool(
  "generate_runbook_docs",
  {
    payload_json: z
      .string()
      .optional()
      .describe("Runbook input JSON string. If omitted, use payload object."),
    payload: z
      .any()
      .optional()
      .describe("Runbook input object (preferred)."),
    output_dir: z
      .string()
      .optional()
      .describe("Suggested output directory for docs (default: docs/runbook)."),
  },
  async ({ payload_json, payload, output_dir }) => {
    const raw = payload ?? (payload_json ? safeJsonParse(payload_json) : null);
    if (!raw) {
      return {
        content: [
          {
            type: "text",
            text:
              "❌ Missing input. Provide `payload` (object) or `payload_json` (JSON string).\n\n" +
              "Tip: Start from packages/dev-doc-mcp/examples/runbook_input.json",
          },
        ],
      };
    }

    const r = normalizeRunbookInput(raw);
    const dir = output_dir?.trim() || "docs/runbook";

    const base = slugify(r.service_name);
    const runbookPath = `${dir}/${base}_runbook.md`;
    const deployPath = `${dir}/${base}_deploy-guide.md`;

    const runbookMd = [
      `# Runbook – ${r.service_name}`,
      ``,
      `> Generated: ${nowIso()}`,
      ``,
      `## Service Overview`,
      mdTable(
        ["Field", "Value"],
        [
          ["Name", r.service_name],
          ["Type", r.type],
          ["Stack", asArray(r.stack).join(", ") || "(none)"],
          ["Environments", asArray(r.environments).join(", ") || "(none)"],
        ]
      ),
      ``,
      `## Health Checks`,
      mdList(r.observability?.health_endpoint ?? r.observability?.healthEndpoint ?? []),
      ``,
      `## Logs`,
      mdList(r.observability?.logs),
      ``,
      `## Metrics`,
      mdList(r.observability?.metrics),
      ``,
      `## Common Incidents (fill in)`,
      `- 5xx spike: check app logs, dependencies, DB connections`,
      `- High latency: check DB locks, downstream timeouts, recent deploy`,
      `- Auth failures: check identity provider / time drift / certs`,
      ``,
      `## On-call / Support`,
      mdTable(
        ["Field", "Value"],
        [
          ["On-call", asString(r.support?.oncall ?? r.support?.onCall, "(TBD)")],
          ["Contacts", asArray(r.support?.contacts).join(", ") || "(none)"],
        ]
      ),
      ``,
      `## Rollback (quick)`,
      mdList(r.rollback?.steps),
    ].join("\n");

    const deployMd = [
      `# Deploy Guide – ${r.service_name}`,
      ``,
      `> Generated: ${nowIso()}`,
      ``,
      `## Build`,
      mdTable(
        ["Field", "Value"],
        [
          ["Repo", asString(r.build?.repo, "(TBD)")],
          ["Build Steps", asArray(r.build?.steps).join(" | ") || "(none)"],
        ]
      ),
      ``,
      `## Configuration`,
      `### Secrets`,
      mdList(r.config?.secrets),
      ``,
      `### App settings`,
      mdList(r.config?.appsettings ?? r.config?.appSettings),
      ``,
      `## Database`,
      mdTable(
        ["Field", "Value"],
        [
          ["Migrations", asString(r.database?.migrations, "(none)")],
          ["Notes", asString(r.database?.notes, "")],
        ]
      ),
      ``,
      `## Deploy Strategy`,
      `- Strategy: ${asString(r.deploy?.strategy, "(TBD)")}`,
      ``,
      `### Deploy Steps`,
      mdList(r.deploy?.steps),
      ``,
      `## Rollback Steps`,
      mdList(r.rollback?.steps),
      ``,
      `## Post-deploy Verification`,
      `- Check health endpoint`,
      `- Verify key user flows`,
      `- Monitor error rate & latency for 15–30 minutes`,
    ].join("\n");

    const result = {
      files: [
        { path: runbookPath, role: "runbook", content: runbookMd },
        { path: deployPath, role: "deploy-guide", content: deployMd },
      ],
      note:
        "This tool does NOT write files. Use file-mcp to write after reviewing output.",
    };

    return {
      content: [
        {
          type: "text",
          text:
            `✅ Generated 2 documents (review then write with file-mcp).\n\n` +
            `\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`,
        },
      ],
    };
  }
);

// ------------------------------
// Tool: generate_mssql_schema_docs
// ------------------------------

server.tool(
  "generate_mssql_schema_docs",
  {
    payload_json: z
      .string()
      .optional()
      .describe("DB doc input JSON string. If omitted, use payload object."),
    payload: z.any().optional().describe("DB doc input object (preferred)."),
    dry_run: z
      .boolean()
      .optional()
      .describe("If true, only return the metadata queries used (no DB connection)."),
    output_dir: z
      .string()
      .optional()
      .describe("Suggested output directory for docs (default: docs/db)."),
  },
  async ({ payload_json, payload, dry_run, output_dir }) => {
    const raw = payload ?? (payload_json ? safeJsonParse(payload_json) : null);
    if (!raw) {
      return {
        content: [
          {
            type: "text",
            text:
              "❌ Missing input. Provide `payload` (object) or `payload_json` (JSON string).\n\n" +
              "Tip: Start from packages/dev-doc-mcp/examples/dbdoc_input.json",
          },
        ],
      };
    }

    const dbInput = normalizeDbDocInput(raw);

    const QUERIES = {
      databaseName: `SELECT DB_NAME() AS database_name;`,
      tables: `
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  t.object_id AS object_id,
  CAST(ep.value AS NVARCHAR(4000)) AS table_description
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = t.object_id
 AND ep.minor_id = 0
 AND ep.name = 'MS_Description'
ORDER BY s.name, t.name;`,
      columns: `
SELECT
  c.object_id,
  c.column_id,
  c.name AS column_name,
  ty.name AS type_name,
  c.max_length,
  c.precision,
  c.scale,
  c.is_nullable,
  c.is_identity,
  dc.definition AS default_definition,
  CAST(ep.value AS NVARCHAR(4000)) AS column_description
FROM sys.columns c
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = c.object_id
 AND ep.minor_id = c.column_id
 AND ep.name = 'MS_Description'
ORDER BY c.object_id, c.column_id;`,
      pk: `
SELECT
  kc.parent_object_id AS object_id,
  kc.name AS pk_name,
  ic.key_ordinal,
  col.name AS column_name
FROM sys.key_constraints kc
JOIN sys.indexes i ON kc.parent_object_id = i.object_id AND kc.unique_index_id = i.index_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns col ON ic.object_id = col.object_id AND ic.column_id = col.column_id
WHERE kc.type = 'PK'
ORDER BY kc.parent_object_id, ic.key_ordinal;`,
      fks: `
SELECT
  fk.object_id AS fk_object_id,
  fk.name AS fk_name,
  ps.name AS parent_schema,
  pt.name AS parent_table,
  rs.name AS ref_schema,
  rt.name AS ref_table,
  pc.name AS parent_column,
  rc.name AS ref_column,
  fkc.constraint_column_id
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables pt ON fk.parent_object_id = pt.object_id
JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
ORDER BY ps.name, pt.name, fk.name, fkc.constraint_column_id;`,
      indexes: `
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  i.object_id,
  i.name AS index_name,
  i.type_desc,
  i.is_unique,
  ic.key_ordinal,
  c.name AS column_name
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.name IS NOT NULL
  AND i.is_hypothetical = 0
ORDER BY s.name, t.name, i.name, ic.key_ordinal;`,
    };

    if (dry_run) {
      return {
        content: [
          {
            type: "text",
            text:
              "🧪 dry_run=true (no DB connection). Here are the metadata queries this tool uses:\n\n" +
              `\`\`\`json\n${JSON.stringify(QUERIES, null, 2)}\n\`\`\`\n`,
          },
        ],
      };
    }

    const conn = pickConnectionString(dbInput);
    if (!conn) {
      return {
        content: [
          {
            type: "text",
            text:
              "❌ Missing connection string. Provide one of:\n" +
              "- payload.connection.connection_string\n" +
              "- or set env var named by payload.connection.from_env (default MSSQL_CONN)\n\n" +
              "Security tip: prefer env var. Do not paste secrets into chat.",
          },
        ],
      };
    }

    const dir = output_dir?.trim() || "docs/db";

    const sql = await loadMssql();
    if (!sql) {
      return {
        content: [
          {
            type: "text",
            text:
              "❌ Missing dependency: mssql.\n" +
              "Run: npm install (from repo root) to install workspace dependencies.\n" +
              "Then restart Gemini CLI / MCP server.",
          },
        ],
      };
    }

    let pool;
    try {
      pool = await sql.connect({
        connectionString: conn,
        options: {
          enableArithAbort: true,
          trustServerCertificate: true,
        },
        requestTimeout: dbInput.connection.timeout_ms,
        connectionTimeout: dbInput.connection.timeout_ms,
      });

      const dbNameRow = await mssqlQuery(pool, QUERIES.databaseName);
      const databaseName = dbNameRow?.[0]?.database_name ?? "database";

      const allTables = await mssqlQuery(pool, QUERIES.tables);
      const cols = await mssqlQuery(pool, QUERIES.columns);
      const pkRows = await mssqlQuery(pool, QUERIES.pk);
      const fkRows = await mssqlQuery(pool, QUERIES.fks);
      const ixRows = await mssqlQuery(pool, QUERIES.indexes);

      // Build lookup maps
      const tableByObj = new Map();
      const tables = [];

      for (const t of allTables) {
        const schema = t.schema_name;
        const name = t.table_name;
        const objectId = t.object_id;

        if (!tableMatchesFilter({ schema, name }, dbInput.options)) continue;

        const item = {
          schema,
          name,
          objectId,
          description: t.table_description || "",
          columns: [],
          foreignKeys: [],
          indexes: [],
        };
        tableByObj.set(objectId, item);
        tables.push(item);
      }

      if (tables.length > dbInput.options.max_tables) {
        return {
          content: [
            {
              type: "text",
              text:
                `❌ Too many tables after filtering (${tables.length}). Set options.max_tables higher or filter by schemas/include_tables.`,
            },
          ],
        };
      }

      const pkMap = new Map(); // objectId -> set(columnName)
      for (const r of pkRows) {
        const set = pkMap.get(r.object_id) ?? new Set();
        set.add(r.column_name);
        pkMap.set(r.object_id, set);
      }

      for (const c of cols) {
        const t = tableByObj.get(c.object_id);
        if (!t) continue;
        const isPk = pkMap.get(c.object_id)?.has(c.column_name) ?? false;

        t.columns.push({
          name: c.column_name,
          typeName: c.type_name,
          maxLength: c.max_length,
          precision: c.precision,
          scale: c.scale,
          isNullable: Boolean(c.is_nullable),
          isIdentity: Boolean(c.is_identity),
          defaultDefinition: c.default_definition || "",
          description: c.column_description || "",
          isPrimaryKey: isPk,
        });
      }

      // FKs
      const fkMap = new Map(); // parent schema.table + fk_name -> fk obj
      for (const r of fkRows) {
        const parentFull = `${r.parent_schema}.${r.parent_table}`;
        const key = `${parentFull}::${r.fk_name}`;

        const fk = fkMap.get(key) ?? {
          name: r.fk_name,
          parentSchema: r.parent_schema,
          parentTable: r.parent_table,
          refSchema: r.ref_schema,
          refTable: r.ref_table,
          columns: [],
        };

        fk.columns.push({ from: r.parent_column, to: r.ref_column, ordinal: r.constraint_column_id });
        fkMap.set(key, fk);
      }

      for (const fk of fkMap.values()) {
        const parent = tables.find((t) => t.schema === fk.parentSchema && t.name === fk.parentTable);
        if (!parent) continue;
        fk.columns.sort((a, b) => a.ordinal - b.ordinal);
        parent.foreignKeys.push({
          name: fk.name,
          refSchema: fk.refSchema,
          refTable: fk.refTable,
          columns: fk.columns.map(({ from, to }) => ({ from, to })),
        });
      }

      // Indexes
      const ixMap = new Map(); // objectId::indexName -> {name,typeDesc,isUnique,columns[]}
      for (const r of ixRows) {
        const key = `${r.object_id}::${r.index_name}`;
        const ix = ixMap.get(key) ?? {
          objectId: r.object_id,
          name: r.index_name,
          typeDesc: r.type_desc,
          isUnique: Boolean(r.is_unique),
          columns: [],
        };
        ix.columns.push({ name: r.column_name, ordinal: r.key_ordinal });
        ixMap.set(key, ix);
      }

      for (const ix of ixMap.values()) {
        const t = tableByObj.get(ix.objectId);
        if (!t) continue;
        ix.columns.sort((a, b) => a.ordinal - b.ordinal);
        t.indexes.push({
          name: ix.name,
          typeDesc: ix.typeDesc,
          isUnique: ix.isUnique,
          columns: ix.columns.map((c) => c.name),
        });
      }

      const snapshot = {
        generatedAt: nowIso(),
        databaseName,
        schemas: dbInput.options.schemas.length ? dbInput.options.schemas : Array.from(new Set(tables.map((t) => t.schema))),
        tables,
      };

      const base = slugify(databaseName);

      const files = [];
      if (dbInput.options.output.json) {
        files.push({
          path: `${dir}/${base}_schema.json`,
          role: "db-schema-json",
          content: JSON.stringify(snapshot, null, 2),
        });
      }

      if (dbInput.options.output.markdown) {
        files.push({
          path: `${dir}/${base}_dictionary.md`,
          role: "db-dictionary-md",
          content: buildDbDictionaryMd(snapshot),
        });
      }

      if (dbInput.options.output.mermaid_er) {
        files.push({
          path: `${dir}/${base}_er.mmd`,
          role: "db-er-mermaid",
          content: buildMermaidEr(snapshot),
        });
      }

      const result = {
        files,
        note:
          "This tool does NOT write files. Use file-mcp to write after reviewing output.",
      };

      return {
        content: [
          {
            type: "text",
            text:
              `✅ Generated DB docs for database: ${databaseName}.\n\n` +
              `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text:
              `❌ Failed to generate schema docs.\n` +
              `Error: ${e?.message || String(e)}\n\n` +
              `Tips:\n` +
              `- Ensure MSSQL_CONN is reachable from this machine\n` +
              `- Use a read-only account\n` +
              `- If TLS/cert issues, set TrustServerCertificate=true in your connection string\n`,
          },
        ],
      };
    } finally {
      try {
        await pool?.close();
      } catch {
        // ignore
      }
    }
  }
);

// ------------------------------
// Tool: scaffold_examples (optional convenience)
// ------------------------------

server.tool(
  "scaffold_examples",
  {
    target_dir: z
      .string()
      .optional()
      .describe("Directory to copy example JSON files into (default: ./docs/_examples)."),
  },
  async ({ target_dir }) => {
    const srcDir = path.join(__dirname, "examples");
    const destDir = path.resolve(process.cwd(), target_dir?.trim() || "docs/_examples");

    try {
      await fs.mkdir(destDir, { recursive: true });

      const names = ["feature_input.json", "runbook_input.json", "dbdoc_input.json"];
      const copied = [];

      for (const name of names) {
        const src = path.join(srcDir, name);
        const dest = path.join(destDir, name);
        await fs.copyFile(src, dest);
        copied.push(dest.replaceAll("\\", "/"));
      }

      return {
        content: [
          {
            type: "text",
            text:
              `✅ Copied example inputs to ${destDir.replaceAll("\\", "/")}\n` +
              copied.map((p) => `- ${p}`).join("\n"),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to scaffold examples: ${e?.message || String(e)}`,
          },
        ],
      };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Dev-Docs MCP Server running...");
