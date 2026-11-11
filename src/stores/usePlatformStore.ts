import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
import {
  DEMO_AI_MODELS,
  DEMO_AI_PROVIDERS,
  DEMO_AI_ROUTING,
  DEMO_ALERTS,
  DEMO_AUDIT_EVENTS,
  DEMO_CATEGORIES,
  DEMO_CMS_PAGES,
  DEMO_COLLECTIONS,
  DEMO_CREDIT_LEDGER,
  DEMO_DATA_REQUESTS,
  DEMO_FEATURE_FLAGS,
  DEMO_INVOICES,
  DEMO_MKT_REPORTS,
  DEMO_MOD_BRANDS,
  DEMO_MOD_PRODUCTS,
  DEMO_PLATFORM_SETTINGS,
  DEMO_PLATFORM_USERS,
  DEMO_PLANS,
  DEMO_RECONCILIATIONS,
  DEMO_REFUNDS,
  DEMO_SECURITY_EVENTS,
  DEMO_SUBSCRIPTIONS,
  DEMO_TENANTS,
  DEMO_TICKETS,
  DEMO_TRANSACTIONS,
  DEMO_TRYON_JOBS,
  DEMO_WEBHOOKS,
} from '../data/platformDemoSeed';
import { DEFAULT_ADMIN_PERMISSIONS } from '../config/permissions';
import { superAdminApi } from '../lib/api';

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

  // Actions
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

  // Tenant Lifecycle & Controlled Impersonation
  createTenant: (tenant: Omit<TenantRecord, 'id' | 'internalNotes' | 'timeline'>) => TenantRecord;
  updateTenantLifecycle: (id: string, lifecycleStatus: TenantLifecycleStatus, reason: string) => void;
  updateTenantPlanLocal: (id: string, plan: string, tryOnQuota: number) => void;
  addTenantNote: (tenantId: string, note: string) => void;
  assignSupportAgent: (tenantId: string, agent: string) => void;
  startImpersonation: (tenantId: string, mode: 'READ_ONLY' | 'ELEVATED_WRITE', reason: string) => void;
  endImpersonation: () => void;

  // Users
  updateUserStatus: (id: string, status: PlatformUserRecord['status']) => void;
  revokeUserSessions: (id: string) => void;

  // Plans & Subscriptions
  savePlan: (plan: SubscriptionPlanRecord) => void;
  updateSubscriptionStatus: (id: string, status: TenantSubscriptionRecord['status'], extra?: Partial<TenantSubscriptionRecord>) => void;

  // Finance
  updateRefundStatus: (id: string, status: RefundRequest['status']) => void;
  updateReconciliationStatus: (id: string, status: ReconciliationItem['status']) => void;

  // AI & Credits
  toggleAiModel: (id: string, active?: boolean, isDefault?: boolean) => void;
  updateAiRouting: (partial: Partial<AiRoutingPolicy>) => void;
  retryTryOnJob: (id: string) => void;
  cancelTryOnJob: (id: string) => void;
  adjustTenantCredits: (tenantId: string, delta: number, reason: string, type: CreditLedgerEntry['type']) => void;

  // Moderation & CMS
  moderateProduct: (id: string, status: ModerationProductItem['moderationStatus'], featured?: boolean) => void;
  moderateBrand: (id: string, updates: Partial<ModerationBrandItem>) => void;
  saveCategory: (cat: MarketplaceCategory) => void;
  saveCollection: (col: MarketplaceCollection) => void;
  resolveMktReport: (id: string, status: MarketplaceReportItem['status']) => void;
  saveCmsPage: (page: CmsPageRecord) => void;

  // Support, Alerts, Security, Governance, Flags, Settings
  updateTicket: (id: string, updates: Partial<SupportTicketRecord>) => void;
  addTicketMessage: (id: string, text: string, internal?: boolean) => void;
  updateAlertStatus: (id: string, status: PlatformAlert['status'], owner?: string) => void;
  updateSecurityEvent: (id: string, status: SecurityEventRecord['status']) => void;
  updateDataRequest: (id: string, status: DataGovernanceRequest['status']) => void;
  toggleFeatureFlag: (key: string, partial: Partial<FeatureFlagRecord>) => void;
  addWebhook: (url: string, events: string[]) => void;
  retryWebhook: (id: string) => void;
  updateSettings: (partial: Partial<PlatformGlobalSettings>) => void;

  recordAudit: (action: string, target: string, details: string, tenantContext?: string, reason?: string) => void;
}

