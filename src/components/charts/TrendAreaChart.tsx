"use client";

import { useState } from "react";

export type TrendSeries = {
  key: string;
  label: string;
  color: string;
  gradientId: string;
};

export type TrendDataPoint = {
  label: string; // x-axis label (e.g. "Jan", "Mon", "Week 1")
  [key: string]: number | string; // one key per series
};

type Props = {
  data: TrendDataPoint[];
  series: TrendSeries[];
  yLabel?: string;
  height?: number;
  formatValue?: (v: number) => string;
};

const WIDTH = 580;
const PAD = { top: 24, right: 24, bottom: 44, left: 48 };

function valToY(val: number, maxVal: number, plotH: number): number {
  if (maxVal === 0) return PAD.top + plotH;
  return PAD.top + plotH - (val / maxVal) * plotH;
}

function buildPath(
  points: { x: number; y: number }[]
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  return points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
  }, "");
}

export default function TrendAreaChart({
  data,
  series,
  yLabel,
  height = 220,
  formatValue = (v) => String(v),
}: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    values: { key: string; label: string; color: string; value: number }[];
  } | null>(null);

  const PLOT_W = WIDTH - PAD.left - PAD.right;
  const PLOT_H = height - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-[var(--canvas)] text-sm text-[var(--muted)]"
        style={{ height }}
      >
        No data available for this period.
      </div>
    );
  }

  // Find max across all series
  const allValues = data.flatMap((d) =>
    series.map((s) => Number(d[s.key] ?? 0))
  );
  const maxVal = Math.max(...allValues, 1);

  const step = data.length > 1 ? PLOT_W / (data.length - 1) : PLOT_W;

  // Build coords per series
  const seriesCoords = series.map((s) => ({
    ...s,
    points: data.map((d, i) => ({
      x: PAD.left + (data.length > 1 ? i * step : PLOT_W / 2),
      y: valToY(Number(d[s.key] ?? 0), maxVal, PLOT_H),
      value: Number(d[s.key] ?? 0),
      label: d.label,
    })),
  }));

  // Y-axis ticks (5 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD.top + PLOT_H - pct * PLOT_H,
    label: formatValue(Math.round(maxVal * pct)),
  }));

  return (
    <div className="relative w-full overflow-hidden">
      {yLabel && (
        <p className="mb-1 text-[10px] font-medium text-[var(--muted)] text-center">
          {yLabel}
        </p>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.gradientId}
              id={s.gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines + Y labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={tick.y}
              x2={PAD.left + PLOT_W}
              y2={tick.y}
              stroke="#e7e5e4"
              strokeWidth={1}
              strokeDasharray={i === 0 ? "none" : "4 3"}
            />
            <text
              x={PAD.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize={9}
              fill="var(--muted)"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Area fills */}
        {seriesCoords.map((s) => {
          const path = buildPath(s.points);
          if (!path) return null;
          const last = s.points[s.points.length - 1];
          const first = s.points[0];
          return (
            <path
              key={`area-${s.key}`}
              d={`${path} L ${last.x},${PAD.top + PLOT_H} L ${first.x},${PAD.top + PLOT_H} Z`}
              fill={`url(#${s.gradientId})`}
            />
          );
        })}

        {/* Lines */}
        {seriesCoords.map((s) => {
          const path = buildPath(s.points);
          if (!path) return null;
          return (
            <path
              key={`line-${s.key}`}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Hover touch targets */}
        {data.map((d, i) => {
          const x =
            PAD.left + (data.length > 1 ? i * step : PLOT_W / 2);
          return (
            <rect
              key={`hit-${i}`}
              x={x - step / 2}
              y={PAD.top}
              width={step}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={(e) => {
                const rect = (
                  e.currentTarget.closest("svg") as SVGSVGElement
                ).getBoundingClientRect();
                const svgX = ((x - PAD.left) / PLOT_W) * rect.width + rect.left;
                const svgY = rect.top + 16;
                setTooltip({
                  x: svgX,
                  y: svgY,
                  label: d.label,
                  values: series.map((s) => ({
                    key: s.key,
                    label: s.label,
                    color: s.color,
                    value: Number(d[s.key] ?? 0),
                  })),
                });
              }}
            />
          );
        })}

        {/* Data points */}
        {seriesCoords.map((s) =>
          s.points.map((pt) => (
            <circle
              key={`dot-${s.key}-${pt.label}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="white"
              stroke={s.color}
              strokeWidth={2}
            />
          ))
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x =
            PAD.left + (data.length > 1 ? i * step : PLOT_W / 2);
          // Show fewer labels if many points
          if (data.length > 12 && i % 2 !== 0) return null;
          return (
            <text
              key={`xlabel-${i}`}
              x={x}
              y={PAD.top + PLOT_H + 18}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--muted)"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-[var(--line)] bg-white px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          <p className="mb-1.5 font-semibold text-[var(--ink)]">{tooltip.label}</p>
          {tooltip.values.map((v) => (
            <div key={v.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: v.color }}
                />
                {v.label}
              </span>
              <span className="font-semibold text-[var(--ink)]">
                {formatValue(v.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
