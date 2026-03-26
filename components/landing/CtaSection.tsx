"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const benefits = [
  "No setup fees — start free",
  "Formula tracking from day one",
  "Automatic inventory deductions",
  "Multi-location support",
  "Full audit trail & cost reports",
  "Dedicated onboarding support",
];

export function CtaSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground leading-tight mb-6">
              Ready to run a
              more profitable salon?
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Join 500+ salons already using Chroma to stop guessing and start growing.
              Set up your account in minutes — no credit card required.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-slate-600 text-sm">{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 font-bold">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-full px-8 font-bold border-2 border-foreground text-foreground hover:bg-foreground hover:text-white transition-colors"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right — image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]"
          >
            <Image
              src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80&auto=format&fit=crop"
              alt="Happy stylist in modern salon"
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
