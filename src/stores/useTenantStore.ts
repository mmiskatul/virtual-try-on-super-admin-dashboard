import { TenantItem } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectTenantState } from '../store/selectors';
import { tenantActions } from '../store/slices/legacyAdminSlices';

const tenantBoundActions = {
  setTenants: (tenants: TenantItem[]) => {
    store.dispatch(tenantActions.setTenants(tenants));
  },
  toggleTenantStatus: (tenantId: string) => {
    store.dispatch(tenantActions.toggleTenantStatus(tenantId));
  },
  updateQuota: (payload: { tenantId: string; quota: number }) => {
    store.dispatch(tenantActions.updateQuota(payload));
  },
};

export const useTenantStore = createSliceFacadeHook(selectTenantState, tenantBoundActions);
