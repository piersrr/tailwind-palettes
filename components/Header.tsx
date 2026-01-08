import { Button } from "./ui/button";
import { CodeIcon, PaletteIcon } from "lucide-react";

interface HeaderProps {
  activePage: string;
  onPageChange: (value: string) => void;
}

export function Header({ activePage, onPageChange }: HeaderProps) {
  return (
    <header className="w-full border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tailwind CSS Toolkit</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate color palettes and convert CSS to Tailwind classes
            </p>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button
              variant={activePage === "palette" ? "default" : "ghost"}
              onClick={() => onPageChange("palette")}
              className="flex items-center gap-2"
            >
              <PaletteIcon className="h-4 w-4" />
              Color Palette Generator
            </Button>
            <Button
              variant={activePage === "css-to-tailwind" ? "default" : "ghost"}
              onClick={() => onPageChange("css-to-tailwind")}
              className="flex items-center gap-2"
            >
              <CodeIcon className="h-4 w-4" />
              CSS to Tailwind
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

