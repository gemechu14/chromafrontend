"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FlaskConical, ArrowRight, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantsApi } from "@/lib/api/tenants";
import { ApiRequestError } from "@/lib/api/client";

interface RegisterForm {
  tenant_name: string;
  location_name: string;
  admin_full_name: string;
  admin_email: string;
  admin_password: string;
  confirmPassword: string;
}

const defaultForm: RegisterForm = {
  tenant_name: "",
  location_name: "",
  admin_full_name: "",
  admin_email: "",
  admin_password: "",
  confirmPassword: "",
};

const steps = [
  { id: 1, label: "Salon Info" },
  { id: 2, label: "Admin Account" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(defaultForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.tenant_name || !form.location_name) {
      setError("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.admin_full_name || !form.admin_email || !form.admin_password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.admin_password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.admin_password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await tenantsApi.register({
        tenant_name: form.tenant_name,
        location_name: form.location_name,
        admin_full_name: form.admin_full_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
        plan: "trial",
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Salon registered!
          </h2>
          <p className="text-slate-500 text-sm">
            Your account is ready. Redirecting you to sign in…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 bg-slate-900 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">
              chroma<span className="text-primary">pro</span>
            </span>
          </div>

          <h1 className="font-display text-4xl font-black leading-tight mb-5">
            Start your free trial today.
          </h1>
          <p className="text-slate-300 leading-relaxed mb-10">
            Set up your salon in under 2 minutes. No credit card required.
          </p>

          <ul className="space-y-4">
            {[
              "Unlimited formula history",
              "Real-time inventory tracking",
              "Multi-location support",
              "Role-based team access",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-slate-200 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-slate-400 text-xs">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              chroma<span className="text-primary">pro</span>
            </span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s.id
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step >= s.id ? "text-foreground" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className="w-8 h-px bg-slate-200 ml-1" />
                )}
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium mb-5">
              {error}
            </div>
          )}

          {/* Step 1: Salon Info */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Tell us about your salon
                </h2>
                <p className="text-slate-500 text-sm">We&apos;ll set up your account in seconds.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_name">
                  Salon Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="tenant_name"
                    placeholder="Elite Hair Studio"
                    value={form.tenant_name}
                    onChange={update("tenant_name")}
                    required
                    className="h-11 pl-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_name">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location_name"
                  placeholder="e.g. Downtown Location"
                  value={form.location_name}
                  onChange={update("location_name")}
                  required
                  className="h-11 rounded-lg"
                />
                <p className="text-xs text-slate-400">
                  You can add more locations after setup.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </form>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Create your admin account
                </h2>
                <p className="text-slate-500 text-sm">
                  You&apos;ll use these credentials to sign in.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_full_name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin_full_name"
                  placeholder="Jane Smith"
                  value={form.admin_full_name}
                  onChange={update("admin_full_name")}
                  required
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="owner@yoursalon.com"
                  value={form.admin_email}
                  onChange={update("admin_email")}
                  required
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin_password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.admin_password}
                  onChange={update("admin_password")}
                  required
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  required
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep(1); setError(null); }}
                  className="flex-1 h-11 rounded-full font-semibold"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold shadow-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}






