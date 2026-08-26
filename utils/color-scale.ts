import { ColorInfo, PALETTE_SHADE_INDICES, formatOklch } from "./color-utils";
import {
  mapOklchToGamut,
  type ColorGamut,
  type OklchTriplet,
} from "./oklch-culori";

export const SCALE_STOP_COUNT = PALETTE_SHADE_INDICES.length;

/**
 * Shape of a whole scale, independent of the color it is anchored to.
 * Every field is a curve control rather than a per-stop value, so a scale
 * stays coherent when the anchor colour or the anchored stop changes.
 */
export interface ScaleParams {
  /** Lightness at the lightest stop (50). */
  lightnessMax: number;
  /** Lightness at the darkest stop (950). */
  lightnessMin: number;
  /** -1 darkens early, 0 neutral, +1 stays light for longer. */
  lightnessBias: number;
  /** 0 linear, 1 fully eased — compresses both ends of the ramp. */
  lightnessEase: number;
  /** Multiplies the whole chroma envelope. 1 keeps the anchor's own chroma. */
  saturation: number;
  /** Where chroma peaks, 0 at stop 50 through 1 at stop 950. */
  chromaPeak: number;
  /** How far chroma falls from the peak toward the light end (0–1). */
  chromaLightFalloff: number;
  /** How far chroma falls from the peak toward the dark end (0–1). */
  chromaDarkFalloff: number;
  /** Degrees of hue rotation applied at the light end. */
  hueShiftLight: number;
  /** Degrees of hue rotation applied at the dark end. */
  hueShiftDark: number;
  gamut: ColorGamut;
}

/** A color pinned to a specific stop; the rest of the ramp bends around it. */
export interface ScaleAnchor {
  /** Array index into `PALETTE_SHADE_INDICES`, not the shade number. */
  stopIndex: number;
  color: OklchTriplet;
}

export interface ScaleStop extends ColorInfo {
  l: number;
  c: number;
  h: number;
  isAnchor: boolean;
  /** True when the stop had to be pulled back to fit the target gamut. */
  wasGamutMapped: boolean;
  /** True when the hex is a clipped stand-in for a wide-gamut color. */
  hexIsApproximate: boolean;
}

/**
 * Falloff exponents fitted against Tailwind v4's own ramps (blue, red,
 * emerald). Exposed as constants rather than params so the two falloff
 * sliders stay the only chroma-shape controls a user has to reason about.
 */
const CHROMA_LIGHT_EXPONENT = 1;
const CHROMA_DARK_EXPONENT = 1.7;

/** Keeps an anchored ramp strictly monotone when anchors sit near an end. */
const MIN_LIGHTNESS_STEP = 0.006;

/**
 * How much the envelope may scale up to meet an anchor's chroma. Anchoring a
 * saturated color to a stop where the envelope is low would otherwise demand
 * chroma far outside any gamut at every other stop, and the whole ramp would
 * flatten onto the gamut boundary with no visible chroma progression.
 */
const MAX_ANCHOR_CHROMA_BOOST = 1.8;

export const DEFAULT_SCALE_PARAMS: ScaleParams = {
  lightnessMax: 0.985,
  lightnessMin: 0.29,
  lightnessBias: 0.1,
  lightnessEase: 0.2,
  saturation: 1,
  chromaPeak: 0.6,
  chromaLightFalloff: 0.8,
  chromaDarkFalloff: 0.58,
  hueShiftLight: -4,
  hueShiftDark: 6,
  gamut: "srgb",
};

export type ScalePresetId = "tailwind" | "soft" | "vivid" | "neutral" | "flat";

export interface ScalePreset {
  id: ScalePresetId;
  label: string;
  description: string;
  params: ScaleParams;
}

