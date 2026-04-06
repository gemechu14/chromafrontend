"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Client-side redirect so this route works with `output: "export"` (no server runtime).
 */
export function LegacyOAuthRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/auth/google/callback?${q}` : "/auth/google/callback");
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin" />
    </div>
  );
}
