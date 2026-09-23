import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuditLog } from "@/types/auditLog";
import { AUDIT_ACTION_LABELS } from "@/types/auditLog";
import { loadAuditLogs, persistAuditLogs } from "@/lib/mock-data/auditLogs";

export interface AuditLogsState {
  logs: AuditLog[];
}

const initialState: AuditLogsState = {
  logs: typeof window !== "undefined" ? loadAuditLogs() : [],
};

export const auditLogsSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {
    /** Hydrate from localStorage (called on mount). */
    hydrateAuditLogs: (state) => {
      state.logs = loadAuditLogs();
    },

    /**
     * Log an admin action. Prepends a new AuditLog entry to the front of the list.
     * The store subscriber persists the updated list to localStorage.
     */
    logAdminAction: (
      state,
      action: PayloadAction<Omit<AuditLog, "id" | "timestamp" | "actionLabel">>
    ) => {
      const newLog: AuditLog = {
        ...action.payload,
        id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        actionLabel: AUDIT_ACTION_LABELS[action.payload.action],
      };
      state.logs = [newLog, ...state.logs];
    },
  },
});

export const { hydrateAuditLogs, logAdminAction } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;
