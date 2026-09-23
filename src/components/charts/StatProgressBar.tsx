"use client";

export type ProgressItem = {
  label: string;
  value: number;
  color: string;
  subLabel?: string;
};

type Props = {
  items: ProgressItem[];
  total?: number; // if not provided, uses sum of all values
  formatValue?: (v: number) => string;
  showPercentage?: boolean;
};

export default function StatProgressBar({
  items,
  total,
  formatValue = (v) => String(v),
  showPercentage = true,
}: Props) {
  const computedTotal =
    total ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct =
          computedTotal > 0
            ? Math.round((item.value / computedTotal) * 100)
            : 0;
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs font-medium text-[var(--ink)]">
                  {item.label}
                </span>
                {item.subLabel && (
                  <span className="text-[10px] text-[var(--muted)]">
                    {item.subLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[var(--ink)]">
                  {formatValue(item.value)}
                </span>
                {showPercentage && (
                  <span className="text-[var(--muted)]">({pct}%)</span>
                )}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--canvas)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
