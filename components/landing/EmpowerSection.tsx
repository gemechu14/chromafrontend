"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function EmpowerSection() {
  return (
    <section id="why-chroma" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Row 1: Image left, text right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3]"
          >
            <Image
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop"
              alt="Modern salon interior with color products"
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground leading-tight mb-6">
              Empower Your Salon
              With Precise Color
              Management
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Chroma is the complete solution for modern salons seeking seamless color management.
              Our platform ensures accurate formula tracking, real-time inventory management,
              and color profit intelligence — so you can focus on what you do best.
            </p>
            <Link href="/login">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 font-bold">
                GET STARTED
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Row 2: Why Chroma — 4 benefit cards */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl sm:text-5xl font-black text-foreground text-center mb-14"
          >
            Why Chroma Color Management?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                icon: "⚖️",
                title: "Effortless Precision",
                body: "Measure and store color formulas down to a tenth of a gram, eliminating any margin for error.",
              },
              {
                icon: "💰",
                title: "Maximize Revenue",
                body: "Join salons boosting revenue by up to 15% in the first month, and upwards of 40% over time.",
              },
              {
                icon: "🔄",
                title: "Streamlined Operations",
                body: "Simplify your stylists' workflow, enhance front desk operations, and create a more profitable business.",
              },
              {
                icon: "🎛️",
                title: "Customized Flexibility",
                body: "Whether you run a large salon or work independently, Chroma adapts to your pricing strategies.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="font-display font-bold text-foreground text-lg mb-3">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="#how-it-works">
              <Button
                variant="outline"
                className="rounded-full px-8 font-bold text-sm border-2 border-foreground text-foreground hover:bg-foreground hover:text-white transition-colors"
              >
                SEE HOW IT WORKS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}








