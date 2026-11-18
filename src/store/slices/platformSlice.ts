import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AiModelRecord,
  AiRoutingPolicy,
  AuditEventRecord,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  ImpersonationSession,
  ModerationProductItem,
  PaymentTransaction,
  PlatformGlobalSettings,
  PlatformInvoice,
  PlatformUserRecord,
  RefundRequest,
  SubscriptionPlanRecord,
  SupportTicketRecord,
  TenantLifecycleStatus,
  TenantRecord,
  TenantSubscriptionRecord,
  TryOnJobRecord,
  WebhookSubscription,
} from '../../types';
import { DEFAULT_AI_ROUTING, DEFAULT_PLATFORM_SETTINGS } from '../../data/platformDefaults';
import { EMPTY_RBAC, RbacState } from '../../config/permissions';
import { mapControlPlaneSnapshot, mapRevenueSeries, RevenuePoint } from '../../lib/controlPlaneMappers';

export interface PlatformSliceState {
  _hydrated: boolean;
  isLiveBackend: boolean;
  lastSyncedAt: string | null;
  backendHealth: any;
  backendLatencyMs: number | null;
  backendTelemetry: { overview: any; aiMetrics: any };

  /** The signed-in admin's real role and permissions, loaded from the backend. Never persisted. */
  rbac: RbacState;
  adminEmail: string;

  sidebarCollapsed: boolean;
  openGroups: string[];

  impersonation: ImpersonationSession | null;

  tenants: TenantRecord[];
  users: PlatformUserRecord[];
  plans: SubscriptionPlanRecord[];
  subscriptions: TenantSubscriptionRecord[];
  transactions: PaymentTransaction[];
  revenueSeries: RevenuePoint[];
  invoices: PlatformInvoice[];
  refunds: RefundRequest[];

  aiModels: AiModelRecord[];
  aiRouting: AiRoutingPolicy;
  tryOnJobs: TryOnJobRecord[];
  creditLedger: CreditLedgerEntry[];

  modProducts: ModerationProductItem[];

  cmsPages: CmsPageRecord[];
  tickets: SupportTicketRecord[];
  auditEvents: AuditEventRecord[];
  dataRequests: DataGovernanceRequest[];
  featureFlags: FeatureFlagRecord[];
  webhooks: WebhookSubscription[];
  settings: PlatformGlobalSettings;
}

export const PERSISTED_PLATFORM_KEYS = [
  'sidebarCollapsed',
  'openGroups',
  'settings',
] as const;

export type PersistedPlatformSlice = Pick<PlatformSliceState, (typeof PERSISTED_PLATFORM_KEYS)[number]>;

const initialState: PlatformSliceState = {
  _hydrated: false,
  isLiveBackend: false,
  lastSyncedAt: null,
  backendHealth: null,
  backendLatencyMs: null,
  backendTelemetry: { overview: null, aiMetrics: null },

  rbac: EMPTY_RBAC,
  adminEmail: '',

  sidebarCollapsed: false,
  openGroups: ['overview', 'tenants', 'ai', 'marketplace', 'system', 'security'],
  impersonation: null,

  tenants: [],
  users: [],
  plans: [],
  subscriptions: [],
  transactions: [],
  revenueSeries: [],
  invoices: [],
  refunds: [],

  aiModels: [],
  aiRouting: DEFAULT_AI_ROUTING,
  tryOnJobs: [],
  creditLedger: [],

  modProducts: [],

  cmsPages: [],
  tickets: [],
  auditEvents: [],
  dataRequests: [],
  featureFlags: [],
  webhooks: [],
  settings: DEFAULT_PLATFORM_SETTINGS,
};

