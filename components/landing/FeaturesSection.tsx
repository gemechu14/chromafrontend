"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Formula Tracking",
    description:
      "Capture color formulas in real-time and record the exact grams used per ingredient. Retrieve any client's formula in seconds for consistent results every visit.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Color mixing bowls with precise measurements",
  },
  {
    title: "Waste Reduction",
    description:
      "Eliminate waste with precise gram-level tracking. Identify which products are over-used, set reorder thresholds, and get alerts before you run out mid-service.",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Hair color products and inventory",
  },
  {
    title: "Control Pricing",
    description:
      "Regardless of your price structure, Chroma calculates the real cost of every service automatically. Know your margins and price with confidence.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Business analytics dashboard",
  },
  {
    title: "Client History",
    description:
      "Every client's complete color history in one place. Perfect results every visit, seamless handoffs between stylists — no more recreating formulas from scratch.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Stylist reviewing client formula history",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
            Everything your salon needs
          </h2>
          <p className="text-slate-500 text-lg max-w-xl">
            Built for the way professional salons actually work — from the color station to the back office.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group"
            >
              {/* Feature image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={f.image}
                  alt={f.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>

              <div className="p-5">
                <h3 className="font-display font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{f.description}</p>
                <button className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:gap-2.5 transition-all">
                  EXPLORE <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
