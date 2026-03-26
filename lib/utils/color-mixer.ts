// ─── Color Mapping & Mixing Utilities ──────────────────────────────────────────

/**
 * Maps hair color tone families to base colors
 */
const toneFamilyColors: Record<string, string> = {
  N: "#D4A574", // Natural - warm beige
  A: "#9B9B9B", // Ash - cool gray
  G: "#E6C866", // Gold - golden yellow
  V: "#B8860B", // Violet - deep purple
  R: "#CD5C5C", // Red - warm red
  C: "#8B7355", // Copper - coppery brown
  M: "#9370DB", // Mahogany - reddish brown
  B: "#2F4F4F", // Blue - dark blue-gray
};

/**
 * Maps product codes to specific colors (common hair color codes)
 * Format: extracts number and letter from codes like "07N", "09N", "6-0", etc.
 */
function getColorFromCode(code: string, toneFamily: string | null): string {
  if (!code) return "#CCCCCC"; // Default gray

  // Extract tone family from code if not provided
  const codeMatch = code.match(/(\d+)([NAGVRCBM])/i);
  const extractedTone = codeMatch ? codeMatch[2].toUpperCase() : null;
  const tone = toneFamily?.toUpperCase() || extractedTone || "N";

  // Get base color from tone family
  const baseColor = toneFamilyColors[tone] || toneFamilyColors["N"];

  // Extract level (lightness) from code (e.g., "07" = level 7, "09" = level 9)
  const levelMatch = code.match(/(\d+)/);
  const level = levelMatch ? parseInt(levelMatch[1], 10) : 7;
  
  // Adjust lightness based on level (1-10 scale, where 10 is lightest)
  const lightness = Math.max(0.3, Math.min(0.95, level / 10));
  
  return adjustLightness(baseColor, lightness);
}

/**
 * Adjusts the lightness of a hex color
 */
function adjustLightness(hex: string, lightness: number): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert to HSL
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Adjust lightness
  const newL = Math.max(0, Math.min(1, l * lightness));
  
  // Convert back to RGB
  const [newR, newG, newB] = hslToRgb(h, s, newL);
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }).join("")}`;
}

/**
 * Mixes multiple colors based on their ratios (amounts)
 * Returns a weighted average color
 */
export function mixColors(
  colors: Array<{ color: string; amount: number }>
): string {
  if (colors.length === 0) return "#CCCCCC";
  if (colors.length === 1) return colors[0].color;

  // Filter out zero amounts
  const validColors = colors.filter((c) => c.amount > 0);
  if (validColors.length === 0) return "#CCCCCC";
  if (validColors.length === 1) return validColors[0].color;

  // Calculate total amount
  const totalAmount = validColors.reduce((sum, c) => sum + c.amount, 0);
  if (totalAmount === 0) return "#CCCCCC";

  // Convert all colors to RGB and calculate weighted average
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  validColors.forEach(({ color, amount }) => {
    const weight = amount / totalAmount;
    const hex = color.startsWith("#") ? color : `#${color}`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    totalR += r * weight;
    totalG += g * weight;
    totalB += b * weight;
  });

  return rgbToHex(Math.round(totalR), Math.round(totalG), Math.round(totalB));
}

/**
 * Gets the color for a product based on its code and tone family
 */
export function getProductColor(
  code: string | null | undefined,
  toneFamily: string | null | undefined
): string {
  if (!code) return "#CCCCCC";
  return getColorFromCode(code, toneFamily || null);
}


