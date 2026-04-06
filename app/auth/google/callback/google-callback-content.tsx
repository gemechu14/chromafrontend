"use client";

/**
 * Google OAuth return URL handler.
 *
 * Reads only `code` and `state` from the query string for the token exchange.
 * Ignores extra Google params (iss, scope, authuser, prompt, …).
 *
 * If Google sends `error` (user cancelled, etc.), we do not call the API — show a message and link to login.
 * On success: POST {API_BASE}/auth/google/callback?code=&state= (no body), store tokens, GET /users/me, then redirect.
 *
 * Important: the effect depends on primitive `code` / `state` / `oauthError` strings — not the `searchParams`
 * object — so Next.js re-renders cannot re-trigger the effect and strand the UI on "Signing you in…".
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api/client";
import { consumePostLoginRedirect } from "@/lib/google-oauth";
import { isPlatformSuperAdmin } from "@/lib/auth-roles";

function decodeOAuthErrorDescription(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw.replace(/\+/g, " ");
  }
}

export function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogleOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const oauthError = searchParams.get("error");
  const oauthErrorDescriptionRaw = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    if (oauthError) {
      const oauthErrorDescription = decodeOAuthErrorDescription(oauthErrorDescriptionRaw);
      if (oauthError === "access_denied") {
        setError("Google sign-in was cancelled.");
      } else {
        setError(
          oauthErrorDescription ||
            `Google could not complete sign-in (${oauthError}). Please try again or use email and password.`
        );
      }
      return;
    }

    if (!code) {
      setError("Missing authorization code from Google.");
      return;
    }

    if (!state) {
      setError("Missing state from Google.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await loginWithGoogleOAuth(code, state);
        if (cancelled) return;
        const saved = consumePostLoginRedirect();
        const fallback = isPlatformSuperAdmin(user) ? "/platform" : "/dashboard";
        router.replace(saved ?? fallback);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiRequestError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Google sign-in failed. Please try again."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, state, oauthError, oauthErrorDescriptionRaw, loginWithGoogleOAuth, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card text-center">
          <div className="w-12 h-12 rounded-xl bg-[#6C3FC5]/10 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-6 h-6 text-[#6C3FC5]" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Sign-in couldn&apos;t finish</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#6C3FC5] px-6 py-2.5 text-sm font-semibold text-[#6C3FC5] hover:bg-[#6C3FC5]/5 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card text-center">
        <div className="w-10 h-10 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display font-semibold text-foreground">Signing you in…</p>
        <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
      </div>
    </div>
  );
}
