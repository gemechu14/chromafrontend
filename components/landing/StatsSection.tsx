"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: Stat[] = [
  { value: 10000, suffix: "+", label: "Formulas Saved", description: "Color recipes tracked and reused for consistent results" },
  { value: 500, suffix: "+", label: "Active Salons", description: "Professional teams managing their inventory with Chroma" },
  { value: 98, suffix: "%", label: "Inventory Accuracy", description: "Precision tracking in grams and milliliters" },
  { value: 40, suffix: "%", label: "Waste Reduced", description: "Average reduction in color product waste after 30 days" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1600;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export function StatsSection() {
  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-slate-200">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center lg:px-8"
            >
              <div className="font-display text-4xl sm:text-5xl font-black text-primary mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="font-semibold text-foreground text-base mb-1">{stat.label}</div>
              <div className="text-slate-500 text-sm leading-relaxed hidden sm:block">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
