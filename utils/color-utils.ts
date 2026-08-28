import { srgbToOklch } from "./oklch-culori";

/** Tailwind v3+ stops from lightest to darkest (11 shades, including 950). */
export const PALETTE_SHADE_INDICES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

/** Classic 10-shade ramp (50–900) used by Mantine, Chakra, and Tailwind v2. */
export const PALETTE_SHADE_INDICES_10 = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
] as const;

export type PaletteStopCount = 10 | 11;

export function shadeIndicesForCount(
  count: PaletteStopCount,
): readonly number[] {
  return count === 10 ? PALETTE_SHADE_INDICES_10 : PALETTE_SHADE_INDICES;
}

/** Array index for a shade number, or -1 when it is not one of our stops. */
export function shadeToStopIndex(
  shade: number,
  stops: readonly number[] = PALETTE_SHADE_INDICES,
): number {
  return (stops as readonly number[]).indexOf(shade);
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * WCAG 2.x relative luminance for sRGB hex (linearized, 0–1).
 */
export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = linear(rgb.r);
  const g = linear(rgb.g);
  const b = linear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two sRGB hex colors (1–21).
 */
export function contrastRatio(fgHex: string, bgHex: string): number | null {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  if (L1 === null || L2 === null) return null;
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Black or white — whichever yields higher contrast on the background. */
export function preferredContrastingTextColor(backgroundHex: string): "#ffffff" | "#000000" {
  const onWhite = contrastRatio("#ffffff", backgroundHex) ?? 0;
  const onBlack = contrastRatio("#000000", backgroundHex) ?? 0;
  return onWhite >= onBlack ? "#ffffff" : "#000000";
}

/** WCAG 2.1 level for normal-sized text (AA 4.5:1, AAA 7:1). */
export type WcagNormalTextLevel = "AAA" | "AA" | "fail";

export function wcagNormalTextLevel(ratio: number): WcagNormalTextLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

/**
 * Format OKLCH values as a CSS string
 */
export function formatOklch(oklch: { l: number, c: number, h: number }): string {
  return `oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(3)})`;
}

/** OKLCH string for CSS / arbitrary Tailwind values (spaces → underscores in arbitrary). */
export function colorToOklchCss(color: string): string {
  const o = stringToOklch(color);
  return formatOklch(o);
}

export function oklchToTailwindArbitrary(oklchCss: string): string {
  return oklchCss.replace(/\s+/g, "_");
}

/**
 * Parse OKLCH string into components
 */
export function parseOklch(oklchStr: string): { l: number, c: number, h: number } | null {
  const matches = oklchStr.match(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/i);
  if (!matches) return null;
  
  return {
    l: parseFloat(matches[1]),
    c: parseFloat(matches[2]),
    h: parseFloat(matches[3])
  };
}

/**
 * Convert a string color to our internal OKLCH representation
 */
export function stringToOklch(color: string): { l: number, c: number, h: number } {
  const parsed = parseOklch(color);
  if (parsed) return parsed;
  return srgbToOklch(color);
}

export type ThemeOutputFormat = "hex" | "oklch";

/**
 * Generate a Tailwind v4 theme configuration string using @theme
 */
export function generateTailwindTheme(
  colorName: string,
  palette: ColorInfo[],
  outputFormat: ThemeOutputFormat = "hex",
): string {
  let themeCode = `@theme {\n`;

  palette.forEach((color) => {
    const value = outputFormat === "oklch" ? color.oklch : color.hex;
    themeCode += `  --color-${colorName}-${color.index}: ${value};\n`;
  });

  themeCode += `}`;
  return themeCode;
}

/**
 * Generate CSS variables for a theme
 */
export function generateCssVariables(
  colorName: string,
  palette: ColorInfo[],
  outputFormat: ThemeOutputFormat = "hex",
): string {
  let cssVars = "";

  palette.forEach((color) => {
    const value = outputFormat === "oklch" ? color.oklch : color.hex;
    cssVars += `  --${colorName}-${color.index}: ${value};\n`;
  });

  return cssVars;
}

/**
 * Generate a plain JS/TS token object for Mantine and other token maps
 */
export function generateTokenObject(
  colorName: string,
  palette: ColorInfo[],
  outputFormat: ThemeOutputFormat = "hex",
): string {
  const name = colorName || "brand";
  const nameKey = /^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`;
  const lines = palette.map((color) => {
    const value = outputFormat === "oklch" ? color.oklch : color.hex;
    return `    ${color.index}: '${value}',`;
  });

  return `{\n  ${nameKey}: {\n${lines.join("\n")}\n  },\n}`;
}

export interface ColorInfo {
  index: number;
  hex: string;
  oklch: string;
}