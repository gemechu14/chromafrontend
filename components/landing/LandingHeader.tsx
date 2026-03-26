"use client";

import Link from "next/link";
import { useState } from "react";
import { FlaskConical, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Chroma", href: "#why-chroma" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              chroma<span className="text-primary">pro</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-slate-600">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 rounded-full px-5 font-semibold"
              >
                Book a Demo
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "md:hidden bg-white border-t border-slate-200 overflow-hidden transition-all",
        mobileOpen ? "max-h-80" : "max-h-0"
      )}>
        <div className="px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="block text-sm font-medium text-slate-600 py-1"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="w-full bg-primary text-white hover:bg-primary/90 rounded-full">Book a Demo</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
