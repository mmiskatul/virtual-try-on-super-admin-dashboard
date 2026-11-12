import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminTab, AuditLog, TenantItem } from '../../types';
import { INITIAL_AUDIT_LOGS, INITIAL_TENANTS } from '../../lib/mock_data';

export interface AdminUiSliceState {
  activeTab: AdminTab;
  toastMessage: string | null;
}

export const adminUiSlice = createSlice({
  name: 'adminUi',
  initialState: { activeTab: 'overview', toastMessage: null } as AdminUiSliceState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<AdminTab>) => {
      state.activeTab = action.payload;
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toastMessage = action.payload;
    },
    hideToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export interface TenantSliceState {
  items: TenantItem[];
}

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState: { items: INITIAL_TENANTS } as TenantSliceState,
  reducers: {
    setTenants: (state, action: PayloadAction<TenantItem[]>) => {
      state.items = action.payload;
    },
    toggleTenantStatus: (state, action: PayloadAction<string>) => {
      state.items = state.items.map((t) =>
        t.id === action.payload
          ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : t
      );
    },
    updateQuota: (state, action: PayloadAction<{ tenantId: string; quota: number }>) => {
      const { tenantId, quota } = action.payload;
      state.items = state.items.map((t) =>
        t.id === tenantId ? { ...t, tryOnQuota: quota } : t
      );
    },
  },
});

export interface AuditSliceState {
  logs: AuditLog[];
}

export const auditSlice = createSlice({
  name: 'audit',
  initialState: { logs: INITIAL_AUDIT_LOGS } as AuditSliceState,
  reducers: {
    setLogs: (state, action: PayloadAction<AuditLog[]>) => {
      state.logs = action.payload;
    },
    addAuditLog: (state, action: PayloadAction<AuditLog>) => {
      state.logs = [action.payload, ...state.logs];
    },
  },
});

export const adminUiActions = adminUiSlice.actions;
export const tenantActions = tenantSlice.actions;
export const auditActions = auditSlice.actions;

