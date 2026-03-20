import { converter, formatHex, parse } from "culori";

const toOklch = converter("oklch");

export type OklchTriplet = { l: number; c: number; h: number };

/** Accurate sRGB (hex, named, etc.) → OKLCH via culori. */
export function srgbToOklch(input: string): OklchTriplet {
  const color = parse(input);
  if (!color) return { l: 0.5, c: 0, h: 0 };
  const o = toOklch(color);
  const l = o.l ?? 0;
  const c = o.c ?? 0;
  const chroma = Math.min(0.4, Math.max(0, c));
  const rawH = o.h;
  const h =
    chroma === 0 || rawH === undefined || Number.isNaN(rawH)
      ? 0
      : ((rawH % 360) + 360) % 360;
  return {
    l: Math.min(1, Math.max(0, l)),
    c: chroma,
    h,
  };
}

/** OKLCH → closest sRGB hex for `<input type="color">`. */
export function oklchToSrgbHex(l: number, c: number, h: number): string {
  const hex = formatHex({ mode: "oklch", l, c, h });
  return hex ?? "#808080";
}

/** Any CSS color string culori understands → sRGB hex (for palette base / hex mode). */
export function cssColorToHex(input: string): string {
  const color = parse(input);
  if (!color) return "#808080";
  return formatHex(color) ?? "#808080";
}
