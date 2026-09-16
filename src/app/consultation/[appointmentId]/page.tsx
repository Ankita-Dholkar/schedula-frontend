"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Users, Clock, Wifi, AlertCircle,
} from "lucide-react";
import {
  getAllAppointments,
  startConsultation,
  endConsultation,
  getComputedAppointmentStatus,
} from "@/lib/mock-data/appointments";
import type { Appointment } from "@/types/appointment";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getUserFromStorage(): { name: string; role: "doctor" | "patient" } | null {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return { name: u.name ?? u.email.split("@")[0], role: u.role ?? "patient" };
  } catch { return null; }
}

// ─── Mock Video Tile ──────────────────────────────────────────────────────────

function VideoTile({
  initials,
  name,
  label,
  isMuted = false,
  isSmall = false,
}: {
  initials: string;
  name: string;
  label?: string;
  isMuted?: boolean;
  isSmall?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner ${
        isSmall ? "h-32 w-48 sm:h-36 sm:w-56" : "h-full w-full"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 font-bold text-white shadow-lg ${
          isSmall ? "h-12 w-12 text-lg" : "h-24 w-24 text-3xl"
        }`}
      >
        {initials}
      </div>
      <p className={`mt-3 font-semibold text-white ${isSmall ? "text-xs" : "text-base"}`}>{name}</p>
      {label && (
        <span className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
          {label}
        </span>
      )}
      {isMuted && (
        <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90">
          <MicOff size={10} className="text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: "doctor" | "patient" } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load appointment + start consultation on mount
  useEffect(() => {
    const user = getUserFromStorage();
    if (!user) { router.push("/login"); return; }
    setCurrentUser(user);

    const allApts = getAllAppointments();
    const apt = allApts.find((a) => a.id === appointmentId) ?? null;

    if (!apt) { setNotFound(true); setIsLoading(false); return; }
    if (apt.appointmentMode !== "online") {
      // In-person appointments should not enter this screen
      router.push(user.role === "doctor" ? "/doctor/appointments" : "/user/appointments");
      return;
    }

    const computed = getComputedAppointmentStatus(apt);
    if (computed !== "starting-soon" && computed !== "live" && computed !== "confirmed") {
      // Past, cancelled or missed — redirect
      router.push(user.role === "doctor" ? "/doctor/appointments" : "/user/appointments");
      return;
    }

    setAppointment(apt);
    setIsLoading(false);

    // Mark as started
    startConsultation(appointmentId);

    // Calculate elapsed time based on when appointment actually started
    const startMs = new Date(apt.startsAt).getTime();
    const nowMs = Date.now();
    const alreadyElapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    setElapsedSeconds(alreadyElapsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // Countdown timer
  useEffect(() => {
    if (!appointment || isLoading) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [appointment, isLoading]);

  const handleEnd = useCallback(async () => {
    setIsEnding(true);
    endConsultation(appointmentId);
    // Brief pause for UX
    await new Promise((r) => setTimeout(r, 800));
    const role = currentUser?.role ?? "patient";
    router.push(role === "doctor" ? "/doctor/dashboard" : "/user/appointments");
  }, [appointmentId, currentUser, router]);

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Joining consultation…</p>
        </div>
      </main>
    );
  }

  if (notFound || !appointment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={48} className="text-red-400" />
          <h1 className="text-xl font-semibold text-white">Appointment Not Found</h1>
          <p className="text-sm text-slate-400">This consultation session could not be loaded.</p>
          <button
            onClick={() => router.back()}
            className="mt-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const isDoctor = currentUser?.role === "doctor";
  const doctorInitials = appointment.clinician.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const patientInitials = appointment.patient.initials;
  const userInitials = isDoctor ? doctorInitials : patientInitials;
  const otherName = isDoctor ? appointment.patient.name : appointment.clinician;
  const otherInitials = isDoctor ? patientInitials : doctorInitials;
  const otherLabel = isDoctor ? "Patient" : "Doctor";
  const totalDuration = appointment.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Live pulse */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-sm font-semibold text-green-400">Live Consultation</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock size={14} />
            <span className="font-mono text-sm font-semibold">{formatDuration(elapsedSeconds)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
            <span>Remaining:</span>
            <span className="font-mono font-semibold text-slate-400">{formatDuration(remainingSeconds)}</span>
          </div>
        </div>

        {/* Participants count */}
        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
          <Users size={14} />
          <span>2 participants</span>
        </div>
      </header>

      {/* ── Appointment info strip ───────────────────────────────────── */}
      <div className="flex items-center gap-4 bg-slate-900/60 px-5 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Wifi size={11} className="text-green-400" />
          <span className="font-medium text-green-400">Connected</span>
        </div>
        <span className="text-slate-600">·</span>
        <span>{appointment.clinician}</span>
        <span className="text-slate-600">·</span>
        <span>{appointment.specialty}</span>
        <span className="text-slate-600">·</span>
        <span>{appointment.reason}</span>
      </div>

      {/* ── Video area ──────────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 p-4">

        {/* Main tile — other participant */}
        <div className="h-full w-full max-h-[70vh] max-w-4xl">
          <VideoTile
            initials={otherInitials}
            name={otherName}
            label={otherLabel}
          />
        </div>

        {/* Self tile — picture-in-picture */}
        <div className="absolute bottom-6 right-6 overflow-hidden rounded-xl shadow-2xl ring-2 ring-white/10">
          <VideoTile
            initials={userInitials}
            name="You"
            isSmall
            isMuted={!isMicOn}
          />
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 bg-slate-900 px-6 py-5">

        {/* Mic */}
        <button
          onClick={() => setIsMicOn((v) => !v)}
          title={isMicOn ? "Mute mic" : "Unmute mic"}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isMicOn
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera */}
        <button
          onClick={() => setIsVideoOn((v) => !v)}
          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isVideoOn
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* End call */}
        <button
          onClick={handleEnd}
          disabled={isEnding}
          title="End consultation"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
        >
          {isEnding ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <PhoneOff size={22} />
          )}
        </button>
      </div>

      {/* ── End label ───────────────────────────────────────────────── */}
      <p className="bg-slate-900 pb-3 text-center text-[11px] text-slate-600">
        Click the red button to end the consultation and return to your portal.
      </p>
    </main>
  );
}
