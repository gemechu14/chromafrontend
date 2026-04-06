"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Invalid or expired reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setError("Invalid or expired reset token.");
      } else if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="font-display text-xl font-bold text-foreground mb-2">Invalid link</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This password reset link is missing a token. Request a new link from the forgot password page.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-[#6C3FC5] hover:underline">
          Forgot password
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground mb-2">Password has been reset successfully</h1>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#6C3FC5]/10 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-[#6C3FC5]" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-new-password">New password</Label>
          <div className="relative">
            <Input
              id="reset-new-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10 rounded-xl"
              disabled={loading}
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirm password</Label>
          <Input
            id="reset-confirm-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-full bg-[#6C3FC5] hover:bg-[#6C3FC5]/90 text-white font-semibold"
        >
          {loading ? "Saving…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-[#6C3FC5] hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Suspense
        fallback={
          <div className="w-10 h-10 border-2 border-[#6C3FC5]/30 border-t-[#6C3FC5] rounded-full animate-spin" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
