import type {
  AiModelRecord,
  AiRoutingPolicy,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  ModerationProductItem,
  PlatformGlobalSettings,
  PlatformInvoice,
  PlatformUserRecord,
  RefundRequest,
  SubscriptionPlanRecord,
  SupportTicketRecord,
  TenantSubscriptionRecord,
  WebhookSubscription,
} from '../types';
import { isAllowedAdminRole } from './portal-auth';

/**
 * Maps the backend control-plane snapshot (GET /api/v1/admin/control-plane/snapshot) onto the dashboard's
 * record types. Pure functions: no store, no network. A collection is returned only when the backend sent it
 * as an array, so "not sent" is never confused with "empty". Fields the backend does not provide are left
 * neutral (0, '' or '—') instead of being invented.
 */

type Raw = Record<string, any>;

export interface ControlPlaneContext {
  /** id -> display name, used to label rows that only carry a tenantId */
  tenantNames: Map<string, string>;
  currentAiRouting: AiRoutingPolicy;
  currentSettings: PlatformGlobalSettings;
}

export interface MappedControlPlane {
  users?: PlatformUserRecord[];
  plans?: SubscriptionPlanRecord[];
  subscriptions?: TenantSubscriptionRecord[];
  invoices?: PlatformInvoice[];
  refunds?: RefundRequest[];
  creditLedger?: CreditLedgerEntry[];
  aiModels?: AiModelRecord[];
  aiRouting?: AiRoutingPolicy;
  modProducts?: ModerationProductItem[];
  cmsPages?: CmsPageRecord[];
  tickets?: SupportTicketRecord[];
  featureFlags?: FeatureFlagRecord[];
  webhooks?: WebhookSubscription[];
  dataRequests?: DataGovernanceRequest[];
  settings?: PlatformGlobalSettings;
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const tenantName = (ctx: ControlPlaneContext, id: unknown): string => ctx.tenantNames.get(str(id)) || str(id, '—');

export function mapUsers(rows: Raw[]): PlatformUserRecord[] {
  return rows.map((u): PlatformUserRecord => {
    const role = str(u.role);
    const category: PlatformUserRecord['category'] =
      role === 'SUPER_ADMIN'
        ? 'SUPER_ADMIN'
        : isAllowedAdminRole(role)
          ? 'PLATFORM_STAFF'
          : role === 'BRAND_OWNER'
            ? 'BRAND_OWNER'
            : role === 'CUSTOMER'
              ? 'MARKETPLACE_CUSTOMER'
              : 'BRAND_STAFF';
    const verified = Boolean(u.emailVerified);
    return {
      id: str(u.id),
      name: str(u.name),
      email: str(u.email),
      category,
      tenantId: u.tenantId ? str(u.tenantId) : undefined,
      roleLabel: role,
      status: u.status === 'SUSPENDED' ? 'SUSPENDED' : verified ? 'ACTIVE' : 'PENDING_VERIFICATION',
      mfaEnabled: false,
      registeredAt: str(u.createdAt),
      lastLoginAt: '—',
      activeSessionsCount: 0,
    };
  });
}

const limitOf = (p: Raw, key: string): number => {
  const row = Array.isArray(p.entitlements) ? p.entitlements.find((e: Raw) => e?.featureKey === key) : undefined;
  return row?.state === 'LIMIT' ? num(row.limitValue) : 0;
};
const flagOf = (p: Raw, key: string): 'ENABLED' | 'DISABLED' => {
  const row = Array.isArray(p.entitlements) ? p.entitlements.find((e: Raw) => e?.featureKey === key) : undefined;
  return row?.state === 'ENABLED' ? 'ENABLED' : 'DISABLED';
};

export function mapPlans(rows: Raw[]): SubscriptionPlanRecord[] {
  return rows.map((p, i): SubscriptionPlanRecord => {
    const tryOns = limitOf(p, 'monthly_tryons');
    return {
      id: str(p.id),
      name: str(p.name),
      slug: str(p.slug),
      description: str(p.description),
      monthlyPrice: num(p.monthlyPrice),
      annualPrice: num(p.annualPrice),
      setupFee: 0,
      currency: str(p.currency, 'BDT'),
      trialDays: num(p.trialDays),
      publicVisible: Boolean(p.publicVisible),
      displayOrder: i + 1,
      limits: {
        maxProducts: limitOf(p, 'max_products'),
        maxVariantsPerProduct: 0,
        maxCategories: 0,
        maxCollections: 0,
        monthlyAiCredits: tryOns,
        maxTeamSeats: 0,
        storageQuotaMb: 0,
        monthlyApiRequests: 0,
      },
      allowedQualities: [],
      allowedCategories: [],
      entitlements: {
        marketplaceEnabled: 'DISABLED',
        virtualTryOnEnabled: tryOns > 0 ? 'ENABLED' : 'DISABLED',
        customDomainEnabled: 'DISABLED',
        storefrontBuilder: 'DISABLED',
        analyticsAccess: 'DISABLED',
        apiAccess: flagOf(p, 'api_webhooks'),
        priorityGpuQueue: 'DISABLED',
        highFidelityModels: flagOf(p, 'high_fidelity_vton'),
      },
    };
  });
}

export function mapSubscriptions(rows: Raw[], plans: SubscriptionPlanRecord[]): TenantSubscriptionRecord[] {
  const bySlug = new Map(plans.map((p) => [p.slug.toUpperCase(), p]));
  const out: TenantSubscriptionRecord[] = [];
  for (const r of rows) {
    const sub = r?.subscription;
    if (!sub) continue; // a tenant without a subscription row has nothing to list
    const plan = bySlug.get(str(sub.plan).toUpperCase());
    out.push({
      id: `sub_${str(r.tenantId)}`,
      tenantId: str(r.tenantId),
      tenantName: str(r.tenantName, '—'),
      planId: plan?.id || str(sub.plan),
      planName: plan?.name || str(sub.plan),
      interval: 'MONTHLY',
      amount: plan?.monthlyPrice ?? 0,
      currency: plan?.currency || 'BDT',
      status: pick(sub.status, ['ACTIVE', 'PAST_DUE', 'CANCELLED'] as const, 'ACTIVE'),
      paymentProvider: 'MANUAL_INVOICE',
      startedAt: '—',
      renewalDate: '—',
    });
  }
  return out;
}

export function mapInvoices(rows: Raw[], ctx: ControlPlaneContext): PlatformInvoice[] {
  return rows.map((i): PlatformInvoice => ({
    id: str(i.invoiceNo || i.id),
    tenantId: str(i.tenantId),
    tenantName: tenantName(ctx, i.tenantId),
    subscriptionId: `sub_${str(i.tenantId)}`,
    period: str(i.period),
    subtotal: num(i.subtotal),
    taxAmount: num(i.taxAmount),
    total: num(i.total),
    currency: str(i.currency, 'BDT'),
    status: pick(i.status, ['PAID', 'OPEN', 'PAST_DUE', 'VOID'] as const, 'OPEN'),
    dueDate: str(i.dueDate),
    issuedAt: str(i.issuedAt),
  }));
}

export function mapRefunds(rows: Raw[], ctx: ControlPlaneContext): RefundRequest[] {
  const status: Record<string, RefundRequest['status']> = {
    PENDING: 'REQUESTED',
    APPROVED: 'APPROVED_PENDING_PROVIDER',
    PROCESSED: 'COMPLETED_BY_PROVIDER',
    REJECTED: 'REJECTED',
  };
  return rows.map((r): RefundRequest => ({
    id: str(r.id),
    transactionId: str(r.orderId),
    tenantName: tenantName(ctx, r.tenantId),
    amount: num(r.amount),
    currency: str(r.currency, 'BDT'),
    reason: str(r.reason),
    status: status[str(r.status)] || 'REQUESTED',
    requestedBy: '—',
    createdAt: str(r.createdAt),
  }));
}

export function mapCreditLedger(rows: Raw[], ctx: ControlPlaneContext): CreditLedgerEntry[] {
  const type: Record<string, CreditLedgerEntry['type']> = {
    ALLOCATE: 'PURCHASE',
    PROMO_GRANT: 'GRANT_PROMO',
    MANUAL_ADD: 'ADMIN_ADJUSTMENT',
    MANUAL_DEDUCT: 'ADMIN_ADJUSTMENT',
    CONSUME: 'CONSUMED',
    RELEASE: 'RELEASED',
  };
  // RESERVE rows are holds that later settle as CONSUME or RELEASE; the dashboard has no "reserved" type.
  return rows
    .filter((e) => str(e.type) in type)
    .map((e): CreditLedgerEntry => ({
      id: str(e.id),
      tenantId: str(e.tenantId),
      tenantName: tenantName(ctx, e.tenantId),
      type: type[str(e.type)],
      delta: num(e.delta),
      balanceAfter: num(e.balanceAfter),
      reason: str(e.reason),
      actor: str(e.actor, 'system'),
      referenceId: str(e.referenceId),
      createdAt: str(e.createdAt),
    }));
}

export function mapAiModels(rows: Raw[]): AiModelRecord[] {
  return rows.map((m): AiModelRecord => ({
    id: str(m.id),
    name: str(m.name),
    providerId: str(m.providerId),
    category: 'VIRTUAL_TRYON',
    version: str(m.version),
    supportedGarments: [str(m.category, 'all')],
    resolution: str(m.resolution),
    avgDurationSec: 0,
    estCostUsd: num(m.estCostUsd),
    requiredEntitlement: str(m.requiredEntitlement).toUpperCase() === 'PRO' ? 'highFidelityModels' : 'virtualTryOnEnabled',
    active: Boolean(m.active),
    isDefault: Boolean(m.isDefault),
  }));
}

/** Merges only the fields the backend really has onto the current policy. */
export function mapAiRouting(raw: Raw, current: AiRoutingPolicy): AiRoutingPolicy {
  return {
    ...current,
    primaryProvider: str(raw.primaryProvider, current.primaryProvider),
    secondaryProvider: str(raw.fallbackProvider, current.secondaryProvider),
  };
}

export function mapModerationProducts(rows: Raw[]): ModerationProductItem[] {
  return rows.map((p): ModerationProductItem => ({
    id: str(p.productId),
    productId: str(p.productId),
    productName: str(p.productName),
    brandId: str(p.tenantId),
    brandName: str(p.brandName),
    category: str(p.category),
    imageUrl: str(p.image),
    price: num(p.price),
    moderationStatus: pick(
      p.moderationStatus,
      ['PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'UNPUBLISHED'] as const,
      'PENDING_REVIEW',
    ),
    visibility: p.marketplacePublished ? 'PUBLIC' : 'HIDDEN',
    featured: Boolean(p.featured),
    sponsored: Boolean(p.sponsored),
    reportsCount: 0,
    submittedAt: '',
  }));
}

export function mapCmsPages(rows: Raw[]): CmsPageRecord[] {
  return rows.map((c): CmsPageRecord => ({
    id: str(c.id),
    title: str(c.title),
    slug: str(c.slug),
    type: pick(c.type, ['HOMEPAGE_SECTION', 'STATIC_PAGE', 'BANNER', 'BLOG', 'FAQ'] as const, 'STATIC_PAGE'),
    status: pick(c.status, ['PUBLISHED', 'DRAFT', 'SCHEDULED'] as const, 'DRAFT'),
    order: num(c.sortOrder),
    summary: str(c.summary),
    updatedAt: str(c.updatedAt),
  }));
}

export function mapTickets(rows: Raw[], ctx: ControlPlaneContext): SupportTicketRecord[] {
  return rows.map((t): SupportTicketRecord => ({
    id: str(t.id),
    subject: str(t.subject),
    requesterName: str(t.requesterName),
    requesterEmail: str(t.requesterEmail),
    tenantId: t.tenantId ? str(t.tenantId) : undefined,
    tenantName: t.tenantId ? tenantName(ctx, t.tenantId) : undefined,
    category: pick(
      t.category,
      ['ACCOUNT', 'SUBSCRIPTION', 'PAYMENT', 'PRODUCT', 'MARKETPLACE', 'TRY_ON', 'AI_ENGINE', 'TECHNICAL', 'PRIVACY'] as const,
      'TECHNICAL',
    ),
    priority: pick(t.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, 'MEDIUM'),
    status: pick(
      t.status,
      ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'] as const,
      'OPEN',
    ),
    assignedAgent: t.assignedAgent ? str(t.assignedAgent) : undefined,
    relatedJobId: t.relatedJobId ? str(t.relatedJobId) : undefined,
    messages: (Array.isArray(t.messages) ? t.messages : []).map((m: Raw) => ({
      sender: str(m.sender),
      role: str(m.senderRole),
      text: str(m.body),
      internal: Boolean(m.internal),
      at: str(m.createdAt),
    })),
    createdAt: str(t.createdAt),
    updatedAt: str(t.updatedAt),
  }));
}

export function mapFeatureFlags(rows: Raw[]): FeatureFlagRecord[] {
  return rows.map((f): FeatureFlagRecord => ({
    key: str(f.key),
    name: str(f.name),
    description: str(f.description),
    owner: str(f.owner),
    globalEnabled: Boolean(f.globalEnabled),
    rolloutPct: num(f.rolloutPct, 100),
    planOverrides: f.overrides && typeof f.overrides === 'object' ? { ...f.overrides } : {},
    updatedAt: '',
  }));
}

export function mapWebhooks(rows: Raw[]): WebhookSubscription[] {
  return rows.map((w): WebhookSubscription => ({
    id: str(w.id),
    url: str(w.url),
    events: Array.isArray(w.events) ? w.events.map((e: unknown) => str(e)) : [],
    active: Boolean(w.active),
    lastResponseCode: num(w.lastResponseCode),
    retryCount: 0,
    lastAttemptAt: '',
  }));
}

export function mapDataRequests(rows: Raw[], ctx: ControlPlaneContext): DataGovernanceRequest[] {
  const type: Record<string, DataGovernanceRequest['type']> = { EXPORT: 'DATA_EXPORT', DELETE: 'DATA_DELETION' };
  return rows.map((r): DataGovernanceRequest => ({
    id: str(r.id),
    type: type[str(r.type)] || 'DATA_EXPORT',
    requester: str(r.requester),
    tenantName: tenantName(ctx, r.tenantId),
    status: str(r.status) === 'REJECTED' ? 'DENIED' : pick(r.status, ['PENDING_REVIEW', 'IN_PROGRESS', 'COMPLETED'] as const, 'PENDING_REVIEW'),
    retentionDeadline: str(r.retentionDeadline),
    createdAt: str(r.createdAt),
  }));
}

/** Merges only the settings the backend really stores onto the current ones. */
export function mapSettings(raw: Raw, current: PlatformGlobalSettings): PlatformGlobalSettings {
  return {
    ...current,
    platformName: str(raw.platformName, current.platformName),
    maxImageUploadMb: num(raw.maxUploadMb, current.maxImageUploadMb),
    maintenanceMode: { ...current.maintenanceMode, enabled: Boolean(raw.maintenanceMode) },
  };
}

export function mapControlPlaneSnapshot(snap: Raw | null | undefined, ctx: ControlPlaneContext): MappedControlPlane {
  const out: MappedControlPlane = {};
  if (!snap || typeof snap !== 'object') return out;
  const arr = (k: string): Raw[] | undefined => (Array.isArray(snap[k]) ? (snap[k] as Raw[]) : undefined);

  const plans = arr('plans') ? mapPlans(arr('plans')!) : undefined;
  if (plans) out.plans = plans;
  if (arr('users')) out.users = mapUsers(arr('users')!);
  if (arr('subscriptions')) out.subscriptions = mapSubscriptions(arr('subscriptions')!, plans || []);
  if (arr('invoices')) out.invoices = mapInvoices(arr('invoices')!, ctx);
  if (arr('refunds')) out.refunds = mapRefunds(arr('refunds')!, ctx);
  if (arr('creditLedger')) out.creditLedger = mapCreditLedger(arr('creditLedger')!, ctx);
  if (arr('aiModels')) out.aiModels = mapAiModels(arr('aiModels')!);
  if (snap.aiRouting && typeof snap.aiRouting === 'object') out.aiRouting = mapAiRouting(snap.aiRouting, ctx.currentAiRouting);
  if (arr('moderationProducts')) out.modProducts = mapModerationProducts(arr('moderationProducts')!);
  if (arr('cmsPages')) out.cmsPages = mapCmsPages(arr('cmsPages')!);
  if (arr('tickets')) out.tickets = mapTickets(arr('tickets')!, ctx);
  if (arr('featureFlags')) out.featureFlags = mapFeatureFlags(arr('featureFlags')!);
  if (arr('webhooks')) out.webhooks = mapWebhooks(arr('webhooks')!);
  if (arr('governanceRequests')) out.dataRequests = mapDataRequests(arr('governanceRequests')!, ctx);
  if (snap.settings && typeof snap.settings === 'object') out.settings = mapSettings(snap.settings, ctx.currentSettings);
  return out;
}
