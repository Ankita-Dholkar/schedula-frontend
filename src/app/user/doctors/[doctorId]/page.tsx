"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowLeft,
  Stethoscope,
  Video,
  Building2,
  FileText,
  CreditCard,
  ShieldCheck,
  MapPin,
  Clock,
  Award,
  GraduationCap,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";

import { getAllDoctors, getDoctorFullAddress, formatDoctorLocation } from "@/lib/mock-data/doctors";
import { getAllAppointments, saveAppointment, saveNotification, saveDoctorNotification } from "@/lib/mock-data/appointments";
import { getDoctorAvailability, loadPersistedAvailability, saveDoctorAvailability } from "@/lib/mock-data/availability";
import type { DoctorAvailability, TimeSlot } from "@/types/availability";
import { CONSULTATION_FEE, type PaymentMethod } from "@/types/payment";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recordPaidPayment } from "@/store/slices/paymentsSlice";
import { refreshAppointments } from "@/store/slices/appointmentsSlice";
import { selectAverageRating, selectDoctorReviews } from "@/store/slices/reviewsSlice";

import DateSelector from "@/features/booking/components/DateSelector";
import SlotSelector from "@/features/booking/components/SlotSelector";
import DemoPaymentModal from "@/features/booking/components/DemoPaymentModal";
import UserPortalHeader from "@/features/user-portal/components/UserPortalHeader";
import VoiceInputButton from "@/features/user-portal/components/VoiceInputButton";
import ReviewsDrawer from "@/features/doctors/components/ReviewsDrawer";

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
  const dispatch = useAppDispatch();
  const doctorId = params.doctorId as string;
  // Use local date (not UTC) to avoid timezone off-by-one-day bug
  const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = toLocalDateStr(new Date());

  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [doctor, setDoctor] = useState<ReturnType<typeof getAllDoctors>[number] | null>(null);
  // Payment state
  const [bookedAptId, setBookedAptId] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paidTransactionId, setPaidTransactionId] = useState("");

  // New booking detail fields
  const [appointmentType, setAppointmentType] = useState("Consultation");
  const [appointmentMode, setAppointmentMode] = useState<"in-person" | "online">("in-person");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ratings & reviews for this doctor
  const avgRating = useAppSelector((state) =>
    selectAverageRating(state, doctor?.id || doctor?.name || doctorId)
  );
  const reviews = useAppSelector((state) =>
    selectDoctorReviews(state, doctor?.id || doctor?.name || doctorId)
  );
  const reviewCount = reviews.length;

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
      router.push("/login");
    } else {
      const loadDoctor = () => {
        const found = getAllDoctors().find((d) => d.id === doctorId) ?? null;
        setDoctor(found);
      };
      loadDoctor();
      setIsCheckingAuth(false);
      window.addEventListener("storage", loadDoctor);
      window.addEventListener("schedula_doctor_updated", loadDoctor);
      return () => {
        window.removeEventListener("storage", loadDoctor);
        window.removeEventListener("schedula_doctor_updated", loadDoctor);
      };
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
      const todayStr = toLocalDateStr(new Date());
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

  // ── handleBooking: local hold only — no writes to Redux or localStorage ──────
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

    // Generate the appointment ID ahead of time so it is shared across all steps
    const newAptId = `apt-${Date.now()}`;
    setBookedAptId(newAptId);
    // Transition to the payment-required screen (local state only)
    setIsBooked(true);
  };

  // ── handlePaymentSuccess: single finalization flow after payment ───────────
  const handlePaymentSuccess = (txId: string, method: PaymentMethod) => {
    if (!selectedSlotObj) return;

    let patientName = "Guest User";
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) {
        const user = JSON.parse(stored);
        patientName = user.name || user.email.split("@")[0];
      }
    } catch { /* ignore */ }

    // Step 1: Mark the slot as booked in availability
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

    // Step 2: Finalize and persist the confirmed appointment
    const currentFee = appointmentType.toLowerCase().includes("check")
      ? (doctor.checkupFee ?? 800)
      : (doctor.consultationFee ?? 500);
    const aptDuration = daySchedule?.slotDuration ?? 30;
    saveAppointment({
      id: bookedAptId,
      patient: { name: patientName, initials: patientName.substring(0, 2).toUpperCase(), age: 30 },
      clinician: doctor.name,
      specialty: doctor.specialization,
      startsAt: `${selectedDate}T${selectedSlotObj.start}:00`,
      durationMinutes: aptDuration,
      status: "confirmed",
      reason: reasonForVisit.trim(),
      type: appointmentType,
      appointmentMode,
      ...(appointmentMode === "in-person"
        ? {
            location: {
              name: doctor.hospitalName || doctor.clinic?.name || "Consultation Clinic",
              address: getDoctorFullAddress(doctor),
            },
            room: undefined,
          }
        : {}),
      consultationFee: currentFee,
      paymentStatus: "paid",
      transactionId: txId,
      paymentMethod: method,
    });

    // Step 3: Record the paid payment in Redux (store subscriber persists to localStorage)
    dispatch(
      recordPaidPayment({
        id: `pay-${bookedAptId}`,
        appointmentId: bookedAptId,
        amount: currentFee,
        method,
        status: "paid",
        transactionId: txId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    // Step 4: Refresh Redux appointments so all views stay in sync
    dispatch(refreshAppointments());

    // Step 5: Save notifications for patient and doctor
    saveNotification({
      appointmentId: bookedAptId,
      patientName,
      message: `Your appointment with ${doctor.name} is confirmed. Transaction ID: ${txId}`,
    });
    saveDoctorNotification({
      appointmentId: bookedAptId,
      patientName,
      message: `${patientName} has confirmed an appointment with you. Transaction ID: ${txId}`,
      doctorId: doctor.id,
    });

    // Step 6: Update local UI state to show confirmation
    setPaidTransactionId(txId);
    setPaymentDone(true);
    setShowPaymentModal(false);
  };

  const formattedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Booking Confirmation ────────────────────────────────────────────────────
  if (isBooked && selectedSlotObj) {
    return (
      <>
        <UserPortalHeader title={paymentDone ? "Booking Confirmed" : "Payment Required"} />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px] rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">

            {/* Icon */}
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              paymentDone ? "bg-emerald-50" : "bg-amber-50"
            }`}>
              {paymentDone
                ? <CheckCircle2 size={32} className="text-emerald-500" />
                : <CreditCard size={28} className="text-amber-500" />
              }
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-[var(--ink)]">
              {paymentDone ? "Appointment Confirmed!" : "Appointment Booked!"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {paymentDone
                ? "Your payment was successful and your appointment is confirmed."
                : "Complete payment to confirm your appointment."}
            </p>

            {/* Appointment summary */}
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4 text-left">
              <p className="font-semibold text-[var(--ink)]">{doctor.name}</p>
              <p className="mt-0.5 text-sm text-[var(--brand)]">{doctor.specialization}</p>
              <div className="mt-4 space-y-2.5 border-t border-[var(--line)] pt-4 text-sm">
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
                {appointmentMode === "in-person" && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--muted)]">Location</span>
                    <span className="font-medium text-[var(--ink)] text-right">{getDoctorFullAddress(doctor)}</span>
                  </div>
                )}
                {/* Payment row */}
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5">
                  <span className="text-[var(--muted)]">{appointmentType} Fee</span>
                  <span className="font-bold text-[var(--ink)]">
                    ₹{appointmentType.toLowerCase().includes("check") ? (doctor.checkupFee ?? 800) : (doctor.consultationFee ?? 500)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Payment</span>
                  {paymentDone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      Pending
                    </span>
                  )}
                </div>
                {paymentDone && paidTransactionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Transaction ID</span>
                    <span className="font-mono text-xs font-semibold text-[var(--ink)]">{paidTransactionId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              {!paymentDone && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-deep)]"
                >
                  <CreditCard size={16} /> Pay Now — ₹{appointmentType.toLowerCase().includes("check") ? (doctor.checkupFee ?? 800) : (doctor.consultationFee ?? 500)}
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/user/appointments")}
                  className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
                >
                  My Appointments
                </button>
                <button
                  onClick={() => router.push("/user/doctors")}
                  className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50"
                >
                  Back to Doctors
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPaymentModal && (
          <DemoPaymentModal
            appointmentId={bookedAptId}
            amount={appointmentType.toLowerCase().includes("check") ? (doctor.checkupFee ?? 800) : (doctor.consultationFee ?? 500)}
            feeLabel={`${appointmentType} Fee`}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={(txId, method) => handlePaymentSuccess(txId, method)}
          />
        )}
      </>
    );
  }

  // ── Booking Page ─
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
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Doctor Avatar */}
              <div className="relative h-[110px] w-[100px] shrink-0 overflow-hidden rounded-xl sm:h-[135px] sm:w-[120px]">
                {doctor.image ? (
                  <Image src={doctor.image} alt={doctor.name} fill priority sizes="(max-width: 640px) 100px, 120px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-teal-50">
                    <UserCircle2 size={60} className="text-[var(--brand)] opacity-60" />
                  </div>
                )}
              </div>

              {/* Doctor Main Information */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-[19px] font-bold text-[var(--ink)] sm:text-[22px]">{doctor.name}</h1>
                    {(doctor.verificationStatus === "approved" || doctor.verificationStatus === "verified") && (
                      <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700">Verified Doctor</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-0.5 text-sm font-semibold text-[var(--brand)]">{doctor.specialization}</p>

                  {/* Rating + Reviews (Clickable) */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      title="Click to view patient reviews"
                      className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -ml-1 text-xs transition hover:bg-amber-50 group border border-transparent hover:border-amber-200"
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className={`text-[12px] ${
                              reviewCount > 0 && avgRating >= s
                                ? "text-amber-400"
                                : reviewCount > 0 && avgRating >= s - 0.5
                                ? "text-amber-300"
                                : "text-gray-200"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {reviewCount > 0 ? (
                        <>
                          <span className="font-bold text-[var(--ink)]">{avgRating.toFixed(1)}</span>
                          <span className="text-[var(--muted)]">({reviewCount} reviews)</span>
                        </>
                      ) : (
                        <span className="text-[var(--muted)]">No reviews yet</span>
                      )}
                      <span className="text-[10px] text-[var(--brand)] font-medium underline underline-offset-2 ml-1">View</span>
                    </button>

                    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {doctor.availability}
                    </span>
                  </div>

                  {/* Key metadata pills / badges: Qualification, Experience, License, Fees */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-[var(--muted)]">
                    {doctor.qualification && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 font-medium text-[var(--ink)]">
                        <GraduationCap size={13} className="text-[var(--brand)]" />
                        {doctor.qualification}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 font-medium text-[var(--ink)]">
                      <Award size={13} className="text-[var(--brand)]" />
                      {doctor.experience}+ Years Exp
                    </span>
                    {doctor.licenseNumber && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-[var(--muted)]">
                        Reg: <strong className="font-medium text-[var(--ink)]">{doctor.licenseNumber}</strong>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                      Consultation: ₹{doctor.consultationFee ?? 500}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2.5 py-1 font-semibold text-teal-800">
                      Check-up: ₹{doctor.checkupFee ?? 800}
                    </span>
                  </div>
                </div>

                {/* Location & Consultation Hours Strip */}
                <div className="mt-3.5 pt-3 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Location Info */}
                  <div className="flex items-start gap-2 rounded-lg bg-[var(--canvas)] p-2.5 border border-[var(--line)]">
                    <MapPin size={15} className="text-[var(--brand)] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)] truncate">
                        {doctor.hospitalName || doctor.clinic?.name || "Consultation Clinic"}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                        {getDoctorFullAddress(doctor)}
                      </p>
                    </div>
                  </div>

                  {/* Consultation Timings */}
                  <div className="flex items-start gap-2 rounded-lg bg-[var(--canvas)] p-2.5 border border-[var(--line)]">
                    <Clock size={15} className="text-[var(--brand)] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)]">Consultation Hours</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {doctor.availableTime || "09:00 AM - 05:00 PM"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Doctor section */}
            <div className="mt-4 border-t border-[var(--line)] pt-3.5">
              <h3 className="text-sm font-semibold text-[var(--ink)]">About Doctor</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {doctor.description}
              </p>
            </div>
          </section>

          {/* Patient Reviews Slide-in Drawer */}
          <ReviewsDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            doctorName={doctor.name}
            avgRating={avgRating}
            reviews={reviews}
          />

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
              <div className="flex flex-wrap gap-2.5">
                {["Consultation", "Check-up"].map((t) => {
                  const fee = t.toLowerCase().includes("check") ? (doctor.checkupFee ?? 800) : (doctor.consultationFee ?? 500);
                  const isSelected = appointmentType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAppointmentType(t)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-sm"
                          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      }`}
                    >
                      <span>{t}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-[var(--ink)]"
                        }`}
                      >
                        ₹{fee}
                      </span>
                    </button>
                  );
                })}
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
              <div className="relative">
                <textarea
                  value={reasonForVisit}
                  onChange={(e) => { setReasonForVisit(e.target.value); setError(""); }}
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for visiting (e.g. I have been having headaches for 3 days...)"
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 pr-12 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] placeholder:text-stone-400 resize-none"
                />
                <div className="absolute right-2 top-2">
                  <VoiceInputButton
                    onTranscript={(text) => {
                      setReasonForVisit((prev) =>
                        prev.trim() ? `${prev.trim()} ${text}` : text
                      );
                      setError("");
                    }}
                  />
                </div>
              </div>
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
