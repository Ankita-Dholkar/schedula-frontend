"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { doctors } from "@/lib/mock-data/doctors";
import { appointments } from "@/lib/mock-data/appointments";

import BookingHeader from "@/features/booking/components/BookingHeader";
import DateSelector from "@/features/booking/components/DateSelector";
import SlotSelector from "@/features/booking/components/SlotSelector";

export default function DoctorBookingPage() {
  const params = useParams();
  const router = useRouter();

  const doctorId = params.doctorId as string;

  const [selectedDate, setSelectedDate] = useState("2026-08-28");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState("");

  // Find selected doctor
  const doctor = doctors.find((item) => item.id === doctorId);

  if (!doctor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg text-gray-500">Doctor not found.</p>
      </main>
    );
  }

  // Find occupied slots for selected doctor and date
  const occupiedSlots = appointments
    .filter(
      (appointment) =>
        appointment.clinician === doctor.name &&
        appointment.status !== "cancelled" &&
        appointment.startsAt.startsWith(selectedDate)
    )
    .map((appointment) => {
      const date = new Date(appointment.startsAt);

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    });

  // Handle date change
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot("");
    setError("");
  };

  // Handle booking
  const handleBooking = () => {
    if (!selectedSlot) {
      setError("Please select a time slot before booking.");
      return;
    }

    setError("");
    setIsBooked(true);
  };

  // Format selected date
  const formattedDate = new Date(
    `${selectedDate}T12:00:00`
  ).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Booking Confirmation Screen
  if (isBooked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          {/* Success Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5F7E9]">
            <CheckCircle2
              size={32}
              className="text-[#2BA84A]"
            />
          </div>

          <h1 className="mt-5 text-[22px] font-semibold text-[#252525]">
            Appointment Confirmed!
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-[#7B8494]">
            Your appointment has been successfully booked.
          </p>

          {/* Appointment Details */}
          <div className="mt-6 rounded-xl bg-[#F8F9FB] p-4 text-left">
            <p className="text-[17px] font-semibold text-[#252525]">
              {doctor.name}
            </p>

            <p className="mt-1 text-sm text-[#43BCD5]">
              {doctor.specialization}
            </p>

            <div className="mt-4 space-y-3 border-t border-[#E5E7EB] pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#7B8494]">
                  Date
                </span>

                <span className="text-right font-medium text-[#252525]">
                  {formattedDate}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#7B8494]">
                  Time
                </span>

                <span className="font-medium text-[#252525]">
                  {selectedSlot}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/doctors")}
            className="mt-6 h-10 w-full rounded-lg bg-[#43BCD5] text-sm font-medium text-white transition hover:bg-[#36B1CB]"
          >
            Back to Doctors
          </button>
        </div>
      </main>
    );
  }

  // Booking Page
  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-[760px]">

        {/* Header */}
        <BookingHeader />

        {/* Doctor Information */}
        <section className="mt-5 w-full max-w-[620px] rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-4">

            {/* Doctor Image */}
            <div className="relative h-[100px] w-[90px] shrink-0 overflow-hidden rounded-lg sm:h-[115px] sm:w-[105px]">
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                sizes="(max-width: 640px) 90px, 105px"
                className="object-cover"
              />
            </div>

            {/* Doctor Details */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h2 className="truncate text-[18px] font-semibold text-[#252525] sm:text-[21px]">
                {doctor.name}
              </h2>

              <p className="mt-1 text-sm text-[#43BCD5]">
                {doctor.specialization}
              </p>

              <p className="mt-1.5 text-sm text-[#6B7280]">
                {doctor.experience}+ Years Experience
              </p>

              <span className="mt-2 inline-block w-fit rounded-md bg-[#E5F7E9] px-2 py-1 text-[11px] text-[#2BA84A]">
                {doctor.availability}
              </span>

              <p className="mt-2 text-[13px] font-medium text-[#4B5563]">
                {doctor.availableTime}
              </p>
            </div>
          </div>

          {/* About Doctor */}
          <div className="mt-4 border-t border-[#E5E7EB] pt-3">
            <h3 className="text-[15px] font-semibold text-[#252525]">
              About Doctor
            </h3>

            <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">
              {doctor.description}
            </p>
          </div>
        </section>

        {/* Date Selection */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />

        {/* Slot Selection */}
        <SlotSelector
          selectedSlot={selectedSlot}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setError("");
          }}
          occupiedSlots={occupiedSlots}
        />

        {/* Booking Action */}
        <div className="mt-7 flex flex-col items-center pb-8">
          {error && (
            <p className="mb-3 text-center text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleBooking}
            className="h-10 w-full max-w-[240px] rounded-lg bg-[#43BCD5] px-5 text-sm font-semibold text-white transition hover:bg-[#36B1CB] active:scale-[0.99]"
          >
            Confirm Appointment
          </button>
        </div>
      </div>
    </main>
  );
}