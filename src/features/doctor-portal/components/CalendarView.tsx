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
};

type AvailEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAvailabilitySlot: true;
};

type AnyEvent = CalEvent | AvailEvent;

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
  return cs === "pending" || cs === "upcoming";
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  upcoming:  "#3b82f6",
  confirmed: "#10b981",
  completed: "#6b7280",
  cancelled: "#9ca3af",
  missed:    "#ef4444",
};

// ─── Availability overlay helpers ─────────────────────────────────────────────

function buildAvailabilityEvents(avail: DoctorAvailability | null): AvailEvent[] {
  if (!avail || !avail.schedule) return [];
  const events: AvailEvent[] = [];

  avail.schedule.forEach((dateSchedule) => {
    if (!dateSchedule.isActive || !dateSchedule.slots?.length) return;
    dateSchedule.slots.forEach((slot) => {
      if (slot.isBooked) return; // already occupied — skip
      const [sh, sm] = slot.start.split(":").map(Number);
      const [eh, em] = slot.end.split(":").map(Number);
      const [y, mo, d] = dateSchedule.date.split("-").map(Number);
      events.push({
        id: `avail-${slot.id}`,
        title: "Available",
        start: new Date(y, mo - 1, d, sh, sm, 0),
        end:   new Date(y, mo - 1, d, eh, em, 0),
        isAvailabilitySlot: true,
      });
    });
  });

  return events;
}

/**
 * Returns true when the given [newStart, newEnd) interval falls entirely within
 * at least one available slot in the doctor's schedule.
 */
function isWithinAvailability(
  avail: DoctorAvailability | null,
  newStart: Date,
  durationMinutes: number
): boolean {
  if (!avail || !avail.schedule) return true; // no schedule configured → allow (open schedule)

  const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);
  const dateStr = moment(newStart).format("YYYY-MM-DD");
  const dateSchedule = avail.schedule.find((s) => s.date === dateStr);

  if (!dateSchedule || !dateSchedule.isActive || !dateSchedule.slots?.length) return false;

  return dateSchedule.slots.some((slot) => {
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    const slotStart = new Date(newStart);
    slotStart.setHours(sh, sm, 0, 0);
    const slotEnd = new Date(newStart);
    slotEnd.setHours(eh, em, 0, 0);
    // The appointment window must fit entirely inside the slot
    return newStart >= slotStart && newEnd <= slotEnd;
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

  // Convert appointments → calendar events
  const appointmentEvents = useMemo<CalEvent[]>(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: apt.patient.name,
        start: new Date(apt.startsAt),
        end: new Date(new Date(apt.startsAt).getTime() + apt.durationMinutes * 60_000),
        resource: apt,
        isAvailabilitySlot: false as const,
      })),
    [appointments]
  );

  // Build availability overlay events
  const availabilityEvents = useMemo<AvailEvent[]>(
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
      // Availability slots can't be dragged
      if ((event as AnyEvent).isAvailabilitySlot) return;

      const calEvent = event as CalEvent;
      const apt = calEvent.resource;

      // Guard: only pending / upcoming can be rescheduled
      if (!isDraggable(apt)) {
        onToast(
          "Only pending or upcoming appointments can be rescheduled.",
          "error"
        );
        return;
      }

      const newStart = new Date(start);

      // Guard: must be a future time
      if (newStart.getTime() <= Date.now()) {
        onToast("Cannot reschedule to a past time.", "error");
        return;
      }

      // Guard: must fall within an available slot (if the doctor has set availability)
      if (availability && availability.schedule.length > 0) {
        if (!isWithinAvailability(availability, newStart, apt.durationMinutes)) {
          onToast(
            "The selected time is outside your available slots. Please choose an available slot.",
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
      if ((event as AnyEvent).isAvailabilitySlot) return;
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
    // Availability background slots
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

  // ── draggableAccessor — availability events are not draggable ─────────────
  const draggableAccessor = useCallback(
    (event: AnyEvent) =>
      !event.isAvailabilitySlot && isDraggable((event as CalEvent).resource),
    []
  );

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const tooltipAccessor = useCallback((event: AnyEvent) => {
    if (event.isAvailabilitySlot) return "Available slot";
    const apt = (event as CalEvent).resource;
    const cs = getComputedAppointmentStatus(apt);
    const draggable = isDraggable(apt);
    return `${apt.patient.name} · ${apt.reason} · ${cs}${
      !draggable ? " (read-only)" : " — drag to reschedule"
    }`;
  }, []);

  // ── Legend items ──────────────────────────────────────────────────────────
  const legendItems = [
    ...Object.entries(STATUS_COLORS).map(([status, color]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color,
      dashed: false,
    })),
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
          view={view as Parameters<typeof DnDCalendar>[0]["view"]}
          onView={(v) => setView(v)}
          date={date}
          onNavigate={setDate}
          views={[Views.DAY, Views.WEEK, Views.MONTH]}
          step={30}
          timeslots={2}
          defaultView={Views.WEEK}
          onEventDrop={onEventDrop as Parameters<typeof DnDCalendar>[0]["onEventDrop"]}
          onEventResize={onEventResize as Parameters<typeof DnDCalendar>[0]["onEventResize"]}
          resizable
          draggableAccessor={draggableAccessor as Parameters<typeof DnDCalendar>[0]["draggableAccessor"]}
          eventPropGetter={eventStyleGetter as Parameters<typeof DnDCalendar>[0]["eventPropGetter"]}
          onSelectEvent={(event) => {
            if (!(event as AnyEvent).isAvailabilitySlot) {
              onSelectEvent((event as CalEvent).resource);
            }
          }}
          popup
          style={{ height: "100%", minHeight: "560px" }}
          tooltipAccessor={tooltipAccessor as Parameters<typeof DnDCalendar>[0]["tooltipAccessor"]}
        />
      </div>
    </div>
  );
}
