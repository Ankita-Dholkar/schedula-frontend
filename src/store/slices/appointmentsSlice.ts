import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { paymentsSlice } from "./paymentsSlice";
import { getAllPayments } from "@/lib/mock-data/payments";
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
    // On hydration: enrich every appointment with its payment data
    builder.addCase(paymentsSlice.actions.hydratePayments, (state) => {
      const payments = getAllPayments();
      const paymentMap = new Map(payments.map((p) => [p.appointmentId, p]));
      state.appointments = state.appointments.map((apt) => {
        const payment = paymentMap.get(apt.id);
        if (!payment) return apt;
        return {
          ...apt,
          paymentStatus: payment.status,
          consultationFee: payment.amount,
          transactionId: payment.transactionId,
          paymentMethod: payment.method,
        };
      });
    });

    // Payment created → mark appointment as pending payment
    builder.addCase(paymentsSlice.actions.createPayment, (state, action) => {
      const apt = state.appointments.find(
        (a) => a.id === action.payload.appointmentId
      );
      if (apt) {
        apt.paymentStatus = "pending";
        apt.consultationFee = action.payload.amount;
      }
    });

    // Payment succeeded → appointment becomes confirmed
    builder.addCase(
      paymentsSlice.actions.markPaymentSuccess,
      (state, action) => {
        const { appointmentId, transactionId, method } = action.payload;
        const apt = state.appointments.find((a) => a.id === appointmentId);
        if (apt) {
          apt.paymentStatus = "paid";
          apt.status = "confirmed";
          apt.transactionId = transactionId;
          apt.paymentMethod = method;
        }
        // Persist the appointment status change via the existing mechanism
        persistStatus(appointmentId, "confirmed");
      }
    );

    // Payment failed → appointment remains pending
    builder.addCase(
      paymentsSlice.actions.markPaymentFailed,
      (state, action) => {
        const apt = state.appointments.find(
          (a) => a.id === action.payload.appointmentId
        );
        if (apt) {
          apt.paymentStatus = "failed";
          apt.paymentMethod = action.payload.method;
          // appointment.status intentionally stays "pending"
        }
      }
    );
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
