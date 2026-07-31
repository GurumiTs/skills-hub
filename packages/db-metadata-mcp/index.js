#!/usr/bin/env node
// index.js - DB Metadata MCP Server (SQL Server read-only metadata, configured aliases only)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sql from "mssql";

const server = new McpServer({
  name: "DB-Metadata-Tools",
  version: "1.2.0",
});

const DEFAULT_CONNECTION_KEY = process.env.DB_METADATA_DEFAULT_CONNECTION?.trim() || "";

function text(data) {
  return {
    content: [{
      type: "text",
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    }],
  };
}

function parseConnections() {
  const raw = process.env.DB_METADATA_CONNECTIONS?.trim();
  if (!raw) return {};

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid DB_METADATA_CONNECTIONS JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("DB_METADATA_CONNECTIONS must be a JSON object keyed by connection alias.");
  }

  const connections = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      throw new Error(`Invalid DB connection key: ${key}. Use letters, numbers, dot, underscore, or dash only.`);
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Invalid DB_METADATA_CONNECTIONS entry for ${key}. Expected an object.`);
    }

    const type = String(value.type || "mssql");
    if (type !== "mssql") {
      throw new Error(`Unsupported DB metadata connection type for ${key}: ${type}. Currently supported: mssql.`);
    }

    const connectionString = value.connectionString || value.connection_string || value.conn || "";
    if (!connectionString || typeof connectionString !== "string") {
      throw new Error(`Missing connectionString for DB_METADATA_CONNECTIONS.${key}.`);
    }

    connections[key] = {
      key,
      type,
      connectionString,
      displayName: String(value.displayName || value.display_name || key),
      description: String(value.description || ""),
      environment: String(value.environment || ""),
      system: String(value.system || ""),
      database: String(value.database || ""),
      tags: Array.isArray(value.tags) ? value.tags.map((item) => String(item)) : [],
    };
  }

  return connections;
}

const CONNECTIONS = parseConnections();

function publicConnectionInfo(connection) {
  return {
    key: connection.key,
    type: connection.type,
    displayName: connection.displayName || connection.key,
    description: connection.description || "",
    environment: connection.environment || "",
    system: connection.system || "",
    database: connection.database || "",
    tags: connection.tags || [],
  };
}

function resolveConnection(connectionKey) {
  const keys = Object.keys(CONNECTIONS);
  if (keys.length === 0) {
    throw new Error(
      "No configured DB metadata connections. Set DB_METADATA_CONNECTIONS in skills-hub. Target project connection strings and legacy fallback variables are not accepted."
    );
  }

  const requested = connectionKey?.trim();
  if (requested) {
    const connection = CONNECTIONS[requested];
    if (!connection) {
      throw new Error(`Unknown DB metadata connection_key: ${requested}. Use list_connections first.`);
    }
    return connection;
  }

  if (DEFAULT_CONNECTION_KEY) {
    const connection = CONNECTIONS[DEFAULT_CONNECTION_KEY];
    if (!connection) {
      throw new Error(`DB_METADATA_DEFAULT_CONNECTION is set to unknown key: ${DEFAULT_CONNECTION_KEY}.`);
    }
    return connection;
  }

  if (keys.length === 1) return CONNECTIONS[keys[0]];
  throw new Error(
    "Multiple configured DB metadata connections exist. Pass connection_key explicitly or set DB_METADATA_DEFAULT_CONNECTION."
  );
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function scoreConnection(connection, queryText) {
  const haystack = [
    connection.key,
    connection.displayName,
    connection.description,
    connection.environment,
    connection.system,
    connection.database,
    ...(connection.tags || []),
  ].join(" ").toLowerCase();

  let score = 0;
  for (const token of tokenize(queryText)) {
    if (haystack.includes(token)) score += token.length >= 4 ? 2 : 1;
  }
  return score;
}

async function withPool(connectionKey, operation) {
  const connection = resolveConnection(connectionKey);
  const pool = new sql.ConnectionPool(connection.connectionString);
  await pool.connect();
  try {
    const result = await operation(pool, connection);
    return { result, connection };
  } finally {
    await pool.close();
  }
}

function normalizeLike(input) {
  if (!input || input.trim() === "") return "%";
  return `%${input.trim()}%`;
}

const connectionKeySchema = z
  .string()
  .optional()
  .describe("Configured DB connection alias from DB_METADATA_CONNECTIONS. Use list_connections or suggest_connection first.");

server.tool("list_connections", {}, async () => {
  try {
    return text({
      policy: "configured-alias-only",
      default_connection_key: DEFAULT_CONNECTION_KEY || null,
      count: Object.keys(CONNECTIONS).length,
      connections: Object.values(CONNECTIONS).map(publicConnectionInfo),
      note: "Connection strings are never returned. Target project config files are not connection sources.",
    });
  } catch (error) {
    return text(`Error: ${error.message}`);
  }
});

server.tool(
  "suggest_connection",
  {
    query_text: z.string().describe("User request or requirement text used to suggest a configured alias."),
    max_results: z.number().int().min(1).max(20).optional().default(5),
  },
  async ({ query_text, max_results }) => {
    try {
      const candidates = Object.values(CONNECTIONS)
        .map((connection) => ({
          ...publicConnectionInfo(connection),
          score: scoreConnection(connection, query_text),
        }))
        .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
        .slice(0, max_results);

      return text({
        policy: "configured-alias-only",
        query_text,
        candidates,
        recommendation: candidates.length > 0 && candidates[0].score > 0 ? candidates[0].key : null,
        note: "If recommendation is null or multiple candidates are plausible, require explicit user confirmation before querying metadata.",
      });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "db_metadata_health",
  { connection_key: connectionKeySchema },
  async ({ connection_key }) => {
    try {
      const { result, connection } = await withPool(connection_key, async (pool) => {
        const response = await pool.request().query(
          "SELECT DB_NAME() AS database_name, @@SERVERNAME AS server_name"
        );
        return response.recordset[0];
      });
      return text({
        ok: true,
        policy: "configured-alias-only",
        connection: publicConnectionInfo(connection),
        ...result,
        note: "Metadata-only connection check completed.",
      });
    } catch (error) {
      return text({ ok: false, policy: "configured-alias-only", error: error.message });
    }
  }
);

server.tool(
  "list_tables",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().optional(),
    table_name_contains: z.string().optional(),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ connection_key, schema_name, table_name_contains, max_rows }) => {
    try {
      const { result: rows, connection } = await withPool(connection_key, async (pool) => {
        const request = pool.request()
          .input("schema_name", sql.NVarChar, schema_name || null)
          .input("table_like", sql.NVarChar, normalizeLike(table_name_contains))
          .input("max_rows", sql.Int, max_rows);
        const response = await request.query(`
          SELECT TOP (@max_rows)
            TABLE_SCHEMA AS schema_name,
            TABLE_NAME AS table_name,
            TABLE_TYPE AS table_type
          FROM INFORMATION_SCHEMA.TABLES
          WHERE (@schema_name IS NULL OR TABLE_SCHEMA = @schema_name)
            AND TABLE_NAME LIKE @table_like
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        return response.recordset;
      });
      return text({ connection: publicConnectionInfo(connection), count: rows.length, tables: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_columns",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().describe("Schema name, for example dbo."),
    table_name: z.string().describe("Table name."),
  },
  async ({ connection_key, schema_name, table_name }) => {
    try {
      const { result: rows, connection } = await withPool(connection_key, async (pool) => {
        const request = pool.request()
          .input("schema_name", sql.NVarChar, schema_name)
          .input("table_name", sql.NVarChar, table_name);
        const response = await request.query(`
          SELECT
            c.ORDINAL_POSITION AS ordinal_position,
            c.COLUMN_NAME AS column_name,
            c.DATA_TYPE AS data_type,
            c.CHARACTER_MAXIMUM_LENGTH AS character_maximum_length,
            c.NUMERIC_PRECISION AS numeric_precision,
            c.NUMERIC_SCALE AS numeric_scale,
            c.IS_NULLABLE AS is_nullable,
            c.COLUMN_DEFAULT AS column_default
          FROM INFORMATION_SCHEMA.COLUMNS c
          WHERE c.TABLE_SCHEMA = @schema_name
            AND c.TABLE_NAME = @table_name
          ORDER BY c.ORDINAL_POSITION
        `);
        return response.recordset;
      });
      return text({ connection: publicConnectionInfo(connection), schema_name, table_name, count: rows.length, columns: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_indexes",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().describe("Schema name, for example dbo."),
    table_name: z.string().describe("Table name."),
  },
  async ({ connection_key, schema_name, table_name }) => {
    try {
      const { result: rows, connection } = await withPool(connection_key, async (pool) => {
        const request = pool.request()
          .input("schema_name", sql.NVarChar, schema_name)
          .input("table_name", sql.NVarChar, table_name);
        const response = await request.query(`
          SELECT
            s.name AS schema_name,
            t.name AS table_name,
            i.name AS index_name,
            i.type_desc,
            i.is_unique,
            i.is_primary_key,
            STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS key_columns
          FROM sys.indexes i
          INNER JOIN sys.tables t ON i.object_id = t.object_id
          INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE s.name = @schema_name
            AND t.name = @table_name
            AND i.index_id > 0
          GROUP BY s.name, t.name, i.name, i.type_desc, i.is_unique, i.is_primary_key
          ORDER BY i.is_primary_key DESC, i.is_unique DESC, i.name
        `);
        return response.recordset;
      });
      return text({ connection: publicConnectionInfo(connection), schema_name, table_name, count: rows.length, indexes: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "find_routines",
  {
    connection_key: connectionKeySchema,
    routine_name_contains: z.string().optional(),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ connection_key, routine_name_contains, max_rows }) => {
    try {
      const { result: rows, connection } = await withPool(connection_key, async (pool) => {
        const request = pool.request()
          .input("routine_like", sql.NVarChar, normalizeLike(routine_name_contains))
          .input("max_rows", sql.Int, max_rows);
        const response = await request.query(`
          SELECT TOP (@max_rows)
            ROUTINE_SCHEMA AS schema_name,
            ROUTINE_NAME AS routine_name,
            ROUTINE_TYPE AS routine_type
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_NAME LIKE @routine_like
          ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME
        `);
        return response.recordset;
      });
      return text({ connection: publicConnectionInfo(connection), count: rows.length, routines: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
