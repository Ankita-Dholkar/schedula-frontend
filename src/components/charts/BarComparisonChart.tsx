"use client";

import { useState } from "react";

export type BarGroup = {
  label: string;
  [key: string]: number | string;
};

export type BarSeries = {
  key: string;
  label: string;
  color: string;
};

type Props = {
  data: BarGroup[];
  series: BarSeries[];
  height?: number;
  formatValue?: (v: number) => string;
};

const WIDTH = 580;
const PAD = { top: 20, right: 24, bottom: 44, left: 48 };
const GROUP_GAP = 0.3; // fraction of group width used as gap

export default function BarComparisonChart({
  data,
  series,
  height = 200,
  formatValue = (v) => String(v),
}: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    group: string;
    values: { label: string; color: string; value: number }[];
  } | null>(null);

  const PLOT_W = WIDTH - PAD.left - PAD.right;
  const PLOT_H = height - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-[var(--canvas)] text-sm text-[var(--muted)]"
        style={{ height }}
      >
        No data available.
      </div>
    );
  }

  const allValues = data.flatMap((d) =>
    series.map((s) => Number(d[s.key] ?? 0))
  );
  const maxVal = Math.max(...allValues, 1);

  const isDense = data.length > 20;
  const GROUP_GAP = isDense ? 0.2 : 0.3; // fraction of group width used as gap

  const groupW = PLOT_W / data.length;
  const barW = (groupW * (1 - GROUP_GAP)) / series.length;
  const groupPad = (groupW * GROUP_GAP) / 2;
  const labelStep = data.length > 20 ? 5 : data.length > 10 ? 2 : 1;

  // Y ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD.top + PLOT_H - pct * PLOT_H,
    label: formatValue(Math.round(maxVal * pct)),
  }));

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
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

        {/* Bars */}
        {data.map((group, gi) => {
          const gx = PAD.left + gi * groupW;
          const cx = gx + groupW / 2;
          const isLabelVisible =
            gi === data.length - 1 ||
            (gi % labelStep === 0 && data.length - 1 - gi >= Math.floor(labelStep / 2));

          const handleHover = (e: React.MouseEvent<SVGElement>) => {
            const rect = (
              e.currentTarget.closest("svg") as SVGSVGElement
            ).getBoundingClientRect();
            const svgX =
              ((cx - PAD.left) / PLOT_W) * rect.width + rect.left;
            setTooltip({
              x: svgX,
              y: rect.top + 16,
              group: group.label,
              values: series.map((s2) => ({
                label: s2.label,
                color: s2.color,
                value: Number(group[s2.key] ?? 0),
              })),
            });
          };

          return (
            <g key={`${group.label}-${gi}`}>
              {/* Hit area so hovering over a date with 0 count still shows tooltip */}
              <rect
                x={gx}
                y={PAD.top}
                width={groupW}
                height={PLOT_H}
                fill="transparent"
                onMouseEnter={handleHover}
              />
              {series.map((s, si) => {
                const val = Number(group[s.key] ?? 0);
                const barH = (val / maxVal) * PLOT_H;
                const bx = gx + groupPad + si * barW;
                const by = PAD.top + PLOT_H - barH;
                return (
                  <rect
                    key={s.key}
                    x={bx}
                    y={by}
                    width={Math.max(barW - (isDense ? 1 : 2), 2)}
                    height={Math.max(barH, 0)}
                    rx={Math.min(3, Math.max(1, (barW - 1) / 2))}
                    fill={s.color}
                    opacity={0.85}
                    onMouseEnter={handleHover}
                  />
                );
              })}
              {/* X-axis label */}
              {isLabelVisible && (
                <text
                  x={cx}
                  y={PAD.top + PLOT_H + 16}
                  textAnchor="middle"
                  fontSize={isDense ? 8.5 : 9.5}
                  fill="var(--muted)"
                >
                  {group.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-[var(--line)] bg-white px-3 py-2 shadow-lg text-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1.5 font-semibold text-[var(--ink)]">
            {tooltip.group}
          </p>
          {tooltip.values.map((v) => (
            <div
              key={v.label}
              className="flex items-center justify-between gap-4"
            >
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
