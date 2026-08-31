"use client";

import { Clock } from "lucide-react";
import type { TimeSlot } from "@/types/availability";

type SlotSelectorProps = {
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  slots: TimeSlot[]; // slots from doctor's availability for the selected day
};

// Format "09:00" -> "09:00 AM"
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export default function SlotSelector({
  selectedSlot,
  onSelectSlot,
  slots,
}: SlotSelectorProps) {
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.start.split(":")[0]);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.start.split(":")[0]);
    return hour >= 12;
  });

  if (slots.length === 0) {
    return (
      <section className="mt-7">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          Select Time Slot
        </h2>
        <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] py-10 text-center">
          <Clock size={28} className="mx-auto mb-2 text-[var(--line)]" strokeWidth={1.4} />
          <p className="text-sm text-[var(--muted)]">
            No slots available for this date.
          </p>
        </div>
      </section>
    );
  }

  const renderSlots = (slotList: TimeSlot[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slotList.map((slot) => {
        const label = formatTime(slot.start);
        const isOccupied = slot.isBooked;
        const isSelected = selectedSlot === slot.id;

        return (
          <button
            key={slot.id}
            type="button"
            disabled={isOccupied}
            onClick={() => onSelectSlot(slot.id)}
            title={isOccupied ? "Already booked" : `Book ${label} – ${formatTime(slot.end)}`}
            className={`h-11 rounded-xl border text-sm font-medium transition ${
              isOccupied
                ? "cursor-not-allowed border-[var(--line)] bg-stone-50 text-stone-400 line-through"
                : isSelected
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="mt-7">
      <h2 className="text-[18px] font-semibold text-[var(--ink)]">
        Select Time Slot
      </h2>

      {morningSlots.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">Morning</h3>
          {renderSlots(morningSlots)}
        </div>
      )}

      {afternoonSlots.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">Afternoon</h3>
          {renderSlots(afternoonSlots)}
        </div>
      )}
    </section>
  );
}