export const usePlatformStore = create<PlatformStoreState>()(
  persist(
    (set, get) => ({
      isLiveBackend: false,
      lastSyncedAt: null,
      backendHealth: null,
      backendLatencyMs: null,
      backendTelemetry: { overview: null, aiMetrics: null },

      activeRole: 'SUPER_ADMIN',
      adminEmail: 'admin@vton-platform.io',
      roleOverrides: {},
      customRoles: [],

      sidebarCollapsed: false,
      openGroups: ['overview', 'tenants', 'ai', 'marketplace', 'system', 'security'],
      impersonation: null,

      tenants: DEMO_TENANTS,
      users: DEMO_PLATFORM_USERS,
      plans: DEMO_PLANS,
      subscriptions: DEMO_SUBSCRIPTIONS,
      transactions: DEMO_TRANSACTIONS,
      invoices: DEMO_INVOICES,
      refunds: DEMO_REFUNDS,
      reconciliations: DEMO_RECONCILIATIONS,

      aiProviders: DEMO_AI_PROVIDERS,
      aiModels: DEMO_AI_MODELS,
      aiRouting: DEMO_AI_ROUTING,
      tryOnJobs: DEMO_TRYON_JOBS,
      creditLedger: DEMO_CREDIT_LEDGER,

      modProducts: DEMO_MOD_PRODUCTS,
      modBrands: DEMO_MOD_BRANDS,
      categories: DEMO_CATEGORIES,
      collections: DEMO_COLLECTIONS,
      mktReports: DEMO_MKT_REPORTS,

      cmsPages: DEMO_CMS_PAGES,
      tickets: DEMO_TICKETS,
      alerts: DEMO_ALERTS,
      securityEvents: DEMO_SECURITY_EVENTS,
      auditEvents: DEMO_AUDIT_EVENTS,
      dataRequests: DEMO_DATA_REQUESTS,
      featureFlags: DEMO_FEATURE_FLAGS,
      webhooks: DEMO_WEBHOOKS,
      settings: DEMO_PLATFORM_SETTINGS,

      setLiveStatus: (live, health, latencyMs) =>
        set({
          isLiveBackend: live,
          backendHealth: health ?? get().backendHealth,
          backendLatencyMs: latencyMs ?? get().backendLatencyMs,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }),

      setBackendTelemetry: (backendTelemetry) => set({ backendTelemetry }),

      mergeLiveTenants: (raw) => {
        if (!Array.isArray(raw) || raw.length === 0) return;
        set((s) => {
          const existingMap = new Map(s.tenants.map((t) => [t.id, t]));
          const mergedLive: TenantRecord[] = raw.map((r) => {
            const prev = existingMap.get(r.id);
            const plan = r.subscription?.plan || prev?.plan || 'STARTER';
            const statusUpper = String(r.status || 'ACTIVE').toUpperCase();
            return {
              ...(prev || {
                country: 'Bangladesh',
                group: 'GROWTH_BOUTIQUE',
                verificationStatus: 'VERIFIED',
                subscriptionStatus: 'ACTIVE',
                teamCount: 3,
                marketplacePublishedCount: r.productCount || 0,
                monthlySpend: plan === 'ENTERPRISE' ? 299 : plan === 'PRO' ? 99 : 39,
                storageUsedMb: 240,
                storageLimitMb: 10240,
                apiRequests30d: 1850,
                retentionGraceDays: 30,
                internalNotes: [],
                timeline: [{ label: 'Live backend record synchronized', at: new Date().toLocaleDateString(), category: 'SYSTEM' }],
              }),
              id: r.id,
              name: r.name,
              slug: r.slug,
              owner: r.owner || prev?.owner || r.name,
              email: r.contactEmail || r.email || prev?.email || `${r.slug}@example.com`,
              status: statusUpper === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
              lifecycleStatus: statusUpper === 'SUSPENDED' ? 'SUSPENDED' : statusUpper === 'PENDING_VERIFICATION' ? 'PENDING_VERIFICATION' : 'ACTIVE',
              plan,
              productsCount: Number(r.productCount ?? prev?.productsCount ?? 0),
              ordersCount: Number(r.orderCount ?? prev?.ordersCount ?? 0),
              gmv: Number(r.totalRevenue ?? prev?.gmv ?? 0),
              tryOnUsed: Number(r.subscription?.tryOnUsed ?? prev?.tryOnUsed ?? 0),
              tryOnQuota: Number(r.subscription?.tryOnMonthlyQuota ?? prev?.tryOnQuota ?? 500),
              joinedDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : prev?.joinedDate || '2026-10-01',
            };
          });
          // Keep live tenants prioritized at top followed by non-colliding demo tenants
          const liveIds = new Set(mergedLive.map((m) => m.id));
          const remainingDemo = s.tenants.filter((d) => !liveIds.has(d.id));
          return { tenants: [...mergedLive, ...remainingDemo] };
        });
      },

      setLiveAuditLogs: (raw) => {
        if (!Array.isArray(raw) || raw.length === 0) return;
        const mapped: AuditEventRecord[] = raw.map((l: any, i: number) => ({
          id: l.id || `AUD-LIVE-${i}`,
          action: l.action || 'EVENT',
          actor: l.actorId || l.actor || 'system',
          actorRole: l.actorRole || 'SUPER_ADMIN',
          target: l.entity || l.target || 'Platform',
          tenantContext: l.tenantId || undefined,
          details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
          correlationId: l.correlationId || `corr_live_${i}`,
          timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Live',
        }));
        set({ auditEvents: mapped });
      },

      setLiveGenerations: (raw) => {
        if (!Array.isArray(raw) || raw.length === 0) return;
        set((s) => {
          const mapped: TryOnJobRecord[] = raw.map((j: any) => ({
            id: j.id,
            tenantId: j.tenantId,
            tenantName: s.tenants.find((t) => t.id === j.tenantId)?.name || j.tenantId,
            productId: j.productId || 'unknown',
            productName: j.productName || j.productId || 'Garment SKU',
            modelId: j.model || 'gemini-3.6-flash',
            provider: j.provider || 'gemini',
            status: (j.status || 'COMPLETED') as TryOnJobRecord['status'],
            durationMs: Number(j.latencyMs || 1400),
            creditsConsumed: j.status === 'FAILED' ? 0 : 1,
            estProviderCostUsd: 0.032,
            retryCount: Number(j.retryCount || 0),
            errorMessage: j.error || undefined,
            privateMediaRedacted: true,
            createdAt: j.createdAt ? new Date(j.createdAt).toLocaleString() : '',
          }));
          const liveIds = new Set(mapped.map((m) => m.id));
          return { tryOnJobs: [...mapped, ...s.tryOnJobs.filter((d) => !liveIds.has(d.id))] };
        });
      },

      setActiveRole: (activeRole) => set({ activeRole }),

      toggleRolePermission: (role, mod, action) => {
        set((s) => {
          const cur = s.roleOverrides[role]?.[mod] || DEFAULT_ADMIN_PERMISSIONS[role]?.[mod] || [];
          const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
          return {
            roleOverrides: {
              ...s.roleOverrides,
              [role]: { ...(s.roleOverrides[role] || {}), [mod]: next },
            },
          };
        });
        get().recordAudit('RBAC_PERMISSION_UPDATED', `${role}:${mod}`, `Toggled permission action: ${action}`);
      },

      createCustomRole: (role) => {
        set((s) => ({ customRoles: [...s.customRoles, role] }));
        get().recordAudit('CUSTOM_ROLE_CREATED', role.id, `Added role ${role.label}`);
      },

      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      toggleNavGroup: (id) =>
        set((s) => ({
          openGroups: s.openGroups.includes(id)
            ? s.openGroups.filter((g) => g !== id)
            : [...s.openGroups, id],
        })),

      createTenant: (input) => {
        const record: TenantRecord = {
          ...input,
          id: `tenant_${Date.now().toString(36)}`,
          internalNotes: [
            {
              id: `note_${Date.now()}`,
              author: get().adminEmail,
              note: 'Tenant provisioned via Super Admin invitation workflow (no password created by staff).',
              at: new Date().toLocaleString(),
            },
          ],
          timeline: [
            { label: 'Created tenant workspace & dispatched owner invite', at: new Date().toLocaleString(), category: 'LIFECYCLE' },
          ],
        };
        set((s) => ({ tenants: [record, ...s.tenants] }));
        get().recordAudit('TENANT_CREATED', record.name, `Provisioned ${record.slug} (${record.plan})`, record.id);
        return record;
      },

      updateTenantLifecycle: (id, lifecycleStatus, reason) => {
        set((s) => ({
          tenants: s.tenants.map((t) => {
            if (t.id !== id) return t;
            const suspended = lifecycleStatus === 'SUSPENDED' || lifecycleStatus === 'CANCELLED' || lifecycleStatus === 'OFFBOARDING';
            return {
              ...t,
              lifecycleStatus,
              status: suspended ? 'SUSPENDED' : 'ACTIVE',
              scheduledPurgeAt:
                lifecycleStatus === 'OFFBOARDING' || lifecycleStatus === 'CANCELLED'
                  ? new Date(Date.now() + t.retentionGraceDays * 86400000).toISOString().slice(0, 10)
                  : undefined,
              timeline: [
                { label: `Lifecycle moved to ${lifecycleStatus}: ${reason}`, at: new Date().toLocaleString(), category: 'LIFECYCLE' },
                ...t.timeline,
              ],
            };
          }),
        }));
        get().recordAudit('TENANT_LIFECYCLE_CHANGED', id, `Status -> ${lifecycleStatus}`, id, reason);
      },

      updateTenantPlanLocal: (id, plan, tryOnQuota) => {
        set((s) => ({
          tenants: s.tenants.map((t) => (t.id === id ? { ...t, plan, tryOnQuota } : t)),
        }));
        get().recordAudit('TENANT_PLAN_UPDATED', id, `Plan -> ${plan}, Quota -> ${tryOnQuota}`, id);
      },

      addTenantNote: (tenantId, note) => {
        set((s) => ({
          tenants: s.tenants.map((t) =>
            t.id === tenantId
              ? {
                  ...t,
                  internalNotes: [
                    { id: `n_${Date.now()}`, author: s.adminEmail, note, at: new Date().toLocaleString() },
                    ...t.internalNotes,
                  ],
                }
              : t
          ),
        }));
      },

      assignSupportAgent: (tenantId, agent) => {
        set((s) => ({
          tenants: s.tenants.map((t) => (t.id === tenantId ? { ...t, assignedSupportAgent: agent } : t)),
        }));
        get().recordAudit('SUPPORT_AGENT_ASSIGNED', tenantId, `Assigned ${agent}`, tenantId);
      },

      startImpersonation: (tenantId, mode, reason) => {
        const tenant = get().tenants.find((t) => t.id === tenantId);
        if (!tenant) return;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString();
        set({
          impersonation: {
            active: true,
            tenantId: tenant.id,
            tenantName: tenant.name,
            mode,
            reason,
            adminEmail: get().adminEmail,
            startedAt: new Date().toLocaleTimeString(),
            expiresAt,
          },
        });
        get().recordAudit('VIEW_AS_SESSION_STARTED', tenant.name, `Mode: ${mode}`, tenant.id, reason);
      },

      endImpersonation: () => {
        const imp = get().impersonation;
        set({ impersonation: null });
        if (imp) {
          get().recordAudit('VIEW_AS_SESSION_ENDED', imp.tenantName, `Closed ${imp.mode} session`, imp.tenantId);
        }
      },

      updateUserStatus: (id, status) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, status } : u)),
        }));
        get().recordAudit('USER_STATUS_CHANGED', id, `Status -> ${status}`);
      },

      revokeUserSessions: (id) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, activeSessionsCount: 0 } : u)),
        }));
        get().recordAudit('USER_SESSIONS_REVOKED', id, 'Invalidated active JWT/refresh sessions');
      },

      savePlan: (plan) => {
        set((s) => {
          const exists = s.plans.some((p) => p.id === plan.id);
          return {
            plans: exists ? s.plans.map((p) => (p.id === plan.id ? plan : p)) : [...s.plans, plan],
          };
        });
        get().recordAudit('PLAN_CONFIG_SAVED', plan.name, `Saved entitlement matrix (${plan.monthlyPrice} USD/mo)`);
      },

      updateSubscriptionStatus: (id, status, extra) => {
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status, ...(extra || {}) } : sub
          ),
        }));
        get().recordAudit('SUBSCRIPTION_MODIFIED', id, `Updated subscription -> ${status}`);
      },

      updateRefundStatus: (id, status) => {
        set((s) => ({
          refunds: s.refunds.map((r) =>
            r.id === id ? { ...r, status, approvedBy: s.adminEmail } : r
          ),
        }));
        get().recordAudit('REFUND_STATUS_UPDATED', id, `Refund status -> ${status}`);
      },

      updateReconciliationStatus: (id, status) => {
        set((s) => ({
          reconciliations: s.reconciliations.map((rec) =>
            rec.id === id ? { ...rec, status } : rec
          ),
        }));
        get().recordAudit('RECONCILIATION_UPDATED', id, `Exception status -> ${status}`);
      },

      toggleAiModel: (id, active, isDefault) => {
        set((s) => ({
          aiModels: s.aiModels.map((m) => {
            if (isDefault) {
              return { ...m, isDefault: m.id === id, active: m.id === id ? true : m.active };
            }
            return m.id === id ? { ...m, active: active ?? !m.active } : m;
          }),
        }));
        get().recordAudit('AI_MODEL_UPDATED', id, isDefault ? 'Promoted as default model' : `Active -> ${active}`);
      },

      updateAiRouting: (partial) => {
        set((s) => ({ aiRouting: { ...s.aiRouting, ...partial } }));
        get().recordAudit('AI_ROUTING_POLICY_UPDATED', 'Router', `Updated ${Object.keys(partial).join(', ')}`);
      },

      retryTryOnJob: (id) => {
        set((s) => ({
          tryOnJobs: s.tryOnJobs.map((j) =>
            j.id === id ? { ...j, status: 'QUEUED', retryCount: j.retryCount + 1, errorMessage: undefined } : j
          ),
        }));
        get().recordAudit('TRYON_JOB_RETRIED', id, 'Re-queued eligible failed generation job');
      },

      cancelTryOnJob: (id) => {
        set((s) => ({
          tryOnJobs: s.tryOnJobs.map((j) => (j.id === id ? { ...j, status: 'CANCELLED' } : j)),
        }));
        get().recordAudit('TRYON_JOB_CANCELLED', id, 'Cancelled queued generation job');
      },

      adjustTenantCredits: (tenantId, delta, reason, type) => {
        const tenant = get().tenants.find((t) => t.id === tenantId);
        if (!tenant) return;
        const nextQuota = Math.max(0, tenant.tryOnQuota + delta);
        const balanceAfter = Math.max(0, nextQuota - tenant.tryOnUsed);
        set((s) => ({
          tenants: s.tenants.map((t) => (t.id === tenantId ? { ...t, tryOnQuota: nextQuota } : t)),
          creditLedger: [
            {
              id: `crd_${Date.now()}`,
              tenantId,
              tenantName: tenant.name,
              type,
              delta,
              balanceAfter,
              reason,
              actor: s.adminEmail,
              referenceId: `REF-${Date.now().toString().slice(-6)}`,
              createdAt: new Date().toLocaleString(),
            },
            ...s.creditLedger,
          ],
        }));
        get().recordAudit('CREDIT_LEDGER_ADJUSTED', tenant.name, `${delta > 0 ? `+${delta}` : delta} (${type})`, tenantId, reason);
      },

      moderateProduct: (id, moderationStatus, featured) => {
        set((s) => ({
          modProducts: s.modProducts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  moderationStatus,
                  visibility: moderationStatus === 'APPROVED' ? 'PUBLIC' : 'HIDDEN',
                  featured: featured ?? p.featured,
                }
              : p
          ),
        }));
        get().recordAudit('PRODUCT_MODERATED', id, `Moderation -> ${moderationStatus}`);
      },

      moderateBrand: (id, updates) => {
        set((s) => ({
          modBrands: s.modBrands.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
        get().recordAudit('BRAND_MODERATED', id, `Updated ${Object.keys(updates).join(', ')}`);
      },

      saveCategory: (cat) =>
        set((s) => ({
          categories: s.categories.some((c) => c.id === cat.id)
            ? s.categories.map((c) => (c.id === cat.id ? cat : c))
            : [...s.categories, cat],
        })),

      saveCollection: (col) =>
        set((s) => ({
          collections: s.collections.some((c) => c.id === col.id)
            ? s.collections.map((c) => (c.id === col.id ? col : c))
            : [...s.collections, col],
        })),

      resolveMktReport: (id, status) => {
        set((s) => ({
          mktReports: s.mktReports.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        get().recordAudit('MARKETPLACE_REPORT_UPDATED', id, `Report status -> ${status}`);
      },

      saveCmsPage: (page) => {
        set((s) => ({
          cmsPages: s.cmsPages.some((p) => p.id === page.id)
            ? s.cmsPages.map((p) => (p.id === page.id ? page : p))
            : [...s.cmsPages, page],
        }));
        get().recordAudit('CMS_PAGE_SAVED', page.title, `Status: ${page.status}`);
      },

      updateTicket: (id, updates) => {
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toLocaleString() } : t
          ),
        }));
        get().recordAudit('TICKET_UPDATED', id, `Modified ${Object.keys(updates).join(', ')}`);
      },

      addTicketMessage: (id, text, internal = false) => {
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      sender: s.adminEmail,
                      role: s.activeRole,
                      text,
                      internal,
                      at: new Date().toLocaleString(),
                    },
                  ],
                  updatedAt: new Date().toLocaleString(),
                }
              : t
          ),
        }));
      },

      updateAlertStatus: (id, status, owner) => {
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, status, owner: owner ?? a.owner } : a)),
        }));
        get().recordAudit('PLATFORM_ALERT_UPDATED', id, `Status -> ${status}`);
      },

      updateSecurityEvent: (id, status) => {
        set((s) => ({
          securityEvents: s.securityEvents.map((e) => (e.id === id ? { ...e, status } : e)),
        }));
        get().recordAudit('SECURITY_EVENT_TRIAGED', id, `Status -> ${status}`);
      },

      updateDataRequest: (id, status) => {
        set((s) => ({
          dataRequests: s.dataRequests.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        get().recordAudit('GOVERNANCE_REQUEST_UPDATED', id, `Status -> ${status}`);
      },

      toggleFeatureFlag: (key, partial) => {
        set((s) => ({
          featureFlags: s.featureFlags.map((f) =>
            f.key === key ? { ...f, ...partial, updatedAt: new Date().toISOString().slice(0, 10) } : f
          ),
        }));
        get().recordAudit('FEATURE_FLAG_UPDATED', key, `Updated ${Object.keys(partial).join(', ')}`);
      },

      addWebhook: (url, events) => {
        set((s) => ({
          webhooks: [
            {
              id: `wh_${Date.now()}`,
              url,
              events,
              active: true,
              lastResponseCode: 200,
              retryCount: 0,
              lastAttemptAt: 'Pending test delivery',
            },
            ...s.webhooks,
          ],
        }));
        get().recordAudit('WEBHOOK_REGISTERED', url, `Events: ${events.join(', ')}`);
      },

      retryWebhook: (id) => {
        set((s) => ({
          webhooks: s.webhooks.map((w) =>
            w.id === id
              ? { ...w, retryCount: w.retryCount + 1, lastAttemptAt: `${new Date().toLocaleTimeString()} (queued)` }
              : w
          ),
        }));
      },

      updateSettings: (partial) => {
        set((s) => ({ settings: { ...s.settings, ...partial } }));
        get().recordAudit('PLATFORM_SETTINGS_UPDATED', 'Global Config', `Modified ${Object.keys(partial).join(', ')}`);
        if (get().isLiveBackend) void superAdminApi.updateSettings(partial).catch(() => undefined);
      },

      hydrateControlPlaneSnapshot: (snap) => {
        if (!snap || typeof snap !== 'object') return;
        set((s) => {
          const nextUsers =
            Array.isArray(snap.users) && snap.users.length > 0
              ? snap.users.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  tenantId: u.tenantId || undefined,
                  status: u.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
                  mfaEnabled: Boolean(u.mfaEnabled),
                  emailVerified: Boolean(u.emailVerified),
                  lastLoginAt: u.createdAt || 'Live',
                }))
              : s.users;

          const nextFlags =
            Array.isArray(snap.featureFlags) && snap.featureFlags.length > 0
              ? snap.featureFlags.map((f: any) => ({
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
                }))
              : s.featureFlags;

          const nextModProducts =
            Array.isArray(snap.moderationProducts) && snap.moderationProducts.length > 0
              ? snap.moderationProducts.map((p: any) => ({
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
                }))
              : s.modProducts;

          return {
            users: nextUsers,
            featureFlags: nextFlags,
            modProducts: nextModProducts,
            cmsPages: Array.isArray(snap.cmsPages) && snap.cmsPages.length > 0 ? snap.cmsPages : s.cmsPages,
            webhooks: Array.isArray(snap.webhooks) && snap.webhooks.length > 0 ? snap.webhooks : s.webhooks,
            creditLedger:
              Array.isArray(snap.creditLedger) && snap.creditLedger.length > 0 ? snap.creditLedger : s.creditLedger,
          };
        });
      },

      recordAudit: (action, target, details, tenantContext, reason) =>
        set((s) => ({
          auditEvents: [
            {
              id: `AUD-${Date.now().toString().slice(-5)}`,
              action,
              actor: s.adminEmail,
              actorRole: s.activeRole,
              target,
              tenantContext,
              details,
              reason,
              correlationId: `corr_${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toLocaleString(),
            },
            ...s.auditEvents,
          ].slice(0, 150),
        })),
    }),
    {
      name: 'vton_super_admin_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeRole: state.activeRole,
        roleOverrides: state.roleOverrides,
        customRoles: state.customRoles,
        sidebarCollapsed: state.sidebarCollapsed,
        openGroups: state.openGroups,
        featureFlags: state.featureFlags,
        settings: state.settings,
      }),
    }
  )
);

