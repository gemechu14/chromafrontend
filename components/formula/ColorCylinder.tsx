"use client";

import { motion } from "framer-motion";

interface ColorCylinderProps {
  color: string;
  totalAmount?: number;
  className?: string;
}

export function ColorCylinder({ color, totalAmount = 0, className = "" }: ColorCylinderProps) {
  const hasColor = color !== "#CCCCCC" && totalAmount > 0;
  // Calculate fill height: minimum 20%, scales with amount up to 85%
  const fillHeight = totalAmount > 0 
    ? Math.min(85, Math.max(20, (totalAmount / 150) * 65 + 20))
    : 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Test Tube Container */}
      <div className="relative flex flex-col items-center">
        {/* Test Tube - Glass Body */}
        <div className="relative">
          {/* Glass tube with realistic glass effect */}
          <motion.div
            className="relative"
            style={{ width: "80px", height: "200px" }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Outer glass rim */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 rounded-t-full border-2 border-slate-300"
              style={{
                background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(240,240,240,0.7))",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)",
              }}
            />

            {/* Glass tube body */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-[180px] rounded-b-full"
              style={{
                background: "linear-gradient(to right, rgba(255,255,255,0.3), rgba(240,240,240,0.2), rgba(255,255,255,0.3))",
                border: "2px solid rgba(200,200,200,0.4)",
                boxShadow: `
                  inset -2px 0 4px rgba(0,0,0,0.1),
                  inset 2px 0 4px rgba(255,255,255,0.3),
                  0 4px 12px rgba(0,0,0,0.15)
                `,
                backdropFilter: "blur(1px)",
              }}
            >
              {/* Liquid Fill */}
              {hasColor && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-b-full overflow-hidden"
                  style={{
                    height: `${fillHeight}%`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${fillHeight}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Liquid color with depth */}
                  <div
                    className="absolute inset-0 rounded-b-full"
                    style={{
                      background: `linear-gradient(to top, ${color}, ${color}dd)`,
                      boxShadow: `
                        inset 0 4px 8px rgba(0,0,0,0.2),
                        inset -2px 0 4px rgba(0,0,0,0.15)
                      `,
                    }}
                  >
                    {/* Liquid surface reflection */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1/4 rounded-b-full"
                      style={{
                        background: `linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)`,
                      }}
                    />
                    {/* Liquid meniscus (curved surface) */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2"
                      style={{
                        background: `radial-gradient(ellipse at center, ${color}ee 0%, ${color} 70%)`,
                        borderRadius: "0 0 50% 50%",
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Glass refraction highlights */}
              <div
                className="absolute top-8 left-2 w-1 h-32 rounded-full opacity-40"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
                }}
              />
              <div
                className="absolute top-12 right-3 w-0.5 h-24 rounded-full opacity-30"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)",
                }}
              />
            </div>

            {/* Test tube base/bottom */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full"
              style={{
                background: "linear-gradient(to bottom, rgba(220,220,220,0.6), rgba(200,200,200,0.8))",
                border: "2px solid rgba(180,180,180,0.5)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            />
          </motion.div>

          {/* Shadow beneath test tube */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full opacity-20 blur-md"
            style={{ backgroundColor: color || "#999" }}
          />
        </div>

        {/* Color Info Display */}
        {hasColor && (
          <motion.div
            className="mt-6 text-center space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-white shadow-lg"
                style={{ backgroundColor: color }}
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  Mixed Color
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalAmount.toFixed(1)}g/ml total
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-mono text-muted-foreground">
                {color.toUpperCase()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasColor && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground font-medium">
              Add products to preview color
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The mixed color will appear here
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

