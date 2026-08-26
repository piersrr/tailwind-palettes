import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDownIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ScaleCurveChart } from "./ScaleCurveChart";
import { cn } from "./ui/utils";
import { formatOklch } from "../utils/color-utils";
import {
  DEFAULT_SCALE_PARAMS,
  SCALE_PRESETS,
  type ScaleParams,
  type ScaleStop,
} from "../utils/color-scale";
import type { OklchTriplet } from "../utils/oklch-culori";

interface ScaleControlsProps {
  params: ScaleParams;
  onChange: (next: ScaleParams) => void;
  /** Drives the gradient slider tracks so they preview the current hue. */
  baseColor: OklchTriplet;
  stops: ScaleStop[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRACK_PROPS = {
  trackClassName:
    "overflow-visible !rounded-lg bg-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-border/45 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
  rangeClassName: "bg-transparent",
} as const;

function ControlSlider({
  label,
  hint,
  value,
  display,
  min,
  max,
  step,
  onChange,
  track,
}: {
  label: string;
  hint?: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  track?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        {hint ? (
          // Hints live in tooltips so the panel stays short enough to sit in
          // view alongside the swatches it is controlling.
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-sm text-muted-foreground underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[15rem]">{hint}</TooltipContent>
          </Tooltip>
        ) : (
          <Label className="text-sm font-normal text-muted-foreground">
            {label}
          </Label>
        )}
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {display}
        </span>
      </div>
      <Slider
        className="w-full min-w-0"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
        {...(track ? TRACK_PROPS : {})}
        trackStyle={track ? { background: track } : undefined}
      />
    </div>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const heading = (
    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {title}
    </p>
  );
  return (
    <section className="min-w-0 space-y-3">
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
              {heading}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[15rem]">{hint}</TooltipContent>
        </Tooltip>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}

/** How far a signed degree slider can push the hue at either end of the ramp. */
const HUE_DRIFT_RANGE = 45;

export function ScaleControls({
  params,
  onChange,
  baseColor,
  stops,
  open,
  onOpenChange,
}: ScaleControlsProps) {
  const patch = (partial: Partial<ScaleParams>) =>
    onChange({ ...params, ...partial });

  const activePreset = useMemo(
    () =>
      SCALE_PRESETS.find((preset) =>
        (Object.keys(params) as (keyof ScaleParams)[]).every(
          (key) => preset.params[key] === params[key],
        ),
      ),
    [params],
  );

  const isDefault = useMemo(
    () =>
      (Object.keys(params) as (keyof ScaleParams)[]).every(
        (key) => DEFAULT_SCALE_PARAMS[key] === params[key],
      ),
    [params],
  );

  const lightnessTrack = useMemo(
    () =>
      `linear-gradient(to right, ${formatOklch({ l: 0.2, c: baseColor.c * 0.6, h: baseColor.h })}, ${formatOklch({ l: 1, c: baseColor.c * 0.2, h: baseColor.h })})`,
    [baseColor.c, baseColor.h],
  );

  const chromaTrack = useMemo(
    () =>
      `linear-gradient(to right, ${formatOklch({ l: 0.62, c: 0, h: baseColor.h })}, ${formatOklch({ l: 0.62, c: 0.3, h: baseColor.h })})`,
    [baseColor.h],
  );

  const hueTrack = useMemo(() => {
    const stopsCss = Array.from({ length: 9 }, (_, i) => {
      const offset = -HUE_DRIFT_RANGE + (i / 8) * HUE_DRIFT_RANGE * 2;
      return formatOklch({
        l: 0.62,
        c: Math.max(0.08, baseColor.c),
        h: baseColor.h + offset,
      });
    });
    return `linear-gradient(to right, ${stopsCss.join(", ")})`;
  }, [baseColor.c, baseColor.h]);

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-xl border border-border/80 bg-card/60"
    >
      <div className="group relative flex items-center justify-between gap-3 px-4 py-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            aria-label={open ? "Close advanced controls" : "Open advanced controls"}
          />
        </CollapsibleTrigger>
        <div className="pointer-events-none relative z-10 flex items-center gap-2 text-sm text-foreground transition-colors group-hover:text-foreground/80">
          <ChevronDownIcon
            className="h-4 w-4 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          />
          Advanced
          <span className="text-xs text-muted-foreground">
            {activePreset ? activePreset.label : "Custom"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_SCALE_PARAMS })}
          disabled={isDefault}
          className={cn(
            "relative z-10 h-7 shrink-0 px-2 text-muted-foreground hover:text-foreground",
            isDefault && "invisible pointer-events-none",
          )}
          tabIndex={isDefault ? -1 : undefined}
          aria-hidden={isDefault}
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          Reset scale
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="advanced-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
        <div className="space-y-5 border-t border-border/70 px-4 py-4 md:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Preset
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SCALE_PRESETS.map((preset) => (
                <Tooltip key={preset.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onChange({ ...preset.params, gamut: params.gamut })}
                      aria-pressed={activePreset?.id === preset.id}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        activePreset?.id === preset.id
                          ? "border-foreground/30 bg-foreground/[0.06] text-foreground"
                          : "border-border bg-card/70 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{preset.description}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
            <Group title="Lightness">
              <ControlSlider
                label="Light end"
                hint="Lightness of the lightest stop. Anchoring a color lighter than this widens the ramp to fit it."
                value={params.lightnessMax}
                display={params.lightnessMax.toFixed(3)}
                min={0.8}
                max={1}
                step={0.005}
                onChange={(lightnessMax) =>
                  patch({
                    lightnessMax,
                    lightnessMin: Math.min(params.lightnessMin, lightnessMax - 0.05),
                  })
                }
                track={lightnessTrack}
              />
              <ControlSlider
                label="Dark end"
                hint="Lightness of the darkest stop. Anchoring a color darker than this widens the ramp to fit it."
                value={params.lightnessMin}
                display={params.lightnessMin.toFixed(3)}
                min={0.08}
                max={0.6}
                step={0.005}
                onChange={(lightnessMin) =>
                  patch({
                    lightnessMin,
                    lightnessMax: Math.max(params.lightnessMax, lightnessMin + 0.05),
                  })
                }
                track={lightnessTrack}
              />
              <ControlSlider
                label="Curve"
                hint="Negative darkens early, positive holds the lights."
                value={params.lightnessBias}
                display={params.lightnessBias.toFixed(2)}
                min={-1}
                max={1}
                step={0.05}
                onChange={(lightnessBias) => patch({ lightnessBias })}
              />
              <ControlSlider
                label="Easing"
                hint="Compresses both ends so the mid-tones spread out."
                value={params.lightnessEase}
                display={params.lightnessEase.toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                onChange={(lightnessEase) => patch({ lightnessEase })}
              />
            </Group>

            <Group title="Chroma">
              <ControlSlider
                label="Saturation"
                hint="Scales chroma along the ramp. The base stop always keeps its own color."
                value={params.saturation}
                display={`${params.saturation.toFixed(2)}\u00d7`}
                min={0}
                max={2}
                step={0.02}
                onChange={(saturation) => patch({ saturation })}
                track={chromaTrack}
              />
              <ControlSlider
                label="Peak"
                hint="Which end of the ramp carries the most chroma."
                value={params.chromaPeak}
                display={params.chromaPeak.toFixed(2)}
                min={0.1}
                max={0.95}
                step={0.025}
                onChange={(chromaPeak) => patch({ chromaPeak })}
              />
              <ControlSlider
                label="Light falloff"
                hint="How much chroma drains out of the tints."
                value={params.chromaLightFalloff}
                display={`${Math.round(params.chromaLightFalloff * 100)}%`}
                min={0}
                max={1}
                step={0.02}
                onChange={(chromaLightFalloff) => patch({ chromaLightFalloff })}
              />
              <ControlSlider
                label="Dark falloff"
                hint="Pulling chroma out of the darks keeps them from going muddy."
                value={params.chromaDarkFalloff}
                display={`${Math.round(params.chromaDarkFalloff * 100)}%`}
                min={0}
                max={1}
                step={0.02}
                onChange={(chromaDarkFalloff) => patch({ chromaDarkFalloff })}
              />
            </Group>

            <div className="min-w-0 space-y-6">
              <Group title="Hue drift">
                <ControlSlider
                  label="Light end"
                  hint="Rotates the hue at the light end of the ramp. Push the two ends in opposite directions for a warm-to-cool trajectory."
                  value={params.hueShiftLight}
                  display={`${params.hueShiftLight > 0 ? "+" : ""}${params.hueShiftLight.toFixed(0)}\u00b0`}
                  min={-HUE_DRIFT_RANGE}
                  max={HUE_DRIFT_RANGE}
                  step={1}
                  onChange={(hueShiftLight) => patch({ hueShiftLight })}
                  track={hueTrack}
                />
                <ControlSlider
                  label="Dark end"
                  hint="Rotates the hue at the dark end. Drift is always zero on the anchored stop, so your base hue stays exact."
                  value={params.hueShiftDark}
                  display={`${params.hueShiftDark > 0 ? "+" : ""}${params.hueShiftDark.toFixed(0)}\u00b0`}
                  min={-HUE_DRIFT_RANGE}
                  max={HUE_DRIFT_RANGE}
                  step={1}
                  onChange={(hueShiftDark) => patch({ hueShiftDark })}
                  track={hueTrack}
                />
              </Group>

              <Group
                title="Gamut"
                hint="Stops outside the target gamut have their chroma reduced until they fit, keeping lightness and hue intact."
              >
                <Tabs
                  value={params.gamut}
                  onValueChange={(value) =>
                    patch({ gamut: value as ScaleParams["gamut"] })
                  }
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="srgb">sRGB</TabsTrigger>
                    <TabsTrigger value="p3">Display P3</TabsTrigger>
                  </TabsList>
                </Tabs>
                {params.gamut === "p3" ? (
                  <p className="text-[11px] leading-snug text-muted-foreground/80">
                    Hex values are clipped stand-ins in P3 — copy the OKLCH
                    output instead.
                  </p>
                ) : null}
              </Group>
            </div>

            <Group title="Trajectory">
              <ScaleCurveChart stops={stops} />
            </Group>
          </div>
        </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Collapsible>
  );
}
