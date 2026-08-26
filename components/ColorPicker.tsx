import { useState, useEffect, useId } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { colord } from "colord";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const cssInputId = useId();
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const normalizeColorInput = (raw: string) => {
    const trimmed = raw.trim();
    // Accept 6-digit hex without a leading "#" (e.g. 3b82f6 → #3b82f6).
    // Only match length 6 so partial typing of a full hex isn't treated as shorthand.
    if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
      return `#${trimmed}`;
    }
    return trimmed;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    try {
      const normalized = normalizeColorInput(newValue);
      if (colord(normalized).isValid()) {
        onChange(colord(normalized).toHex());
      }
    } catch {
      // Invalid color, don't update the actual value
    }
  };

  const handleInputBlur = () => {
    const trimmed = inputValue.trim();
    // On blur, also accept 3-digit shorthand without "#" (e.g. fff → #ffffff)
    const normalized =
      /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(trimmed)
        ? `#${trimmed}`
        : trimmed;
    if (colord(normalized).isValid()) {
      const hex = colord(normalized).toHex();
      setInputValue(hex);
      onChange(hex);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  };

  return (
    <div className="w-full min-w-0 space-y-3">
      <Label className="font-normal text-muted-foreground">{label}</Label>

      <div className="relative w-full max-h-[100px] aspect-[2/1] overflow-hidden rounded-2xl ring-1 ring-foreground/10 sm:max-h-[110px]">
        <div className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={colord(value).toHex()}
          onChange={handleColorChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} — color picker`}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={cssInputId} className="text-sm text-muted-foreground">
          Hex color (paste)
        </Label>
        <Input
          id={cssInputId}
          type="text"
          spellCheck={false}
          className="font-mono text-sm"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="#3b82f6"
          aria-label={`${label} — hex color`}
        />
      </div>
    </div>
  );
}
