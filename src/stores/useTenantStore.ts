import { create } from 'zustand';
import { TenantItem } from '../types';
import { INITIAL_TENANTS } from '../lib/mock_data';

interface TenantState {
  items: TenantItem[];
  setTenants: (tenants: TenantItem[]) => void;
  toggleTenantStatus: (tenantId: string) => void;
  updateQuota: (payload: { tenantId: string; quota: number }) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  items: INITIAL_TENANTS,
  setTenants: (items) => set({ items }),
  toggleTenantStatus: (tenantId) =>
    set((state) => ({
      items: state.items.map((t) =>
        t.id === tenantId
          ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : t
      )
    })),
  updateQuota: ({ tenantId, quota }) =>
    set((state) => ({
      items: state.items.map((t) =>
        t.id === tenantId ? { ...t, tryOnQuota: quota } : t
      )
    }))
}));
