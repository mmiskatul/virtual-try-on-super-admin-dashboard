import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectPlatformState = (state: RootState) => state.platform;
export const selectAdminUiState = (state: RootState) => state.adminUi;

export const selectOpenAlerts = createSelector(
  [(state: RootState) => state.platform.alerts],
  (alerts) => alerts.filter((a) => a.status === 'OPEN')
);

export const selectPendingRefunds = createSelector(
  [(state: RootState) => state.platform.refunds],
  (refunds) => refunds.filter((r) => r.status === 'REQUESTED')
);

export const selectActiveTenants = createSelector(
  [(state: RootState) => state.platform.tenants],
  (tenants) => tenants.filter((t) => t.status === 'ACTIVE')
);

export const selectPlatformGmv = createSelector(
  [(state: RootState) => state.platform.tenants],
  (tenants) => tenants.reduce((sum, t) => sum + (Number(t.gmv) || 0), 0)
);
