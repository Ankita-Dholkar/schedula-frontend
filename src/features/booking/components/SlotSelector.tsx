"use client";

type SlotSelectorProps = {
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  occupiedSlots: string[];
};

const morningSlots = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
];

const afternoonSlots = [
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
];

export default function SlotSelector({
  selectedSlot,
  onSelectSlot,
  occupiedSlots,
}: SlotSelectorProps) {
  const renderSlots = (slots: string[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => {
        const isOccupied = occupiedSlots.includes(slot);
        const isSelected = selectedSlot === slot;

        return (
          <button
            key={slot}
            type="button"
            disabled={isOccupied}
            onClick={() => onSelectSlot(slot)}
            className={`
              h-11 rounded-xl border text-sm font-medium transition
              ${
                isOccupied
                  ? "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#B0B6BE] line-through"
                  : isSelected
                    ? "border-[#43BCD5] bg-[#43BCD5] text-white"
                    : "border-[#E2E5E9] bg-white text-[#4B5563] hover:border-[#43BCD5]"
              }
            `}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="mt-7">
      <h2 className="text-[18px] font-semibold text-[#252525]">
        Select Time Slot
      </h2>

      <div className="mt-4">
        <h3 className="mb-3 text-sm font-medium text-[#6B7280]">
          Morning
        </h3>

        {renderSlots(morningSlots)}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-[#6B7280]">
          Afternoon
        </h3>

        {renderSlots(afternoonSlots)}
      </div>
    </section>
  );
}