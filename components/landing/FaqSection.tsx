"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does the inventory auto-deduction work?",
    answer:
      "When you save a formula in Chroma, each product and the amount used is recorded. The system automatically subtracts the exact gram or milliliter amount from your inventory — no manual counting needed. You can also see the full audit trail of every deduction.",
  },
  {
    question: "Can I use Chroma across multiple salon locations?",
    answer:
      "Yes. Chroma is built as a multi-location platform. Each branch has its own independent inventory while sharing the same customer database, product catalog, and user accounts. Managers can view data across all locations.",
  },
  {
    question: "What happens when a product runs low?",
    answer:
      "You set a reorder threshold (in grams or ml) for each product. Chroma highlights low-stock items on your dashboard and in the inventory table so you can reorder before running out mid-service.",
  },
  {
    question: "How do I import my existing product catalog?",
    answer:
      "Chroma includes a global catalog of professional color brands including Redken, Wella, Schwarzkopf, and more. You simply enable the products you use, set your cost per gram, and start tracking. Custom products can also be added manually.",
  },
  {
    question: "Will Chroma integrate with my salon booking software?",
    answer:
      "We're building integrations with popular salon software. Formula data and cost reports can be exported at any time. Contact us to discuss your specific integration needs.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="pricing" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — FAQs */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl sm:text-5xl font-black text-foreground mb-10"
            >
              Frequently Asked
              <br />
              Questions
            </motion.h2>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className={`font-semibold text-sm leading-snug pr-4 ${open === i ? "text-primary" : "text-foreground"}`}>
                      {faq.question}
                    </span>
                    <div className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${open === i ? "border-primary text-primary" : "border-slate-300 text-slate-400"}`}>
                      {open === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — product photo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-xl aspect-[3/4] sticky top-24"
          >
            <Image
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format&fit=crop"
              alt="Hair salon color products and tools"
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








