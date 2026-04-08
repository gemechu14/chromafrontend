"use client";

import { useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, FlaskConical } from "lucide-react";
import { normalizeCatalogHex } from "@/lib/utils/color-mixer";

// ─── Public types ────────────────────────────────────────────────────────────

export interface DropletItem {
  color: string;
  amount: number;
  label: string;
  /** Product tracking unit from tenant product. */
  unitLabel: "g" | "ml";
  /** Catalog `hex_code` from the API (may be null when not set). */
  hex_code: string | null;
  /** True when the product line is COLOR. */
  isColorCategory: boolean;
  /** Only COLOR items with a valid catalog hex drive the mixed swatch. */
  contributesToMix: boolean;
  /** Human-readable category: "COLOR", "DEVELOPER", "TONER", "TREATMENT", etc. */
  categoryLabel: string;
  /** Product line name from catalog (category is stored on the line). */
  product_line_name: string | null;
}

interface FormulaDropletProps {
  items: DropletItem[];
  /** Virtual bowl capacity for fill scale. Default 500 g/ml. */
  capacity?: number;
  unitLabel?: string;
  className?: string;
}

const DEFAULT_CAPACITY = 500;

// ─── Cylinder/Bowl SVG geometry ──────────────────────────────────────────────

const VB_W = 680;
const VB_H = 500;
const CX = 340;
const R = 248;
const RIM_Y = 126;
const SHOULDER_Y = 304;
const SHOULDER_HALF_W = 154;
const BOT_Y = 380;
const BOWL_DEPTH = 26;
const RIM_RISE = 7;
const BOWL_CONTROL_Y = BOT_Y + BOWL_DEPTH;
// For a quadratic from shoulder->shoulder, the visible lowest point is at t=0.5.
const LIQUID_BOTTOM_Y = SHOULDER_Y + (BOWL_CONTROL_Y - SHOULDER_Y) / 2;
const DROP_INNER_H = LIQUID_BOTTOM_Y - RIM_Y;

const CYLINDER_FILL_PATH = [
  `M ${CX - R} ${RIM_Y}`,
  `C ${CX - R + 14} ${RIM_Y + 72}, ${CX - SHOULDER_HALF_W - 28} ${SHOULDER_Y - 28}, ${CX - SHOULDER_HALF_W} ${SHOULDER_Y}`,
  `Q ${CX} ${BOWL_CONTROL_Y}, ${CX + SHOULDER_HALF_W} ${SHOULDER_Y}`,
  `C ${CX + SHOULDER_HALF_W + 28} ${SHOULDER_Y - 28}, ${CX + R - 14} ${RIM_Y + 72}, ${CX + R} ${RIM_Y}`,
  "Z",
].join(" ");

const RIM_BACK_ARC = `M ${CX - R} ${RIM_Y} Q ${CX} ${RIM_Y - RIM_RISE}, ${CX + R} ${RIM_Y}`;
const RIM_FRONT_ARC = `M ${CX - R} ${RIM_Y} Q ${CX} ${RIM_Y + RIM_RISE}, ${CX + R} ${RIM_Y}`;
const BOWL_WALL_PATH = [
  `M ${CX - R} ${RIM_Y}`,
  `C ${CX - R + 14} ${RIM_Y + 72}, ${CX - SHOULDER_HALF_W - 28} ${SHOULDER_Y - 28}, ${CX - SHOULDER_HALF_W} ${SHOULDER_Y}`,
  `Q ${CX} ${BOWL_CONTROL_Y}, ${CX + SHOULDER_HALF_W} ${SHOULDER_Y}`,
  `C ${CX + SHOULDER_HALF_W + 28} ${SHOULDER_Y - 28}, ${CX + R - 14} ${RIM_Y + 72}, ${CX + R} ${RIM_Y}`,
].join(" ");

function halfWidthAt(y: number): number {
  if (y <= RIM_Y || y >= LIQUID_BOTTOM_Y) return 0;
  if (y <= SHOULDER_Y) {
    const t = (y - RIM_Y) / (SHOULDER_Y - RIM_Y);
    const eased = 1 - Math.pow(t, 0.74) * 0.42;
    return R * eased;
  }
  const denom = BOWL_CONTROL_Y - SHOULDER_Y;
  const inside = 1 - (2 * (y - SHOULDER_Y)) / denom;
  return SHOULDER_HALF_W * Math.sqrt(Math.max(0, inside));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1e293b" : "#ffffff";
}

