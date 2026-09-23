"use client";

import { useState } from "react";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: DonutSlice[];
  centerLabel?: string;
  centerSubLabel?: string;
  size?: number;
  formatValue?: (v: number) => string;
};

export default function DonutBreakdownChart({
  slices,
  centerLabel,
  centerSubLabel,
  size = 180,
  formatValue = (v) => String(v),
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const total = slices.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38; // outer radius
  const r = size * 0.22; // inner radius (donut hole)

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--muted)]"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  // Build arc paths
  let cumAngle = -Math.PI / 2; // start at top
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const angle = (slice.value / total) * Math.PI * 2;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const x1 = cx + R * Math.cos(startAngle);
      const y1 = cy + R * Math.sin(startAngle);
      const x2 = cx + R * Math.cos(endAngle);
      const y2 = cy + R * Math.sin(endAngle);
      const ix1 = cx + r * Math.cos(endAngle);
      const iy1 = cy + r * Math.sin(endAngle);
      const ix2 = cx + r * Math.cos(startAngle);
      const iy2 = cy + r * Math.sin(startAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      return { ...slice, d, angle };
    });

  const hoveredSlice = hovered
    ? slices.find((s) => s.label === hovered)
    : null;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {/* SVG donut */}
      <div className="relative flex-shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-sm"
        >
          {arcs.map((arc) => (
            <path
              key={arc.label}
              d={arc.d}
              fill={arc.color}
              opacity={
                hovered === null || hovered === arc.label ? 1 : 0.35
              }
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHovered(arc.label)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center text */}
          <text
            x={cx}
            y={cy - (centerSubLabel ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.11}
            fontWeight="700"
            fill="var(--ink)"
          >
            {hoveredSlice
              ? formatValue(hoveredSlice.value)
              : centerLabel ?? formatValue(total)}
          </text>
          {centerSubLabel && (
            <text
              x={cx}
              y={cy + size * 0.1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.072}
              fill="var(--muted)"
            >
              {hoveredSlice
                ? `${Math.round((hoveredSlice.value / total) * 100)}%`
                : centerSubLabel}
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div
              key={slice.label}
              className={`flex items-center gap-2 cursor-pointer transition-opacity duration-150 ${
                hovered !== null && hovered !== slice.label
                  ? "opacity-40"
                  : "opacity-100"
              }`}
              onMouseEnter={() => setHovered(slice.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-xs text-[var(--ink)]">{slice.label}</span>
              <span className="ml-auto text-xs font-semibold text-[var(--ink)]">
                {formatValue(slice.value)}
                <span className="ml-1 text-[var(--muted)] font-normal">
                  ({pct}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
