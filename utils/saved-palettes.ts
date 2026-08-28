import { useCallback, useEffect, useState } from "react";
import type { ColorInfo, PaletteStopCount } from "./color-utils";
import { DEFAULT_SCALE_PARAMS, type ScaleParams } from "./color-scale";
import type { ColorGamut } from "./oklch-culori";

const STORAGE_KEY = "tailwind-palettes.saved";
const STORE_VERSION = 1 as const;

export interface PaletteSnapshot {
  colorName: string;
  baseColor1: string;
  baseColor2: string;
  useTwoColors: boolean;
  params: ScaleParams;
  pinnedStop1: number | null;
  pinnedStop2: number | null;
  overrides: ColorInfo[];
  inputColorSpace: "hex" | "oklch";
  /** 11 = Tailwind 50–950, 10 = 50–900. Missing on older saves → 11. */
  stopCount: PaletteStopCount;
}

export interface SavedPalette {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  previewHex: string[];
  snapshot: PaletteSnapshot;
}

export interface SavedPalettesStore {
  version: typeof STORE_VERSION;
  palettes: SavedPalette[];
  activeId: string | null;
}

export const DEFAULT_SNAPSHOT: PaletteSnapshot = {
  colorName: "brand",
  baseColor1: "#3b82f6",
  baseColor2: "#8b5cf6",
  useTwoColors: false,
  params: { ...DEFAULT_SCALE_PARAMS },
  pinnedStop1: null,
  pinnedStop2: null,
  overrides: [],
  inputColorSpace: "oklch",
  stopCount: 11,
};

export const EMPTY_STORE: SavedPalettesStore = {
  version: STORE_VERSION,
  palettes: [],
  activeId: null,
};

export function storedOverrides(overrides: Iterable<ColorInfo>): ColorInfo[] {
  return Array.from(overrides)
    .map(({ index, hex, oklch }) => ({ index, hex, oklch }))
    .sort((a, b) => a.index - b.index);
}

export function overridesToMap(overrides: ColorInfo[]): Map<number, ColorInfo> {
  return new Map(storedOverrides(overrides).map((stop) => [stop.index, stop]));
}

export function snapshotsEqual(a: PaletteSnapshot, b: PaletteSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNullableInt(value: unknown): number | null {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePinnedStop(value: unknown, lastStop: number): number | null {
  const parsed = parseNullableInt(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(parsed, lastStop));
}

function parseParams(raw: unknown): ScaleParams {
  if (!isRecord(raw)) return { ...DEFAULT_SCALE_PARAMS };
  const gamut: ColorGamut = raw.gamut === "p3" ? "p3" : "srgb";
  const num = (key: keyof ScaleParams, fallback: number) => {
    const value = raw[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };
  return {
    lightnessMax: num("lightnessMax", DEFAULT_SCALE_PARAMS.lightnessMax),
    lightnessMin: num("lightnessMin", DEFAULT_SCALE_PARAMS.lightnessMin),
    lightnessBias: num("lightnessBias", DEFAULT_SCALE_PARAMS.lightnessBias),
    lightnessEase: num("lightnessEase", DEFAULT_SCALE_PARAMS.lightnessEase),
    saturation: num("saturation", DEFAULT_SCALE_PARAMS.saturation),
    chromaPeak: num("chromaPeak", DEFAULT_SCALE_PARAMS.chromaPeak),
    chromaLightFalloff: num(
      "chromaLightFalloff",
      DEFAULT_SCALE_PARAMS.chromaLightFalloff,
    ),
    chromaDarkFalloff: num(
      "chromaDarkFalloff",
      DEFAULT_SCALE_PARAMS.chromaDarkFalloff,
    ),
    hueShiftLight: num("hueShiftLight", DEFAULT_SCALE_PARAMS.hueShiftLight),
    hueShiftDark: num("hueShiftDark", DEFAULT_SCALE_PARAMS.hueShiftDark),
    gamut,
  };
}

function parseOverride(raw: unknown): ColorInfo | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.index !== "number" || !Number.isFinite(raw.index)) return null;
  if (typeof raw.hex !== "string" || typeof raw.oklch !== "string") return null;
  return { index: raw.index, hex: raw.hex, oklch: raw.oklch };
}

function parseSnapshot(raw: unknown): PaletteSnapshot | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.colorName !== "string") return null;
  if (typeof raw.baseColor1 !== "string") return null;
  if (typeof raw.baseColor2 !== "string") return null;
  if (typeof raw.useTwoColors !== "boolean") return null;
  if (raw.inputColorSpace !== "hex" && raw.inputColorSpace !== "oklch") {
    return null;
  }
  if (!Array.isArray(raw.overrides)) return null;
  const overrides: ColorInfo[] = [];
  for (const item of raw.overrides) {
    const parsed = parseOverride(item);
    if (!parsed) return null;
    overrides.push(parsed);
  }
  const stopCount: PaletteStopCount = raw.stopCount === 10 ? 10 : 11;
  return {
    colorName: raw.colorName,
    baseColor1: raw.baseColor1,
    baseColor2: raw.baseColor2,
    useTwoColors: raw.useTwoColors,
    params: parseParams(raw.params),
    pinnedStop1: parsePinnedStop(raw.pinnedStop1, stopCount - 1),
    pinnedStop2: parsePinnedStop(raw.pinnedStop2, stopCount - 1),
    overrides: storedOverrides(overrides),
    inputColorSpace: raw.inputColorSpace,
    stopCount,
  };
}

