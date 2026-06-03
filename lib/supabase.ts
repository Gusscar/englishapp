/**
 * Drop-in Supabase client replacement backed by Neon (Postgres).
 * All queries go through /api/query so the DATABASE_URL stays server-side.
 *
 * Supported API (matches the patterns used across the app):
 *   .from(table).select(cols).order(col, opts)         → SELECT
 *   .from(table).select(cols).gte(col, val).order(...) → SELECT with filter
 *   .from(table).insert(data)                          → INSERT RETURNING *
 *   .from(table).insert(data).select(cols).single()    → INSERT + get first row
 *   .from(table).update(data).eq(col, val)             → UPDATE
 *   .from(table).delete().eq(col, val)                 → DELETE
 *   .from(table).delete().neq(col, val)                → DELETE WHERE !=
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type FilterOp = "eq" | "neq" | "gte" | "lte";
type Filter   = { column: string; op: FilterOp; value: unknown };

async function apiQuery(payload: Record<string, unknown>): Promise<{ data: any; error: any }> {
  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Network error" };
  }
}

class QueryBuilder {
  private _table: string;
  private _op: "select" | "insert" | "update" | "delete" = "select";
  private _cols  = "*";
  private _order?: { column: string; ascending: boolean };
  private _filters: Filter[] = [];
  private _insertData?: unknown;
  private _updateData?: Record<string, unknown>;
  private _postInsertSelect = false;
  private _singleRow = false;

  constructor(table: string) { this._table = table; }

  // ── SELECT ──────────────────────────────────────────────────────────────────
  select(cols = "*"): this {
    if (this._op === "insert") {
      // .insert(...).select(...) — Supabase pattern to get back inserted row
      this._postInsertSelect = true;
    } else {
      this._op = "select";
    }
    this._cols = cols;
    return this;
  }

  order(column: string, opts: { ascending?: boolean } = {}): Promise<{ data: any; error: any }> {
    this._order = { column, ascending: opts.ascending !== false };
    return this._run();
  }

  // ── INSERT ──────────────────────────────────────────────────────────────────
  insert(data: unknown): this {
    this._op = "insert";
    this._insertData = data;
    return this;
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  update(data: Record<string, unknown>): this {
    this._op = "update";
    this._updateData = data;
    return this;
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  delete(): this {
    this._op = "delete";
    return this;
  }

  // ── .single() — return first row only ───────────────────────────────────────
  single(): Promise<{ data: any; error: any }> {
    this._singleRow = true;
    return this._run();
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  eq(column: string, value: unknown): Promise<{ data: any; error: any }> {
    this._filters.push({ column, op: "eq", value });
    return this._run();
  }

  neq(column: string, value: unknown): Promise<{ data: any; error: any }> {
    this._filters.push({ column, op: "neq", value });
    return this._run();
  }

  gte(column: string, value: unknown): this {
    this._filters.push({ column, op: "gte", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this._filters.push({ column, op: "lte", value });
    return this;
  }

  // ── Thenable — .select(...).then(({ data }) => ...) ─────────────────────────
  then<R>(
    resolve: (v: { data: any; error: any }) => R,
    reject?: (e: unknown) => R
  ): Promise<R> {
    return this._run().then(resolve, reject);
  }

  // ── Execute ──────────────────────────────────────────────────────────────────
  private async _run(): Promise<{ data: any; error: any }> {
    const table = this._table;
    const op    = this._op;

    if (op === "select") {
      const result = await apiQuery({
        table, op,
        columns: this._cols,
        ...(this._filters.length ? { filters: this._filters } : {}),
        ...(this._order ? { order: this._order } : {}),
      });
      if (this._singleRow && Array.isArray(result.data)) {
        return { data: result.data[0] ?? null, error: result.error };
      }
      return result;
    }

    if (op === "insert") {
      const result = await apiQuery({ table, op, data: this._insertData });
      if (this._singleRow) {
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        return { data: row ?? null, error: result.error };
      }
      return result;
    }

    if (op === "update") {
      return apiQuery({
        table, op,
        data: this._updateData,
        filters: this._filters,
      });
    }

    if (op === "delete") {
      return apiQuery({ table, op, filters: this._filters });
    }

    return { data: null, error: "Unknown operation" };
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
};
