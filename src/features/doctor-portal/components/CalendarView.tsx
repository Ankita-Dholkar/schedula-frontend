"use client";

import { useMemo, useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import type { Appointment } from "@/types/appointment";
import {
  getComputedAppointmentStatus,
  rescheduleAppointment,
  saveNotification,
} from "@/lib/mock-data/appointments";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
};

type Props = {
  appointments: Appointment[];
  onToast: (msg: string, type?: "success" | "error") => void;
  onRefresh: () => void;
  onSelectEvent: (apt: Appointment) => void;
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  upcoming:  "#3b82f6",
  confirmed: "#10b981",
  completed: "#6b7280",
  cancelled: "#9ca3af",
  missed:    "#ef4444",
};

/** Whether an appointment can be dragged (rescheduled) */
function isDraggable(apt: Appointment): boolean {
  const cs = getComputedAppointmentStatus(apt);
  return cs === "pending" || cs === "upcoming";
}

export default function CalendarView({ appointments, onToast, onRefresh, onSelectEvent }: Props) {
  const [view, setView] = useState<string>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Convert appointments → calendar events
  const events = useMemo<CalEvent[]>(() =>
    appointments.map((apt) => ({
      id: apt.id,
      title: apt.patient.name,
      start: new Date(apt.startsAt),
      end: new Date(new Date(apt.startsAt).getTime() + apt.durationMinutes * 60000),
      resource: apt,
    })),
    [appointments]
  );

  // Drag-and-drop handler
  const onEventDrop = useCallback(
    ({ event, start }: { event: CalEvent; start: Date | string; end: Date | string }) => {
      const apt = event.resource;
      if (!isDraggable(apt)) {
        onToast("This appointment cannot be rescheduled.", "error");
        return;
      }

      const newStartsAt = new Date(start).toISOString();

      // Conflict check: does another appointment already occupy that slot?
      const overlap = appointments.find((a) => {
        if (a.id === apt.id) return false;
        const cs = getComputedAppointmentStatus(a);
        if (cs === "cancelled" || cs === "missed") return false;
        const aStart = new Date(a.startsAt).getTime();
        const aEnd = aStart + a.durationMinutes * 60000;
        const newStart = new Date(start).getTime();
        const newEnd = newStart + apt.durationMinutes * 60000;
        return newStart < aEnd && newEnd > aStart;
      });

      if (overlap) {
        onToast(`Slot conflicts with ${overlap.patient.name}'s appointment.`, "error");
        return;
      }

      rescheduleAppointment(apt.id, newStartsAt);
      saveNotification({
        appointmentId: apt.id,
        patientName: apt.patient.name,
        message: `Your appointment has been rescheduled to ${moment(newStartsAt).format("dddd, MMM D")} at ${moment(newStartsAt).format("h:mm A")}.`,
      });

      onToast(`Rescheduled for ${moment(newStartsAt).format("ddd, MMM D [at] h:mm A")}`, "success");
      onRefresh();
    },
    [appointments, onToast, onRefresh]
  );

  // Resize handler (end time drag)
  const onEventResize = useCallback(
    ({ event, start, end }: { event: CalEvent; start: Date | string; end: Date | string }) => {
      const apt = event.resource;
      if (!isDraggable(apt)) { onToast("Cannot resize this appointment.", "error"); return; }
      rescheduleAppointment(apt.id, new Date(start).toISOString());
      onToast("Appointment time updated.", "success");
      onRefresh();
    },
    [onToast, onRefresh]
  );

  // Per-event style
  const eventStyleGetter = useCallback((event: CalEvent) => {
    const cs = getComputedAppointmentStatus(event.resource);
    const color = STATUS_COLORS[cs] ?? "#6b7280";
    const draggable = isDraggable(event.resource);
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "#fff",
        borderRadius: "6px",
        fontSize: "12px",
        opacity: draggable ? 1 : 0.65,
        cursor: draggable ? "grab" : "default",
      },
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Custom toolbar legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</p>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5 text-xs capitalize text-[var(--ink)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
        <span className="ml-auto text-xs text-[var(--muted)]">Drag pending / upcoming events to reschedule</span>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden rounded-xl border border-[var(--line)] bg-white [&_.rbc-calendar]:h-full [&_.rbc-toolbar]:px-4 [&_.rbc-toolbar]:py-3 [&_.rbc-toolbar]:border-b [&_.rbc-toolbar]:border-[var(--line)]">
        <DnDCalendar
          localizer={localizer}
          events={events}
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
          draggableAccessor={(event) => isDraggable((event as CalEvent).resource)}
          eventPropGetter={eventStyleGetter as Parameters<typeof DnDCalendar>[0]["eventPropGetter"]}
          onSelectEvent={(event) => onSelectEvent((event as CalEvent).resource)}
          popup
          style={{ height: "100%", minHeight: "600px" }}
          tooltipAccessor={(event) => {
            const apt = (event as CalEvent).resource;
            const cs = getComputedAppointmentStatus(apt);
            return `${apt.patient.name} · ${apt.reason} · ${cs}`;
          }}
        />
      </div>
    </div>
  );
}
