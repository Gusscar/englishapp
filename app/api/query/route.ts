import { Pool } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

// Whitelisted tables
const ALLOWED_TABLES = new Set([
  "phrases", "phrase_groups", "immersion_logs", "journal_entries", "saved_stories",
]);

const SAFE_IDENT = /^[a-z_][a-z0-9_]*$/i;

function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: url });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as QueryPayload;
    const { table, op } = body;

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: "Table not allowed" }, { status: 400 });
    }

    const pool = getPool();

    // ── SELECT ──────────────────────────────────────────────────────────────
    if (op === "select") {
      const { columns = "*", order, filters = [] } = body;
      const safeCols = columns === "*" ? "*" : columns
        .split(",").map(c => c.trim()).filter(c => SAFE_IDENT.test(c)).join(", ");

      const params: unknown[] = [];
      const whereClauses: string[] = [];

      for (const f of filters) {
        params.push(f.value);
        const sym = f.op === "neq" ? "!=" : f.op === "gte" ? ">=" : f.op === "lte" ? "<=" : "=";
        whereClauses.push(`${f.column} ${sym} $${params.length}`);
      }

      let query = `SELECT ${safeCols} FROM ${table}`;
      if (whereClauses.length) query += ` WHERE ${whereClauses.join(" AND ")}`;
      if (order && SAFE_IDENT.test(order.column)) {
        query += ` ORDER BY ${order.column} ${order.ascending ? "ASC" : "DESC"}`;
      }

      const { rows } = await pool.query(query, params);
      return NextResponse.json({ data: rows, error: null });
    }

    // ── INSERT ───────────────────────────────────────────────────────────────
    if (op === "insert") {
      const items: Record<string, unknown>[] = Array.isArray(body.data)
        ? body.data : [body.data];
      if (!items.length) return NextResponse.json({ data: null, error: null });

      const keys = Object.keys(items[0]);
      const placeholders = items.map((_, i) =>
        `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(", ")})`
      ).join(", ");
      const values = items.flatMap(item => keys.map(k => item[k]));
      const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${placeholders} RETURNING *`;

      const { rows } = await pool.query(query, values);
      const result = Array.isArray(body.data) ? rows : (rows[0] ?? null);
      return NextResponse.json({ data: result, error: null });
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    if (op === "update") {
      const data = body.data as Record<string, unknown>;
      const { filters = [] } = body;
      if (!filters.length) return NextResponse.json({ error: "filter required" }, { status: 400 });

      const keys = Object.keys(data);
      const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const params: unknown[] = keys.map(k => data[k]);
      const whereClauses = filters.map(f => {
        params.push(f.value);
        const sym = f.op === "neq" ? "!=" : "=";
        return `${f.column} ${sym} $${params.length}`;
      });
      const query = `UPDATE ${table} SET ${sets} WHERE ${whereClauses.join(" AND ")} RETURNING *`;

      const { rows } = await pool.query(query, params);
      return NextResponse.json({ data: rows[0] ?? null, error: null });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (op === "delete") {
      const { filters = [] } = body;
      if (!filters.length) return NextResponse.json({ error: "filter required" }, { status: 400 });

      const params: unknown[] = [];
      const whereClauses = filters.map(f => {
        params.push(f.value);
        const sym = f.op === "neq" ? "!=" : "=";
        return `${f.column} ${sym} $${params.length}`;
      });
      const query = `DELETE FROM ${table} WHERE ${whereClauses.join(" AND ")}`;
      await pool.query(query, params);
      return NextResponse.json({ data: null, error: null });
    }

    return NextResponse.json({ error: "Unknown operation" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/query]", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterOp = "eq" | "neq" | "gte" | "lte";
type Filter = { column: string; op: FilterOp; value: unknown };

type QueryPayload =
  | { table: string; op: "select"; columns?: string; order?: { column: string; ascending: boolean }; filters?: Filter[] }
  | { table: string; op: "insert"; data: Record<string, unknown> | Record<string, unknown>[] }
  | { table: string; op: "update"; data: Record<string, unknown>; filters?: Filter[] }
  | { table: string; op: "delete"; filters?: Filter[] };
