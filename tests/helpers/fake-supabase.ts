/**
 * A tiny chainable stand-in for the Supabase client, just enough to unit-test the
 * API routes. Each query records its table, operation, payload and filters so tests
 * can assert *what* a route wrote (e.g. that an update is conditional on status).
 */
export interface Result {
  data: unknown;
  error: unknown;
}

export interface Query {
  table: string;
  op: "select" | "update" | "insert";
  payload?: unknown;
  filters: Array<{ kind: string; col: string; val: unknown }>;
}

type Handler = Result | ((q: Query) => Result);

export interface Handlers {
  [table: string]: Partial<Record<Query["op"], Handler>>;
}

export function fakeSupabase(handlers: Handlers) {
  const calls: Query[] = [];

  function resolve(q: Query): Result {
    calls.push(q);
    const h = handlers[q.table]?.[q.op];
    if (!h) return { data: null, error: null };
    return typeof h === "function" ? h(q) : h;
  }

  function builder(q: Query) {
    const api = {
      select: () => api,
      eq: (col: string, val: unknown) => {
        q.filters.push({ kind: "eq", col, val });
        return api;
      },
      in: (col: string, val: unknown) => {
        q.filters.push({ kind: "in", col, val });
        return api;
      },
      is: (col: string, val: unknown) => {
        q.filters.push({ kind: "is", col, val });
        return api;
      },
      gte: (col: string, val: unknown) => {
        q.filters.push({ kind: "gte", col, val });
        return api;
      },
      order: () => api,
      limit: () => api,
      single: async () => resolve(q),
      then: (ok: (r: Result) => unknown, fail?: (e: unknown) => unknown) =>
        Promise.resolve(resolve(q)).then(ok, fail),
    };
    return api;
  }

  const client = {
    from: (table: string) => ({
      select: () => builder({ table, op: "select", filters: [] }),
      update: (payload: unknown) => builder({ table, op: "update", payload, filters: [] }),
      insert: (payload: unknown) => builder({ table, op: "insert", payload, filters: [] }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  };

  return { client, calls };
}

export function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
