"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FlaskConical, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api/client";
import { isPlatformSuperAdmin } from "@/lib/auth-roles";

const highlights = [
  "Track every gram of color used",
  "Auto-deduct inventory on save",
  "Know the exact cost of every service",
  "Full client formula history",
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      router.push(isPlatformSuperAdmin(loggedInUser) ? "/platform" : "/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — image + brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-50">
        {/* Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80&auto=format&fit=crop"
            alt="Professional hair stylist"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                chroma<span className="text-primary">pro</span>
              </span>
            </div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
                Color precision.
                <br />
                Business clarity.
              </h1>
              <p className="text-slate-200 text-lg leading-relaxed mb-10 max-w-sm">
                The professional platform that turns your color knowledge into business intelligence.
              </p>
            </motion.div>

            {/* Benefits list */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3"
            >
              {highlights.map((h, i) => (
                <motion.li
                  key={h}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-slate-100"
                >
                  <CheckCircle className="w-5 h-5 text-white/90 shrink-0" />
                  <span className="text-sm">{h}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Bottom quote */}
          <div>
            <blockquote className="text-slate-200 text-sm italic leading-relaxed mb-2">
              &ldquo;Chroma changed how we run our salon. We cut product waste by 30% in the first
              month.&rdquo;
            </blockquote>
            <p className="text-white/80 text-xs font-medium">— Lisa Park, Luxe Hair Studio</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your salon dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="stylist@yoursalon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 rounded-lg"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold shadow-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Start your free trial
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              By signing in, you agree to our{" "}
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
