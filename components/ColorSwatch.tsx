
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { ColorInfo, stringToOklch } from "../utils/color-utils";
import { CheckIcon, ClipboardCopyIcon, PaletteIcon } from "lucide-react";

interface ColorSwatchProps {
  color: ColorInfo;
  onColorChange: (colorIndex: number, newColor: ColorInfo) => void;
}

export function ColorSwatch({ color, onColorChange }: ColorSwatchProps) {
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
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="h-20 cursor-pointer group relative"
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
        
        {/* Indicator to show it's clickable */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PaletteIcon className="w-6 h-6 text-white drop-shadow-md" />
        </div>
      </div>
      
      <div className="p-2 space-y-2 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{color.index}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleCopyHex(color.hex)}
              >
                {copiedHex ? <CheckIcon className="h-3 w-3" /> : <ClipboardCopyIcon className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copiedHex ? "Copied!" : "Copy hex"}
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex flex-col gap-1 text-xs">
          <div 
            className="font-mono cursor-pointer hover:text-primary transition-colors"
            onClick={() => handleCopyHex(color.hex)}
          >
            {color.hex}
          </div>
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
