"use client";

type DateSelectorProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const dates = [
  { day: "28", weekDay: "THU", value: "2026-08-28" },
  { day: "29", weekDay: "FRI", value: "2026-08-29" },
  { day: "30", weekDay: "SAT", value: "2026-08-30" },
  { day: "31", weekDay: "SUN", value: "2026-08-31" },
  { day: "01", weekDay: "MON", value: "2026-09-01" },
];

export default function DateSelector({
  selectedDate,
  onSelectDate,
}: DateSelectorProps) {
  return (
    <section className="mt-6">
      <h2 className="text-[18px] font-semibold text-[#252525]">
        Select Date
      </h2>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {dates.map((date) => {
          const isSelected = selectedDate === date.value;

          return (
            <button
              key={date.value}
              type="button"
              onClick={() => onSelectDate(date.value)}
              className={`flex min-w-[62px] flex-col items-center rounded-xl border px-3 py-3 transition-all ${
                isSelected
                  ? "border-[#43BCD5] bg-[#43BCD5] text-white"
                  : "border-[#E2E5E9] bg-white text-[#252525] hover:border-[#43BCD5]"
              }`}
            >
              <span className="text-[18px] font-semibold">
                {date.day}
              </span>

              <span
                className={`mt-1 text-[10px] ${
                  isSelected ? "text-white" : "text-[#8B95A1]"
                }`}
              >
                {date.weekDay}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}