function parsePalette(raw: unknown): SavedPalette | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  if (typeof raw.name !== "string") return null;
  if (typeof raw.createdAt !== "number" || typeof raw.updatedAt !== "number") {
    return null;
  }
  const snapshot = parseSnapshot(raw.snapshot);
  if (!snapshot) return null;
  const previewHex = Array.isArray(raw.previewHex)
    ? raw.previewHex.filter((hex): hex is string => typeof hex === "string")
    : [];
  return {
    id: raw.id,
    name: raw.name,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    previewHex,
    snapshot,
  };
}

export function readSavedPalettesStore(): SavedPalettesStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.palettes)) return EMPTY_STORE;
    const palettes = parsed.palettes
      .map(parsePalette)
      .filter((palette): palette is SavedPalette => palette !== null);
    const activeId =
      typeof parsed.activeId === "string" &&
      palettes.some((palette) => palette.id === parsed.activeId)
        ? parsed.activeId
        : null;
    return { version: STORE_VERSION, palettes, activeId };
  } catch {
    return EMPTY_STORE;
  }
}

function writeSavedPalettesStore(store: SavedPalettesStore): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function getActiveSnapshot(store: SavedPalettesStore): PaletteSnapshot {
  if (!store.activeId) return DEFAULT_SNAPSHOT;
  return (
    store.palettes.find((palette) => palette.id === store.activeId)?.snapshot ??
    DEFAULT_SNAPSHOT
  );
}

export function useSavedPalettes() {
  const [store, setStore] = useState<SavedPalettesStore>(readSavedPalettesStore);
  const [bootSnapshot] = useState(() => getActiveSnapshot(store));

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setStore(readSavedPalettesStore());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: SavedPalettesStore): boolean => {
    if (!writeSavedPalettesStore(next)) return false;
    setStore(next);
    return true;
  }, []);

  const savePalette = useCallback(
    (opts: {
      name: string;
      snapshot: PaletteSnapshot;
      previewHex: string[];
      mode: "update" | "new";
    }): boolean => {
      const snapshot: PaletteSnapshot = {
        ...opts.snapshot,
        params: { ...opts.snapshot.params },
        overrides: storedOverrides(opts.snapshot.overrides),
      };
      const name = opts.name.trim() || "Untitled";
      const now = Date.now();
      const existing =
        opts.mode === "update" && store.activeId
          ? store.palettes.find((palette) => palette.id === store.activeId)
          : undefined;

      if (existing) {
        const updated: SavedPalette = {
          ...existing,
          name,
          snapshot,
          previewHex: opts.previewHex,
          updatedAt: now,
        };
        const activeId = existing.id;
        return commit({
          version: STORE_VERSION,
          activeId,
          palettes: [
            updated,
            ...store.palettes.filter((palette) => palette.id !== activeId),
          ],
        });
      }

      const created: SavedPalette = {
        id: crypto.randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
        previewHex: opts.previewHex,
        snapshot,
      };
      return commit({
        version: STORE_VERSION,
        activeId: created.id,
        palettes: [created, ...store.palettes],
      });
    },
    [commit, store],
  );

  const loadPalette = useCallback(
    (id: string): SavedPalette | undefined => {
      const found = store.palettes.find((palette) => palette.id === id);
      if (!found) return undefined;
      commit({ ...store, activeId: id });
      return found;
    },
    [commit, store],
  );

  const deletePalette = useCallback(
    (id: string): boolean => {
      return commit({
        version: STORE_VERSION,
        palettes: store.palettes.filter((palette) => palette.id !== id),
        activeId: store.activeId === id ? null : store.activeId,
      });
    },
    [commit, store],
  );

  const renamePalette = useCallback(
    (id: string, name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      return commit({
        ...store,
        palettes: store.palettes.map((palette) =>
          palette.id === id
            ? { ...palette, name: trimmed, updatedAt: Date.now() }
            : palette,
        ),
      });
    },
    [commit, store],
  );

  return {
    palettes: store.palettes,
    activeId: store.activeId,
    bootSnapshot,
    savePalette,
    loadPalette,
    deletePalette,
    renamePalette,
  };
}
