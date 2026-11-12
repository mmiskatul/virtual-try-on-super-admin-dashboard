import {
  AiModelRecord,
  AiProviderRecord,
  AiRoutingPolicy,
  AuditEventRecord,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  ImpersonationSession,
  MarketplaceCategory,
  MarketplaceCollection,
  MarketplaceReportItem,
  ModerationBrandItem,
  ModerationProductItem,
  PaymentTransaction,
  PlatformAction,
  PlatformAlert,
  PlatformGlobalSettings,
  PlatformInvoice,
  PlatformModule,
  PlatformRole,
  PlatformUserRecord,
  ReconciliationItem,
  RefundRequest,
  SecurityEventRecord,
  SubscriptionPlanRecord,
  SupportTicketRecord,
  TenantLifecycleStatus,
  TenantRecord,
  TenantSubscriptionRecord,
  TryOnJobRecord,
  WebhookSubscription,
} from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectPlatformState } from '../store/selectors';
import { platformActions } from '../store/slices/platformSlice';

export interface PlatformStoreState {
  isLiveBackend: boolean;
  lastSyncedAt: string | null;
  backendHealth: any;
  backendLatencyMs: number | null;
  backendTelemetry: { overview: any; aiMetrics: any };

  activeRole: PlatformRole;
  adminEmail: string;
  roleOverrides: Record<string, Partial<Record<PlatformModule, PlatformAction[]>>>;
  customRoles: Array<{ id: string; label: string; summary: string; mfaRequired: boolean }>;

  sidebarCollapsed: boolean;
  openGroups: string[];

  impersonation: ImpersonationSession | null;

  tenants: TenantRecord[];
  users: PlatformUserRecord[];
  plans: SubscriptionPlanRecord[];
  subscriptions: TenantSubscriptionRecord[];
  transactions: PaymentTransaction[];
  invoices: PlatformInvoice[];
  refunds: RefundRequest[];
  reconciliations: ReconciliationItem[];

  aiProviders: AiProviderRecord[];
  aiModels: AiModelRecord[];
  aiRouting: AiRoutingPolicy;
  tryOnJobs: TryOnJobRecord[];
  creditLedger: CreditLedgerEntry[];

  modProducts: ModerationProductItem[];
  modBrands: ModerationBrandItem[];
  categories: MarketplaceCategory[];
  collections: MarketplaceCollection[];
  mktReports: MarketplaceReportItem[];

  cmsPages: CmsPageRecord[];
  tickets: SupportTicketRecord[];
  alerts: PlatformAlert[];
  securityEvents: SecurityEventRecord[];
  auditEvents: AuditEventRecord[];
  dataRequests: DataGovernanceRequest[];
  featureFlags: FeatureFlagRecord[];
  webhooks: WebhookSubscription[];
  settings: PlatformGlobalSettings;

  setLiveStatus: (live: boolean, health?: any, latencyMs?: number) => void;
  setBackendTelemetry: (telemetry: { overview: any; aiMetrics: any }) => void;
  mergeLiveTenants: (raw: any[]) => void;
  setLiveAuditLogs: (raw: any[]) => void;
  setLiveGenerations: (raw: any[]) => void;
  hydrateControlPlaneSnapshot?: (snap: any) => void;

  setActiveRole: (role: PlatformRole) => void;
  toggleRolePermission: (role: PlatformRole, mod: PlatformModule, action: PlatformAction) => void;
  createCustomRole: (role: { id: string; label: string; summary: string; mfaRequired: boolean }) => void;
  toggleSidebarCollapsed: () => void;
  toggleNavGroup: (id: string) => void;

  createTenant: (tenant: Omit<TenantRecord, 'id' | 'internalNotes' | 'timeline'>) => TenantRecord;
  updateTenantLifecycle: (id: string, lifecycleStatus: TenantLifecycleStatus, reason: string) => void;
  updateTenantPlanLocal: (id: string, plan: string, tryOnQuota: number) => void;
  addTenantNote: (tenantId: string, note: string) => void;
  assignSupportAgent: (tenantId: string, agent: string) => void;
  startImpersonation: (tenantId: string, mode: 'READ_ONLY' | 'ELEVATED_WRITE', reason: string) => void;
  endImpersonation: () => void;

  updateUserStatus: (id: string, status: PlatformUserRecord['status']) => void;
  revokeUserSessions: (id: string) => void;

