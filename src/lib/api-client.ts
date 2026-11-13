// A small JSON client for the customer backend, kept apart from the UI. Sessions are carried by the
// backend's HTTP-only cookie (credentials: "include"), so no token is ever handled or stored here.
// Every failure becomes an ApiError with a code the services can act on.

export class ApiError extends Error {
  constructor(
    /** The backend's error code, or "network_error" / "timeout" / "unknown". */
    readonly code: string,
    message: string,
    /** HTTP status; null when no response arrived. */
    readonly status: number | null,
    readonly retryAfterSeconds?: number,
    /** The whole `error` object of the response, for codes that carry more data (e.g. `quote_changed`). */
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string>;
  timeoutMs?: number;
  /** Extra request headers, e.g. Idempotency-Key. */
  headers?: Record<string, string>;
}

export interface ApiClient {
  request<T>(path: string, options?: ApiRequest): Promise<T>;
}

const DEFAULT_TIMEOUT_MS = 15_000;
// ngrok's free tunnels answer browser requests with a warning page unless this header is sent, so a
// backend reached through ngrok (development only) gets it on every request. Other hosts never do.
const NGROK_HOSTS = [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.dev", ".ngrok.app", ".ngrok.io"];

export function tunnelHeaders(baseUrl: string): Record<string, string> {
  try {
    const host = new URL(baseUrl).hostname;
    return NGROK_HOSTS.some((suffix) => host.endsWith(suffix)) ? { "ngrok-skip-browser-warning": "1" } : {};
  } catch {
    return {};
  }
}

export function createApiClient(baseUrl: string, fetchImpl: typeof fetch = (...args) => fetch(...args)): ApiClient {
  const tunnel = tunnelHeaders(baseUrl);
  return {
    async request<T>(path: string, { method = "GET", body, query, timeoutMs = DEFAULT_TIMEOUT_MS, headers }: ApiRequest = {}): Promise<T> {
      const search = query ? `?${new URLSearchParams(query).toString()}` : "";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}${search}`, {
          method,
          credentials: "include",
          signal: controller.signal,
          headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }), ...tunnel, ...headers },
          ...(body !== undefined && { body: JSON.stringify(body) }),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new ApiError("timeout", "The request took too long.", null);
        }
        throw new ApiError("network_error", "The server could not be reached.", null);
      } finally {
        clearTimeout(timer);
      }

      if (response.status === 204) return undefined as T;
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = (payload as { error?: { code?: unknown; message?: unknown; retry_after_seconds?: unknown } } | null)?.error;
        throw new ApiError(
          typeof error?.code === "string" ? error.code : "unknown",
          typeof error?.message === "string" ? error.message : "The request failed.",
          response.status,
          typeof error?.retry_after_seconds === "number" ? error.retry_after_seconds : undefined,
          error && typeof error === "object" ? (error as Record<string, unknown>) : undefined,
        );
      }
      return payload as T;
    },
  };
}
