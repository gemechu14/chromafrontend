import { Suspense } from "react";
import { GoogleCallbackContent } from "./google-callback-content";

export default function AuthGoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
