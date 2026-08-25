import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { colord } from "colord";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
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
    <div className="space-y-2">
      <Label htmlFor={`color-${label}`} className="text-muted-foreground font-normal">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={`color-${label}`}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="flex-1 font-mono"
          placeholder="#3b82f6"
        />
        <div className="relative size-10 shrink-0">
          <Input
            type="color"
            value={colord(value).toHex()}
            onChange={handleColorChange}
            className="absolute inset-0 size-10 cursor-pointer opacity-0"
          />
          <div
            className="size-10 rounded-lg ring-1 ring-foreground/15"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );
}