function darken(hex: string, factor = 0.7): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(parseInt(hex.slice(1, 3), 16) * factor);
  const g = clamp(parseInt(hex.slice(3, 5), 16) * factor);
  const b = clamp(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function wrapText(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const words = text.split(/[\s\-/]+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2)
    return [lines[0], lines.slice(1).join(" ").slice(0, max - 1) + "\u2026"];
  return lines;
}

// ─── Callout layout constants ────────────────────────────────────────────────

const CALLOUT_R = 29;
const MIN_GAP = CALLOUT_R * 2 + 34;
const LABEL_L_X = 56;
const LABEL_R_X = VB_W - 56;
const LABEL_TOP_BOUND = RIM_Y - 22;
const LABEL_BOTTOM_BOUND = LIQUID_BOTTOM_Y - 8;

interface Layer extends DropletItem {
  rectY: number;
  rectH: number;
  midY: number;
  edgeY: number;
  isLeft: boolean;
  edgeX: number;
  labelX: number;
  labelY: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FormulaDroplet({
  items,
  capacity = DEFAULT_CAPACITY,
  unitLabel = "g",
  className = "",
}: FormulaDropletProps) {
  const clipId = useId();

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const colorItems = items.filter((i) => i.isColorCategory);
  const tonerPreviewItems = items.filter(
    (i) => i.categoryLabel === "Toner" && normalizeCatalogHex(i.hex_code)
  );
  const previewItems = [...colorItems, ...tonerPreviewItems];
  const nonColorItems = items.filter((i) => !i.isColorCategory);
  const colorAmount = previewItems.reduce((s, i) => s + i.amount, 0);

  // Group non-color items by category
  const nonColorGroups = useMemo(() => {
    const map = new Map<string, DropletItem[]>();
    nonColorItems.forEach((item) => {
      const key = item.categoryLabel || "OTHER";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [nonColorItems]);

  // Teardrop shows COLOR + TONER(with hex) lines.
  const { layers, fillRatio } = useMemo(() => {
    if (colorAmount === 0 || capacity <= 0)
      return { layers: [] as Layer[], fillRatio: 0 };

    const fillRatio = Math.min(1, colorAmount / capacity);
    // Visual easing: keep low amounts visible while preserving real quantity text.
    const visualFillRatio =
      fillRatio <= 0 ? 0 : Math.max(0.12, Math.min(1, Math.pow(fillRatio, 0.62)));
    const liquidH = visualFillRatio * DROP_INNER_H;

    // Same order as mix rows: oldest first in array → bottom of liquid; newest → tip
    let cumY = LIQUID_BOTTOM_Y;
    const raw: Layer[] = [];

    for (let i = 0; i < previewItems.length; i++) {
      const item = previewItems[i];
      const h = (item.amount / colorAmount) * liquidH;
      cumY -= h;
      raw.push({
        ...item,
        rectY: cumY,
        rectH: Math.max(h, 1),
        midY: cumY + h / 2,
        edgeY: 0,
        isLeft: false,
        edgeX: 0,
        labelX: 0,
        labelY: 0,
      });
    }

    raw.forEach((l, i) => {
      // Keep anchor on the actual visible contour while tracking each layer.
      l.edgeY = Math.max(RIM_Y + 8, Math.min(LIQUID_BOTTOM_Y - 8, l.midY));
      const hw = halfWidthAt(l.edgeY);
      l.isLeft = i % 2 === 0;
      l.edgeX = l.isLeft ? CX - hw : CX + hw;
      l.labelX = l.isLeft ? LABEL_L_X : LABEL_R_X;
      l.labelY = Math.max(LABEL_TOP_BOUND, Math.min(LABEL_BOTTOM_BOUND, l.midY));
    });

    for (const side of [true, false] as const) {
      const group = raw
        .filter((l) => l.isLeft === side)
        .sort((a, b) => a.labelY - b.labelY);
      for (let i = 1; i < group.length; i++) {
        const minY = group[i - 1].labelY + MIN_GAP;
        if (group[i].labelY < minY) group[i].labelY = minY;
      }
      for (let i = group.length - 2; i >= 0; i--) {
        const maxY = group[i + 1].labelY - MIN_GAP;
        if (group[i].labelY > maxY) group[i].labelY = maxY;
      }
      group.forEach((l) => {
        l.labelY = Math.max(LABEL_TOP_BOUND, Math.min(LABEL_BOTTOM_BOUND, l.labelY));
      });
    }

    return { layers: raw, fillRatio };
  }, [previewItems, colorAmount, capacity]);

  const hasLayers = layers.length > 0;
  const u = unitLabel.toLowerCase() === "ml" ? "ml" : "g";

  function fmt(a: number, perItemUnit?: "g" | "ml"): string {
    const unit = perItemUnit ?? u;
    return a >= 10 ? `${a.toFixed(1)}${unit}` : `${a.toFixed(2)}${unit}`;
  }

  /** Hex label under swatch: normalized API `hex_code`, else the fill color. */
  function displayHexForItem(item: DropletItem): string {
    const n = normalizeCatalogHex(item.hex_code);
    if (n) return n;
    return item.color.toUpperCase();
  }

  return (
    <div className={className}>
      {/* ── Dark canvas with teardrop ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-slate-50/70 px-2 pt-5 pb-4 shadow-sm">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="bowlGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.24)" />
              <stop offset="100%" stopColor="rgba(226,232,240,0.05)" />
            </linearGradient>
            <clipPath id={`drop-${clipId}`}>
              <path d={CYLINDER_FILL_PATH} />
            </clipPath>
          </defs>

          {/* Ground shadow */}
          <ellipse
            cx={CX}
            cy={BOT_Y + 26}
            rx={R * 0.5}
            ry={11}
            fill="rgba(15,23,42,0.12)"
          />

          {/* Back rim for open-top bowl */}
          <path
            d={RIM_BACK_ARC}
            fill="none"
            stroke="rgba(148,163,184,0.45)"
            strokeWidth="2"
          />

          {hasLayers ? (
            <>
              {/* Stacked liquid layers clipped to teardrop */}
              <g clipPath={`url(#drop-${clipId})`}>
                {layers.map((layer, i) => (
                  <motion.rect
                    key={i}
                    x={CX - R - 4}
                    y={layer.rectY}
                    width={(R + 4) * 2}
                    height={layer.rectH}
                    fill={layer.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                  />
                ))}
                {/* Liquid surface highlight (top of stack = newest / last in mix list) */}
                {(() => {
                  const topLayer = layers[layers.length - 1];
                  const topY = topLayer.rectY;
                  const hw = halfWidthAt(topY);
                  return (
                    <rect
                      x={CX - hw}
                      y={topY}
                      width={hw * 2}
                      height={3}
                      fill="rgba(255,255,255,0.42)"
                      rx={2}
                    />
                  );
                })()}
              </g>

              {/* Glass gloss overlay */}
              <path d={CYLINDER_FILL_PATH} fill="url(#bowlGloss)" />

              {/* Callouts */}
              {layers.map((layer, i) => {
                const border = darken(layer.color);
                const fg = contrastText(layer.color);
                const lines = wrapText(layer.label, 17);

                return (
                  <motion.g
                    key={i}
                    initial={{ opacity: 0, x: layer.isLeft ? -14 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                  >
                    {/* Dot on edge */}
                    <circle cx={layer.edgeX} cy={layer.edgeY} r={3.5} fill="white" />

                    {/* Leader line */}
                    <line
                      x1={layer.edgeX}
                      y1={layer.edgeY}
                      x2={layer.labelX}
                      y2={layer.labelY}
                      stroke="rgba(71,85,105,0.35)"
                      strokeWidth="1.2"
                    />

                    {/* Callout circle (hair color only) */}
                    <circle
                      cx={layer.labelX}
                      cy={layer.labelY}
                      r={CALLOUT_R}
                      fill={layer.color}
                      stroke={border}
                      strokeWidth={3}
                    />
                    <circle
                      cx={layer.labelX}
                      cy={layer.labelY}
                      r={CALLOUT_R - 4}
                      fill="none"
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth="1"
                    />

                    {/* Amount text */}
                    <text
                      x={layer.labelX}
                      y={layer.labelY + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={fg}
                      fontWeight="700"
                      fontSize="12.5"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {fmt(layer.amount, layer.unitLabel)}
                    </text>

                    {/* Product name label */}
                    <text
                      x={layer.labelX}
                      y={layer.labelY + CALLOUT_R + 13}
                      textAnchor="middle"
                      fill="rgba(51,65,85,0.92)"
                      fontSize="10"
                      fontWeight="700"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {lines.map((line, li) => (
                        <tspan key={li} x={layer.labelX} dy={li === 0 ? 0 : 12}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </motion.g>
                );
              })}
            </>
          ) : (
            <>
              {/* Empty teardrop outline */}
              <path
                d={CYLINDER_FILL_PATH}
                fill="none"
                stroke="rgba(148,163,184,0.6)"
                strokeWidth="2"
                strokeDasharray="8 5"
              />
              <path
                d={RIM_BACK_ARC}
                fill="none"
                stroke="rgba(148,163,184,0.55)"
                strokeWidth="2"
              />
              <text
                x={CX}
                y={RIM_Y + 54}
                textAnchor="middle"
                fill="rgba(148,163,184,0.65)"
                fontSize="34"
              >
                &#x1F9EA;
              </text>
              <text
                x={CX}
                y={RIM_Y + 86}
                textAnchor="middle"
                fill="rgba(100,116,139,0.85)"
                fontSize="12"
                fontWeight="500"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {nonColorItems.length > 0 && colorItems.length === 0
                  ? "Add a color product to preview the mix"
                  : "Add products to preview"}
              </text>
            </>
          )}

          {/* Fill gauge (color volume only) */}
          {hasLayers && (
            <text
              x={CX}
              y={BOT_Y + 42}
              textAnchor="middle"
              fill="rgba(100,116,139,0.8)"
              fontSize="9.5"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {colorAmount.toFixed(1)} / {capacity} {u} ({Math.round(fillRatio * 100)}%)
            </text>
          )}

          {/* Bowl walls and front rim on top to keep it visually open */}
          <path
            d={BOWL_WALL_PATH}
            fill="none"
            stroke="rgba(71,85,105,0.35)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d={RIM_FRONT_ARC}
            fill="none"
            stroke="rgba(71,85,105,0.5)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ── Product breakdown below teardrop ──────────────────────────── */}
      <AnimatePresence>
        {totalAmount > 0 && (
          <motion.div
            className="mt-3 space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Color products — swatch circle + catalog hex under the bowl */}
            {colorItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-1 flex items-center gap-1.5">
                  <Droplets className="w-3 h-3" /> Color
                </p>
                <div className="space-y-2">
                  {colorItems.map((item, i) => (
                    <motion.div
                      key={`c-${i}`}
                      className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0 border-[3px] border-white shadow-md ring-1 ring-black/10"
                          style={{ backgroundColor: item.color }}
                          aria-hidden
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-mono font-semibold text-foreground tracking-tight">
                            {displayHexForItem(item)}
                          </p>
                          <p className="text-xs text-foreground font-medium leading-snug">
                            {item.label}
                          </p>
                          {item.product_line_name && (
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {item.product_line_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs tabular-nums text-foreground font-bold shrink-0 pt-0.5">
                        {fmt(item.amount, item.unitLabel)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-color products grouped by category */}
            {nonColorGroups.map(([category, groupItems]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-1 flex items-center gap-1.5">
                  <FlaskConical className="w-3 h-3" /> {category}
                </p>
                <div className="space-y-1">
                  {groupItems.map((item, i) => (
                    <motion.div
                      key={`nc-${category}-${i}`}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 bg-muted/20 hover:bg-muted/40 transition-colors"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <div className="w-6 h-6 rounded-full shrink-0 border border-slate-300 bg-slate-100 flex items-center justify-center">
                        <FlaskConical className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-foreground/80 font-medium block truncate">
                          {item.label}
                        </span>
                        {item.product_line_name && (
                          <span className="text-[10px] text-muted-foreground/80 truncate block">
                            {item.product_line_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground font-semibold shrink-0">
                        {fmt(item.amount, item.unitLabel)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

