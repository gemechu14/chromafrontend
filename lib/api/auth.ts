import {
  apiClient,
  setTokens,
  clearTokens,
  getApiBaseUrl,
  getAccessToken,
  getRefreshToken,
  ApiRequestError,
} from "./client";
import type {
  LoginResponse,
  TokenResponse,
  User,
  LoginRequest,
  RefreshRequest,
  LoginUserSummary,
} from "../types";

/** Same code+state must only hit POST /auth/google/callback once (Google single-use codes). */
const googleOAuthInflight = new Map<string, Promise<{ tokens: TokenResponse; user: User }>>();

function oauthFingerprint(code: string, state: string): string {
  let h = 0;
  const s = `${code}\0${state}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function oauthSessionSuccessKey(code: string, state: string): string {
  return `chroma_oauth_code_ok_${oauthFingerprint(code, state)}`;
}

function markGoogleOAuthExchangeSuccess(code: string, state: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(oauthSessionSuccessKey(code, state), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function hasGoogleOAuthExchangeSucceeded(code: string, state: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(oauthSessionSuccessKey(code, state)) === "1";
}

function userFromGoogleCallbackSummary(s: LoginUserSummary): User {
  return {
    id: s.id,
    tenant_id: s.tenant_id,
    full_name: s.full_name,
    email: s.email,
    role: s.role as User["role"],
    is_active: true,
    default_location_id: null,
    auth_provider: "google",
    last_login_at: null,
    created_at: new Date().toISOString(),
    is_platform_tenant: s.is_platform_tenant,
  };
}

export const authApi = {
  /**
   * POST /users/login
   * Authenticates user and stores tokens in localStorage.
   */
  async login(email: string, password: string): Promise<{ tokens: TokenResponse; user: User }> {
    const payload: LoginRequest = { email, password };
    const data = await apiClient.post<LoginResponse>("/users/login", payload, {
      skipAuth: true,
    });
    setTokens(data.access_token, data.refresh_token);
    let user: User;
    try {
      user = await authApi.getCurrentUser();
    } catch {
      if (!data.user) throw new Error("Unable to load user profile after login.");
      user = data.user as User;
    }
    return { tokens: data, user };
  },

  /**
   * POST /auth/google/callback?code=...&state=...
   * Exchanges Google authorization code for tokens on the server; stores tokens in localStorage.
   * Query string only — no body. Extra Google callback params (iss, scope, …) are not sent.
   *
   * Dedupes concurrent calls (React Strict Mode) and skips a second POST if this code+state
   * already succeeded in-session (sessionStorage).
   */
  async exchangeGoogleOAuthCallback(code: string, state: string): Promise<{ tokens: TokenResponse; user: User }> {
    const dedupeKey = `${code}|${state}`;

    if (typeof window !== "undefined" && hasGoogleOAuthExchangeSucceeded(code, state)) {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access && refresh) {
        try {
          const user = await authApi.getCurrentUser();
          return {
            tokens: {
              access_token: access,
              refresh_token: refresh,
              token_type: "bearer",
            },
            user,
          };
        } catch {
          try {
            sessionStorage.removeItem(oauthSessionSuccessKey(code, state));
          } catch {
            /* ignore */
          }
        }
      }
    }

    const inflight = googleOAuthInflight.get(dedupeKey);
    if (inflight) {
      return inflight;
    }

    const promise = executeGoogleOAuthExchangeOnce(code, state).finally(() => {
      googleOAuthInflight.delete(dedupeKey);
    });
    googleOAuthInflight.set(dedupeKey, promise);
    return promise;
  },

  /**
   * POST /users/refresh
   * Exchanges a refresh token for a new token pair.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const payload: RefreshRequest = { refresh_token: refreshToken };
    const tokens = await apiClient.post<TokenResponse>("/users/refresh", payload, {
      skipAuth: true,
    });
    setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  },

  /**
   * GET /users/me
   * Returns the currently authenticated user.
   */
  getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/users/me");
  },

  /**
   * POST /auth/set-password (invitation token)
   */
  setPasswordFromInvitation(token: string, password: string): Promise<void> {
    return apiClient.post<void>("/auth/set-password", { token, password }, { skipAuth: true });
  },

  /**
   * POST /auth/forgot-password
   */
  forgotPassword(email: string): Promise<void> {
    return apiClient.post<void>("/auth/forgot-password", { email }, { skipAuth: true });
  },

  /**
   * POST /auth/reset-password
   */
  resetPassword(token: string, password: string): Promise<void> {
    return apiClient.post<void>("/auth/reset-password", { token, password }, { skipAuth: true });
  },

  /**
   * Clears tokens from localStorage (client-side logout).
   */
  logout(): void {
    clearTokens();
  },
};

async function executeGoogleOAuthExchangeOnce(
  code: string,
  state: string
): Promise<{ tokens: TokenResponse; user: User }> {
  const qs = new URLSearchParams({ code, state });
  const url = `${getApiBaseUrl()}/auth/google/callback?${qs}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (typeof j.detail === "string") {
        message = j.detail;
      } else if (Array.isArray(j.detail)) {
        message = j.detail.map((d: { msg: string }) => d.msg).join(", ");
      }
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new ApiRequestError(res.status, message);
  }

  const data = (await res.json()) as TokenResponse & { user?: LoginUserSummary };
  setTokens(data.access_token, data.refresh_token);
  let user: User;
  try {
    user = await authApi.getCurrentUser();
  } catch {
    if (data.user) {
      user = userFromGoogleCallbackSummary(data.user);
    } else {
      throw new Error("Unable to load user profile after Google sign-in.");
    }
  }

  markGoogleOAuthExchangeSuccess(code, state);
  return { tokens: data, user };
}
