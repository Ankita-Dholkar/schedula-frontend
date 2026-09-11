"use client";

type Props = {
  star: 1 | 2 | 3 | 4 | 5;
  count: number;
  percentage: number;
  maxCount: number;
};

export default function RatingDistributionBar({ star, count, percentage, maxCount }: Props) {
  const filled = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Star label */}
      <span className="w-6 shrink-0 text-right text-sm font-semibold text-[var(--ink)]">
        {star}
      </span>
      <span className="text-amber-400">★</span>

      {/* Track */}
      <div className="relative flex-1 overflow-hidden rounded-full bg-stone-100 h-2.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-700 ease-out"
          style={{ width: `${filled}%` }}
        />
      </div>

      {/* Count */}
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-[var(--muted)]">
        {count}
      </span>
      {/* Percentage */}
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">
        {percentage}%
      </span>
    </div>
  );
}
