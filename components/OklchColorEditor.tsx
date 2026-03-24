import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { formatOklch } from "../utils/color-utils";
import {
  oklchToSrgbHex,
  srgbToOklch,
  tryCssToOklch,
  type OklchTriplet,
} from "../utils/oklch-culori";

export type OklchColor = OklchTriplet;

export const L_MAX = 1;
export const C_MAX = 0.4;

export function clampOklch(o: OklchColor): OklchColor {
  return {
    l: Math.min(L_MAX, Math.max(0, o.l)),
    c: Math.min(C_MAX, Math.max(0, o.c)),
    h: Math.min(360, Math.max(0, o.h)),
  };
}

export function OklchColorEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: OklchColor;
  onChange: (next: OklchColor) => void;
}) {
  const cssInputId = useId();
  const [draft, setDraft] = useState(() => formatOklch(value));

  useEffect(() => {
    setDraft(formatOklch(value));
  }, [value.l, value.c, value.h]);

  const commitDraft = () => {
    const parsed = tryCssToOklch(draft);
    if (parsed) {
      const next = clampOklch(parsed);
      onChange(next);
      setDraft(formatOklch(next));
    } else {
      setDraft(formatOklch(value));
    }
  };

  const css = formatOklch(value);
  const hexForNativePicker = oklchToSrgbHex(value.l, value.c, value.h);

  const patch = (partial: Partial<OklchColor>) => {
    onChange(clampOklch({ ...value, ...partial }));
  };

  const lightnessTrack = useMemo(
    () =>
      `linear-gradient(to right, ${formatOklch({ l: 0, c: value.c, h: value.h })}, ${formatOklch({ l: 1, c: value.c, h: value.h })})`,
    [value.c, value.h],
  );

  const chromaTrack = useMemo(
    () =>
      `linear-gradient(to right, ${formatOklch({ l: value.l, c: 0, h: value.h })}, ${formatOklch({ l: value.l, c: C_MAX, h: value.h })})`,
    [value.l, value.h],
  );

  const hueTrack = useMemo(() => {
    const stops = Array.from({ length: 13 }, (_, i) =>
      formatOklch({ l: value.l, c: value.c, h: (i / 12) * 360 }),
    );
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [value.l, value.c]);

  const gradientTrackProps = {
    trackClassName:
      "overflow-visible !rounded-lg bg-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-border/45 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
    rangeClassName: "bg-transparent",
  } as const;

  return (
    <div className="w-full min-w-0 space-y-3">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="relative w-full overflow-hidden rounded-xl border-2 border-border shadow-sm aspect-[2/1] max-h-[100px] sm:max-h-[110px]">
        <div className="absolute inset-0" style={{ backgroundColor: css }} />
        <input
          type="color"
          value={hexForNativePicker}
          onChange={(e) => onChange(clampOklch(srgbToOklch(e.target.value)))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} — sRGB color picker`}
        />
      </div>
      <p className="text-xs text-muted-foreground -mt-1 w-full">
        Tile = OKLCH. Picker is sRGB (culori) so it matches the tile after you choose.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor={cssInputId} className="text-sm text-muted-foreground">
          CSS color (paste)
        </Label>
        <Input
          id={cssInputId}
          type="text"
          spellCheck={false}
          className="font-mono text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="oklch(0.55 0.18 250) or #3b82f6"
          aria-label={`${label} — CSS color string`}
        />
      </div>

      <div className="w-full min-w-0 space-y-3 pt-0.5">
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Lightness</span>
            <span className="font-mono tabular-nums text-muted-foreground text-xs">
              {value.l.toFixed(3)}
            </span>
          </div>
          <Slider
            className="w-full min-w-0"
            min={0}
            max={L_MAX}
            step={0.005}
            value={[value.l]}
            onValueChange={([l]) => patch({ l })}
            {...gradientTrackProps}
            trackStyle={{ background: lightnessTrack }}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Chroma</span>
            <span className="font-mono tabular-nums text-muted-foreground text-xs">
              {value.c.toFixed(3)}
            </span>
          </div>
          <Slider
            className="w-full min-w-0"
            min={0}
            max={C_MAX}
            step={0.005}
            value={[value.c]}
            onValueChange={([c]) => patch({ c })}
            {...gradientTrackProps}
            trackStyle={{ background: chromaTrack }}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Hue</span>
            <span className="font-mono tabular-nums text-muted-foreground text-xs">
              {value.h.toFixed(0)}°
            </span>
          </div>
          <Slider
            className="w-full min-w-0"
            min={0}
            max={360}
            step={1}
            value={[value.h]}
            onValueChange={([h]) => patch({ h })}
            {...gradientTrackProps}
            trackStyle={{ background: hueTrack }}
          />
        </div>
      </div>
    </div>
  );
}
