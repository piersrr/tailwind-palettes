import { useState, useEffect, useRef } from "react";
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
import {
  generatePalette,
  generatePaletteFromTwoColors,
  generateTailwindTheme,
  generateCssVariables,
  determinePalettePosition,
  formatOklch,
  stringToOklch,
  PALETTE_SHADE_INDICES,
  PALETTE_INDEX_500,
  ColorInfo,
} from "../utils/color-utils";
import { cssColorToHex } from "../utils/oklch-culori";
import { CheckIcon, CircleHelpIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

export function PaletteGenerator() {
  const [baseColor1, setBaseColor1] = useState("#3b82f6");
  const [baseColor2, setBaseColor2] = useState("#8b5cf6");
  const [useTwoColors, setUseTwoColors] = useState(false);
  const [colorName, setColorName] = useState("theme");
  const [generatedPalette, setGeneratedPalette] = useState<ColorInfo[]>([]);
  const [palette, setPalette] = useState<ColorInfo[]>([]);
  const [lockedShades, setLockedShades] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("tailwind");
  const [showBentoPreview, setShowBentoPreview] = useState(false);
  const [showContrastPreview, setShowContrastPreview] = useState(true);
  const [basePosition, setBasePosition] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputColorSpace, setInputColorSpace] = useState<"hex" | "oklch">(
    "oklch",
  );
  const lockedShadesRef = useRef(lockedShades);
  lockedShadesRef.current = lockedShades;

  const handleInputColorSpaceChange = (value: string) => {
    const next = value as "hex" | "oklch";
    if (next === "hex" && inputColorSpace === "oklch") {
      setBaseColor1(cssColorToHex(baseColor1));
      setBaseColor2(cssColorToHex(baseColor2));
    }
    setInputColorSpace(next);
  };

  useEffect(() => {
    setIsGenerating(true);
    const id = window.setTimeout(() => {
      let newPalette: ColorInfo[];

      if (useTwoColors) {
        newPalette = generatePaletteFromTwoColors(baseColor1, baseColor2);
      } else {
        const position = determinePalettePosition(baseColor1);
        setBasePosition(position);
        newPalette = generatePalette(baseColor1);
      }

      newPalette.sort((a, b) => a.index - b.index);
      const locked = lockedShadesRef.current;
      setGeneratedPalette(newPalette);
      setPalette((prev) =>
        newPalette.map((color) => {
          if (locked.has(color.index)) {
            const current = prev.find((stop) => stop.index === color.index);
            if (current) return { ...current };
          }
          return { ...color };
        }),
      );
      setIsGenerating(false);
    }, 0);

    return () => window.clearTimeout(id);
  }, [baseColor1, baseColor2, useTwoColors]);

  const handleColorChange = (colorIndex: number, newColor: ColorInfo) => {
    setPalette((prev) =>
      prev.map((color) => (color.index === colorIndex ? newColor : color)),
    );
    setLockedShades((prev) => {
      if (prev.has(colorIndex)) return prev;
      const next = new Set(prev);
      next.add(colorIndex);
      return next;
    });
  };

  const toggleLock = (colorIndex: number) => {
    const unlocking = lockedShades.has(colorIndex);
    setLockedShades((prev) => {
      const next = new Set(prev);
      if (unlocking) next.delete(colorIndex);
      else next.add(colorIndex);
      return next;
    });
    if (unlocking) {
      const generated = generatedPalette.find((stop) => stop.index === colorIndex);
      if (generated) {
        setPalette((prev) =>
          prev.map((color) =>
            color.index === colorIndex ? { ...generated } : color,
          ),
        );
      }
    }
  };

  const copyToClipboard = () => {
    let textToCopy = "";

    if (activeTab === "tailwind") {
      textToCopy = generateTailwindTheme(colorName, palette, inputColorSpace);
    } else if (activeTab === "css") {
      textToCopy = generateCssVariables(colorName, palette, inputColorSpace);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPositionInfo = () => {
    if (useTwoColors) return null;
    return {
      position: basePosition,
      shade: PALETTE_SHADE_INDICES[basePosition],
    };
  };

  const positionInfo = getPositionInfo();
  const themeSnippet = generateTailwindTheme(
    colorName,
    palette,
    inputColorSpace,
  );
  const cssSnippet = generateCssVariables(colorName, palette, inputColorSpace);
  const tokenName = colorName || "theme";
  const hasLockedStops = lockedShades.size > 0;
  const hasOverrides = palette.some((color) => {
    const generated = generatedPalette.find((stop) => stop.index === color.index);
    return generated != null && generated.hex.toLowerCase() !== color.hex.toLowerCase();
  });

  const resetPalette = () => {
    setLockedShades(new Set());
    setPalette(generatedPalette.map((color) => ({ ...color })));
  };

  return (
    <div className="space-y-12">
      <PageIntro kicker="Scale" title="Turn your color into a scale.">
        One stop becomes a 50–950 ramp in OKLCH. Click any swatch to retune it,
        then copy Tailwind v4 tokens or CSS variables.
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
            {isGenerating ? (
              <Loader2Icon
                className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                aria-label="Updating palette"
              />
            ) : null}
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
              value={clampOklch(stringToOklch(baseColor1))}
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
              value={clampOklch(stringToOklch(baseColor2))}
              onChange={(o) => setBaseColor2(formatOklch(o))}
            />
          )}

          <div className="space-y-2">
            <Label
              htmlFor="color-name"
              className="text-muted-foreground font-normal"
            >
              Token name
            </Label>
            <Input
              id="color-name"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="primary, brand, accent"
              className="font-mono"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-ink text-ink-foreground shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
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
                Click a stop to edit. Lock one to keep it while you retune the rest.
                {!useTwoColors && positionInfo ? (
                  <>
                    {" "}
                    Base sits on{" "}
                    <span className="font-mono text-foreground">
                      {positionInfo.shade}
                    </span>
                    .
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
              onClick={resetPalette}
              disabled={!hasOverrides && !hasLockedStops}
              tabIndex={hasOverrides || hasLockedStops ? undefined : -1}
              aria-hidden={!(hasOverrides || hasLockedStops)}
              className={cn(
                "h-7 shrink-0 px-2 text-muted-foreground hover:text-foreground",
                !(hasOverrides || hasLockedStops) && "invisible pointer-events-none",
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
          <div className="flex min-w-[44rem] overflow-hidden rounded-none ring-1 ring-foreground/10 md:min-w-0 md:rounded-2xl">
            {palette.map((color) => {
              const baseShade =
                !useTwoColors && basePosition < PALETTE_SHADE_INDICES.length
                  ? PALETTE_SHADE_INDICES[basePosition]
                  : null;
              return (
                <ColorSwatch
                  key={color.index}
                  color={color}
                  onColorChange={handleColorChange}
                  locked={lockedShades.has(color.index)}
                  onToggleLock={() => toggleLock(color.index)}
                  isMatchedBase={
                    baseShade !== null && color.index === baseShade
                  }
                  contrastPreview={showContrastPreview}
                />
              );
            })}
          </div>
        </div>
      </section>

      {showBentoPreview && palette.length > 0 && (
        <BentoLayout
          colorName={colorName}
          palette={palette}
          basePosition={useTwoColors ? PALETTE_INDEX_500 : basePosition}
        />
      )}
    </div>
  );
}
