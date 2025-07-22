import { colord } from "colord";

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
  // Check if it's already an OKLCH string
  const parsed = parseOklch(color);
  if (parsed) return parsed;
  
  // Otherwise, use colord to parse the color to hex, then convert to our OKLCH
  const hex = colord(color).toHex();
  const rgb = hexToRgb(hex);
  
  if (!rgb) {
    return { l: 0.5, c: 0.1, h: 0 }; // Default fallback
  }
  
  return rgbToOklch(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert our OKLCH representation to hex
 */
export function oklchToHex(l: number, c: number, h: number): string {
  const rgb = oklchToRgb(l, c, h);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Determine the appropriate palette position for a color based on its lightness
 * Returns 0-8 index (corresponding to stops 50-900)
 */
export function determinePalettePosition(color: string): number {
  const oklch = stringToOklch(color);
  const lightness = oklch.l;
  
  // Map lightness to appropriate palette position
  // Very light colors (near white) should be at position 0 (50)
  // Very dark colors (near black) should be at position 8 (900)
  // Mid-range colors should be around position 4-5 (500-600)
  
  if (lightness >= 0.95) return 0; // White-like colors → position 0 (50)
  if (lightness <= 0.15) return 8; // Black-like colors → position 8 (900)
  
  // For colors in between, create a mapping that's weighted toward the middle
  // This places mid-tones around the 400-600 range
  
  // Map 0.15-0.95 to 0-8, with 0.5-0.6 centered around positions 4-5
  if (lightness < 0.3) return Math.round(8 - (lightness - 0.15) / 0.15 * 2); // Very dark → 6-8
  if (lightness < 0.5) return Math.round(6 - (lightness - 0.3) / 0.2 * 2); // Dark → 4-6
  if (lightness < 0.7) return Math.round(4 - (lightness - 0.5) / 0.2 * 2); // Medium → 2-4
  return Math.round(2 - (lightness - 0.7) / 0.25 * 2); // Light → 0-2
}

/**
 * Generate a color palette from a base color
 */
export function generatePalette(baseColor: string, count: number = 9): ColorInfo[] {
  const color = stringToOklch(baseColor);
  const palette: ColorInfo[] = [];
  
  // Determine where in the palette the base color should be placed
  const basePosition = determinePalettePosition(baseColor);
  
  // Generate a range of lightness values
  const minLightness = 0.15; // Very dark
  const maxLightness = 0.98; // Very light
  const lightnessRange = maxLightness - minLightness;
  
  for (let i = 0; i < count; i++) {
    // Calculate lightness for this step
    const lightness = maxLightness - (i * (lightnessRange / (count - 1)));
    
    // If this is the base position, use the original color's values
    // otherwise, create a new color with adjusted lightness
    const hex = i === basePosition 
      ? colord(baseColor).toHex() 
      : oklchToHex(lightness, color.c, color.h);
    
    // For the base position color, get its actual OKLCH values
    const oklchValue = i === basePosition
      ? formatOklch(color)
      : formatOklch({ l: lightness, c: color.c, h: color.h });
    
    palette.push({
      index: (i + 1) * 100,
      hex: hex,
      oklch: oklchValue
    });
  }

  return palette;
}

/**
 * Generate a color palette from two base colors by interpolation
 * This version doesn't currently use base position, but could be enhanced
 */
export function generatePaletteFromTwoColors(color1: string, color2: string, count: number = 9): ColorInfo[] {
  const c1 = stringToOklch(color1);
  const c2 = stringToOklch(color2);
  const palette: ColorInfo[] = [];

  for (let i = 0; i < count; i++) {
    // Calculate the mix ratio
    const ratio = i / (count - 1);
    
    // Interpolate between the two colors
    const l = c1.l + (c2.l - c1.l) * ratio;
    const c = c1.c + (c2.c - c1.c) * ratio;
    
    // For hue, we need to handle the circular nature
    let h1 = c1.h;
    let h2 = c2.h;
    
    // Ensure we take the shortest path around the hue circle
    if (Math.abs(h2 - h1) > 180) {
      if (h1 < h2) h1 += 360;
      else h2 += 360;
    }
    
    const h = (h1 + (h2 - h1) * ratio) % 360;
    
    // Create the interpolated color
    const hex = oklchToHex(l, c, h);
    
    palette.push({
      index: (i + 1) * 100,
      hex: hex,
      oklch: formatOklch({ l, c, h })
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