import { getApiBaseUrl } from "@/lib/api/client";

/** GET /auth/google/start */
export interface GoogleOAuthStartResponse {
  auth_url: string;
  state: string;
}

export class GoogleOAuthConfigError extends Error {
  constructor(
    message: string,
    public readonly kind: "empty" | "http" | "network" | "unavailable"
  ) {
    super(message);
    this.name = "GoogleOAuthConfigError";
  }
}

const POST_LOGIN_KEY = "chroma_post_login_redirect";

/** Save a safe internal path (e.g. /dashboard) before redirecting to Google; read after OAuth in the callback page. */
export function setPostLoginRedirect(path: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const safe = safeInternalPath(path);
  if (safe) {
    sessionStorage.setItem(POST_LOGIN_KEY, safe);
  } else {
    sessionStorage.removeItem(POST_LOGIN_KEY);
  }
}

export function consumePostLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(POST_LOGIN_KEY);
  sessionStorage.removeItem(POST_LOGIN_KEY);
  return safeInternalPath(v);
}

/** Only allow same-origin paths (no protocol-relative or external URLs). */
export function safeInternalPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return null;
  }
  return trimmed;
}

/**
 * Full redirect URI sent to Google — must match Google Cloud "Authorized redirect URIs" exactly
 * (scheme, host, port, path). Uses the **current browser origin** so localhost vs 127.0.0.1 matches
 * how you opened the app.
 */
export function getGoogleOAuthRedirectUri(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const path =
    process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_PATH?.trim() || "/oauth/google/callback";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}

/**
 * Step A — backend returns the full Google authorize URL (and CSRF state embedded in auth_url).
 * GET {API_BASE}/auth/google/start?redirect_uri=... (no auth header).
 *
 * Passes `redirect_uri` so the API can align with this SPA (same host as the browser tab). Your
 * backend should use this value when building the Google authorize URL, or set GOOGLE_REDIRECT_URI
 * to the same string character-for-character.
 */
export async function fetchGoogleOAuthStart(): Promise<GoogleOAuthStartResponse> {
  const redirectUri = getGoogleOAuthRedirectUri();
  const startPath = `${getApiBaseUrl()}/auth/google/start`;
  const url =
    redirectUri.length > 0
      ? `${startPath}?${new URLSearchParams({ redirect_uri: redirectUri })}`
      : startPath;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", cache: "no-store", credentials: "omit" });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new GoogleOAuthConfigError(
        "Check the network.",
        "network"
      );
    }
    throw e;
  }

  if (res.status === 503) {
    throw new GoogleOAuthConfigError(
      "Google sign-in is not configured on the API (missing server environment variables).",
      "unavailable"
    );
  }

  if (!res.ok) {
    throw new GoogleOAuthConfigError(
      `Could not start Google sign-in (HTTP ${res.status}).`,
      "http"
    );
  }

  let data: GoogleOAuthStartResponse;
  try {
    data = (await res.json()) as GoogleOAuthStartResponse;
  } catch {
    throw new GoogleOAuthConfigError("Invalid response from Google OAuth start.", "http");
  }

  const authUrl = typeof data.auth_url === "string" ? data.auth_url.trim() : "";
  if (!authUrl) {
    throw new GoogleOAuthConfigError("Backend not configured", "empty");
  }

  return { auth_url: authUrl, state: typeof data.state === "string" ? data.state : "" };
}
