#!/usr/bin/env node
// index.js - DB Metadata MCP Server (SQL Server read-only metadata)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sql from "mssql";

const server = new McpServer({
  name: "DB-Metadata-Tools",
  version: "1.0.0",
});

const DEFAULT_CONN = process.env.DB_METADATA_MSSQL_CONN || process.env.MSSQL_CONN || "";

function text(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

function requireConn() {
  if (!DEFAULT_CONN) {
    throw new Error("Missing DB_METADATA_MSSQL_CONN or MSSQL_CONN. Use a read-only account and do not expose secrets.");
  }
  return DEFAULT_CONN;
}

async function withPool(fn) {
  const pool = await sql.connect(requireConn());
  try {
    return await fn(pool);
  } finally {
    await pool.close();
  }
}

function normalizeLike(input) {
  if (!input || input.trim() === "") return "%";
  return `%${input.trim()}%`;
}

server.tool("db_metadata_health", {}, async () => {
  try {
    const result = await withPool(async (pool) => {
      const r = await pool.request().query("SELECT DB_NAME() AS database_name, @@SERVERNAME AS server_name");
      return r.recordset[0];
    });
    return text({ ok: true, ...result, note: "Metadata-only connection check completed." });
  } catch (error) {
    return text({ ok: false, error: error.message });
  }
});

server.tool(
  "list_tables",
  {
    schema_name: z.string().optional().describe("Optional schema name filter"),
    table_name_contains: z.string().optional().describe("Optional table name contains filter"),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ schema_name, table_name_contains, max_rows }) => {
    try {
      const rows = await withPool(async (pool) => {
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
      return text({ count: rows.length, tables: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_columns",
  {
    schema_name: z.string().describe("Schema name, for example dbo"),
    table_name: z.string().describe("Table name"),
  },
  async ({ schema_name, table_name }) => {
    try {
      const rows = await withPool(async (pool) => {
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
      return text({ schema_name, table_name, count: rows.length, columns: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "list_indexes",
  {
    schema_name: z.string().describe("Schema name, for example dbo"),
    table_name: z.string().describe("Table name"),
  },
  async ({ schema_name, table_name }) => {
    try {
      const rows = await withPool(async (pool) => {
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
      return text({ schema_name, table_name, count: rows.length, indexes: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

server.tool(
  "find_routines",
  {
    routine_name_contains: z.string().optional().describe("Optional routine name contains filter"),
    max_rows: z.number().int().min(1).max(500).optional().default(100),
  },
  async ({ routine_name_contains, max_rows }) => {
    try {
      const rows = await withPool(async (pool) => {
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
      return text({ count: rows.length, routines: rows });
    } catch (error) {
      return text(`Error: ${error.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
