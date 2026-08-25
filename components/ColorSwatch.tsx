import { useState, useRef } from "react";
import { LockIcon, LockOpenIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { cn } from "./ui/utils";
import {
  ColorInfo,
  contrastRatio,
  preferredContrastingTextColor,
  stringToOklch,
  wcagNormalTextLevel,
} from "../utils/color-utils";

interface ColorSwatchProps {
  color: ColorInfo;
  onColorChange: (colorIndex: number, newColor: ColorInfo) => void;
  /** Highlights the palette stop that matches the auto-placed base color (single-color mode). */
  isMatchedBase?: boolean;
  /** Show sample text and WCAG contrast badge for body-sized text. */
  contrastPreview?: boolean;
  locked?: boolean;
  onToggleLock?: () => void;
}

export function ColorSwatch({
  color,
  onColorChange,
  isMatchedBase,
  contrastPreview,
  locked,
  onToggleLock,
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
    if (colorPickerRef.current) {
      colorPickerRef.current.click();
    }
  };

  const contrastText = preferredContrastingTextColor(color.hex);
  const contrastValue = contrastRatio(contrastText, color.hex) ?? 1;
  const wcagLevel = wcagNormalTextLevel(contrastValue);

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const newOklch = stringToOklch(newHex);

    onColorChange(color.index, {
      index: color.index,
      hex: newHex,
      oklch: `oklch(${newOklch.l.toFixed(3)} ${newOklch.c.toFixed(3)} ${newOklch.h.toFixed(3)})`,
    });
  };

  return (
    <div
      className="group relative flex min-w-0 flex-1 flex-col"
      aria-label={
        isMatchedBase
          ? `Shade ${color.index}, matches your base color input`
          : `Shade ${color.index}`
      }
    >
      <div className="relative">
        <button
          type="button"
          className="relative h-36 w-full cursor-pointer md:h-44"
          style={{ backgroundColor: color.hex }}
          onClick={handleColorClick}
          aria-label={`Edit shade ${color.index}`}
        >
          {isMatchedBase ? (
            <span
              className="absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em]"
              style={{ color: contrastText, backgroundColor: `${contrastText}22` }}
            >
              Base
            </span>
          ) : null}

          {contrastPreview ? (
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center select-none text-sm font-medium tracking-tight"
              style={{ color: contrastText }}
              aria-hidden
            >
              Aa
            </span>
          ) : null}
        </button>
        {onToggleLock ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={locked}
                aria-label={
                  locked
                    ? `Unlock shade ${color.index}`
                    : `Lock shade ${color.index}`
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleLock();
                }}
                className={cn(
                  "absolute right-1.5 top-1.5 z-10 inline-flex size-7 items-center justify-center rounded-full transition-opacity",
                  "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  locked
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                )}
                style={{
                  color: contrastText,
                  backgroundColor: `${contrastText}24`,
                }}
              >
                {locked ? (
                  <LockIcon className="size-3.5" aria-hidden />
                ) : (
                  <LockOpenIcon className="size-3.5" aria-hidden />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {locked ? "Unlock — follow the generator" : "Lock — keep this stop"}
            </TooltipContent>
          </Tooltip>
        ) : null}
        <input
          ref={colorPickerRef}
          type="color"
          value={color.hex}
          onChange={handleColorPickerChange}
          className="pointer-events-none absolute inset-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      <div className="space-y-1 bg-card px-2.5 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[13px] font-medium tabular-nums">{color.index}</span>
          {contrastPreview ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 cursor-help rounded px-1 py-px text-[10px] font-semibold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    wcagLevel === "AAA" && "text-emerald-800",
                    wcagLevel === "AA" && "text-amber-800",
                    wcagLevel === "fail" && "text-red-800",
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
                <p className="font-medium">
                  WCAG 2.1 contrast ({wcagLevel === "fail" ? "below AA" : wcagLevel})
                </p>
                <p className="text-primary-foreground/90">
                  {contrastValue.toFixed(2)}:1 against{" "}
                  {contrastText === "#ffffff" ? "white" : "black"} text.
                </p>
                <p>
                  Normal text needs AA ≥ 4.5:1. Large text needs AA ≥ 3:1.
                </p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="block w-full truncate text-left font-mono text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => handleCopyHex(color.hex)}
            >
              {color.hex}
            </button>
          </TooltipTrigger>
          <TooltipContent>{copiedHex ? "Copied" : "Copy hex"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="hidden w-full truncate text-left font-mono text-[10px] text-muted-foreground hover:text-foreground xl:block"
              onClick={() => handleCopyOklch(color.oklch)}
            >
              {color.oklch}
            </button>
          </TooltipTrigger>
          <TooltipContent>{copiedOklch ? "Copied" : "Copy OKLCH"}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
