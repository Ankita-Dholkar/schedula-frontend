import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import appointmentsReducer from "./slices/appointmentsSlice";
import availabilityReducer from "./slices/availabilitySlice";
import prescriptionsReducer from "./slices/prescriptionsSlice";
import doctorsReducer from "./slices/doctorsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentsReducer,
    availability: availabilityReducer,
    prescriptions: prescriptionsReducer,
    doctors: doctorsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
