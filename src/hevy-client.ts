const BASE_URL = process.env.HEVY_BASE_URL ?? "https://api.hevyapp.com";

export class HevyApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    method: string,
    path: string,
  ) {
    super(`Hevy API ${method} ${path} -> ${status}: ${body.slice(0, 500)}`);
  }
}

type Query = Record<string, string | number | undefined>;

export class HevyClient {
  constructor(private readonly apiKey: string) {}

  async request<T = unknown>(method: string, path: string, opts: { query?: Query; body?: unknown } = {}): Promise<T> {
    const url = new URL(path, BASE_URL);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    // Retry on 429/5xx with exponential backoff.
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, {
        method,
        headers: {
          "api-key": this.apiKey,
          accept: "application/json",
          ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });

      if (res.ok) {
        const text = await res.text();
        return (text ? JSON.parse(text) : {}) as T;
      }

      const retriable = res.status === 429 || res.status >= 500;
      if (retriable && attempt < 3) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }
      throw new HevyApiError(res.status, await res.text(), method, path);
    }
  }

  get<T = unknown>(path: string, query?: Query) {
    return this.request<T>("GET", path, { query });
  }
  post<T = unknown>(path: string, body: unknown) {
    return this.request<T>("POST", path, { body });
  }
  put<T = unknown>(path: string, body: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  /**
   * Walks a paginated endpoint (`page`/`pageSize` -> `{ page, page_count, [key]: [] }`)
   * and returns up to `maxItems` items.
   */
  async paginate<T = unknown>(path: string, key: string, pageSize: number, maxItems: number, query: Query = {}): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; items.length < maxItems; page++) {
      const res = await this.get<Record<string, unknown>>(path, { ...query, page, pageSize });
      const batch = (res[key] as T[] | undefined) ?? [];
      items.push(...batch);
      const pageCount = Number(res.page_count ?? page);
      if (batch.length === 0 || page >= pageCount) break;
    }
    return items.slice(0, maxItems);
  }
}