  savePlan: (plan: SubscriptionPlanRecord) => void;
  updateSubscriptionStatus: (
    id: string,
    status: TenantSubscriptionRecord['status'],
    extra?: Partial<TenantSubscriptionRecord>
  ) => void;

  updateRefundStatus: (id: string, status: RefundRequest['status']) => void;
  updateReconciliationStatus: (id: string, status: ReconciliationItem['status']) => void;

  toggleAiModel: (id: string, active?: boolean, isDefault?: boolean) => void;
  updateAiRouting: (partial: Partial<AiRoutingPolicy>) => void;
  retryTryOnJob: (id: string) => void;
  cancelTryOnJob: (id: string) => void;
  adjustTenantCredits: (
    tenantId: string,
    delta: number,
    reason: string,
    type: CreditLedgerEntry['type']
  ) => void;

  moderateProduct: (
    id: string,
    status: ModerationProductItem['moderationStatus'],
    featured?: boolean
  ) => void;
  moderateBrand: (id: string, updates: Partial<ModerationBrandItem>) => void;
  saveCategory: (cat: MarketplaceCategory) => void;
  saveCollection: (col: MarketplaceCollection) => void;
  resolveMktReport: (id: string, status: MarketplaceReportItem['status']) => void;
  saveCmsPage: (page: CmsPageRecord) => void;

  updateTicket: (id: string, updates: Partial<SupportTicketRecord>) => void;
  addTicketMessage: (id: string, text: string, internal?: boolean) => void;
  updateAlertStatus: (id: string, status: PlatformAlert['status'], owner?: string) => void;
  updateSecurityEvent: (id: string, status: SecurityEventRecord['status']) => void;
  updateDataRequest: (id: string, status: DataGovernanceRequest['status']) => void;
  toggleFeatureFlag: (key: string, partial: Partial<FeatureFlagRecord>) => void;
  addWebhook: (url: string, events: string[]) => void;
  retryWebhook: (id: string) => void;
  updateSettings: (partial: Partial<PlatformGlobalSettings>) => void;

  recordAudit: (
    action: string,
    target: string,
    details: string,
    tenantContext?: string,
    reason?: string
  ) => void;
}

