"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, ArrowLeft, Stethoscope, Video, Building2, FileText } from "lucide-react";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";

import { getAllDoctors } from "@/lib/mock-data/doctors";
import { getAllAppointments, saveAppointment, saveNotification } from "@/lib/mock-data/appointments";
import { getDoctorAvailability, loadPersistedAvailability, saveDoctorAvailability } from "@/lib/mock-data/availability";
import type { DoctorAvailability, TimeSlot } from "@/types/availability";

import DateSelector from "@/features/booking/components/DateSelector";
import SlotSelector from "@/features/booking/components/SlotSelector";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function getBookedTimes(doctorName: string, date: string): string[] {
  return getAllAppointments()
    .filter((a) => a.clinician === doctorName && a.status !== "cancelled" && a.startsAt.startsWith(date))
    .map((a) => {
      const d = new Date(a.startsAt);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    });
}

export default function UserDoctorBookingPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;
  const today = new Date().toISOString().split("T")[0];

  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [doctor, setDoctor] = useState<ReturnType<typeof getAllDoctors>[number] | null>(null);

  // New booking detail fields
  const [appointmentType, setAppointmentType] = useState("Consultation");
  const [appointmentMode, setAppointmentMode] = useState<"in-person" | "online">("in-person");
  const [reasonForVisit, setReasonForVisit] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
      router.push("/login");
    } else {
      const found = getAllDoctors().find((d) => d.id === doctorId) ?? null;
      setDoctor(found);
      setIsCheckingAuth(false);
    }
  }, [router, doctorId]);

  useEffect(() => {
    if (isCheckingAuth) return;
    const avail = loadPersistedAvailability(doctorId) ?? getDoctorAvailability(doctorId);
    setAvailability(avail);

    const activeDatesList = avail.schedule
      .filter((s) => s.isActive && s.slots.length > 0)
      .map((s) => s.date);

    if (activeDatesList.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const futureDates = activeDatesList.filter((d) => d >= todayStr).sort();
      setSelectedDate(futureDates.length > 0 ? futureDates[0] : activeDatesList[0]);
    }
  }, [doctorId, isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[var(--muted)]">Doctor not found.</p>
      </div>
    );
  }

  const activeDates = availability?.schedule.filter((s) => s.isActive && s.slots.length > 0).map((s) => s.date) ?? [];
  const daySchedule = availability?.schedule.find((s) => s.date === selectedDate);
  const bookedTimes = getBookedTimes(doctor.name, selectedDate);
  const slotsForDay: TimeSlot[] = (daySchedule?.slots ?? []).map((slot) => ({
    ...slot,
    isBooked: slot.isBooked || bookedTimes.includes(slot.start),
  }));
  const selectedSlotObj = slotsForDay.find((s) => s.id === selectedSlotId);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId("");
    setError("");
  };

  const handleBooking = () => {
    if (!selectedSlotId || !selectedSlotObj) {
      setError("Please select a time slot before confirming.");
      return;
    }
    if (!reasonForVisit.trim()) {
      setError("Please describe your reason for visit.");
      return;
    }
    setError("");

    let patientName = "Guest User";
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user = JSON.parse(stored);
        patientName = user.name || user.email.split("@")[0];
      }
    } catch { /* ignore */ }

    if (availability) {
      const updated = {
        ...availability,
        schedule: availability.schedule.map((s) =>
          s.date === selectedDate
            ? { ...s, slots: s.slots.map((sl) => sl.id === selectedSlotId ? { ...sl, isBooked: true } : sl) }
            : s
        ),
      };
      setAvailability(updated);
      saveDoctorAvailability(updated);
    }

    const aptDuration = daySchedule?.slotDuration ?? 30;
    const newAptId = `apt-${Date.now()}`;
    saveAppointment({
      id: newAptId,
      patient: { name: patientName, initials: patientName.substring(0, 2).toUpperCase(), age: 30 },
      clinician: doctor.name,
      specialty: doctor.specialization,
      startsAt: `${selectedDate}T${selectedSlotObj.start}:00`,
      durationMinutes: aptDuration,
      status: "pending",
      reason: reasonForVisit.trim(),
      type: appointmentType,
      appointmentMode,
      room: appointmentMode === "online" ? "Video Call" : "Room TBD",
    });

    saveNotification({
      appointmentId: newAptId,
      patientName,
      message: `Your booking request with ${doctor.name} was sent and is awaiting confirmation.`,
    });

    setIsBooked(true);
  };

  const formattedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Booking Confirmation ────────────────────────────────────────────────────
  if (isBooked && selectedSlotObj) {
    return (
      <>
        <UserPortalHeader title="Booking Confirmed" />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px] rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[var(--ink)]">Appointment Booked!</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Your appointment has been successfully booked and is awaiting confirmation.</p>

            <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 text-left">
              <p className="font-semibold text-[var(--ink)]">{doctor.name}</p>
              <p className="mt-0.5 text-sm text-[var(--brand)]">{doctor.specialization}</p>
              <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Date</span>
                  <span className="font-medium text-[var(--ink)]">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Time</span>
                  <span className="font-medium text-[var(--ink)]">{formatTime(selectedSlotObj.start)} – {formatTime(selectedSlotObj.end)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Type</span>
                  <span className="font-medium text-[var(--ink)]">{appointmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Mode</span>
                  <span className="font-medium text-[var(--ink)]">{appointmentMode === "online" ? "Online (Video)" : "In-person"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/user/appointments")}
                className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
              >
                My Appointments
              </button>
              <button
                onClick={() => router.push("/user/doctors")}
                className="flex-1 rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)]"
              >
                Back to Doctors
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Booking Page ────────────────────────────────────────────────────────────
  return (
    <>
      <UserPortalHeader title="Book Appointment" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-[760px]">
          <Link
            href="/user/doctors"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            <ArrowLeft size={16} />
            Back to doctors
          </Link>

          {/* Doctor Card */}
          <section className="mt-5 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="relative h-[100px] w-[90px] shrink-0 overflow-hidden rounded-lg sm:h-[115px] sm:w-[105px]">
                {doctor.image ? (
                  <Image src={doctor.image} alt={doctor.name} fill priority sizes="(max-width: 640px) 90px, 105px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-teal-50">
                    <UserCircle2 size={52} className="text-[var(--brand)] opacity-60" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h1 className="truncate text-[18px] font-semibold text-[var(--ink)] sm:text-[21px]">{doctor.name}</h1>
                <p className="mt-1 text-sm text-[var(--brand)]">{doctor.specialization}</p>
                <p className="mt-1.5 text-sm text-[var(--muted)]">{doctor.experience}+ Years Experience</p>
                <span className="mt-2 inline-block w-fit rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">{doctor.availability}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-[var(--line)] pt-3">
              <h3 className="text-sm font-semibold text-[var(--ink)]">About Doctor</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{doctor.description}</p>
            </div>
          </section>

          {/* ── Appointment Details ───────────────────────────────────────── */}
          <section className="mt-5 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <FileText size={16} className="text-[var(--brand)]" />
              Appointment Details
            </h2>

            {/* Appointment Type */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <Stethoscope size={12} /> Appointment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {["Consultation", "Check-up"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAppointmentType(t)}
                    className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${
                      appointmentType === t
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment Mode */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Mode
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentMode("in-person")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                    appointmentMode === "in-person"
                      ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)]"
                  }`}
                >
                  <Building2 size={16} /> In-person
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentMode("online")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                    appointmentMode === "online"
                      ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)]"
                  }`}
                >
                  <Video size={16} /> Online
                </button>
              </div>
            </div>

            {/* Reason for Visit */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Reason for Visit <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reasonForVisit}
                onChange={(e) => { setReasonForVisit(e.target.value); setError(""); }}
                rows={3}
                placeholder="Briefly describe your symptoms or reason for visiting (e.g. I have been having headaches for 3 days...)"
                className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400 resize-none"
              />
            </div>
          </section>

          {/* Date & Slot Selectors */}
          <DateSelector selectedDate={selectedDate} onSelectDate={handleDateSelect} activeDates={activeDates} />
          <SlotSelector
            selectedSlot={selectedSlotId}
            onSelectSlot={(id) => { setSelectedSlotId(id); setError(""); }}
            slots={slotsForDay}
          />

          <div className="mt-7 flex flex-col items-center pb-10">
            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
            <button
              type="button"
              onClick={handleBooking}
              className="h-11 w-full max-w-[260px] rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] active:scale-[0.99]"
            >
              Confirm Appointment
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
