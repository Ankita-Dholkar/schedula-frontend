import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import adminAuthReducer from "./slices/adminAuthSlice";
import appointmentsReducer from "./slices/appointmentsSlice";
import availabilityReducer from "./slices/availabilitySlice";
import prescriptionsReducer from "./slices/prescriptionsSlice";
import doctorsReducer from "./slices/doctorsSlice";
import reviewsReducer from "./slices/reviewsSlice";
import paymentsReducer from "./slices/paymentsSlice";
import toastReducer from "./slices/toastSlice";
import patientsReducer from "./slices/patientsSlice";
import adminNotificationsReducer from "./slices/adminNotificationsSlice";
import { persistPayments } from "@/lib/mock-data/payments";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    appointments: appointmentsReducer,
    availability: availabilityReducer,
    prescriptions: prescriptionsReducer,
    doctors: doctorsReducer,
    reviews: reviewsReducer,
    payments: paymentsReducer,
    toast: toastReducer,
    patients: patientsReducer,
    adminNotifications: adminNotificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

let previousPayments = store.getState().payments.payments;

store.subscribe(() => {
  const currentPayments = store.getState().payments.payments;

  if (currentPayments !== previousPayments) {
    persistPayments(currentPayments);
    previousPayments = currentPayments;
  }
});
