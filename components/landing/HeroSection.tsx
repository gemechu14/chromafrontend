"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="pt-16 bg-[#F8FAFC] min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — text */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-primary font-semibold text-sm uppercase tracking-widest mb-4"
            >
              Top-Rated Salon Color Management Software
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-foreground leading-[1.05] tracking-tight mb-6"
            >
              Make More
              <br />
              Money From
              <br />
              Your Color
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-slate-500 text-lg leading-relaxed max-w-md mb-10"
            >
              Track every gram of color, build precise formulas, auto-deduct inventory, and know the exact profit from every service.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-12 text-base font-bold"
                >
                  GET STARTED
                </Button>
              </Link>
              <Link href="#how-it-works">
                <button className="flex items-center gap-2 text-slate-600 font-semibold text-sm h-12 hover:text-foreground transition-colors">
                  <span className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  EXPLORE
                </button>
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex items-center gap-8"
            >
              {[
                { value: "500+", label: "Active Salons" },
                { value: "10k+", label: "Formulas Saved" },
                { value: "98%", label: "Stock Accuracy" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-black text-foreground">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — image + floating card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop"
                alt="Professional hair stylist applying color"
                fill
                className="object-cover"
                priority
                unoptimized
              />
              {/* Dark overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
            </div>

            {/* Floating formula card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -left-6 top-1/3 bg-slate-900 text-white rounded-xl p-4 shadow-xl w-52"
            >
              <p className="text-xs text-slate-400 mb-2">New Formula</p>
              <p className="text-xs text-slate-500 mb-3">Ingredient 1 of 4 · 60.2g/165.5g</p>
              <div className="flex gap-1.5 mb-3">
                {["8N", "Blue", "Yellow", "20 Vol"].map((c, i) => (
                  <div
                    key={c}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-[#D4B896] text-slate-900 ring-2 ring-white" :
                      i === 1 ? "bg-blue-500 text-white" :
                      i === 2 ? "bg-amber-400 text-slate-900" :
                      "bg-slate-200 text-slate-700"
                    }`}
                  >
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary text-sm font-bold">30g</span>
                <span className="text-slate-400 text-xs">/ 60g</span>
              </div>
            </motion.div>

            {/* Floating cost card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="absolute -right-4 bottom-12 bg-white rounded-xl p-4 shadow-xl border border-slate-100 w-44"
            >
              <p className="text-xs text-slate-500 mb-1">Service Cost</p>
              <p className="font-display text-2xl font-black text-foreground">$11.40</p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs text-slate-500">Auto-calculated</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
