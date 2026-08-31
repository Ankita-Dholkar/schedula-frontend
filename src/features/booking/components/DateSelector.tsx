"use client";

type DateSelectorProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeDays?: string[]; // day names doctor is available e.g. ["Monday", "Wednesday"]
};

// Generate the next 14 days from today
function generateDates(activeDays: string[]) {
  const result = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    // If activeDays provided, only show days the doctor works
    if (activeDays.length > 0 && !activeDays.includes(dayName)) continue;

    const value = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const day = String(d.getDate()).padStart(2, "0");
    const weekDay = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

    result.push({ day, weekDay, value, dayName });
  }

  return result;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
  activeDays = [],
}: DateSelectorProps) {
  const dates = generateDates(activeDays);

  if (dates.length === 0) {
    return (
      <section className="mt-6">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">Select Date</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          This doctor has no available days set up yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-[18px] font-semibold text-[var(--ink)]">Select Date</h2>

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
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]"
              }`}
            >
              <span className="text-[18px] font-semibold">{date.day}</span>
              <span
                className={`mt-1 text-[10px] ${
                  isSelected ? "text-white" : "text-[var(--muted)]"
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