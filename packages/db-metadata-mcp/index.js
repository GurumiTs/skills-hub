#!/usr/bin/env node
// index.js - DB Metadata MCP Server (SQL Server read-only metadata, multi-connection)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sql from "mssql";

const server = new McpServer({
  name: "DB-Metadata-Tools",
  version: "1.1.0",
});

const LEGACY_CONN = process.env.DB_METADATA_MSSQL_CONN || process.env.MSSQL_CONN || "";
const DEFAULT_CONNECTION_KEY = process.env.DB_METADATA_DEFAULT_CONNECTION || "";

function text(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

function parseConnections() {
  const raw = process.env.DB_METADATA_CONNECTIONS?.trim();
  const connections = {};

  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid DB_METADATA_CONNECTIONS JSON: ${error.message}`);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("DB_METADATA_CONNECTIONS must be a JSON object keyed by connection alias.");
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
        throw new Error(`Invalid DB connection key: ${key}. Use letters, numbers, dot, underscore, or dash only.`);
      }

      if (typeof value === "string") {
        connections[key] = {
          key,
          type: "mssql",
          connectionString: value,
          description: "",
          tags: [],
        };
        continue;
      }

      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`Invalid DB_METADATA_CONNECTIONS entry for ${key}. Expected connection string or object.`);
      }

      const type = value.type || "mssql";
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
        tags: Array.isArray(value.tags) ? value.tags.map((x) => String(x)) : [],
      };
    }
  }

  if (Object.keys(connections).length === 0 && LEGACY_CONN) {
    connections.default = {
      key: "default",
      type: "mssql",
      connectionString: LEGACY_CONN,
      displayName: "default",
      description: "Legacy single connection from DB_METADATA_MSSQL_CONN or MSSQL_CONN.",
      environment: "",
      system: "",
      database: "",
      tags: ["default"],
    };
  }

  return connections;
}

const CONNECTIONS = parseConnections();

function publicConnectionInfo(conn) {
  return {
    key: conn.key,
    type: conn.type,
    displayName: conn.displayName || conn.key,
    description: conn.description || "",
    environment: conn.environment || "",
    system: conn.system || "",
    database: conn.database || "",
    tags: conn.tags || [],
  };
}

function resolveConnection(connectionKey) {
  const keys = Object.keys(CONNECTIONS);
  if (keys.length === 0) {
    throw new Error("No DB metadata connections configured. Set DB_METADATA_CONNECTIONS, DB_METADATA_MSSQL_CONN, or MSSQL_CONN.");
  }

  const requested = connectionKey?.trim();
  if (requested) {
    const conn = CONNECTIONS[requested];
    if (!conn) {
      throw new Error(`Unknown DB metadata connection_key: ${requested}. Use list_connections first.`);
    }
    return conn;
  }

  if (DEFAULT_CONNECTION_KEY) {
    const conn = CONNECTIONS[DEFAULT_CONNECTION_KEY];
    if (!conn) {
      throw new Error(`DB_METADATA_DEFAULT_CONNECTION is set to unknown key: ${DEFAULT_CONNECTION_KEY}.`);
    }
    return conn;
  }

  if (keys.length === 1) return CONNECTIONS[keys[0]];

  throw new Error("Multiple DB metadata connections are configured. Pass connection_key explicitly, or set DB_METADATA_DEFAULT_CONNECTION.");
}

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);
}

function scoreConnection(conn, queryText) {
  const queryTokens = tokenize(queryText);
  const haystack = [
    conn.key,
    conn.displayName,
    conn.description,
    conn.environment,
    conn.system,
    conn.database,
    ...(conn.tags || []),
  ].join(" ").toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += token.length >= 4 ? 2 : 1;
  }
  return score;
}

async function withPool(connectionKey, fn) {
  const conn = resolveConnection(connectionKey);
  const pool = new sql.ConnectionPool(conn.connectionString);
  await pool.connect();
  try {
    const result = await fn(pool, conn);
    return { result, conn };
  } finally {
    await pool.close();
  }
}

function normalizeLike(input) {
  if (!input || input.trim() === "") return "%";
  return `%${input.trim()}%`;
}

const connectionKeySchema = z.string().optional().describe("Optional DB connection alias. Use list_connections or suggest_connection to choose one when multiple DB connections are configured.");

server.tool("list_connections", {}, async () => {
  try {
    return text({
      default_connection_key: DEFAULT_CONNECTION_KEY || null,
      count: Object.keys(CONNECTIONS).length,
      connections: Object.values(CONNECTIONS).map(publicConnectionInfo),
      note: "Connection strings are intentionally not returned. Choose a connection_key based on key, description, environment, system, database, or tags.",
    });
  } catch (error) {
    return text(`Error: ${error.message}`);
  }
});

server.tool(
  "suggest_connection",
  {
    query_text: z.string().describe("User request or requirement text used to suggest a DB connection alias"),
    max_results: z.number().int().min(1).max(20).optional().default(5),
  },
  async ({ query_text, max_results }) => {
    try {
      const candidates = Object.values(CONNECTIONS)
        .map((conn) => ({ ...publicConnectionInfo(conn), score: scoreConnection(conn, query_text) }))
        .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
        .slice(0, max_results);

      return text({
        query_text,
        candidates,
        recommendation: candidates.length > 0 && candidates[0].score > 0 ? candidates[0].key : null,
        note: "If recommendation is null or multiple candidates look plausible, ask the user to confirm the connection_key before querying metadata.",
      });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "db_metadata_health",
  {
    connection_key: connectionKeySchema,
  },
  async ({ connection_key }) => {
    try {
      const { result, conn } = await withPool(connection_key, async (pool) => {
        const r = await pool.request().query("SELECT DB_NAME() AS database_name, @@SERVERNAME AS server_name");
        return r.recordset[0];
      });
      return text({ ok: true, connection: publicConnectionInfo(conn), ...result, note: "Metadata-only connection check completed." });
    } catch (error) {
      return text({ ok: false, error: error.message });
    }
  }
);

server.tool(
  "list_tables",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().optional().describe("Optional schema name filter"),
    table_name_contains: z.string().optional().describe("Optional table name contains filter"),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ connection_key, schema_name, table_name_contains, max_rows }) => {
    try {
      const { result: rows, conn } = await withPool(connection_key, async (pool) => {
        const req = pool.request()
          .input("schema_name", sql.NVarChar, schema_name || null)
          .input("table_like", sql.NVarChar, normalizeLike(table_name_contains))
          .input("max_rows", sql.Int, max_rows);
        const r = await req.query(`
          SELECT TOP (@max_rows)
            TABLE_SCHEMA AS schema_name,
            TABLE_NAME AS table_name,
            TABLE_TYPE AS table_type
          FROM INFORMATION_SCHEMA.TABLES
          WHERE (@schema_name IS NULL OR TABLE_SCHEMA = @schema_name)
            AND TABLE_NAME LIKE @table_like
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        return r.recordset;
      });
      return text({ connection: publicConnectionInfo(conn), count: rows.length, tables: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_columns",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().describe("Schema name, for example dbo"),
    table_name: z.string().describe("Table name"),
  },
  async ({ connection_key, schema_name, table_name }) => {
    try {
      const { result: rows, conn } = await withPool(connection_key, async (pool) => {
        const req = pool.request()
          .input("schema_name", sql.NVarChar, schema_name)
          .input("table_name", sql.NVarChar, table_name);
        const r = await req.query(`
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
        return r.recordset;
      });
      return text({ connection: publicConnectionInfo(conn), schema_name, table_name, count: rows.length, columns: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_indexes",
  {
    connection_key: connectionKeySchema,
    schema_name: z.string().describe("Schema name, for example dbo"),
    table_name: z.string().describe("Table name"),
  },
  async ({ connection_key, schema_name, table_name }) => {
    try {
      const { result: rows, conn } = await withPool(connection_key, async (pool) => {
        const req = pool.request()
          .input("schema_name", sql.NVarChar, schema_name)
          .input("table_name", sql.NVarChar, table_name);
        const r = await req.query(`
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
        return r.recordset;
      });
      return text({ connection: publicConnectionInfo(conn), schema_name, table_name, count: rows.length, indexes: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "find_routines",
  {
    connection_key: connectionKeySchema,
    routine_name_contains: z.string().optional().describe("Optional routine name contains filter"),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ connection_key, routine_name_contains, max_rows }) => {
    try {
      const { result: rows, conn } = await withPool(connection_key, async (pool) => {
        const req = pool.request()
          .input("routine_like", sql.NVarChar, normalizeLike(routine_name_contains))
          .input("max_rows", sql.Int, max_rows);
        const r = await req.query(`
          SELECT TOP (@max_rows)
            ROUTINE_SCHEMA AS schema_name,
            ROUTINE_NAME AS routine_name,
            ROUTINE_TYPE AS routine_type
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_NAME LIKE @routine_like
          ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME
        `);
        return r.recordset;
      });
      return text({ connection: publicConnectionInfo(conn), count: rows.length, routines: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
