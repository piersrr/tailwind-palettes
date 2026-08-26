import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ColorPicker } from "./ColorPicker";
import { ColorSwatch } from "./ColorSwatch";
import { BentoLayout } from "./BentoLayout";
import { OklchColorEditor, clampOklch } from "./OklchColorEditor";
import { PageIntro } from "./PageIntro";
import { ScaleControls } from "./ScaleControls";
import {
  generateTailwindTheme,
  generateCssVariables,
  formatOklch,
  stringToOklch,
  shadeToStopIndex,
  PALETTE_SHADE_INDICES,
  ColorInfo,
} from "../utils/color-utils";
import {
  DEFAULT_SCALE_PARAMS,
  generateScale,
  suggestBaseStop,
  type ScaleAnchor,
  type ScaleParams,
} from "../utils/color-scale";
import { cssColorToHex } from "../utils/oklch-culori";
import { CheckIcon, CircleHelpIcon, RefreshCwIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

const LAST_STOP = PALETTE_SHADE_INDICES.length - 1;

/**
 * Keeps the blend color off the base color's stop. Two colors of similar
 * lightness would otherwise collapse onto the same anchor and the second
 * one would be dropped.
 */
function separateStop(
  candidate: number,
  taken: number,
  darker: boolean,
): number {
  if (candidate !== taken) return candidate;
  const shifted = darker ? taken + 1 : taken - 1;
  if (shifted >= 0 && shifted <= LAST_STOP) return shifted;
  return darker ? taken - 1 : taken + 1;
}

export function PaletteGenerator() {
  const [baseColor1, setBaseColor1] = useState("#3b82f6");
  const [baseColor2, setBaseColor2] = useState("#8b5cf6");
  const [useTwoColors, setUseTwoColors] = useState(false);
  const [colorName, setColorName] = useState("brand");
  const [params, setParams] = useState<ScaleParams>(DEFAULT_SCALE_PARAMS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  /** null means "place this color by its lightness". */
  const [pinnedStop1, setPinnedStop1] = useState<number | null>(null);
  const [pinnedStop2, setPinnedStop2] = useState<number | null>(null);
  /** Stops the user locked or edited; these survive regeneration. */
  const [overrides, setOverrides] = useState<Map<number, ColorInfo>>(
    () => new Map(),
  );
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("tailwind");
  const [showBentoPreview, setShowBentoPreview] = useState(false);
  const [showContrastPreview, setShowContrastPreview] = useState(true);
  const [inputColorSpace, setInputColorSpace] = useState<"hex" | "oklch">(
    "oklch",
  );

  const handleInputColorSpaceChange = (value: string) => {
    const next = value as "hex" | "oklch";
    if (next === "hex" && inputColorSpace === "oklch") {
      setBaseColor1(cssColorToHex(baseColor1));
      setBaseColor2(cssColorToHex(baseColor2));
    }
    setInputColorSpace(next);
  };

  const base1 = useMemo(
    () => clampOklch(stringToOklch(baseColor1)),
    [baseColor1],
  );
  const base2 = useMemo(
    () => clampOklch(stringToOklch(baseColor2)),
    [baseColor2],
  );

  const stop1 = useMemo(
    () => pinnedStop1 ?? suggestBaseStop(base1, params),
    [pinnedStop1, base1, params],
  );

  const stop2 = useMemo(() => {
    if (pinnedStop2 !== null) return pinnedStop2;
    const suggested = suggestBaseStop(base2, params);
    return separateStop(suggested, stop1, base2.l <= base1.l);
  }, [pinnedStop2, base2, base1.l, params, stop1]);

  const anchors = useMemo<ScaleAnchor[]>(() => {
    const first: ScaleAnchor = { stopIndex: stop1, color: base1 };
    if (!useTwoColors) return [first];
    return [first, { stopIndex: stop2, color: base2 }];
  }, [useTwoColors, stop1, stop2, base1, base2]);

  const generated = useMemo(
    () => generateScale(anchors, params),
    [anchors, params],
  );

  const palette = useMemo(
    () => generated.map((stop) => overrides.get(stop.index) ?? stop),
    [generated, overrides],
  );

  const handleColorChange = (colorIndex: number, newColor: ColorInfo) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(colorIndex, newColor);
      return next;
    });
  };

  const toggleLock = (colorIndex: number) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      if (next.has(colorIndex)) {
        next.delete(colorIndex);
        return next;
      }
      const current = generated.find((stop) => stop.index === colorIndex);
      if (current) next.set(colorIndex, { ...current });
      return next;
    });
  };

  /** Moves whichever anchor is nearest onto this stop, or releases it. */
  const setAnchorStop = (shade: number) => {
    const index = shadeToStopIndex(shade);
    if (index < 0) return;

    if (!useTwoColors) {
      setPinnedStop1((prev) => (prev === index ? null : index));
      return;
    }
    if (index === stop1 && pinnedStop1 !== null) {
      setPinnedStop1(null);
      return;
    }
    if (index === stop2 && pinnedStop2 !== null) {
      setPinnedStop2(null);
      return;
    }
    if (Math.abs(index - stop1) <= Math.abs(index - stop2)) {
      setPinnedStop1(index);
    } else {
      setPinnedStop2(index);
    }
  };

  const copyToClipboard = () => {
    const textToCopy =
      activeTab === "tailwind"
        ? generateTailwindTheme(colorName, palette, inputColorSpace)
        : generateCssVariables(colorName, palette, inputColorSpace);

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeSnippet = generateTailwindTheme(
    colorName,
    palette,
    inputColorSpace,
  );
  const cssSnippet = generateCssVariables(colorName, palette, inputColorSpace);
  const tokenName = colorName || "brand";
  const hasLockedStops = overrides.size > 0;
  const hasPinnedStops =
    pinnedStop1 !== null || (useTwoColors && pinnedStop2 !== null);
  const baseShade = PALETTE_SHADE_INDICES[stop1];
  const blendShade = PALETTE_SHADE_INDICES[stop2];
  const gamutMappedCount = generated.filter(
    (stop) => stop.wasGamutMapped,
  ).length;

  const resetPalette = () => setOverrides(new Map());

  return (
    <div className="space-y-12">
      <PageIntro kicker="Colors" title="Turn a color into a scale.">
        One stop becomes a 50–950 ramp in OKLCH. Pin your color to any tile and
        the rest bends around it, then reshape the whole trajectory under
        Advanced.
      </PageIntro>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={inputColorSpace}
              onValueChange={handleInputColorSpaceChange}
              aria-label="Base color format"
            >
              <TabsList>
                <TabsTrigger value="oklch">OKLCH</TabsTrigger>
                <TabsTrigger value="hex">Hex</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="What is the difference between Hex and OKLCH?"
                >
                  <CircleHelpIcon className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent
                showArrow={false}
                side="bottom"
                align="start"
                sideOffset={10}
                className="max-w-[min(22rem,calc(100vw-2rem))] border border-border bg-card px-4 py-3.5 text-left text-card-foreground shadow-lg rounded-xl text-sm leading-relaxed"
              >
                <p className="font-medium mb-2">Hex vs OKLCH</p>
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Hex</span> is{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem]">
                    #RRGGBB
                  </code>
                  . Compact, universal, and not how we see lightness.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">OKLCH</span> is
                  lightness, chroma, and hue. Ramps stay smoother when you step
                  in this space.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {inputColorSpace === "hex" ? (
            <ColorPicker
              label="Base color"
              value={baseColor1}
              onChange={setBaseColor1}
            />
          ) : (
            <OklchColorEditor
              label="Base color"
              value={base1}
              onChange={(o) => setBaseColor1(formatOklch(o))}
            />
          )}

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 px-4 py-3">
            <Label htmlFor="use-two-colors" className="font-normal">
              Blend a second color
            </Label>
            <Switch
              id="use-two-colors"
              checked={useTwoColors}
              onCheckedChange={setUseTwoColors}
            />
          </div>

          {useTwoColors && inputColorSpace === "hex" && (
            <ColorPicker
              label="Second color"
              value={baseColor2}
              onChange={setBaseColor2}
            />
          )}
          {useTwoColors && inputColorSpace === "oklch" && (
            <OklchColorEditor
              label="Second color"
              value={base2}
              onChange={(o) => setBaseColor2(formatOklch(o))}
            />
          )}
        </div>

        <div className="overflow-hidden rounded-2xl bg-ink text-ink-foreground shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <Input
                id="color-name"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="primary"
                aria-label="Token name"
                className="h-9 w-[8.5rem] shrink-0 border-white/15 bg-white/10 font-mono text-ink-foreground placeholder:text-ink-muted focus-visible:border-white/30 focus-visible:ring-white/20"
              />
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="gap-0"
              >
                <TabsList className="h-9 bg-white/10 text-ink-muted">
                  <TabsTrigger
                    value="tailwind"
                    className="text-ink-muted data-[state=active]:bg-white/15 data-[state=active]:text-ink-foreground"
                  >
                    @theme
                  </TabsTrigger>
                  <TabsTrigger
                    value="css"
                    className="text-ink-muted data-[state=active]:bg-white/15 data-[state=active]:text-ink-foreground"
                  >
                    Variables
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              className="bg-white/10 text-ink-foreground hover:bg-white/15"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : "Copy"}
            </Button>
          </div>

          <div className="px-5 pb-5 pt-4">
            {activeTab === "tailwind" ? (
              <div className="space-y-4">
                <pre className="max-h-72 overflow-auto font-mono text-[12px] leading-relaxed text-ink-foreground/90">
                  {themeSnippet}
                </pre>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Drop into your CSS. Then{" "}
                  <code className="font-mono text-ink-foreground">
                    bg-{tokenName}-500
                  </code>{" "}
                  or{" "}
                  <code className="font-mono text-ink-foreground">
                    var(--color-{tokenName}-500)
                  </code>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <pre className="max-h-72 overflow-auto font-mono text-[12px] leading-relaxed text-ink-foreground/90">
                  {`:root {\n${cssSnippet}}`}
                </pre>
                <p className="text-xs text-ink-muted">
                  Custom properties for stylesheets outside Tailwind.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {tokenName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Click a stop to edit, lock one to keep it, or pin your base
                color to a different tile. Base sits on{" "}
                <span className="font-mono text-foreground">{baseShade}</span>
                {useTwoColors ? (
                  <>
                    {" "}
                    and the blend on{" "}
                    <span className="font-mono text-foreground">
                      {blendShade}
                    </span>
                  </>
                ) : null}
                {hasPinnedStops ? "" : " by lightness"}.
                {gamutMappedCount > 0 ? (
                  <>
                    {" "}
                    {gamutMappedCount} stop{gamutMappedCount === 1 ? "" : "s"}{" "}
                    pulled back to fit{" "}
                    {params.gamut === "p3" ? "Display P3" : "sRGB"}.
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPinnedStop1(null);
                setPinnedStop2(null);
              }}
              disabled={!hasPinnedStops}
              tabIndex={hasPinnedStops ? undefined : -1}
              aria-hidden={!hasPinnedStops}
              className={cn(
                "h-7 shrink-0 px-2 text-muted-foreground hover:text-foreground",
                !hasPinnedStops && "invisible pointer-events-none",
              )}
            >
              Auto place
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetPalette}
              disabled={!hasLockedStops}
              tabIndex={hasLockedStops ? undefined : -1}
              aria-hidden={!hasLockedStops}
              className={cn(
                "h-7 shrink-0 px-2 text-muted-foreground hover:text-foreground",
                !hasLockedStops && "invisible pointer-events-none",
              )}
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              Reset
            </Button>
            <div className="flex items-center gap-2.5">
              <Switch
                id="show-bento"
                checked={showBentoPreview}
                onCheckedChange={setShowBentoPreview}
              />
              <Label htmlFor="show-bento" className="font-normal text-sm">
                Layout
              </Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch
                id="show-contrast"
                checked={showContrastPreview}
                onCheckedChange={setShowContrastPreview}
              />
              <Label htmlFor="show-contrast" className="font-normal text-sm">
                Contrast
              </Label>
            </div>
          </div>
        </div>

        <div className="-mx-5 overflow-x-auto md:mx-0">
          <div className="flex min-w-[48rem] overflow-hidden rounded-none border border-foreground/10 md:min-w-0 md:rounded-2xl">
            {palette.map((color) => {
              const isBase = color.index === baseShade;
              const isBlend = useTwoColors && color.index === blendShade;
              return (
                <ColorSwatch
                  key={color.index}
                  color={color}
                  onColorChange={handleColorChange}
                  locked={overrides.has(color.index)}
                  onToggleLock={() => toggleLock(color.index)}
                  anchorLabel={isBase ? "Base" : isBlend ? "Blend" : null}
                  anchorPinned={
                    (isBase && pinnedStop1 !== null) ||
                    (isBlend && pinnedStop2 !== null)
                  }
                  onSetAnchor={() => setAnchorStop(color.index)}
                  contrastPreview={showContrastPreview}
                />
              );
            })}
          </div>
        </div>

        <ScaleControls
          params={params}
          onChange={setParams}
          baseColor={base1}
          stops={generated}
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
        />
      </section>

      {showBentoPreview && palette.length > 0 && (
        <BentoLayout
          colorName={colorName}
          palette={palette}
          basePosition={stop1}
        />
      )}
    </div>
  );
}
