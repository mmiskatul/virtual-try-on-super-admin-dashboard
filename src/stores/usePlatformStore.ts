import {
  AiRoutingPolicy,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  ModerationProductItem,
  PlatformGlobalSettings,
  PlatformUserRecord,
  RefundRequest,
  SupportTicketRecord,
  TenantLifecycleStatus,
} from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectPlatformState } from '../store/selectors';
import { platformActions } from '../store/slices/platformSlice';
import {
  addTenantNoteRemote,
  addTicketMessageRemote,
  assignSupportAgentRemote,
  cancelSubscriptionRemote,
  extendTrialRemote,
  loadTenantAdminContext,
  addWebhookRemote,
  adjustTenantCreditsRemote,
  createTenantRemote,
  endViewAsRemote,
  moderateProductRemote,
  saveCmsPageRemote,
  setTenantLifecycleRemote,
  setUserStatusRemote,
  startViewAsRemote,
  toggleAiModelRemote,
  updateDataRequestRemote,
  updateRefundStatusRemote,
  updateTicketRemote,
  toggleFeatureFlagRemote,
  updateAiRoutingRemote,
  updateTenantPlanRemote,
} from '../services/platformWrites';

const platformBoundActions = {
  setLiveStatus: (live: boolean, health?: any, latencyMs?: number) => {
    store.dispatch(platformActions.setLiveStatus({ live, health, latencyMs }));
  },
  setBackendTelemetry: (telemetry: { overview: any; aiMetrics: any }) => {
    store.dispatch(platformActions.setBackendTelemetry(telemetry));
  },
  setRevenueSeries: (points: any[]) => {
    store.dispatch(platformActions.setRevenueSeries(points));
  },
  mergeLiveTenants: (raw: any[]) => {
    store.dispatch(platformActions.mergeLiveTenants(raw));
  },
  setLiveAuditLogs: (raw: any[]) => {
    store.dispatch(platformActions.setLiveAuditLogs(raw));
  },
  setLiveGenerations: (raw: any[]) => {
    store.dispatch(platformActions.setLiveGenerations(raw));
  },
  hydrateControlPlaneSnapshot: (snap: any) => {
    store.dispatch(platformActions.hydrateControlPlaneSnapshot(snap));
  },

  setRbac: (rbac: { role: string; roleCodes: string[]; permissions: string[] }) => {
    store.dispatch(platformActions.setRbac(rbac));
  },
  toggleSidebarCollapsed: () => {
    store.dispatch(platformActions.toggleSidebarCollapsed());
  },
  toggleNavGroup: (id: string) => {
    store.dispatch(platformActions.toggleNavGroup(id));
  },

  /** Creates the tenant on the backend; resolves with the server-assigned id. */
  createTenant: (input: { name: string; slug: string; contactEmail: string; planSlug: string }) =>
    createTenantRemote(input),
  addTenantNote: (tenantId: string, note: string) => addTenantNoteRemote(tenantId, note),
  assignSupportAgent: (tenantId: string, agentId: string) => assignSupportAgentRemote(tenantId, agentId),
  loadTenantAdminContext: (tenantId: string) => loadTenantAdminContext(tenantId),
  extendTrial: (tenantId: string, days?: number) => extendTrialRemote(tenantId, days),
  cancelSubscription: (tenantId: string, reason: string) => cancelSubscriptionRemote(tenantId, reason),
  updateTenantLifecycle: (id: string, lifecycleStatus: TenantLifecycleStatus, reason: string) =>
    setTenantLifecycleRemote(id, lifecycleStatus, reason),
  updateTenantPlan: (id: string, plan: string, tryOnQuota: number) =>
    updateTenantPlanRemote(id, plan, tryOnQuota),
  startImpersonation: (tenantId: string, mode: 'READ_ONLY' | 'ELEVATED_WRITE', reason: string) =>
    startViewAsRemote(tenantId, mode, reason),
  endImpersonation: () => endViewAsRemote(),

  updateUserStatus: (id: string, status: PlatformUserRecord['status']) => setUserStatusRemote(id, status),
  revokeUserSessions: (id: string) => {
    store.dispatch(platformActions.revokeUserSessions(id));
  },

  updateRefundStatus: (id: string, status: RefundRequest['status'], note?: string) =>
    updateRefundStatusRemote(id, status, note),
  toggleAiModel: (id: string, active?: boolean, isDefault?: boolean) => toggleAiModelRemote(id, active, isDefault),
  updateAiRouting: (partial: Partial<AiRoutingPolicy>) => updateAiRoutingRemote(partial),
  retryTryOnJob: (id: string) => {
    store.dispatch(platformActions.retryTryOnJob(id));
  },
  cancelTryOnJob: (id: string) => {
    store.dispatch(platformActions.cancelTryOnJob(id));
  },
  adjustTenantCredits: (
    tenantId: string,
    delta: number,
    reason: string,
    type: CreditLedgerEntry['type']
  ) => adjustTenantCreditsRemote(tenantId, delta, reason, type),

  moderateProduct: (
    id: string,
    moderationStatus: ModerationProductItem['moderationStatus'],
    featured?: boolean
  ) => moderateProductRemote(id, moderationStatus, { featured }),
  saveCmsPage: (page: CmsPageRecord) => saveCmsPageRemote(page),

  updateTicket: (
    id: string,
    updates: Partial<Pick<SupportTicketRecord, 'status' | 'priority' | 'assignedAgent'>>
  ) => updateTicketRemote(id, updates),
  addTicketMessage: (id: string, text: string, internal?: boolean) => addTicketMessageRemote(id, text, internal),
  updateDataRequest: (id: string, status: DataGovernanceRequest['status']) => updateDataRequestRemote(id, status),
  toggleFeatureFlag: (key: string, partial: Partial<FeatureFlagRecord>) => toggleFeatureFlagRemote(key, partial),
  addWebhook: (url: string, events: string[]) => addWebhookRemote(url, events),
  updateSettings: (partial: Partial<PlatformGlobalSettings>) => {
    store.dispatch(platformActions.updateSettings(partial));
  },
  recordAudit: (
    action: string,
    target: string,
    details: string,
    tenantContext?: string,
    reason?: string
  ) => {
    store.dispatch(
      platformActions.recordAudit({ action, target, details, tenantContext, reason })
    );
  },
};

export const usePlatformStore = createSliceFacadeHook(
  selectPlatformState,
  platformBoundActions
);
