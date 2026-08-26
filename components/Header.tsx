import { BlendIcon, CodeIcon, PaletteIcon } from "lucide-react";
import prkBlack from "../prk-black.png";
import { cn } from "./ui/utils";

interface HeaderProps {
  activePage: string;
  onPageChange: (value: string) => void;
}

const navItems = [
  {
    id: "palette",
    label: "Palettes",
    shortLabel: "Palettes",
    icon: PaletteIcon,
  },
  {
    id: "css-to-tailwind",
    label: "Convert",
    shortLabel: "CSS",
    icon: CodeIcon,
  },
  {
    id: "oklch-gradient",
    label: "Gradient",
    shortLabel: "Mix",
    icon: BlendIcon,
  },
] as const;

export function Header({ activePage, onPageChange }: HeaderProps) {
  return (
    <header className="bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3.5 md:px-8">
        <a
          href="https://piers.cc"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          aria-label="Piers"
        >
          <img src={prkBlack} alt="" className="h-7 w-auto" />
        </a>
        <div className="min-w-0 leading-none">
          <p className="font-serif text-[1.35rem] italic tracking-tight">
            Color Palette Toolkit
          </p>
          <p className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
            CSS, OKLCH, Tailwind
          </p>
        </div>

        <nav
          className="ml-auto flex items-center gap-0.5 sm:gap-1"
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
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
