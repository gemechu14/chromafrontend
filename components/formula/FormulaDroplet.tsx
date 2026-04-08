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

// ─── Teardrop SVG geometry (matches Vish reference) ─────────────────────────

const VB_W = 680;
const VB_H = 440;
const CX = 340;
const TIP_Y = 22;
const CC_Y = 190;
const R = 150;
const BOT_Y = CC_Y + R;
const DROP_INNER_H = BOT_Y - TIP_Y;

const DROP_PATH = [
  `M ${CX} ${TIP_Y}`,
  `C ${CX - 4} 90, ${CX + R} ${CC_Y - 50}, ${CX + R} ${CC_Y}`,
  `A ${R} ${R} 0 0 1 ${CX - R} ${CC_Y}`,
  `C ${CX - R} ${CC_Y - 50}, ${CX + 4} 90, ${CX} ${TIP_Y}`,
  "Z",
].join(" ");

function halfWidthAt(y: number): number {
  if (y <= TIP_Y || y >= BOT_Y) return 0;
  if (y >= CC_Y) {
    const dy = y - CC_Y;
    return Math.sqrt(Math.max(0, R * R - dy * dy));
  }
  const t = (y - TIP_Y) / (CC_Y - TIP_Y);
  return R * Math.pow(t, 0.52);
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

const CALLOUT_R = 26;
const MIN_GAP = CALLOUT_R * 2 + 26;
const LABEL_L_X = 72;
const LABEL_R_X = VB_W - 72;

interface Layer extends DropletItem {
  rectY: number;
  rectH: number;
  midY: number;
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
    const liquidH = fillRatio * DROP_INNER_H;

    // Same order as mix rows: oldest first in array → bottom of liquid; newest → tip
    let cumY = BOT_Y;
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
        isLeft: false,
        edgeX: 0,
        labelX: 0,
        labelY: 0,
      });
    }

    raw.forEach((l, i) => {
      const hw = halfWidthAt(l.midY);
      l.isLeft = i % 2 === 0;
      l.edgeX = l.isLeft ? CX - hw : CX + hw;
      l.labelX = l.isLeft ? LABEL_L_X : LABEL_R_X;
      l.labelY = Math.max(TIP_Y + CALLOUT_R, Math.min(BOT_Y + 30, l.midY));
    });

    for (const side of [true, false] as const) {
      const group = raw
        .filter((l) => l.isLeft === side)
        .sort((a, b) => a.labelY - b.labelY);
      for (let i = 1; i < group.length; i++) {
        const minY = group[i - 1].labelY + MIN_GAP;
        if (group[i].labelY < minY) group[i].labelY = minY;
      }
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
      <div className="rounded-2xl bg-gradient-to-b from-[#1e2333] via-[#171c2a] to-[#111520] px-2 pt-5 pb-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id={`drop-${clipId}`}>
              <path d={DROP_PATH} />
            </clipPath>
          </defs>

          {/* Ground shadow */}
          <ellipse
            cx={CX}
            cy={BOT_Y + 20}
            rx={R * 0.6}
            ry={8}
            fill="rgba(0,0,0,0.3)"
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
                      height={2}
                      fill="rgba(255,255,255,0.15)"
                      rx={1}
                    />
                  );
                })()}
              </g>

              {/* Teardrop glass outline */}
              <path
                d={DROP_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="2"
              />

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
                    <circle cx={layer.edgeX} cy={layer.midY} r={3.5} fill="white" />

                    {/* Leader line */}
                    <line
                      x1={layer.edgeX}
                      y1={layer.midY}
                      x2={layer.labelX}
                      y2={layer.labelY}
                      stroke="rgba(255,255,255,0.3)"
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
                      stroke="rgba(255,255,255,0.2)"
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
                      fontSize="11.5"
                      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      {fmt(layer.amount, layer.unitLabel)}
                    </text>

                    {/* Product name label */}
                    <text
                      x={layer.labelX}
                      y={layer.labelY + CALLOUT_R + 13}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="9"
                      fontWeight="500"
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
                d={DROP_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
                strokeDasharray="8 5"
              />
              <text
                x={CX}
                y={CC_Y - 10}
                textAnchor="middle"
                fill="rgba(148,163,184,0.45)"
                fontSize="34"
              >
                &#x1F9EA;
              </text>
              <text
                x={CX}
                y={CC_Y + 22}
                textAnchor="middle"
                fill="rgba(148,163,184,0.5)"
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
              fill="rgba(148,163,184,0.4)"
              fontSize="9.5"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {colorAmount.toFixed(1)} / {capacity} {u} ({Math.round(fillRatio * 100)}%)
            </text>
          )}
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

