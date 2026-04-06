import { Suspense } from "react";
import { LegacyOAuthRedirect } from "./legacy-oauth-redirect";

/**
 * Legacy path: forwards to the canonical handler so Google redirect URIs
 * like /oauth/google/callback still work. Implemented as a client redirect
 * so static export (`output: "export"`) does not require dynamic server routes.
 */
export default function LegacyOAuthGoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin" />
        </div>
      }
    >
      <LegacyOAuthRedirect />
    </Suspense>
  );
}
