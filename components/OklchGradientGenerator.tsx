import { useRef, useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { OklchColorEditor, clampOklch, type OklchColor } from "./OklchColorEditor";
import { PageIntro } from "./PageIntro";
import { formatOklch, oklchToTailwindArbitrary } from "../utils/color-utils";
import { srgbToOklch } from "../utils/oklch-culori";
import { CheckIcon } from "lucide-react";

const SUGGESTED_PAIRINGS = [
  { name: "Blue → Violet", from: "#3b82f6", to: "#8b5cf6" },
  { name: "Emerald → Teal", from: "#10b981", to: "#14b8a6" },
  { name: "Rose → Orange", from: "#f43f5e", to: "#f97316" },
  { name: "Indigo → Pink", from: "#6366f1", to: "#ec4899" },
  { name: "Cyan → Sky", from: "#06b6d4", to: "#0ea5e9" },
  { name: "Amber → Red", from: "#f59e0b", to: "#ef4444" },
  { name: "Lime → Green", from: "#84cc16", to: "#22c55e" },
  { name: "Fuchsia → Purple", from: "#d946ef", to: "#a855f7" },
] as const;

const DIAL_SHORTCUTS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

function angleMatchesShortcut(angle: number, target: number, tol = 11): boolean {
  const a = ((angle % 360) + 360) % 360;
  const t = ((target % 360) + 360) % 360;
  let diff = Math.abs(a - t);
  if (diff > 180) diff = 360 - diff;
  return diff <= tol;
}

function AngleDial({
  angle,
  onChange,
}: {
  angle: number;
  onChange: (deg: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const setFromPointer = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    onChange(Math.round(deg));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX, e.clientY);
    const onMove = (ev: PointerEvent) => setFromPointer(ev.clientX, ev.clientY);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const r = 36;
  const tickRadius = 46.5;
  const cx = 50;
  const cy = 50;
  const rad = (angle * Math.PI) / 180;
  const hx = cx + r * Math.sin(rad);
  const hy = cy - r * Math.cos(rad);

  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="text-muted-foreground text-xs">Direction</Label>
      <div
        ref={wrapRef}
        className="relative touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 100 100"
          className="block text-muted-foreground"
          aria-label={`Gradient direction ${angle} degrees`}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-40"
          />
          {DIAL_SHORTCUTS.map((deg) => {
            const tr = (deg * Math.PI) / 180;
            const tx = cx + tickRadius * Math.sin(tr);
            const ty = cy - tickRadius * Math.cos(tr);
            const active = angleMatchesShortcut(angle, deg);
            return (
              <circle
                key={deg}
                role="button"
                tabIndex={0}
                cx={tx}
                cy={ty}
                r={3.25}
                className={
                  active
                    ? "fill-primary cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    : "fill-muted-foreground/45 hover:fill-muted-foreground/80 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                }
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={() => onChange(deg)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(deg);
                  }
                }}
                aria-label={`Set direction to ${deg} degrees`}
                aria-pressed={active}
              />
            );
          })}
          <line
            x1={cx}
            y1={cy}
            x2={hx}
            y2={hy}
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-foreground pointer-events-none"
          />
          <circle
            cx={hx}
            cy={hy}
            r="7"
            className="fill-primary stroke-background stroke-2 pointer-events-none"
          />
        </svg>
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground">
        {angle}°
      </span>
    </div>
  );
}

export function OklchGradientGenerator() {
  const [stop1, setStop1] = useState<OklchColor>(() => srgbToOklch("#3b82f6"));
  const [stop2, setStop2] = useState<OklchColor>(() => srgbToOklch("#8b5cf6"));
  const [angle, setAngle] = useState(135);
  const [copied, setCopied] = useState<"css" | "tw" | null>(null);

  const ok1 = formatOklch(stop1);
  const ok2 = formatOklch(stop2);

  const cssGradient = `linear-gradient(${angle}deg, ${ok1}, ${ok2})`;
  const tailwindClass = `bg-[linear-gradient(${angle}deg,${oklchToTailwindArbitrary(ok1)},${oklchToTailwindArbitrary(ok2)})]`;

  const copy = (kind: "css" | "tw") => {
    const text = kind === "css" ? cssGradient : tailwindClass;
    void navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const applyPairing = (from: string, to: string) => {
    setStop1(clampOklch(srgbToOklch(from)));
    setStop2(clampOklch(srgbToOklch(to)));
  };

  return (
    <div className="w-full space-y-10">
      <PageIntro kicker="" title="Oklch gradient generator">
        Preview is the CSS you copy. The native picker is sRGB; we convert with
        culori so the tile matches. Wide-gamut OKLCH can outrun the picker.
      </PageIntro>

      <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        <div
          className="h-40 w-full md:h-52"
          style={{ backgroundImage: cssGradient }}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
        <div className="min-w-0 order-1">
          <OklchColorEditor label="From" value={stop1} onChange={setStop1} />
        </div>
        <div className="order-2 flex shrink-0 justify-center self-start py-2 md:px-2 md:py-0">
          <AngleDial angle={angle} onChange={setAngle} />
        </div>
        <div className="min-w-0 order-3">
          <OklchColorEditor label="To" value={stop2} onChange={setStop2} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              CSS
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copy("css")}
              className="h-8 shrink-0"
            >
              {copied === "css" ? <CheckIcon className="h-4 w-4" /> : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-ink p-4 font-mono text-[12px] leading-relaxed text-ink-foreground/90">
            {cssGradient}
          </pre>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tailwind
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copy("tw")}
              className="h-8 shrink-0"
            >
              {copied === "tw" ? <CheckIcon className="h-4 w-4" /> : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-ink p-4 font-mono text-[12px] leading-relaxed text-ink-foreground/90">
            {tailwindClass}
          </pre>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Pairings
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PAIRINGS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pr-3 pl-1.5 text-left text-sm transition-colors hover:border-foreground/25"
              onClick={() => applyPairing(p.from, p.to)}
            >
              <span
                className="size-7 shrink-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                }}
                aria-hidden
              />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
