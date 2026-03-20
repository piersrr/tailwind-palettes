import { cssColorToHex, oklchToSrgbHex, srgbToOklch } from "./oklch-culori";

/** Tailwind-style stops from lightest to darkest */
export const PALETTE_SHADE_INDICES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const DEFAULT_PALETTE_COUNT = PALETTE_SHADE_INDICES.length;

/** Palette array index where shade 500 lives (for two-color preview anchor) */
export const PALETTE_INDEX_500 = PALETTE_SHADE_INDICES.indexOf(500);

/**
 * Softer chroma on the light end so 50 is a whisper and 100 is muted (not full chroma on pastels).
 */
export function chromaMultiplierForPaletteStep(stepIndex: number): number {
  const table = [0.11, 0.35, 0.56, 0.78, 0.92, 1, 1, 1, 1, 1] as const;
  return table[stepIndex] ?? 1;
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
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Mock OKLCH conversion - we'll use HSL internally since we don't have access to the OKLCH plugin
 * Note: This is not a real OKLCH conversion, but a simple approximation for our app
 */
export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const hsl = rgbToHsl(r, g, b);
  
  // Approximate mapping from HSL to OKLCH
  // In reality, OKLCH is more complex, but this gives us workable values
  return {
    l: hsl.l, // Map lightness directly
    c: hsl.s * 0.4, // Scale saturation to chroma range (0-0.4)
    h: hsl.h // Keep same hue
  };
}

/**
 * Convert OKLCH to RGB (simplified approximation)
 */
export function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // Convert to HSL as an approximation
  const hsl = {
    h,
    s: c / 0.4, // Scale back from chroma to saturation
    l
  };
  
  return hslToRgb(hsl.h, hsl.s, hsl.l);
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

/**
 * Convert our OKLCH representation to hex
 */
export function oklchToHex(l: number, c: number, h: number): string {
  return oklchToSrgbHex(l, c, h);
}

/**
 * Map a color's lightness to a palette slot index (0 = shade 50, last = 900).
 */
export function determinePalettePosition(
  color: string,
  paletteLength: number = DEFAULT_PALETTE_COUNT,
): number {
  const oklch = stringToOklch(color);
  const lightness = oklch.l;
  const last = paletteLength - 1;
  const scale = last / 8;

  if (lightness >= 0.95) return 0;
  if (lightness <= 0.15) return last;

  if (lightness < 0.3) {
    return Math.min(last, Math.max(0, Math.round(last - (lightness - 0.15) / 0.15 * 2 * scale)));
  }
  if (lightness < 0.5) {
    return Math.min(last, Math.max(0, Math.round(last - 2 * scale - (lightness - 0.3) / 0.2 * 2 * scale)));
  }
  if (lightness < 0.7) {
    return Math.min(last, Math.max(0, Math.round(last - 4 * scale - (lightness - 0.5) / 0.2 * 2 * scale)));
  }
  return Math.min(last, Math.max(0, Math.round(last - 6 * scale - (lightness - 0.7) / 0.25 * 2 * scale)));
}

/**
 * Generate a color palette from a base color (default: 50–900 with softer light tints).
 */
export function generatePalette(
  baseColor: string,
  count: number = DEFAULT_PALETTE_COUNT,
): ColorInfo[] {
  const color = stringToOklch(baseColor);
  const palette: ColorInfo[] = [];

  const basePosition = determinePalettePosition(baseColor, count);

  const minLightness = 0.15;
  const maxLightness = 0.985;
  const lightnessRange = maxLightness - minLightness;

  for (let i = 0; i < count; i++) {
    const lightness = maxLightness - (i * (lightnessRange / (count - 1)));
    const isBase = i === basePosition;
    const chromaMul =
      count === DEFAULT_PALETTE_COUNT ? chromaMultiplierForPaletteStep(i) : 1;
    const cOut = isBase ? color.c : color.c * chromaMul;

    const hex = isBase ? cssColorToHex(baseColor) : oklchToHex(lightness, cOut, color.h);

    const oklchValue = isBase
      ? formatOklch(color)
      : formatOklch({ l: lightness, c: cOut, h: color.h });

    const shadeIndex =
      count === DEFAULT_PALETTE_COUNT && i < PALETTE_SHADE_INDICES.length
        ? PALETTE_SHADE_INDICES[i]
        : (i + 1) * 100;

    palette.push({
      index: shadeIndex,
      hex,
      oklch: oklchValue,
    });
  }

  return palette;
}

/**
 * Generate a color palette from two base colors by interpolation (same stops as single-base).
 */
export function generatePaletteFromTwoColors(
  color1: string,
  color2: string,
  count: number = DEFAULT_PALETTE_COUNT,
): ColorInfo[] {
  const c1 = stringToOklch(color1);
  const c2 = stringToOklch(color2);
  const palette: ColorInfo[] = [];

  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);

    const l = c1.l + (c2.l - c1.l) * ratio;
    let c = c1.c + (c2.c - c1.c) * ratio;
    if (count === DEFAULT_PALETTE_COUNT) {
      c *= chromaMultiplierForPaletteStep(i);
    }

    let h1 = c1.h;
    let h2 = c2.h;

    if (Math.abs(h2 - h1) > 180) {
      if (h1 < h2) h1 += 360;
      else h2 += 360;
    }

    const h = (h1 + (h2 - h1) * ratio) % 360;

    const hex = oklchToHex(l, c, h);
    const shadeIndex =
      count === DEFAULT_PALETTE_COUNT && i < PALETTE_SHADE_INDICES.length
        ? PALETTE_SHADE_INDICES[i]
        : (i + 1) * 100;

    palette.push({
      index: shadeIndex,
      hex,
      oklch: formatOklch({ l, c, h }),
    });
  }

  return palette;
}

/**
 * Adjust a color's properties
 */
export function adjustColor(color: string, adjustment: ColorAdjustment): ColorInfo {
  const oklch = stringToOklch(color);
  
  const l = adjustment.lightness !== undefined ? adjustment.lightness : oklch.l;
  const c = adjustment.chroma !== undefined ? adjustment.chroma : oklch.c;
  const h = adjustment.hue !== undefined ? adjustment.hue : oklch.h;
  
  const hex = oklchToHex(l, c, h);
  
  return {
    index: adjustment.index || 500,
    hex: hex,
    oklch: formatOklch({ l, c, h })
  };
}

/**
 * Generate a Tailwind v4 theme configuration string using @theme
 */
export function generateTailwindTheme(colorName: string, palette: ColorInfo[]): string {
  let themeCode = `@theme {\n`;
  
  palette.forEach(color => {
    themeCode += `  --color-${colorName}-${color.index}: ${color.hex};\n`;
  });
  
  themeCode += `}`;
  return themeCode;
}

/**
 * Generate CSS variables for a theme
 */
export function generateCssVariables(colorName: string, palette: ColorInfo[]): string {
  let cssVars = '';
  
  palette.forEach(color => {
    cssVars += `  --${colorName}-${color.index}: ${color.hex};\n`;
  });
  
  return cssVars;
}

export interface ColorInfo {
  index: number;
  hex: string;
  oklch: string;
}

export interface ColorAdjustment {
  index?: number;
  lightness?: number;
  chroma?: number;
  hue?: number;
}