// Brand color presets shown in the admin sticker picker.
// Values match the CSS variables defined in src/index.css so the badges visually
// match the rest of the landing page.
export const STICKER_COLOR_PRESETS = [
  { name: "Plava", value: "hsl(196 91% 48%)", textColor: "hsl(0 0% 100%)" },
  { name: "Crvena", value: "hsl(4 91% 58%)", textColor: "hsl(0 0% 100%)" },
  { name: "Zelena", value: "hsl(67 76% 53%)", textColor: "hsl(221 39% 11%)" },
  { name: "Žuta", value: "hsl(39 97% 58%)", textColor: "hsl(221 39% 11%)" },
  { name: "Narančasta", value: "hsl(24 95% 53%)", textColor: "hsl(0 0% 100%)" },
] as const;

export const DEFAULT_STICKER_COLOR = STICKER_COLOR_PRESETS[1].value;

// Pick a sensible foreground color for a given background.
// For brand presets we use the predefined contrast color; for custom hex we
// compute YIQ luma and choose black or white for legibility.
export function getStickerTextColor(bg: string): string {
  const preset = STICKER_COLOR_PRESETS.find((p) => p.value === bg);
  if (preset) return preset.textColor;

  const hex = bg.trim().replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? "hsl(221 39% 11%)" : "hsl(0 0% 100%)";
  }
  return "hsl(0 0% 100%)";
}

interface ProductStickerProps {
  text: string;
  color?: string | null;
  className?: string;
}

const ProductSticker = ({ text, color, className }: ProductStickerProps) => {
  const bg = color || DEFAULT_STICKER_COLOR;
  return (
    <span
      className={
        "inline-flex items-center justify-center text-center font-bold uppercase tracking-wide rounded-full shadow-playful select-none " +
        (className || "")
      }
      style={{
        backgroundColor: bg,
        color: getStickerTextColor(bg),
      }}
    >
      {text}
    </span>
  );
};

export default ProductSticker;
