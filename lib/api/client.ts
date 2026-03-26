/**
 * Base API client for Chroma SaaS.
 *
 * - Reads the base URL from NEXT_PUBLIC_API_BASE_URL
 * - Injects Authorization header automatically
 * - Handles token refresh on 401 responses
 * - Throws ApiRequestError with the backend's detail message
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ─── Storage helpers (safe for SSR) ──────────────────────────────────────────

const TOKEN_KEY = "chroma_access_token";
const REFRESH_KEY = "chroma_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// ─── Token refresh ───────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...rest,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  if (res.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        // Retry original request with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
      } else {
        // Redirect to login if refresh failed
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiRequestError(401, "Session expired. Please log in again.");
      }
    } else {
      // Wait for current refresh to complete
      const newToken = await new Promise<string>((resolve) => {
        subscribeTokenRefresh(resolve);
      });
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  // ── 204 No Content ───────────────────────────────────────────────────────
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({ detail: res.statusText }));

  if (!res.ok) {
    let message: string;
    const detail: unknown = data?.detail;

    // Handle nested error structure (e.g., insufficient inventory)
    if (data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
      const detailObj = data.detail as Record<string, unknown>;
      if (detailObj.message && typeof detailObj.message === "string") {
        message = detailObj.message;
      } else if (detailObj.error && typeof detailObj.error === "string") {
        message = detailObj.error;
      } else {
        message = `HTTP ${res.status}`;
      }
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((d: { msg: string }) => d.msg).join(", ");
    } else {
      message = `HTTP ${res.status}`;
    }

    throw new ApiRequestError(res.status, message, detail);
  }

  return data as T;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...options }),

  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};