const platformBoundActions = {
  setLiveStatus: (live: boolean, health?: any, latencyMs?: number) => {
    store.dispatch(platformActions.setLiveStatus({ live, health, latencyMs }));
  },
  setBackendTelemetry: (telemetry: { overview: any; aiMetrics: any }) => {
    store.dispatch(platformActions.setBackendTelemetry(telemetry));
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

  setActiveRole: (role: PlatformRole) => {
    store.dispatch(platformActions.setActiveRole(role));
  },
  toggleRolePermission: (role: PlatformRole, mod: PlatformModule, permAction: PlatformAction) => {
    store.dispatch(platformActions.toggleRolePermission({ role, mod, permAction }));
  },
  createCustomRole: (role: { id: string; label: string; summary: string; mfaRequired: boolean }) => {
    store.dispatch(platformActions.createCustomRole(role));
  },
  toggleSidebarCollapsed: () => {
    store.dispatch(platformActions.toggleSidebarCollapsed());
  },
  toggleNavGroup: (id: string) => {
    store.dispatch(platformActions.toggleNavGroup(id));
  },

  createTenant: (input: Omit<TenantRecord, 'id' | 'internalNotes' | 'timeline'>): TenantRecord => {
    const adminEmail = store.getState().platform.adminEmail;
    const record: TenantRecord = {
      ...input,
      id: `tenant_${Date.now().toString(36)}`,
      internalNotes: [
        {
          id: `note_${Date.now()}`,
          author: adminEmail,
          note: 'Tenant provisioned via Super Admin invitation workflow (no password created by staff).',
          at: new Date().toLocaleString(),
        },
      ],
      timeline: [
        {
          label: 'Created tenant workspace & dispatched owner invite',
          at: new Date().toLocaleString(),
          category: 'LIFECYCLE',
        },
      ],
    };
    store.dispatch(platformActions.addTenantRecord(record));
    return record;
  },
  updateTenantLifecycle: (id: string, lifecycleStatus: TenantLifecycleStatus, reason: string) => {
    store.dispatch(platformActions.updateTenantLifecycle({ id, lifecycleStatus, reason }));
  },
  updateTenantPlanLocal: (id: string, plan: string, tryOnQuota: number) => {
    store.dispatch(platformActions.updateTenantPlanLocal({ id, plan, tryOnQuota }));
  },
  addTenantNote: (tenantId: string, note: string) => {
    store.dispatch(platformActions.addTenantNote({ tenantId, note }));
  },
  assignSupportAgent: (tenantId: string, agent: string) => {
    store.dispatch(platformActions.assignSupportAgent({ tenantId, agent }));
  },
  startImpersonation: (
    tenantId: string,
    mode: 'READ_ONLY' | 'ELEVATED_WRITE',
    reason: string
  ) => {
    store.dispatch(platformActions.startImpersonation({ tenantId, mode, reason }));
  },
  endImpersonation: () => {
    store.dispatch(platformActions.endImpersonation());
  },

  updateUserStatus: (id: string, status: PlatformUserRecord['status']) => {
    store.dispatch(platformActions.updateUserStatus({ id, status }));
  },
  revokeUserSessions: (id: string) => {
    store.dispatch(platformActions.revokeUserSessions(id));
  },

  savePlan: (plan: SubscriptionPlanRecord) => {
    store.dispatch(platformActions.savePlan(plan));
  },
  updateSubscriptionStatus: (
    id: string,
    status: TenantSubscriptionRecord['status'],
    extra?: Partial<TenantSubscriptionRecord>
  ) => {
    store.dispatch(platformActions.updateSubscriptionStatus({ id, status, extra }));
  },

  updateRefundStatus: (id: string, status: RefundRequest['status']) => {
    store.dispatch(platformActions.updateRefundStatus({ id, status }));
  },
  updateReconciliationStatus: (id: string, status: ReconciliationItem['status']) => {
    store.dispatch(platformActions.updateReconciliationStatus({ id, status }));
  },

  toggleAiModel: (id: string, active?: boolean, isDefault?: boolean) => {
    store.dispatch(platformActions.toggleAiModel({ id, active, isDefault }));
  },
  updateAiRouting: (partial: Partial<AiRoutingPolicy>) => {
    store.dispatch(platformActions.updateAiRouting(partial));
  },
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
  ) => {
    store.dispatch(platformActions.adjustTenantCredits({ tenantId, delta, reason, type }));
  },

  moderateProduct: (
    id: string,
    moderationStatus: ModerationProductItem['moderationStatus'],
    featured?: boolean
  ) => {
    store.dispatch(platformActions.moderateProduct({ id, moderationStatus, featured }));
  },
  moderateBrand: (id: string, updates: Partial<ModerationBrandItem>) => {
    store.dispatch(platformActions.moderateBrand({ id, updates }));
  },
  saveCategory: (cat: MarketplaceCategory) => {
    store.dispatch(platformActions.saveCategory(cat));
  },
  saveCollection: (col: MarketplaceCollection) => {
    store.dispatch(platformActions.saveCollection(col));
  },
  resolveMktReport: (id: string, status: MarketplaceReportItem['status']) => {
    store.dispatch(platformActions.resolveMktReport({ id, status }));
  },
  saveCmsPage: (page: CmsPageRecord) => {
    store.dispatch(platformActions.saveCmsPage(page));
  },

  updateTicket: (id: string, updates: Partial<SupportTicketRecord>) => {
    store.dispatch(platformActions.updateTicket({ id, updates }));
  },
  addTicketMessage: (id: string, text: string, internal?: boolean) => {
    store.dispatch(platformActions.addTicketMessage({ id, text, internal }));
  },
  updateAlertStatus: (id: string, status: PlatformAlert['status'], owner?: string) => {
    store.dispatch(platformActions.updateAlertStatus({ id, status, owner }));
  },
  updateSecurityEvent: (id: string, status: SecurityEventRecord['status']) => {
    store.dispatch(platformActions.updateSecurityEvent({ id, status }));
  },
  updateDataRequest: (id: string, status: DataGovernanceRequest['status']) => {
    store.dispatch(platformActions.updateDataRequest({ id, status }));
  },
  toggleFeatureFlag: (key: string, partial: Partial<FeatureFlagRecord>) => {
    store.dispatch(platformActions.toggleFeatureFlag({ key, partial }));
  },
  addWebhook: (url: string, events: string[]) => {
    store.dispatch(platformActions.addWebhook({ url, events }));
  },
  retryWebhook: (id: string) => {
    store.dispatch(platformActions.retryWebhook(id));
  },
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
