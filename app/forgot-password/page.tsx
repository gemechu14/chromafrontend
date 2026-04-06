"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
    } catch {
      // Intentionally ignored — same UX whether or not the email exists
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#6C3FC5]/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[#6C3FC5]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Forgot password</h1>
            <p className="text-sm text-muted-foreground">We&apos;ll email you a reset link.</p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed rounded-xl bg-slate-50 border border-slate-100 p-4">
              If that email is registered, a reset link has been sent.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#6C3FC5] h-11 text-sm font-semibold text-[#6C3FC5] hover:bg-[#6C3FC5]/5 transition-colors"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@salon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-[#6C3FC5] hover:bg-[#6C3FC5]/90 text-white font-semibold"
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        {!submitted && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-[#6C3FC5] hover:underline">
              Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
