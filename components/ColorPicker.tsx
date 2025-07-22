
import { useState } from "react";
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    try {
      // Validate if the input is a valid color
      if (colord(newValue).isValid()) {
        onChange(colord(newValue).toHex());
      }
    } catch (error) {
      // Invalid color, don't update the actual value
    }
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <Input 
          id={`color-${label}`}
          type="text" 
          value={inputValue} 
          onChange={handleInputChange}
          className="flex-1"
          placeholder="#000000 or oklch(0.5 0.2 240)"
        />
        <div className="relative flex items-center">
          <Input
            type="color"
            value={colord(value).toHex()}
            onChange={handleColorChange}
            className="absolute opacity-0 cursor-pointer size-10"
          />
          <div 
            className="size-10 rounded border border-border"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );
}
