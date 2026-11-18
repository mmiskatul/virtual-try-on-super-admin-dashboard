import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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
} from '../../types';
import {
  DEMO_AI_MODELS,
  DEMO_AI_PROVIDERS,
  DEMO_AI_ROUTING,
  DEMO_ALERTS,
  DEMO_CATEGORIES,
  DEMO_COLLECTIONS,
  DEMO_DATA_REQUESTS,
  DEMO_INVOICES,
  DEMO_MKT_REPORTS,
  DEMO_MOD_BRANDS,
  DEMO_PLATFORM_SETTINGS,
  DEMO_PLANS,
  DEMO_RECONCILIATIONS,
  DEMO_REFUNDS,
  DEMO_SECURITY_EVENTS,
  DEMO_SUBSCRIPTIONS,
  DEMO_TICKETS,
  DEMO_TRANSACTIONS,
} from '../../data/platformDemoSeed';
import { DEFAULT_ADMIN_PERMISSIONS } from '../../config/permissions';

export interface PlatformSliceState {
  _hydrated: boolean;
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
}

export const PERSISTED_PLATFORM_KEYS = [
  'activeRole',
  'roleOverrides',
  'customRoles',
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

  activeRole: 'SUPER_ADMIN',
  adminEmail: '',
  roleOverrides: {},
  customRoles: [],

  sidebarCollapsed: false,
  openGroups: ['overview', 'tenants', 'ai', 'marketplace', 'system', 'security'],
  impersonation: null,

  tenants: [],
  users: [],
  plans: DEMO_PLANS,
  subscriptions: DEMO_SUBSCRIPTIONS,
  transactions: DEMO_TRANSACTIONS,
  invoices: DEMO_INVOICES,
  refunds: DEMO_REFUNDS,
  reconciliations: DEMO_RECONCILIATIONS,

  aiProviders: DEMO_AI_PROVIDERS,
  aiModels: DEMO_AI_MODELS,
  aiRouting: DEMO_AI_ROUTING,
  tryOnJobs: [],
  creditLedger: [],

  modProducts: [],
  modBrands: DEMO_MOD_BRANDS,
  categories: DEMO_CATEGORIES,
  collections: DEMO_COLLECTIONS,
  mktReports: DEMO_MKT_REPORTS,

  cmsPages: [],
  tickets: DEMO_TICKETS,
  alerts: DEMO_ALERTS,
  securityEvents: DEMO_SECURITY_EVENTS,
  auditEvents: [],
  dataRequests: DEMO_DATA_REQUESTS,
  featureFlags: [],
  webhooks: [],
  settings: DEMO_PLATFORM_SETTINGS,
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
      actorRole: state.activeRole,
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
          subscriptionStatus: r.subscription?.status || 'ACTIVE',
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
    hydrateControlPlaneSnapshot: (state, action: PayloadAction<any>) => {
      const snap = action.payload;
      if (!snap || typeof snap !== 'object') return;
      if (Array.isArray(snap.users)) {
        state.users = snap.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          tenantId: u.tenantId || undefined,
          status: u.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          mfaEnabled: Boolean(u.mfaEnabled),
          emailVerified: Boolean(u.emailVerified),
          lastLoginAt: u.createdAt || 'Live',
        }));
      }
      if (Array.isArray(snap.featureFlags)) {
        state.featureFlags = snap.featureFlags.map((f: any) => ({
          key: f.key,
          name: f.name,
          description: f.description,
          owner: f.owner,
          globalEnabled: Boolean(f.globalEnabled),
          rolloutPercentage: Number(f.rolloutPct ?? 100),
          tenantOverrides: Object.entries(f.overrides || {}).map(([tid, enabled]) => ({
            tenantId: tid,
            enabled: Boolean(enabled),
          })),
        }));
      }
      if (Array.isArray(snap.moderationProducts)) {
        state.modProducts = snap.moderationProducts.map((p: any) => ({
          id: p.productId,
          productName: p.productName,
          sku: p.sku,
          brandName: p.brandName,
          category: p.category,
          price: Number(p.price || 0),
          image: p.image || '',
          marketplacePublished: Boolean(p.marketplacePublished),
          moderationStatus: p.moderationStatus || 'APPROVED',
          moderationNote: p.moderationNote,
          featured: Boolean(p.featured),
          sponsored: Boolean(p.sponsored),
        }));
      }
      if (Array.isArray(snap.cmsPages)) state.cmsPages = snap.cmsPages;
      if (Array.isArray(snap.webhooks)) state.webhooks = snap.webhooks;
      if (Array.isArray(snap.creditLedger)) {
        state.creditLedger = snap.creditLedger;
      }
    },

    setAdminEmail: (state, action: PayloadAction<string>) => {
      state.adminEmail = action.payload;
    },

    setActiveRole: (state, action: PayloadAction<PlatformRole>) => {
      state.activeRole = action.payload;
    },
    toggleRolePermission: (
      state,
      action: PayloadAction<{ role: PlatformRole; mod: PlatformModule; permAction: PlatformAction }>
    ) => {
      const { role, mod, permAction } = action.payload;
      const cur = state.roleOverrides[role]?.[mod] || DEFAULT_ADMIN_PERMISSIONS[role]?.[mod] || [];
      const next = cur.includes(permAction)
        ? cur.filter((a) => a !== permAction)
        : [...cur, permAction];
      state.roleOverrides = {
        ...state.roleOverrides,
        [role]: { ...(state.roleOverrides[role] || {}), [mod]: next },
      };
      appendPlatformAudit(
        state,
        'RBAC_PERMISSION_UPDATED',
        `${role}:${mod}`,
        `Toggled permission action: ${permAction}`
      );
    },
    createCustomRole: (
      state,
      action: PayloadAction<{ id: string; label: string; summary: string; mfaRequired: boolean }>
    ) => {
      const role = action.payload;
      state.customRoles.push(role);
      appendPlatformAudit(state, 'CUSTOM_ROLE_CREATED', role.id, `Added role ${role.label}`);
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
    addTenantNote: (state, action: PayloadAction<{ tenantId: string; note: string }>) => {
      const { tenantId, note } = action.payload;
      state.tenants = state.tenants.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              internalNotes: [
                {
                  id: `n_${Date.now()}`,
                  author: state.adminEmail,
                  note,
                  at: new Date().toLocaleString('en-US'),
                },
                ...t.internalNotes,
              ],
            }
          : t
      );
    },
    assignSupportAgent: (state, action: PayloadAction<{ tenantId: string; agent: string }>) => {
      const { tenantId, agent } = action.payload;
      state.tenants = state.tenants.map((t) =>
        t.id === tenantId ? { ...t, assignedSupportAgent: agent } : t
      );
      appendPlatformAudit(state, 'SUPPORT_AGENT_ASSIGNED', tenantId, `Assigned ${agent}`, tenantId);
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

    savePlan: (state, action: PayloadAction<SubscriptionPlanRecord>) => {
      const plan = action.payload;
      const exists = state.plans.some((p) => p.id === plan.id);
      state.plans = exists ? state.plans.map((p) => (p.id === plan.id ? plan : p)) : [...state.plans, plan];
      appendPlatformAudit(
        state,
        'PLAN_CONFIG_SAVED',
        plan.name,
        `Saved entitlement matrix (৳${plan.monthlyPrice} BDT/mo)`
      );
    },
    updateSubscriptionStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: TenantSubscriptionRecord['status'];
        extra?: Partial<TenantSubscriptionRecord>;
      }>
    ) => {
      const { id, status, extra } = action.payload;
      state.subscriptions = state.subscriptions.map((sub) =>
        sub.id === id ? { ...sub, status, ...(extra || {}) } : sub
      );
      appendPlatformAudit(state, 'SUBSCRIPTION_MODIFIED', id, `Updated subscription -> ${status}`);
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
    updateReconciliationStatus: (
      state,
      action: PayloadAction<{ id: string; status: ReconciliationItem['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.reconciliations = state.reconciliations.map((rec) =>
        rec.id === id ? { ...rec, status } : rec
      );
      appendPlatformAudit(state, 'RECONCILIATION_UPDATED', id, `Exception status -> ${status}`);
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
    moderateBrand: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ModerationBrandItem> }>
    ) => {
      const { id, updates } = action.payload;
      state.modBrands = state.modBrands.map((b) => (b.id === id ? { ...b, ...updates } : b));
      appendPlatformAudit(state, 'BRAND_MODERATED', id, `Updated ${Object.keys(updates).join(', ')}`);
    },
    saveCategory: (state, action: PayloadAction<MarketplaceCategory>) => {
      const cat = action.payload;
      state.categories = state.categories.some((c) => c.id === cat.id)
        ? state.categories.map((c) => (c.id === cat.id ? cat : c))
        : [...state.categories, cat];
    },
    saveCollection: (state, action: PayloadAction<MarketplaceCollection>) => {
      const col = action.payload;
      state.collections = state.collections.some((c) => c.id === col.id)
        ? state.collections.map((c) => (c.id === col.id ? col : c))
        : [...state.collections, col];
    },
    resolveMktReport: (
      state,
      action: PayloadAction<{ id: string; status: MarketplaceReportItem['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.mktReports = state.mktReports.map((r) => (r.id === id ? { ...r, status } : r));
      appendPlatformAudit(state, 'MARKETPLACE_REPORT_UPDATED', id, `Report status -> ${status}`);
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
                  role: state.activeRole,
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
    updateAlertStatus: (
      state,
      action: PayloadAction<{ id: string; status: PlatformAlert['status']; owner?: string }>
    ) => {
      const { id, status, owner } = action.payload;
      state.alerts = state.alerts.map((a) =>
        a.id === id ? { ...a, status, owner: owner ?? a.owner } : a
      );
      appendPlatformAudit(state, 'PLATFORM_ALERT_UPDATED', id, `Status -> ${status}`);
    },
    updateSecurityEvent: (
      state,
      action: PayloadAction<{ id: string; status: SecurityEventRecord['status'] }>
    ) => {
      const { id, status } = action.payload;
      state.securityEvents = state.securityEvents.map((e) =>
        e.id === id ? { ...e, status } : e
      );
      appendPlatformAudit(state, 'SECURITY_EVENT_TRIAGED', id, `Status -> ${status}`);
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
    retryWebhook: (state, action: PayloadAction<string>) => {
      state.webhooks = state.webhooks.map((w) =>
        w.id === action.payload
          ? {
              ...w,
              retryCount: w.retryCount + 1,
              lastAttemptAt: `${new Date().toLocaleTimeString('en-US')} (queued)`,
            }
          : w
      );
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