export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: "tailwind",
    label: "Tailwind",
    description: "Fitted to Tailwind v4's own ramps.",
    params: { ...DEFAULT_SCALE_PARAMS },
  },
  {
    id: "soft",
    label: "Soft",
    description: "Airier lights, gentler darks, less chroma overall.",
    params: {
      ...DEFAULT_SCALE_PARAMS,
      lightnessMax: 0.99,
      lightnessMin: 0.36,
      lightnessBias: 0.3,
      lightnessEase: 0.5,
      saturation: 0.78,
      chromaPeak: 0.55,
      chromaLightFalloff: 0.88,
      chromaDarkFalloff: 0.7,
    },
  },
  {
    id: "vivid",
    label: "Vivid",
    description: "Chroma held high and late, deeper dark end.",
    params: {
      ...DEFAULT_SCALE_PARAMS,
      lightnessMin: 0.25,
      lightnessBias: 0,
      lightnessEase: 0.1,
      saturation: 1.2,
      chromaPeak: 0.65,
      chromaLightFalloff: 0.68,
      chromaDarkFalloff: 0.38,
      hueShiftLight: -6,
      hueShiftDark: 9,
    },
  },
  {
    id: "neutral",
    label: "Neutral",
    description: "A near-grey ramp with a hint of the base hue.",
    params: {
      ...DEFAULT_SCALE_PARAMS,
      lightnessMin: 0.22,
      saturation: 0.15,
      chromaPeak: 0.5,
      chromaLightFalloff: 0.55,
      chromaDarkFalloff: 0.3,
      hueShiftLight: 0,
      hueShiftDark: 0,
    },
  },
  {
    id: "flat",
    label: "Flat",
    description: "One hue, one chroma, evenly spaced lightness.",
    params: {
      ...DEFAULT_SCALE_PARAMS,
      lightnessEase: 0,
      chromaLightFalloff: 0,
      chromaDarkFalloff: 0,
      hueShiftLight: 0,
      hueShiftDark: 0,
    },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** Shortest signed arc from `from` to `to`, in (-180, 180]. */
function hueDelta(from: number, to: number): number {
  const diff = normalizeHue(to) - normalizeHue(from);
  if (diff > 180) return diff - 360;
  if (diff <= -180) return diff + 360;
  return diff;
}

/** Normalized position of each stop, 0 at shade 50 through 1 at shade 950. */
export function stopPositions(count: number = SCALE_STOP_COUNT): number[] {
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, i) => i / (count - 1));
}

/**
 * Reshapes linear progress into the ramp's lightness progression: an
 * S-curve blend (`lightnessEase`) that compresses both ends, then a gamma
 * (`lightnessBias`) that decides how long the scale stays light.
 */
function shapeProgress(t: number, params: ScaleParams): number {
  const smooth = t * t * (3 - 2 * t);
  const eased = lerp(t, smooth, clamp(params.lightnessEase, 0, 1));
  const gamma = Math.pow(2, clamp(params.lightnessBias, -1, 1));
  return Math.pow(clamp(eased, 0, 1), gamma);
}

/** The unanchored lightness ramp, lightest first. */
export function lightnessRamp(
  params: ScaleParams,
  count: number = SCALE_STOP_COUNT,
): number[] {
  const max = clamp(params.lightnessMax, 0, 1);
  const min = clamp(params.lightnessMin, 0, 1);
  return stopPositions(count).map((t) => lerp(max, min, shapeProgress(t, params)));
}

/**
 * Chroma envelope normalized to 1 at the peak, falling away asymmetrically
 * so pastels stay muted at the light end and darks avoid going muddy.
 */
export function chromaEnvelope(t: number, params: ScaleParams): number {
  const peak = clamp(params.chromaPeak, 0, 1);
  // Each side is normalized over its own span, so a peak sitting on an end
  // leaves only one side and that end keeps the full peak chroma.
  if (t < peak) {
    const u = (peak - t) / peak;
    const falloff = clamp(params.chromaLightFalloff, 0, 1);
    return Math.max(0, 1 - falloff * Math.pow(u, CHROMA_LIGHT_EXPONENT));
  }
  const u = peak >= 1 ? 0 : (t - peak) / (1 - peak);
  const falloff = clamp(params.chromaDarkFalloff, 0, 1);
  return Math.max(0, 1 - falloff * Math.pow(u, CHROMA_DARK_EXPONENT));
}

/**
 * The stop whose unanchored lightness sits closest to the color — used as
 * the default anchor so a base color lands where it naturally belongs.
 */
