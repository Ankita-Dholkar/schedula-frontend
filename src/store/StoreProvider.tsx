"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateAuth } from "./slices/authSlice";
import { refreshAppointments } from "./slices/appointmentsSlice";
import { refreshDoctors } from "./slices/doctorsSlice";
import { refreshPrescriptions } from "./slices/prescriptionsSlice";

function HydrateStore({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth());
    store.dispatch(refreshAppointments());
    store.dispatch(refreshDoctors());
    store.dispatch(refreshPrescriptions());
  }, []);

  return <>{children}</>;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <HydrateStore>{children}</HydrateStore>
    </Provider>
  );
}