function appendPlatformAudit(
  state: PlatformSliceState,
  action: string,
  target: string,
  details: string,
  tenantContext?: string,
  reason?: string
) {
  state.auditEvents = [
    {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      action,
      actor: state.adminEmail,
      actorRole: state.rbac.role || 'ADMIN',
      target,
      tenantContext,
      details,
      reason,
      correlationId: `corr_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toLocaleString('en-US'),
    },
    ...state.auditEvents,
  ].slice(0, 150);
}

export const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    hydratePlatform: (state, action: PayloadAction<Partial<PersistedPlatformSlice> | null>) => {
      const persisted = action.payload;
      if (persisted && typeof persisted === 'object') {
        for (const key of PERSISTED_PLATFORM_KEYS) {
          if (persisted[key] !== undefined) {
            // @ts-expect-error key belongs to PERSISTED_PLATFORM_KEYS
            state[key] = persisted[key];
          }
        }
      }
      state._hydrated = true;
    },

    setLiveStatus: (
      state,
      action: PayloadAction<{ live: boolean; health?: any; latencyMs?: number }>
    ) => {
      state.isLiveBackend = action.payload.live;
      state.backendHealth = action.payload.health ?? state.backendHealth;
      state.backendLatencyMs = action.payload.latencyMs ?? state.backendLatencyMs;
      state.lastSyncedAt = new Date().toLocaleTimeString('en-US');
    },
    // Real monthly figures from the backend; an empty answer clears the chart.
    setRevenueSeries: (state, action: PayloadAction<any[]>) => {
      if (!Array.isArray(action.payload)) return;
      state.revenueSeries = mapRevenueSeries(action.payload);
    },
    setBackendTelemetry: (state, action: PayloadAction<{ overview: any; aiMetrics: any }>) => {
      state.backendTelemetry = action.payload;
    },
    // The backend is the source of truth: replace the list (an empty answer means no tenants). Local-only
    // details (internal notes, timeline) are kept for tenants that were already loaded. Fields the backend does
    // not provide (country, team size, storage, API usage) stay neutral instead of being invented.
    mergeLiveTenants: (state, action: PayloadAction<any[]>) => {
      const raw = action.payload;
      if (!Array.isArray(raw)) return;
      const existingMap = new Map(state.tenants.map((t) => [t.id, t]));
      state.tenants = raw.map((r): TenantRecord => {
        const prev = existingMap.get(r.id);
        const plan = r.subscription?.plan || prev?.plan || 'STARTER';
        const statusUpper = String(r.status || 'ACTIVE').toUpperCase();
        return {
          country: '—',
          group: 'NEW_COHORT',
          verificationStatus: 'UNVERIFIED',
          teamCount: 0,
          marketplacePublishedCount: Number(r.marketplacePublishedCount ?? 0),
          monthlySpend: 0,
          storageUsedMb: 0,
          storageLimitMb: 0,
          apiRequests30d: 0,
          retentionGraceDays: 0,
          internalNotes: [],
          timeline: [],
          ...(prev || {}),
          subscriptionStatus: r.subscription?.status || prev?.subscriptionStatus || 'ACTIVE',
          id: r.id,
          name: r.name,
          slug: r.slug,
          owner: r.owner || prev?.owner || r.name,
          email: r.contactEmail || r.email || prev?.email || '',
          status: statusUpper === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          lifecycleStatus:
            statusUpper === 'SUSPENDED'
              ? 'SUSPENDED'
              : statusUpper === 'PENDING_VERIFICATION'
                ? 'PENDING_VERIFICATION'
                : 'ACTIVE',
          plan,
          productsCount: Number(r.productCount ?? 0),
          ordersCount: Number(r.orderCount ?? 0),
          gmv: Number(r.totalRevenue ?? 0),
          tryOnUsed: Number(r.subscription?.tryOnUsed ?? 0),
          tryOnQuota: Number(r.subscription?.tryOnMonthlyQuota ?? 0),
          joinedDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : prev?.joinedDate || '',
        };
      });
    },
    setLiveAuditLogs: (state, action: PayloadAction<any[]>) => {
      const raw = action.payload;
      if (!Array.isArray(raw)) return;
      state.auditEvents = raw.map((l: any, i: number) => ({
        id: l.id || `AUD-LIVE-${i}`,
        action: l.action || 'EVENT',
        actor: l.actorId || l.actor || 'system',
        actorRole: l.actorRole || 'SUPER_ADMIN',
        target: l.entity || l.target || 'Platform',
        tenantContext: l.tenantId || undefined,
        details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
        correlationId: l.correlationId || `corr_live_${i}`,
        timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString('en-US') : 'Live',
      }));
    },
    setLiveGenerations: (state, action: PayloadAction<any[]>) => {
      const raw = action.payload;
      if (!Array.isArray(raw)) return;
      const mapped: TryOnJobRecord[] = raw.map((j: any) => ({
        id: j.id,
        tenantId: j.tenantId,
        tenantName: state.tenants.find((t) => t.id === j.tenantId)?.name || j.tenantId,
        productId: j.productId || 'unknown',
        productName: j.productName || j.productId || 'Garment SKU',
        modelId: j.model || 'unknown',
        provider: j.provider || 'unknown',
        status: (j.status || 'COMPLETED') as TryOnJobRecord['status'],
        durationMs: Number(j.latencyMs || 0),
        creditsConsumed: j.status === 'FAILED' ? 0 : 1,
        estProviderCostUsd: Number(j.estProviderCostUsd ?? 0),
        retryCount: Number(j.retryCount || 0),
        errorMessage: j.error || undefined,
        privateMediaRedacted: true,
        createdAt: j.createdAt ? new Date(j.createdAt).toLocaleString('en-US') : '',
      }));
      state.tryOnJobs = mapped;
    },
    // The backend snapshot is mapped onto the dashboard's record types in lib/controlPlaneMappers.ts.
    // Only collections the backend actually sent are replaced (an empty array means "none").
    hydrateControlPlaneSnapshot: (state, action: PayloadAction<any>) => {
      const mapped = mapControlPlaneSnapshot(action.payload, {
        tenantNames: new Map(state.tenants.map((t) => [t.id, t.name])),
        currentAiRouting: state.aiRouting,
        currentSettings: state.settings,
      });
      Object.assign(state, mapped);
    },

    setTenantAdminContext: (
      state,
      action: PayloadAction<{
        tenantId: string;
        notes: Array<{ id: string; note: string; author: string; createdAt: string }>;
        assignedSupportAgent: { id: string; name: string } | null;
      }>
    ) => {
      const { tenantId, notes, assignedSupportAgent } = action.payload;
      state.tenants = state.tenants.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              assignedSupportAgent: assignedSupportAgent?.name,
              internalNotes: notes.map((n) => ({
                id: n.id,
                author: n.author,
                note: n.note,
                at: new Date(n.createdAt).toLocaleString('en-US'),
              })),
            }
          : t
      );
    },

    setRbac: (
      state,
      action: PayloadAction<{ role: string; roleCodes: string[]; permissions: string[] }>
    ) => {
      state.rbac = { loaded: true, ...action.payload };
    },

    setAdminEmail: (state, action: PayloadAction<string>) => {
      state.adminEmail = action.payload;
    },

    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleNavGroup: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.openGroups = state.openGroups.includes(id)
        ? state.openGroups.filter((g) => g !== id)
        : [...state.openGroups, id];
    },

    addTenantRecord: (state, action: PayloadAction<TenantRecord>) => {
      const record = action.payload;
      state.tenants = [record, ...state.tenants];
      appendPlatformAudit(
        state,
        'TENANT_CREATED',
        record.name,
        `Provisioned ${record.slug} (${record.plan})`,
        record.id
      );
    },
    updateTenantLifecycle: (
      state,
      action: PayloadAction<{ id: string; lifecycleStatus: TenantLifecycleStatus; reason: string }>
    ) => {
      const { id, lifecycleStatus, reason } = action.payload;
      state.tenants = state.tenants.map((t) => {
        if (t.id !== id) return t;
        const suspended =
          lifecycleStatus === 'SUSPENDED' ||
          lifecycleStatus === 'CANCELLED' ||
          lifecycleStatus === 'OFFBOARDING';
        return {
          ...t,
          lifecycleStatus,
          status: suspended ? 'SUSPENDED' : 'ACTIVE',
          scheduledPurgeAt:
            lifecycleStatus === 'OFFBOARDING' || lifecycleStatus === 'CANCELLED'
              ? new Date(Date.now() + t.retentionGraceDays * 86400000).toISOString().slice(0, 10)
              : undefined,
          timeline: [
            {
              label: `Lifecycle moved to ${lifecycleStatus}: ${reason}`,
              at: new Date().toLocaleString('en-US'),
              category: 'LIFECYCLE',
            },
            ...t.timeline,
          ],
        };
      });
      appendPlatformAudit(
        state,
        'TENANT_LIFECYCLE_CHANGED',
        id,
        `Status -> ${lifecycleStatus}`,
        id,
        reason
      );
    },
    updateTenantPlanLocal: (
      state,
      action: PayloadAction<{ id: string; plan: string; tryOnQuota: number }>
    ) => {
      const { id, plan, tryOnQuota } = action.payload;
      state.tenants = state.tenants.map((t) => (t.id === id ? { ...t, plan, tryOnQuota } : t));
      appendPlatformAudit(
        state,
        'TENANT_PLAN_UPDATED',
        id,
        `Plan -> ${plan}, Quota -> ${tryOnQuota}`,
        id
      );
    },
    startImpersonation: (
      state,
      action: PayloadAction<{
        tenantId: string;
        mode: 'READ_ONLY' | 'ELEVATED_WRITE';
        reason: string;
      }>
    ) => {
      const { tenantId, mode, reason } = action.payload;
      const tenant = state.tenants.find((t) => t.id === tenantId);
      if (!tenant) return;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('en-US');
      state.impersonation = {
        active: true,
        tenantId: tenant.id,
        tenantName: tenant.name,
        mode,
        reason,
        adminEmail: state.adminEmail,
        startedAt: new Date().toLocaleTimeString('en-US'),
        expiresAt,
      };
      appendPlatformAudit(
        state,
        'VIEW_AS_SESSION_STARTED',
        tenant.name,
        `Mode: ${mode}`,
        tenant.id,
        reason
      );
    },
    endImpersonation: (state) => {
      const imp = state.impersonation;
      state.impersonation = null;
      if (imp) {
        appendPlatformAudit(
          state,
          'VIEW_AS_SESSION_ENDED',
          imp.tenantName,
          `Closed ${imp.mode} session`,
          imp.tenantId
        );
      }
    },

    updateUserStatus: (
      state,
      action: PayloadAction<{ id: string; status: PlatformUserRecord['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.users = state.users.map((u) => (u.id === id ? { ...u, status } : u));
      appendPlatformAudit(state, 'USER_STATUS_CHANGED', id, `Status -> ${status}`);
    },
    revokeUserSessions: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.users = state.users.map((u) => (u.id === id ? { ...u, activeSessionsCount: 0 } : u));
      appendPlatformAudit(state, 'USER_SESSIONS_REVOKED', id, 'Invalidated active JWT/refresh sessions');
    },

    updateRefundStatus: (
      state,
      action: PayloadAction<{ id: string; status: RefundRequest['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.refunds = state.refunds.map((r) =>
        r.id === id ? { ...r, status, approvedBy: state.adminEmail } : r
      );
      appendPlatformAudit(state, 'REFUND_STATUS_UPDATED', id, `Refund status -> ${status}`);
    },
    toggleAiModel: (
      state,
      action: PayloadAction<{ id: string; active?: boolean; isDefault?: boolean }>
    ) => {
      const { id, active, isDefault } = action.payload;
      state.aiModels = state.aiModels.map((m) => {
        if (isDefault) {
          return { ...m, isDefault: m.id === id, active: m.id === id ? true : m.active };
        }
        return m.id === id ? { ...m, active: active ?? !m.active } : m;
      });
      appendPlatformAudit(
        state,
        'AI_MODEL_UPDATED',
        id,
        isDefault ? 'Promoted as default model' : `Active -> ${active}`
      );
    },
    updateAiRouting: (state, action: PayloadAction<Partial<AiRoutingPolicy>>) => {
      state.aiRouting = { ...state.aiRouting, ...action.payload };
      appendPlatformAudit(
        state,
        'AI_ROUTING_POLICY_UPDATED',
        'Router',
        `Updated ${Object.keys(action.payload).join(', ')}`
      );
    },
    retryTryOnJob: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.tryOnJobs = state.tryOnJobs.map((j) =>
        j.id === id ? { ...j, status: 'QUEUED', retryCount: j.retryCount + 1, errorMessage: undefined } : j
      );
      appendPlatformAudit(state, 'TRYON_JOB_RETRIED', id, 'Re-queued eligible failed generation job');
    },
    cancelTryOnJob: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.tryOnJobs = state.tryOnJobs.map((j) => (j.id === id ? { ...j, status: 'CANCELLED' } : j));
      appendPlatformAudit(state, 'TRYON_JOB_CANCELLED', id, 'Cancelled queued generation job');
    },
    adjustTenantCredits: (
      state,
      action: PayloadAction<{
        tenantId: string;
        delta: number;
        reason: string;
        type: CreditLedgerEntry['type'];
      }>
    ) => {
      const { tenantId, delta, reason, type } = action.payload;
      const tenant = state.tenants.find((t) => t.id === tenantId);
      if (!tenant) return;
      const nextQuota = Math.max(0, tenant.tryOnQuota + delta);
      const balanceAfter = Math.max(0, nextQuota - tenant.tryOnUsed);
      tenant.tryOnQuota = nextQuota;
      state.creditLedger = [
        {
          id: `crd_${Date.now()}`,
          tenantId,
          tenantName: tenant.name,
          type,
          delta,
          balanceAfter,
          reason,
          actor: state.adminEmail,
          referenceId: `REF-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toLocaleString('en-US'),
        },
        ...state.creditLedger,
      ];
      appendPlatformAudit(
        state,
        'CREDIT_LEDGER_ADJUSTED',
        tenant.name,
        `${delta > 0 ? `+${delta}` : delta} (${type})`,
        tenantId,
        reason
      );
    },

    moderateProduct: (
      state,
      action: PayloadAction<{
        id: string;
        moderationStatus: ModerationProductItem['moderationStatus'];
        featured?: boolean;
      }>
    ) => {
      const { id, moderationStatus, featured } = action.payload;
      state.modProducts = state.modProducts.map((p) =>
        p.id === id
          ? {
              ...p,
              moderationStatus,
              visibility: moderationStatus === 'APPROVED' ? 'PUBLIC' : 'HIDDEN',
              featured: featured ?? p.featured,
            }
          : p
      );
      appendPlatformAudit(state, 'PRODUCT_MODERATED', id, `Moderation -> ${moderationStatus}`);
    },
    saveCmsPage: (state, action: PayloadAction<CmsPageRecord>) => {
      const page = action.payload;
      state.cmsPages = state.cmsPages.some((p) => p.id === page.id)
        ? state.cmsPages.map((p) => (p.id === page.id ? page : p))
        : [...state.cmsPages, page];
      appendPlatformAudit(state, 'CMS_PAGE_SAVED', page.title, `Status: ${page.status}`);
    },

    updateTicket: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<SupportTicketRecord> }>
    ) => {
      const { id, updates } = action.payload;
      state.tickets = state.tickets.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toLocaleString('en-US') } : t
      );
      appendPlatformAudit(state, 'TICKET_UPDATED', id, `Modified ${Object.keys(updates).join(', ')}`);
    },
    addTicketMessage: (
      state,
      action: PayloadAction<{ id: string; text: string; internal?: boolean }>
    ) => {
      const { id, text, internal = false } = action.payload;
      state.tickets = state.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  sender: state.adminEmail,
                  role: state.rbac.role || 'ADMIN',
                  text,
                  internal,
                  at: new Date().toLocaleString('en-US'),
                },
              ],
              updatedAt: new Date().toLocaleString('en-US'),
            }
          : t
      );
    },
    updateDataRequest: (
      state,
      action: PayloadAction<{ id: string; status: DataGovernanceRequest['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.dataRequests = state.dataRequests.map((r) =>
        r.id === id ? { ...r, status } : r
      );
      appendPlatformAudit(state, 'GOVERNANCE_REQUEST_UPDATED', id, `Status -> ${status}`);
    },
    toggleFeatureFlag: (
      state,
      action: PayloadAction<{ key: string; partial: Partial<FeatureFlagRecord> }>
    ) => {
      const { key, partial } = action.payload;
      state.featureFlags = state.featureFlags.map((f) =>
        f.key === key ? { ...f, ...partial, updatedAt: new Date().toISOString().slice(0, 10) } : f
      );
      appendPlatformAudit(state, 'FEATURE_FLAG_UPDATED', key, `Updated ${Object.keys(partial).join(', ')}`);
    },
    addWebhook: (state, action: PayloadAction<{ url: string; events: string[] }>) => {
      const { url, events } = action.payload;
      state.webhooks = [
        {
          id: `wh_${Date.now()}`,
          url,
          events,
          active: true,
          lastResponseCode: 200,
          retryCount: 0,
          lastAttemptAt: 'Pending test delivery',
        },
        ...state.webhooks,
      ];
      appendPlatformAudit(state, 'WEBHOOK_REGISTERED', url, `Events: ${events.join(', ')}`);
    },
    updateSettings: (state, action: PayloadAction<Partial<PlatformGlobalSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      appendPlatformAudit(
        state,
        'PLATFORM_SETTINGS_UPDATED',
        'Global Config',
        `Modified ${Object.keys(action.payload).join(', ')}`
      );
    },
    recordAudit: (
      state,
      action: PayloadAction<{
        action: string;
        target: string;
        details: string;
        tenantContext?: string;
        reason?: string;
      }>
    ) => {
      appendPlatformAudit(
        state,
        action.payload.action,
        action.payload.target,
        action.payload.details,
        action.payload.tenantContext,
        action.payload.reason
      );
    },
  },
});

export const platformActions = platformSlice.actions;
export default platformSlice.reducer;