export function suggestBaseStop(
  color: OklchTriplet,
  params: ScaleParams,
  count: number = SCALE_STOP_COUNT,
): number {
  const ramp = lightnessRamp(params, count);
  let best = 0;
  let bestDistance = Infinity;
  ramp.forEach((l, i) => {
    const distance = Math.abs(l - color.l);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

interface ControlPoint {
  index: number;
  raw: number;
  target: number;
}

/**
 * Sorts anchors by stop and forces their lightness to descend. A user can pin
 * a light color below a dark one; rather than refusing, we nudge the later
 * anchors down so the ramp stays monotone.
 */
function orderedAnchors(anchors: ScaleAnchor[], count: number): ScaleAnchor[] {
  const usable = anchors
    .filter((a) => a.stopIndex >= 0 && a.stopIndex < count)
    .sort((a, b) => a.stopIndex - b.stopIndex)
    .filter(
      (anchor, i, all) => i === 0 || all[i - 1].stopIndex !== anchor.stopIndex,
    );

  let ceiling = Infinity;
  return usable.map((anchor, i) => {
    const gap = i === 0 ? 0 : MIN_LIGHTNESS_STEP;
    const l = Math.min(anchor.color.l, ceiling - gap);
    ceiling = l;
    return { ...anchor, color: { ...anchor.color, l: clamp(l, 0, 1) } };
  });
}

/**
 * Remaps the ramp so every anchor's lightness lands exactly on its stop,
 * interpolating monotonically between anchors and the (possibly widened)
 * endpoints.
 */
function anchoredLightness(
  raw: number[],
  anchors: ScaleAnchor[],
): number[] {
  if (anchors.length === 0) return [...raw];
  const last = raw.length - 1;
  const first = anchors[0];
  const final = anchors[anchors.length - 1];

  // Widen the endpoints when an anchor is lighter/darker than the ramp's own
  // ends, so pinning a dark color to a light stop still descends throughout.
  const lightTarget = clamp(
    Math.max(raw[0], first.color.l + MIN_LIGHTNESS_STEP * first.stopIndex),
    0,
    1,
  );
  const darkTarget = clamp(
    Math.min(raw[last], final.color.l - MIN_LIGHTNESS_STEP * (last - final.stopIndex)),
    0,
    1,
  );

  const points: ControlPoint[] = anchors.map((anchor) => ({
    index: anchor.stopIndex,
    raw: raw[anchor.stopIndex],
    target: anchor.color.l,
  }));
  // Endpoints only join in when no anchor already occupies them, so pinning a
  // color to stop 50 or 950 wins over the ramp's own end.
  if (first.stopIndex > 0) {
    points.unshift({ index: 0, raw: raw[0], target: lightTarget });
  }
  if (final.stopIndex < last) {
    points.push({ index: last, raw: raw[last], target: darkTarget });
  }

  return raw.map((value, i) => {
    let lower = points[0];
    let upper = points[points.length - 1];
    for (let p = 0; p < points.length - 1; p++) {
      if (i >= points[p].index && i <= points[p + 1].index) {
        lower = points[p];
        upper = points[p + 1];
        break;
      }
    }
    if (i === lower.index) return lower.target;
    if (i === upper.index) return upper.target;
    const span = lower.raw - upper.raw;
    const ratio = span === 0 ? (i - lower.index) / Math.max(1, upper.index - lower.index) : (lower.raw - value) / span;
    return clamp(lerp(lower.target, upper.target, clamp(ratio, 0, 1)), 0, 1);
  });
}

/**
 * Slides the chroma peak toward an anchor until reaching that anchor's chroma
 * needs no more than `MAX_ANCHOR_CHROMA_BOOST`. Pinning a vivid color to stop
 * 50 therefore peaks the chroma near stop 50 and falls away from it, instead
 * of asking the mid-tones for chroma nothing can display.
 */
function effectiveChromaPeak(
  positions: number[],
  anchors: ScaleAnchor[],
  params: ScaleParams,
): number {
  const floor = 1 / MAX_ANCHOR_CHROMA_BOOST;
  let peak = params.chromaPeak;

  anchors.forEach((anchor) => {
    const t = positions[anchor.stopIndex];
    if (chromaEnvelope(t, { ...params, chromaPeak: peak }) >= floor) return;
    // The envelope at the anchor falls monotonically as the peak moves away
    // from it, so bisect for the furthest peak that still clears the floor.
    let near = t;
    let far = peak;
    for (let i = 0; i < 16; i++) {
      const mid = (near + far) / 2;
      if (chromaEnvelope(t, { ...params, chromaPeak: mid }) >= floor) near = mid;
      else far = mid;
    }
    peak = near;
  });

  return peak;
}

/** Per-anchor chroma scale, interpolated across the ramp and held outside. */
function anchoredChroma(
  positions: number[],
  anchors: ScaleAnchor[],
  inputParams: ScaleParams,
): number[] {
  const params = {
    ...inputParams,
    chromaPeak: effectiveChromaPeak(positions, anchors, inputParams),
  };

  const scales = anchors.map((anchor) => {
    const envelope = chromaEnvelope(positions[anchor.stopIndex], params);
    return envelope < 0.001 ? anchor.color.c : anchor.color.c / envelope;
  });

  return positions.map((t, i) => {
    let scale = scales[0] ?? 0;
    if (anchors.length > 1) {
      const firstIndex = anchors[0].stopIndex;
      const lastIndex = anchors[anchors.length - 1].stopIndex;
      if (i <= firstIndex) {
        scale = scales[0];
      } else if (i >= lastIndex) {
        scale = scales[scales.length - 1];
      } else {
        for (let a = 0; a < anchors.length - 1; a++) {
          const from = anchors[a].stopIndex;
          const to = anchors[a + 1].stopIndex;
          if (i >= from && i <= to) {
            const ratio = (i - from) / (to - from);
            scale = lerp(scales[a], scales[a + 1], ratio);
            break;
          }
        }
      }
    }
    return Math.max(0, scale * Math.max(0, params.saturation) * chromaEnvelope(t, params));
  });
}

/**
 * Hue interpolates along the shortest arc between anchors, then drifts by the
 * shift amounts outside them. The drift is pinned to zero at every anchor so
 * an anchored color's hue is always reproduced exactly.
 */
function anchoredHue(
  positions: number[],
  anchors: ScaleAnchor[],
  params: ScaleParams,
): number[] {
  const firstIndex = anchors[0].stopIndex;
  const lastIndex = anchors[anchors.length - 1].stopIndex;
  const firstT = positions[firstIndex];
  const lastT = positions[lastIndex];

  return positions.map((t, i) => {
    let base = anchors[0].color.h;
    if (i >= lastIndex) {
      base = anchors[anchors.length - 1].color.h;
    } else if (i > firstIndex) {
      for (let a = 0; a < anchors.length - 1; a++) {
        const from = anchors[a].stopIndex;
        const to = anchors[a + 1].stopIndex;
        if (i >= from && i <= to) {
          const ratio = (i - from) / (to - from);
          const start = anchors[a].color.h;
          base =
            start + hueDelta(start, anchors[a + 1].color.h) * ratio;
          break;
        }
      }
    }

    let drift = 0;
    if (t < firstT && firstT > 0) {
      drift = params.hueShiftLight * ((firstT - t) / firstT);
    } else if (t > lastT && lastT < 1) {
      drift = params.hueShiftDark * ((t - lastT) / (1 - lastT));
    }

    return normalizeHue(base + drift);
  });
}

/**
 * Build a full scale from one or more anchored colors plus curve params.
 * A single anchor is the common case; a second anchor blends two colors while
 * still spanning the whole 50–950 range.
 */
export function generateScale(
  anchors: ScaleAnchor[],
  params: ScaleParams,
  stops: readonly number[] = PALETTE_SHADE_INDICES,
): ScaleStop[] {
  const count = stops.length;
  const positions = stopPositions(count);
  const raw = lightnessRamp(params, count);
  const ordered = orderedAnchors(anchors, count);

  if (ordered.length === 0) {
    return raw.map((l, i) => buildStop(stops[i], { l, c: 0, h: 0 }, false, params));
  }

  const lightness = anchoredLightness(raw, ordered);
  const chroma = anchoredChroma(positions, ordered, params);
  const hue = anchoredHue(positions, ordered, params);
  const anchorStops = new Set(ordered.map((anchor) => anchor.stopIndex));

  return stops.map((shade, i) =>
    buildStop(
      shade,
      { l: lightness[i], c: chroma[i], h: hue[i] },
      anchorStops.has(i),
      params,
    ),
  );
}

function buildStop(
  shade: number,
  triplet: OklchTriplet,
  isAnchor: boolean,
  params: ScaleParams,
): ScaleStop {
  const requested = {
    l: clamp(triplet.l, 0, 1),
    c: Math.max(0, triplet.c),
    h: normalizeHue(triplet.h),
  };
  const { color, hex, clipped } = mapOklchToGamut(requested, params.gamut);
  return {
    index: shade,
    hex,
    oklch: formatOklch(color),
    l: color.l,
    c: color.c,
    h: color.h,
    isAnchor,
    wasGamutMapped: requested.c - color.c > 0.0005,
    hexIsApproximate: clipped,
  };
}
