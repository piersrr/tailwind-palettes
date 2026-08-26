import { useId } from "react";
import { PALETTE_SHADE_INDICES } from "../utils/color-utils";
import type { ScaleStop } from "../utils/color-scale";

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 26;

type Track = {
  key: "l" | "c" | "h";
  label: string;
  title: string;
  format: (value: number) => string;
};

const TRACKS: Track[] = [
  {
    key: "l",
    label: "L",
    title: "Lightness",
    format: (v) => v.toFixed(3),
  },
  {
    key: "c",
    label: "C",
    title: "Chroma",
    format: (v) => v.toFixed(3),
  },
  {
    key: "h",
    label: "H",
    title: "Hue",
    format: (v) => `${v.toFixed(0)}°`,
  },
];

/**
 * Hue is an angle, so a ramp crossing 0/360 would otherwise plot as a cliff.
 * Unwrapping keeps the drift readable as a continuous line.
 */
function unwrapHues(values: number[]): number[] {
  const out: number[] = [];
  let offset = 0;
  values.forEach((value, i) => {
    if (i > 0) {
      const delta = value + offset - out[i - 1];
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    out.push(value + offset);
  });
  return out;
}

function Sparkline({
  values,
  anchorIndices,
  label,
  title,
  format,
}: {
  values: number[];
  anchorIndices: number[];
  label: string;
  title: string;
  format: (value: number) => string;
}) {
  const gradientId = useId();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const last = values.length - 1;

  const point = (value: number, i: number) => {
    const x = last === 0 ? 0 : (i / last) * VIEW_WIDTH;
    // A flat track sits mid-height rather than collapsing onto an edge.
    const ratio = span < 1e-6 ? 0.5 : (value - min) / span;
    const y = VIEW_HEIGHT - 2 - ratio * (VIEW_HEIGHT - 4);
    return { x, y };
  };

  const points = values.map(point);
  const line = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `0,${VIEW_HEIGHT} ${line} ${VIEW_WIDTH},${VIEW_HEIGHT}`;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-3 shrink-0 font-mono text-[11px] text-muted-foreground"
        title={title}
      >
        {label}
      </span>
      <div className="relative h-6 min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible text-foreground/70"
          role="img"
          aria-label={`${title} across the scale, ${format(values[0])} to ${format(values[last])}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {anchorIndices.map((i) => (
            <line
              key={i}
              x1={points[i].x}
              y1={0}
              x2={points[i].x}
              y2={VIEW_HEIGHT}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="1.5 1.5"
              className="opacity-40"
            />
          ))}
          <polygon points={area} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {anchorIndices.map((i) => (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{
              left: `${(points[i].x / VIEW_WIDTH) * 100}%`,
              top: `${(points[i].y / VIEW_HEIGHT) * 100}%`,
            }}
          />
        ))}
      </div>
      <span className="w-[5.5rem] shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
        {format(values[0])} → {format(values[last])}
      </span>
    </div>
  );
}

/**
 * Read-only view of the three curves behind the ramp, so the effect of the
 * advanced controls is visible while dragging them.
 */
export function ScaleCurveChart({ stops }: { stops: ScaleStop[] }) {
  if (stops.length === 0) return null;

  const anchorIndices = stops
    .map((stop, i) => (stop.isAnchor ? i : -1))
    .filter((i) => i >= 0);

  const series: Record<Track["key"], number[]> = {
    l: stops.map((stop) => stop.l),
    c: stops.map((stop) => stop.c),
    h: unwrapHues(stops.map((stop) => stop.h)),
  };

  return (
    <div className="space-y-0.5">
      {TRACKS.map((track) => (
        <Sparkline
          key={track.key}
          values={series[track.key]}
          anchorIndices={anchorIndices}
          label={track.label}
          title={track.title}
          format={track.format}
        />
      ))}
      <p className="pt-1 pl-[1.375rem] text-[10px] text-muted-foreground/80">
        {PALETTE_SHADE_INDICES[0]} to{" "}
        {PALETTE_SHADE_INDICES[PALETTE_SHADE_INDICES.length - 1]}, left to right.
        Dots mark the anchored stops.
      </p>
    </div>
  );
}
