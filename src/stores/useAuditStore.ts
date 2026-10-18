import { create } from 'zustand';
import { AuditLog } from '../types';
import { INITIAL_AUDIT_LOGS } from '../lib/mock_data';

interface AuditState {
  logs: AuditLog[];
  setLogs: (logs: AuditLog[]) => void;
  addAuditLog: (log: AuditLog) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: INITIAL_AUDIT_LOGS,
  setLogs: (logs) => set({ logs }),
  addAuditLog: (log) => set((state) => ({ logs: [log, ...state.logs] }))
}));
