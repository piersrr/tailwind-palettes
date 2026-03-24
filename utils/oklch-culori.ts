import { converter, formatHex, parse } from "culori";

const toOklch = converter("oklch");

export type OklchTriplet = { l: number; c: number; h: number };

function parsedColorToOklchTriplet(color: NonNullable<ReturnType<typeof parse>>): OklchTriplet {
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

/** CSS color string culori understands → OKLCH, or null if not parseable. */
export function tryCssToOklch(input: string): OklchTriplet | null {
  const color = parse(input.trim());
  if (!color) return null;
  return parsedColorToOklchTriplet(color);
}

/** Accurate sRGB (hex, named, etc.) → OKLCH via culori. */
export function srgbToOklch(input: string): OklchTriplet {
  return tryCssToOklch(input) ?? { l: 0.5, c: 0, h: 0 };
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
