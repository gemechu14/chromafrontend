"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";

interface HairColorPreviewProps {
  color: string;
  totalAmount?: number;
  className?: string;
}

const DEFAULT_HAIR = "#7A4E2D";

// ── Image URLs for the three hairstyles ────────────────────────────────────────
const HAIRSTYLE_IMAGES = [
  {
    label: "Shoulder Length",
    url: "https://m.media-amazon.com/images/I/81NttRCZTEL._AC_.jpg",
  },
  {
    label: "Long Straight",
    url: "https://m.media-amazon.com/images/I/81NttRCZTEL._AC_.jpg",
  },
  {
    label: "Double Braids",
    url: "https://m.media-amazon.com/images/I/81NttRCZTEL._AC_.jpg",
  },
];

// ── Helper: Convert hex to RGB ─────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ── Helper: Check if pixel is likely hair (brown/dark tones) ──────────────────
function isHairColor(r: number, g: number, b: number): boolean {
  // Hair is typically in brown/black/gray ranges
  // Exclude skin tones (pink/peach) and bright colors
  const brightness = (r + g + b) / 3;
  const saturation =
    (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b, 1);

  // Skin tones are usually bright and low saturation
  if (brightness > 200 && saturation < 0.15) return false;
  // Very dark areas (likely hair)
  if (brightness < 100) return true;
  // Brown tones (hair range)
  if (brightness < 180 && r < g + 30 && b < g + 30) return true;

  return false;
}

// ── Portrait component with canvas-based hair recoloring ───────────────────────
function HairPortrait({
  imageUrl,
  hairColor,
  hasColor,
}: {
  imageUrl: string;
  hairColor: string;
  hasColor: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get container size for display (responsive)
    const container = canvas.parentElement;
    const displayWidth = container?.clientWidth || 200;
    const displayHeight = container?.clientHeight || 300;

    // Set canvas display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Set canvas internal resolution (2x for retina quality)
    const scale = 2;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    
    // Reset transform before drawing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, scale);

    // Draw original image scaled to fit
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    if (hasColor) {
      // Reset transform to get imageData at full resolution
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Get image data at the scaled resolution
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const targetRgb = hexToRgb(hairColor);

      if (targetRgb) {
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if this pixel is likely hair
          if (isHairColor(r, g, b)) {
            // Blend the target hair color with the original pixel
            // Preserve some of the original brightness and texture
            const factor = 0.7; // How much of the new color to apply

            data[i] = Math.round(r * (1 - factor) + targetRgb.r * factor);
            data[i + 1] = Math.round(g * (1 - factor) + targetRgb.g * factor);
            data[i + 2] = Math.round(b * (1 - factor) + targetRgb.b * factor);
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [hairColor, hasColor]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageLoaded(true);
      imgRef.current = img;
      // Small delay to ensure container is sized
      setTimeout(updateCanvas, 100);
    };
    img.onerror = () => setImageError(true);
    img.src = imageUrl;
  }, [imageUrl, updateCanvas]);

  // Handle resize and color changes
  useEffect(() => {
    if (!imageLoaded) return;
    const resizeObserver = new ResizeObserver(() => {
      updateCanvas();
    });
    const container = canvasRef.current?.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    return () => resizeObserver.disconnect();
  }, [imageLoaded, updateCanvas]);

  return (
    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {imageError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center px-2">
            Image failed to load
          </p>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            // style={{ imageRendering: "high-quality" }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
      </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function HairColorPreview({
  color,
  totalAmount = 0,
  className = "",
}: HairColorPreviewProps) {
  const hasColor = color !== "#CCCCCC" && totalAmount > 0;
  const hairColor = hasColor ? color : DEFAULT_HAIR;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* 3 portraits with real images */}
      <div className="grid grid-cols-3 gap-2">
        {HAIRSTYLE_IMAGES.map((style) => (
        <motion.div
            key={style.label}
            className="flex flex-col items-center gap-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              animate={{ opacity: hasColor ? 1 : 0.7 }}
              transition={{ duration: 0.5 }}
            >
              <HairPortrait
                imageUrl={style.url}
                hairColor={hairColor}
                hasColor={hasColor}
              />
        </motion.div>
            <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight">
              {style.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Color info */}
      {hasColor ? (
          <motion.div
          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
          initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          >
              <div
            className="w-10 h-10 rounded-lg border-2 border-white shadow-md flex-shrink-0"
                style={{ backgroundColor: color }}
              />
          <div>
            <p className="text-sm font-semibold text-foreground">Mixed Color</p>
            <p className="text-xs text-muted-foreground">{totalAmount.toFixed(1)} g/ml total</p>
            <p className="text-xs font-mono text-muted-foreground">{color.toUpperCase()}</p>
            </div>
          </motion.div>
      ) : (
          <motion.div
          className="text-center py-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-muted-foreground font-medium">
            Add products to preview the hair color
            </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All three styles update instantly
            </p>
          </motion.div>
        )}
    </div>
  );
}
