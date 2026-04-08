// ─── Color Mixing Utilities ─────────────────────────────────────────────────

import type { ProductCategory } from "@/lib/types";

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Weighted-average mix of multiple hex colors by their amounts.
 */
export function mixColors(
  colors: Array<{ color: string; amount: number }>
): string {
  const valid = colors.filter((c) => c.amount > 0);
  if (valid.length === 0) return "#CCCCCC";
  if (valid.length === 1) return valid[0].color;

  const totalAmount = valid.reduce((s, c) => s + c.amount, 0);
  if (totalAmount === 0) return "#CCCCCC";

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  valid.forEach(({ color, amount }) => {
    const weight = amount / totalAmount;
    const hex = color.startsWith("#") ? color : `#${color}`;
    totalR += parseInt(hex.slice(1, 3), 16) * weight;
    totalG += parseInt(hex.slice(3, 5), 16) * weight;
    totalB += parseInt(hex.slice(5, 7), 16) * weight;
  });

  return rgbToHex(Math.round(totalR), Math.round(totalG), Math.round(totalB));
}

/** Returns canonical `#RRGGBB` or null (matches API `hex_code` shapes). */
export function normalizeCatalogHex(hex?: string | null): string | null {
  if (hex == null) return null;
  const s = String(hex).trim();
  if (!s) return null;
  if (/^#[0-9A-Fa-f]{6}$/i.test(s)) {
    return s.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{3}$/i.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

export function isValidCatalogHex(hex?: string | null): boolean {
  return normalizeCatalogHex(hex) !== null;
}

/**
 * Catalog hair-color swatch when `hex_code` is set.
 */
export function getProductColor(hexCode?: string | null): string {
  const n = normalizeCatalogHex(hexCode);
  if (n) return n;
  return "#D4D4D8";
}

/** Muted layer fill for developers, toners, treatments — not hair swatches. */
export function getNonColorLayerColor(
  category: Exclude<ProductCategory, "COLOR">
): string {
  switch (category) {
    case "DEVELOPER":
      return "#64748b";
    case "TONER":
      return "#78716c";
    case "TREATMENT":
      return "#a8a29e";
  }
}
