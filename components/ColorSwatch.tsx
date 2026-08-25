import { useState, useRef } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { cn } from "./ui/utils";
import {
  ColorInfo,
  contrastRatio,
  preferredContrastingTextColor,
  stringToOklch,
  wcagNormalTextLevel,
} from "../utils/color-utils";
import { PaletteIcon } from "lucide-react";

interface ColorSwatchProps {
  color: ColorInfo;
  onColorChange: (colorIndex: number, newColor: ColorInfo) => void;
  /** Highlights the palette stop that matches the auto-placed base color (single-color mode). */
  isMatchedBase?: boolean;
  /** Show sample text and WCAG contrast badge for body-sized text. */
  contrastPreview?: boolean;
}

export function ColorSwatch({
  color,
  onColorChange,
  isMatchedBase,
  contrastPreview,
}: ColorSwatchProps) {
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedOklch, setCopiedOklch] = useState(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  
  const handleCopyHex = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const handleCopyOklch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOklch(true);
    setTimeout(() => setCopiedOklch(false), 2000);
  };
  
  const handleColorClick = () => {
    // Open the color picker when clicking on the color area
    if (colorPickerRef.current) {
      colorPickerRef.current.click();
    }
  };
  
  const contrastText = preferredContrastingTextColor(color.hex);
  const contrastValue = contrastRatio(contrastText, color.hex) ?? 1;
  const wcagLevel = wcagNormalTextLevel(contrastValue);

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    // Convert the new hex color to OKLCH 
    const newOklch = stringToOklch(newHex);
    
    onColorChange(color.index, {
      index: color.index,
      hex: newHex,
      oklch: `oklch(${newOklch.l.toFixed(3)} ${newOklch.c.toFixed(3)} ${newOklch.h.toFixed(3)})`
    });
  };
  
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        isMatchedBase
          ? "border-[2px] border-neutral-700 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] dark:border-neutral-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "border border-border",
      )}
      aria-label={
        isMatchedBase
          ? `Shade ${color.index}, matches your base color input`
          : undefined
      }
    >
      <div 
        className="h-28 cursor-pointer group relative"
        style={{ backgroundColor: color.hex }}
        onClick={handleColorClick}
      >
        {/* Hidden color input for native color picker */}
        <input
          ref={colorPickerRef}
          type="color"
          value={color.hex}
          onChange={handleColorPickerChange}
          className="absolute opacity-0 pointer-events-none"
          aria-label={`Color picker for ${color.index}`}
        />
        
        {contrastPreview ? (
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-tight pointer-events-none select-none"
            style={{
              color: contrastText,              
            }}
            aria-hidden
          >
            Abc123
          </span>
        ) : null}

        {/* Indicator to show it's clickable */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PaletteIcon
            className={cn(
              "w-6 h-6 drop-shadow-md",
              !contrastPreview && "text-white",
            )}
            style={contrastPreview ? { color: contrastText } : undefined}
          />
        </div>
      </div>
      
      <div className="p-2 space-y-2 bg-card">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium tabular-nums">{color.index}</span>
            {contrastPreview ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 cursor-help rounded border px-1 py-px text-[10px] font-semibold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      wcagLevel === "AAA" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100",
                      wcagLevel === "AA" &&
                        "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-100",
                      wcagLevel === "fail" &&
                        "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100",
                    )}
                  >
                    {wcagLevel === "fail" ? "Fail" : wcagLevel}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  showArrow={false}
                  side="top"
                  sideOffset={8}
                  className="max-w-[min(22rem,calc(100vw-2rem))] space-y-2 px-3 py-2.5 text-left text-xs leading-relaxed"
                >
                  <p className="font-semibold text-primary-foreground text-md">
                    WCAG 2.1 contrast ({wcagLevel === "fail" ? "below AA" : wcagLevel})
                  </p>
                  <p className="text-primary-foreground/95 text-xs">
                    This badge uses{" "}
                    <span className="font-medium text-primary-foreground">
                      {contrastValue.toFixed(2)}:1
                    </span>{" "}
                    between the swatch and either black or white text—whichever reads stronger (same
                    idea as the “Abc123” preview).
                  </p>
                  <p className="font-medium text-primary-foreground text-md">Text size vs. required contrast</p>
                  <ul className="list-disc space-y-1.5 pl-4 text-primary-foreground/95">
                    <li>
                      <span className="font-medium text-primary-foreground">Normal text</span> (smaller
                      than about{" "}
                      <span className="whitespace-nowrap">24px / 1.5rem</span> regular, or smaller than
                      about <span className="whitespace-nowrap">18.5px</span> bold):{" "}
                      <span className="whitespace-nowrap">AA ≥ 4.5:1</span>,{" "}
                      <span className="whitespace-nowrap">AAA ≥ 7:1</span>.
                    </li>
                    <li>
                      <span className="font-medium text-primary-foreground">Large text</span> (at
                      least <span className="whitespace-nowrap">24px / 1.5rem</span> regular, or at
                      least <span className="whitespace-nowrap">18.5px</span> bold):{" "}
                      <span className="whitespace-nowrap">AA ≥ 3:1</span>,{" "}
                      <span className="whitespace-nowrap">AAA ≥ 4.5:1</span>.
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          
        </div>
        
        <div className="flex flex-col gap-1 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="font-mono cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleCopyHex(color.hex)}
              >
                {color.hex}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {copiedHex ? "Copied!" : color.hex}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="font-mono truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleCopyOklch(color.oklch)}
              >
                {color.oklch.length > 20 ? `${color.oklch.substring(0, 17)}...` : color.oklch}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {copiedOklch ? "Copied!" : color.oklch}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
