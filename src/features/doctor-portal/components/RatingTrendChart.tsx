"use client";

type TrendPoint = {
  month: string; // "YYYY-MM"
  avg: number;   // 1–5
};

type Props = {
  data: TrendPoint[];
};

const WIDTH = 560;
const HEIGHT = 200;
const PAD = { top: 20, right: 24, bottom: 40, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function avgToY(avg: number): number {
  // avg 5 → top (PAD.top), avg 1 → bottom (PAD.top + PLOT_H)
  return PAD.top + PLOT_H - ((avg - 1) / 4) * PLOT_H;
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(Number(year), Number(month) - 1)
  );
}

export default function RatingTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl bg-stone-50 text-sm text-[var(--muted)]">
        Not enough data to display a trend yet.
      </div>
    );
  }

  if (data.length === 1) {
    // Single point — show a dot and label
    const pt = data[0];
    const cx = PAD.left + PLOT_W / 2;
    const cy = avgToY(pt.avg);
    return (
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        aria-label="Rating trend chart"
      >
        <GridLines />
        <circle cx={cx} cy={cy} r={5} fill="var(--brand)" />
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize={11} fill="var(--brand)" fontWeight="600">
          {pt.avg}★
        </text>
        <text x={cx} y={PAD.top + PLOT_H + 18} textAnchor="middle" fontSize={11} fill="var(--muted)">
          {formatMonth(pt.month)}
        </text>
      </svg>
    );
  }

  // Map data to SVG coordinates
  const step = PLOT_W / (data.length - 1);
  const points = data.map((d, i) => ({
    x: PAD.left + i * step,
    y: avgToY(d.avg),
    month: d.month,
    avg: d.avg,
  }));

  // Build smooth polyline path (catmull-rom-like using cubic bezier)
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      aria-label="Rating trend chart"
    >
      <GridLines />

      {/* Area fill under line */}
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${points[points.length - 1].x},${PAD.top + PLOT_H} L ${points[0].x},${PAD.top + PLOT_H} Z`}
        fill="url(#trendGrad)"
      />

      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((pt) => (
        <g key={pt.month}>
          <circle cx={pt.x} cy={pt.y} r={4.5} fill="white" stroke="var(--brand)" strokeWidth={2} />
          {/* Avg label */}
          <text
            x={pt.x}
            y={pt.y - 10}
            textAnchor="middle"
            fontSize={10}
            fill="var(--brand)"
            fontWeight="600"
          >
            {pt.avg}
          </text>
        </g>
      ))}

      {/* Month labels */}
      {points.map((pt) => (
        <text
          key={`label-${pt.month}`}
          x={pt.x}
          y={PAD.top + PLOT_H + 18}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted)"
        >
          {formatMonth(pt.month)}
        </text>
      ))}
    </svg>
  );
}

function GridLines() {
  const ratings = [5, 4, 3, 2, 1];
  return (
    <>
      {ratings.map((r) => {
        const y = avgToY(r);
        return (
          <g key={r}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + PLOT_W}
              y2={y}
              stroke="#e7e5e4"
              strokeWidth={1}
              strokeDasharray={r === 1 || r === 5 ? "none" : "4 3"}
            />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
              {r}★
            </text>
          </g>
        );
      })}
    </>
  );
}
