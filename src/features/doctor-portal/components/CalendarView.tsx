"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import type { Appointment } from "@/types/appointment";
import type { DoctorAvailability } from "@/types/availability";
import {
  getComputedAppointmentStatus,
  rescheduleAppointment,
  saveNotification,
} from "@/lib/mock-data/appointments";
import { loadPersistedAvailability } from "@/lib/mock-data/availability";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// ─── Types ────────────────────────────────────────────────────────────────────

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  isAvailabilitySlot?: false;
  isBookedSlot?: false;
};

type AvailEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAvailabilitySlot: true;
  isBookedSlot?: false;
};

type BookedSlotEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAvailabilitySlot?: false;
  isBookedSlot: true;
};

type AnyEvent = CalEvent | AvailEvent | BookedSlotEvent;

type Props = {
  appointments: Appointment[];
  onToast: (msg: string, type?: "success" | "error") => void;
  onRefresh: () => void;
  onSelectEvent: (apt: Appointment) => void;
  doctorId?: string;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Only upcoming (confirmed + future) and pending can be dragged */
function isDraggable(apt: Appointment): boolean {
  const cs = getComputedAppointmentStatus(apt);
  return cs === "pending" || cs === "upcoming" || cs === "confirmed";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  upcoming: "#3b82f6",
  confirmed: "#10b981",
  completed: "#6b7280",
  cancelled: "#9ca3af",
  missed: "#ef4444",
};

// ─── Availability overlay helpers ─────────────────────────────────────────────

function buildAvailabilityEvents(avail: DoctorAvailability | null): (AvailEvent | BookedSlotEvent)[] {
  if (!avail || !avail.schedule) return [];
  const events: (AvailEvent | BookedSlotEvent)[] = [];

  avail.schedule.forEach((dateSchedule) => {
    if (!dateSchedule.isActive || !dateSchedule.slots?.length) return;
    dateSchedule.slots.forEach((slot) => {
      if (slot.isBooked) return; // Skip booked slots so they don't show on calendar

      const [sh, sm] = slot.start.split(":").map(Number);
      const [eh, em] = slot.end.split(":").map(Number);
      const [y, mo, d] = dateSchedule.date.split("-").map(Number);
      const slotStart = new Date(y, mo - 1, d, sh, sm, 0);
      const slotEnd = new Date(y, mo - 1, d, eh, em, 0);

      events.push({
        id: `avail-${slot.id}`,
        title: "Available",
        start: slotStart,
        end: slotEnd,
        isAvailabilitySlot: true,
      });
    });
  });

  return events;
}

/**
 * Returns true when the given newStart falls within at least one AVAILABLE (unbooked)
 * slot in the doctor's schedule, and the slot has not passed.
 */
function isWithinAvailableSlot(
  avail: DoctorAvailability | null,
  newStart: Date,
  _durationMinutes: number
): boolean {
  if (!avail || !avail.schedule || avail.schedule.length === 0) return true; // open schedule

  const dateStr = moment(newStart).format("YYYY-MM-DD");
  const dateSchedule = avail.schedule.find((s) => s.date === dateStr);

  // If no schedule configured for that date, allow freely (no restriction)
  if (!dateSchedule || !dateSchedule.isActive || !dateSchedule.slots?.length) return false;

  const dropHHMM = newStart.getHours() * 60 + newStart.getMinutes();

  // Check if the drop time falls inside ANY unbooked slot on that date
  return dateSchedule.slots.some((slot) => {
    if (slot.isBooked) return false;
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    const slotStartMin = sh * 60 + sm;
    const slotEndMin = eh * 60 + em;
    // Drop point must land at or after slot start and before slot end
    return dropHHMM >= slotStartMin && dropHHMM < slotEndMin;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarView({
  appointments,
  onToast,
  onRefresh,
  onSelectEvent,
  doctorId,
}: Props) {
  const [view, setView] = useState<string>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);

  // Load availability for the logged-in doctor
  useEffect(() => {
    const resolvedId =
      doctorId ??
      (() => {
        try {
          const u = localStorage.getItem("loggedInUser");
          return u ? (JSON.parse(u) as { id: string }).id : undefined;
        } catch {
          return undefined;
        }
      })();

    if (resolvedId) {
      const avail = loadPersistedAvailability(resolvedId);
      setAvailability(avail);
    }
  }, [doctorId]);

  // Convert appointments → calendar events (show all statuses)
  const appointmentEvents = useMemo<CalEvent[]>(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: apt.patient.name,
        start: new Date(apt.startsAt),
        end: new Date(new Date(apt.startsAt).getTime() + apt.durationMinutes * 60_000),
        resource: apt,
        isAvailabilitySlot: false as const,
        isBookedSlot: false as const,
      })),
    [appointments]
  );

  // Build availability overlay events (both available and booked slots)
  const availabilityEvents = useMemo(
    () => buildAvailabilityEvents(availability),
    [availability]
  );

  const allEvents: AnyEvent[] = useMemo(
    () => [...appointmentEvents, ...availabilityEvents],
    [appointmentEvents, availabilityEvents]
  );

  // ── Drag-and-drop handler ──────────────────────────────────────────────────
  const onEventDrop = useCallback(
    ({
      event,
      start,
    }: {
      event: AnyEvent;
      start: Date | string;
      end: Date | string;
    }) => {
      // Availability / booked slots can't be dragged
      if ((event as AnyEvent).isAvailabilitySlot || (event as AnyEvent).isBookedSlot) return;

      const calEvent = event as CalEvent;
      const apt = calEvent.resource;

      // Guard: only pending / upcoming / confirmed can be rescheduled
      if (!isDraggable(apt)) {
        onToast(
          "Only pending, upcoming, or confirmed appointments can be rescheduled.",
          "error"
        );
        return;
      }

      const newStart = new Date(start);
      const now = new Date();

      // Guard: slot start time must not have passed yet
      if (newStart.getTime() < now.getTime()) {
        onToast("Cannot reschedule to a time that has already passed.", "error");
        return;
      }

      // Guard: must fall within an available (unbooked) slot
      if (availability && availability.schedule.length > 0) {
        if (!isWithinAvailableSlot(availability, newStart, apt.durationMinutes)) {
          onToast(
            "The selected time is outside your available slots or the slot is already booked. Please drop onto a green dashed slot.",
            "error"
          );
          return;
        }
      }

      // Guard: conflict / double-booking check
      const newEnd = new Date(newStart.getTime() + apt.durationMinutes * 60_000);
      const overlap = appointments.find((a) => {
        if (a.id === apt.id) return false;
        const cs = getComputedAppointmentStatus(a);
        if (cs === "cancelled" || cs === "missed" || cs === "completed") return false;
        const aStart = new Date(a.startsAt).getTime();
        const aEnd = aStart + a.durationMinutes * 60_000;
        return newStart.getTime() < aEnd && newEnd.getTime() > aStart;
      });

      if (overlap) {
        onToast(
          `Slot conflicts with ${overlap.patient.name}'s appointment.`,
          "error"
        );
        return;
      }

      const newStartsAt = newStart.toISOString();
      rescheduleAppointment(apt.id, newStartsAt);
      saveNotification({
        appointmentId: apt.id,
        patientName: apt.patient.name,
        message: `Your appointment has been rescheduled to ${moment(newStartsAt).format(
          "dddd, MMM D"
        )} at ${moment(newStartsAt).format("h:mm A")}.`,
      });

      onToast(
        `✓ Rescheduled for ${moment(newStartsAt).format("ddd, MMM D [at] h:mm A")}`,
        "success"
      );
      onRefresh();
    },
    [appointments, availability, onToast, onRefresh]
  );

  // ── Resize handler ────────────────────────────────────────────────────────
  const onEventResize = useCallback(
    ({
      event,
      start,
    }: {
      event: AnyEvent;
      start: Date | string;
      end: Date | string;
    }) => {
      if ((event as AnyEvent).isAvailabilitySlot || (event as AnyEvent).isBookedSlot) return;
      const calEvent = event as CalEvent;
      const apt = calEvent.resource;
      if (!isDraggable(apt)) {
        onToast("Cannot resize this appointment.", "error");
        return;
      }
      rescheduleAppointment(apt.id, new Date(start).toISOString());
      onToast("Appointment time updated.", "success");
      onRefresh();
    },
    [onToast, onRefresh]
  );

  // ── Per-event styling ─────────────────────────────────────────────────────
  const eventStyleGetter = useCallback((event: AnyEvent) => {
    // Booked slots — subtle red/rose overlay
    if ((event as BookedSlotEvent).isBookedSlot) {
      return {
        style: {
          backgroundColor: "rgba(239,68,68,0.07)",
          border: "1.5px dashed #ef4444",
          color: "#dc2626",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 500,
          cursor: "default",
          pointerEvents: "none" as const,
        },
      };
    }

    // Availability background slots — green dashed
    if (event.isAvailabilitySlot) {
      return {
        style: {
          backgroundColor: "rgba(16,185,129,0.08)",
          border: "1.5px dashed #10b981",
          color: "#059669",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 500,
          cursor: "default",
          pointerEvents: "none" as const,
        },
      };
    }

    const calEvent = event as CalEvent;
    const cs = getComputedAppointmentStatus(calEvent.resource);
    const color = STATUS_COLORS[cs] ?? "#6b7280";
    const draggable = isDraggable(calEvent.resource);

    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "#fff",
        borderRadius: "6px",
        fontSize: "12px",
        opacity: draggable ? 1 : 0.65,
        cursor: draggable ? "grab" : "not-allowed",
        boxShadow: draggable ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
      },
    };
  }, []);

  // ── draggableAccessor — only appointment events are draggable ─────────────
  const draggableAccessor = useCallback(
    (event: AnyEvent) =>
      !event.isAvailabilitySlot &&
      !(event as BookedSlotEvent).isBookedSlot &&
      isDraggable((event as CalEvent).resource),
    []
  );

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const tooltipAccessor = useCallback((event: AnyEvent) => {
    if (event.isAvailabilitySlot) return "Available slot — drop appointment here";
    const apt = (event as CalEvent).resource;
    const cs = getComputedAppointmentStatus(apt);
    const draggable = isDraggable(apt);
    return `${apt.patient.name} · ${apt.reason} · ${cs}${!draggable ? " (read-only)" : " — drag to any available green slot"
      }`;
  }, []);

  // ── Legend items — only relevant statuses shown ───────────────────────────
  const legendItems = [
    { label: "Upcoming", color: STATUS_COLORS.upcoming, dashed: false },
    { label: "Confirmed", color: STATUS_COLORS.confirmed, dashed: false },
    { label: "Available Slot", color: "#10b981", dashed: true },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Legend + hint */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--line)] bg-white px-4 py-3 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mr-2">
          Legend
        </p>
        {legendItems.map(({ label, color, dashed }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-[var(--ink)]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: dashed ? "transparent" : color,
                border: dashed ? `2px dashed ${color}` : "none",
              }}
            />
            {label}
          </span>
        ))}
        <span className="ml-auto text-xs text-[var(--muted)]">
          Drag <strong>pending/upcoming/confirmed</strong> appointments onto any green slot (any day)
        </span>
      </div>

      {/* Calendar */}
      <div
        className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[var(--line)] bg-white
          [&_.rbc-calendar]:h-full
          [&_.rbc-toolbar]:px-4 [&_.rbc-toolbar]:py-3 [&_.rbc-toolbar]:border-b [&_.rbc-toolbar]:border-[var(--line)]
          [&_.rbc-toolbar-label]:font-semibold [&_.rbc-toolbar-label]:text-[var(--ink)]
          [&_.rbc-btn-group_button]:rounded-lg [&_.rbc-btn-group_button]:border [&_.rbc-btn-group_button]:border-[var(--line)] [&_.rbc-btn-group_button]:text-sm [&_.rbc-btn-group_button]:px-3 [&_.rbc-btn-group_button]:py-1.5 [&_.rbc-btn-group_button]:transition
          [&_.rbc-active]:bg-[var(--brand)] [&_.rbc-active]:text-white [&_.rbc-active]:border-[var(--brand)]
          [&_.rbc-today]:bg-blue-50/60
          [&_.rbc-current-time-indicator]:bg-[var(--brand)]"
      >
        <DnDCalendar
          localizer={localizer}
          events={allEvents}
          view={view as any}
          onView={(v) => setView(v)}
          date={date}
          onNavigate={setDate}
          views={[Views.DAY, Views.WEEK, Views.MONTH]}
          step={30}
          timeslots={2}
          defaultView={Views.WEEK}
          onEventDrop={onEventDrop as any}
          onEventResize={onEventResize as any}
          resizable
          draggableAccessor={draggableAccessor as any}
          eventPropGetter={eventStyleGetter as any}
          onSelectEvent={(event) => {
            if (!(event as AnyEvent).isAvailabilitySlot && !(event as BookedSlotEvent).isBookedSlot) {
              onSelectEvent((event as CalEvent).resource);
            }
          }}
          popup
          style={{ height: "100%", minHeight: "560px" }}
          tooltipAccessor={tooltipAccessor as any}
        />
      </div>
    </div>
  );
}
