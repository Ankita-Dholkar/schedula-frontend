import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { paymentsSlice } from "./paymentsSlice";
import {
  getAllAppointments,
  updateAppointmentStatus as persistStatus,
  rescheduleAppointment as persistReschedule,
  saveAppointment as persistSaveAppointment,
  getNotifications as loadNotifications,
  getDoctorNotifications as loadDoctorNotifications,
  markNotificationRead as persistMarkRead,
  markDoctorNotificationRead as persistMarkDoctorRead,
  saveNotification as persistSaveNotification,
  saveDoctorNotification as persistSaveDoctorNotification,
  AppointmentNotification,
} from "@/lib/mock-data/appointments";

export type AppointmentsState = {
  appointments: Appointment[];
  userNotifications: AppointmentNotification[];
  doctorNotifications: AppointmentNotification[];
  filterStatus: string;
};

function getInitialAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    return getAllAppointments();
  } catch {
    return [];
  }
}

const initialState: AppointmentsState = {
  appointments: getInitialAppointments(),
  userNotifications: typeof window !== "undefined" ? loadNotifications() : [],
  doctorNotifications:
    typeof window !== "undefined" ? loadDoctorNotifications() : [],
  filterStatus: "all",
};

export const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    refreshAppointments: (state) => {
      // getAllAppointments() already merges payment data at the data layer
      state.appointments = getAllAppointments();
      state.userNotifications = loadNotifications();
      state.doctorNotifications = loadDoctorNotifications();
    },
    bookAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
      persistSaveAppointment(action.payload);
    },
    changeStatus: (
      state,
      action: PayloadAction<{ id: string; status: AppointmentStatus }>
    ) => {
      const { id, status } = action.payload;
      const apt = state.appointments.find((a) => a.id === id);
      if (apt) {
        apt.status = status;
      }
      persistStatus(id, status);
    },
    rescheduleApt: (
      state,
      action: PayloadAction<{ id: string; newStartsAt: string }>
    ) => {
      const { id, newStartsAt } = action.payload;
      const apt = state.appointments.find((a) => a.id === id);
      if (apt) {
        apt.startsAt = newStartsAt;
        apt.updatedAt = new Date().toISOString();
      }
      persistReschedule(id, newStartsAt);
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload;
    },
    addUserNotification: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        patientName: string;
        message: string;
      }>
    ) => {
      persistSaveNotification(action.payload);
      state.userNotifications = loadNotifications();
    },
    addDoctorNotification: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        patientName: string;
        message: string;
        doctorId?: string;
      }>
    ) => {
      persistSaveDoctorNotification(action.payload);
      state.doctorNotifications = loadDoctorNotifications(action.payload.doctorId);
    },
    readUserNotification: (state, action: PayloadAction<string>) => {
      persistMarkRead(action.payload);
      state.userNotifications = loadNotifications();
    },
    readDoctorNotification: (state, action: PayloadAction<string>) => {
      persistMarkDoctorRead(action.payload);
      state.doctorNotifications = loadDoctorNotifications();
    },
  },

  // ── Payment field sync (paymentsSlice is the source of truth) ─────────────
  extraReducers: (builder) => {
    // On hydration: re-derive all appointment payment fields from the payments store
    builder.addCase(paymentsSlice.actions.hydratePayments, (state) => {
      // getAllAppointments() already calls getAllPayments() and merges payment data;
      // a full refresh is the cleanest way to synchronize.
      state.appointments = getAllAppointments();
    });

    // recordPaidPayment: refresh appointments so the newly confirmed appointment is visible
    builder.addCase(paymentsSlice.actions.recordPaidPayment, (state) => {
      state.appointments = getAllAppointments();
    });
  },
});

export const {
  refreshAppointments,
  bookAppointment,
  changeStatus,
  rescheduleApt,
  setFilterStatus,
  addUserNotification,
  addDoctorNotification,
  readUserNotification,
  readDoctorNotification,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;
