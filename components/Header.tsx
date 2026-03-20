import { CodeIcon, PaletteIcon, BlendIcon } from "lucide-react";
import prkBlack from "../prk-black.png";
import { cn } from "./ui/utils";

interface HeaderProps {
  activePage: string;
  onPageChange: (value: string) => void;
}

const navItems = [
  { id: "palette", label: "Palettes", shortLabel: "Palettes", icon: PaletteIcon },
  {
    id: "css-to-tailwind",
    label: "CSS → Tailwind",
    shortLabel: "CSS",
    icon: CodeIcon,
  },
  {
    id: "oklch-gradient",
    label: "OKLCH gradient",
    shortLabel: "Gradient",
    icon: BlendIcon,
  },
] as const;

export function Header({ activePage, onPageChange }: HeaderProps) {
  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href="https://piers.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
              aria-label="Piers"
            >
              <img src={prkBlack} alt="Piers" className="h-10" />
            </a>
            <div>
              <h1 className="text-2xl font-bold">Tailwind CSS Toolkit</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Palettes, CSS conversion, and OKLCH gradients
              </p>
            </div>
          </div>

          <nav
            className="inline-flex h-10 w-full max-w-full md:w-auto items-center rounded-lg border border-border bg-muted/60 p-1 shadow-sm"
            role="tablist"
            aria-label="Tools"
          >
            {navItems.map(({ id, label, shortLabel, icon: Icon }) => {
              const active = activePage === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onPageChange(id)}
                  className={cn(
                    "inline-flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "bg-background text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground border border-transparent",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

