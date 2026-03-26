"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Mix & Measure",
    description: "Place the bowl on a digital scale, add each product by grams or milliliters, and record the formula directly in Chroma.",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Stylist mixing hair color",
  },
  {
    number: "02",
    title: "Save to Client",
    description: "Attach the formula to the client's profile. Inventory deducts automatically — no manual counting required.",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Saving client profile on tablet",
  },
  {
    number: "03",
    title: "Track & Profit",
    description: "See the real cost of every service, monitor stock levels, and understand your business performance at a glance.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop",
    imageAlt: "Business analytics and reporting",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
            Get Your Salon Started
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Three simple steps to transform how your salon tracks color — set up in under five minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
            >
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[4/3] mb-6">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Step badge */}
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                  <span className="font-display font-black text-primary text-sm">{step.number}</span>
                </div>
              </div>

              <h3 className="font-display text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-slate-500 text-base leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Example formula record */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto text-white"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-display font-bold text-white text-lg">Sarah Mitchell</p>
              <p className="text-slate-400 text-sm">Root Touch-Up · March 5, 2026</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Service Cost</p>
              <p className="font-display font-black text-accent text-xl">$9.00</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { amount: "30g", code: "07N", name: "Mirage", brand: "Redken Shades EQ", cost: "$5.40" },
              { amount: "15g", code: "07A", name: "Smoky Quartz", brand: "Redken Shades EQ", cost: "$2.70" },
              { amount: "45ml", code: "DEV20", name: "20 Vol Developer", brand: "Redken", cost: "$0.90" },
            ].map((item) => (
              <div key={item.code} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-primary text-sm w-10">{item.amount}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.code} {item.name}</p>
                    <p className="text-xs text-slate-400">{item.brand}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-300">{item.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
