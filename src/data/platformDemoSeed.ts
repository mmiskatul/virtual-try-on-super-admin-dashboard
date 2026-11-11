import {
  AiModelRecord,
  AiProviderRecord,
  AiRoutingPolicy,
  AuditEventRecord,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  MarketplaceCategory,
  MarketplaceCollection,
  MarketplaceReportItem,
  ModerationBrandItem,
  ModerationProductItem,
  PaymentTransaction,
  PlatformAlert,
  PlatformGlobalSettings,
  PlatformInvoice,
  PlatformUserRecord,
  ReconciliationItem,
  RefundRequest,
  SecurityEventRecord,
  SubscriptionPlanRecord,
  SupportTicketRecord,
  TenantRecord,
  TenantSubscriptionRecord,
  TryOnJobRecord,
  WebhookSubscription,
} from '../types';

const SAMPLE_BRAND_SEED: Array<{
  name: string;
  slug: string;
  owner: string;
  country: string;
  plan: string;
  lifecycle: TenantRecord['lifecycleStatus'];
  group: TenantRecord['group'];
  gmv: number;
  used: number;
  quota: number;
}> = [
  { name: 'Aura Atelier', slug: 'aura-atelier', owner: 'Elena Rostova', country: 'Bangladesh', plan: 'PRO', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 28450, used: 1240, quota: 5000 },
  { name: 'Vogue Nova', slug: 'vogue-nova', owner: 'Marcus Sterling', country: 'United Kingdom', plan: 'ENTERPRISE', lifecycle: 'ACTIVE', group: 'ENTERPRISE_PARTNER', gmv: 89200, used: 8420, quota: 25000 },
  { name: 'Aarong Heritage Studio', slug: 'aarong-heritage', owner: 'Farhana Rahman', country: 'Bangladesh', plan: 'ENTERPRISE', lifecycle: 'ACTIVE', group: 'ENTERPRISE_PARTNER', gmv: 112400, used: 14100, quota: 25000 },
  { name: 'Dhaka Looms', slug: 'dhaka-looms', owner: 'Tanvir Ahmed', country: 'Bangladesh', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 19300, used: 3100, quota: 10000 },
  { name: 'Silk & Saffron', slug: 'silk-saffron', owner: 'Nadia Karim', country: 'India', plan: 'PRO', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 15800, used: 2210, quota: 5000 },
  { name: 'Nordic Minimal', slug: 'nordic-minimal', owner: 'Soren Lindqvist', country: 'Sweden', plan: 'PRO', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 41200, used: 2890, quota: 5000 },
  { name: 'Atelier Lumiere', slug: 'atelier-lumiere', owner: 'Camille Laurent', country: 'France', plan: 'ENTERPRISE', lifecycle: 'ACTIVE', group: 'ENTERPRISE_PARTNER', gmv: 96500, used: 11020, quota: 25000 },
  { name: 'Kyoto Selvedge', slug: 'kyoto-selvedge', owner: 'Kenji Takahashi', country: 'Japan', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 34800, used: 4150, quota: 10000 },
  { name: 'Zari Couturier', slug: 'zari-couturier', owner: 'Sana Mirza', country: 'Pakistan', plan: 'STARTER', lifecycle: 'TRIAL', group: 'NEW_COHORT', gmv: 2100, used: 310, quota: 1000 },
  { name: 'Metro Activewear', slug: 'metro-active', owner: 'Devon Brooks', country: 'United States', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 53400, used: 6200, quota: 10000 },
  { name: 'Muslin House', slug: 'muslin-house', owner: 'Rafiul Islam', country: 'Bangladesh', plan: 'STARTER', lifecycle: 'ACTIVE', group: 'NEW_COHORT', gmv: 6420, used: 580, quota: 1000 },
  { name: 'Velvet Thread', slug: 'velvet-thread', owner: 'Maya Chen', country: 'Singapore', plan: 'PRO', lifecycle: 'PAST_DUE', group: 'GROWTH_BOUTIQUE', gmv: 14100, used: 3920, quota: 5000 },
  { name: 'Sahara Linen', slug: 'sahara-linen', owner: 'Omar Hassan', country: 'UAE', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 27900, used: 3400, quota: 10000 },
  { name: 'Monsoon Outerwear', slug: 'monsoon-outer', owner: 'Arjun Mehta', country: 'India', plan: 'PRO', lifecycle: 'SUSPENDED', group: 'GROWTH_BOUTIQUE', gmv: 8400, used: 4990, quota: 5000 },
  { name: 'Knit & Co', slug: 'knit-and-co', owner: 'Hannah Abbott', country: 'Canada', plan: 'STARTER', lifecycle: 'TRIAL', group: 'NEW_COHORT', gmv: 1200, used: 145, quota: 1000 },
  { name: 'Seaside Resortwear', slug: 'seaside-resort', owner: 'Sofia Morales', country: 'Spain', plan: 'PRO', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 21500, used: 1840, quota: 5000 },
  { name: 'Panjabi Royale', slug: 'panjabi-royale', owner: 'Jubayer Hossain', country: 'Bangladesh', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 32900, used: 5400, quota: 10000 },
  { name: 'Modest Vogue', slug: 'modest-vogue', owner: 'Aisha Al-Mansoor', country: 'Malaysia', plan: 'PRO', lifecycle: 'PENDING_VERIFICATION', group: 'NEW_COHORT', gmv: 0, used: 12, quota: 5000 },
  { name: 'Denim Lab Berlin', slug: 'denim-lab', owner: 'Lukas Weber', country: 'Germany', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 46100, used: 5120, quota: 10000 },
  { name: 'Ivory Bridal Edit', slug: 'ivory-bridal', owner: 'claire@ivorybridal.io', country: 'United States', plan: 'ENTERPRISE', lifecycle: 'ACTIVE', group: 'ENTERPRISE_PARTNER', gmv: 78300, used: 6890, quota: 25000 },
  { name: 'Saree Artisans', slug: 'saree-artisans', owner: 'Ananya Sen', country: 'India', plan: 'FREE', lifecycle: 'ONBOARDING', group: 'NEW_COHORT', gmv: 450, used: 48, quota: 150 },
  { name: 'Urban Streetwear BD', slug: 'urban-bd', owner: 'Saif Khan', country: 'Bangladesh', plan: 'STARTER', lifecycle: 'ACTIVE', group: 'NEW_COHORT', gmv: 7850, used: 720, quota: 1000 },
  { name: 'Caspian Cashmere', slug: 'caspian-cashmere', owner: 'Leila Rahimi', country: 'Netherlands', plan: 'PRO', lifecycle: 'CANCELLED', group: 'GROWTH_BOUTIQUE', gmv: 11200, used: 900, quota: 5000 },
  { name: 'Alpine Layering', slug: 'alpine-layer', owner: 'Matteo Rossi', country: 'Italy', plan: 'BUSINESS', lifecycle: 'ACTIVE', group: 'GROWTH_BOUTIQUE', gmv: 38900, used: 4300, quota: 10000 },
  { name: 'Sandbox Apparel Dev', slug: 'sandbox-dev', owner: 'Platform QA', country: 'United States', plan: 'FREE', lifecycle: 'RESTRICTED', group: 'SANDBOX', gmv: 0, used: 120, quota: 150 },
];

export const DEMO_TENANTS: TenantRecord[] = SAMPLE_BRAND_SEED.map((b, i) => {
  const num = i + 1;
  const suspended = b.lifecycle === 'SUSPENDED' || b.lifecycle === 'CANCELLED';
  return {
    id: i === 0 ? 'tenant_aura' : i === 1 ? 'tenant_vogue' : `tenant_${String(num).padStart(3, '0')}`,
    name: b.name,
    slug: b.slug,
    owner: b.owner.includes('@') ? 'Claire Sterling' : b.owner,
    email: b.owner.includes('@') ? b.owner : `owner@${b.slug}.com`,
    status: suspended ? 'SUSPENDED' : 'ACTIVE',
    plan: b.plan,
    productsCount: 8 + ((i * 7) % 64),
    ordersCount: Math.max(0, Math.round(b.gmv / 145)),
    gmv: b.gmv,
    tryOnUsed: b.used,
    tryOnQuota: b.quota,
    joinedDate: `2026-${String(((i % 9) + 1)).padStart(2, '0')}-${String(((i * 3) % 27) + 1).padStart(2, '0')}`,
    legalName: `${b.name} Retail Ltd.`,
    logoUrl: `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=240&auto=format&fit=crop&q=70`,
    phone: `+880-1700-${String(100000 + i * 111)}`,
    country: b.country,
    group: b.group,
    verificationStatus:
      b.lifecycle === 'PENDING_VERIFICATION' || b.lifecycle === 'ONBOARDING'
        ? 'UNDER_REVIEW'
        : 'VERIFIED',
    lifecycleStatus: b.lifecycle,
    subscriptionStatus:
      b.lifecycle === 'TRIAL'
        ? 'TRIALING'
        : b.lifecycle === 'PAST_DUE'
        ? 'PAST_DUE'
        : b.lifecycle === 'CANCELLED'
        ? 'CANCELLED'
        : 'ACTIVE',
    teamCount: b.plan === 'ENTERPRISE' ? 14 : b.plan === 'BUSINESS' ? 7 : 3,
    marketplacePublishedCount: 4 + ((i * 5) % 36),
    monthlySpend:
      b.plan === 'ENTERPRISE' ? 299 : b.plan === 'BUSINESS' ? 179 : b.plan === 'PRO' ? 99 : b.plan === 'STARTER' ? 39 : 0,
    storageUsedMb: 120 + i * 95,
    storageLimitMb: b.plan === 'ENTERPRISE' ? 51200 : b.plan === 'PRO' ? 10240 : 2048,
    apiRequests30d: 1200 + i * 840,
    assignedSupportAgent: i % 2 === 0 ? 'Arif Chowdhury' : 'Nusrat Jahan',
    retentionGraceDays: 30,
    internalNotes: [
      {
        id: `note_${num}`,
        author: 'Support Operations',
        note: `Account onboarded in ${b.country} region under ${b.plan} entitlements.`,
        at: '2026-10-28 11:20',
      },
    ],
    timeline: [
      { label: `Registered merchant workspace (${b.slug})`, at: '2026-10-01', category: 'LIFECYCLE' },
      { label: `Provisioned ${b.plan} plan entitlements`, at: '2026-10-02', category: 'BILLING' },
      { label: `Latest virtual try-on & storefront sync`, at: '2026-11-10', category: 'ACTIVITY' },
    ],
  };
});

// 100 Deterministic Sample Platform Users across all 5 categories
export const DEMO_PLATFORM_USERS: PlatformUserRecord[] = Array.from({ length: 100 }).map((_, idx) => {
  const categories: PlatformUserRecord['category'][] = [
    'MARKETPLACE_CUSTOMER',
    'BRAND_OWNER',
    'BRAND_STAFF',
    'PLATFORM_STAFF',
    'SUPER_ADMIN',
  ];
  const cat =
    idx < 2
      ? 'SUPER_ADMIN'
      : idx < 10
      ? 'PLATFORM_STAFF'
      : idx < 35
      ? 'BRAND_OWNER'
      : idx < 55
      ? 'BRAND_STAFF'
      : 'MARKETPLACE_CUSTOMER';
  const tenant = DEMO_TENANTS[idx % DEMO_TENANTS.length];
  const roles = ['Operations Manager', 'Finance Manager', 'Support Agent', 'AI Ops Engineer', 'Marketplace Moderator'];
  return {
    id: `usr_${String(idx + 1).padStart(3, '0')}`,
    name:
      cat === 'SUPER_ADMIN'
        ? `Platform Root ${idx + 1}`
        : cat === 'PLATFORM_STAFF'
        ? `Staff Operator ${idx + 1}`
        : cat === 'BRAND_OWNER'
        ? tenant.owner
        : `User Member ${idx + 1}`,
    email:
      cat === 'SUPER_ADMIN'
        ? `root${idx + 1}@vton-platform.io`
        : cat === 'PLATFORM_STAFF'
        ? `staff${idx + 1}@vton-platform.io`
        : cat === 'BRAND_OWNER'
        ? tenant.email
        : `member${idx + 1}@shopper-mail.example`,
    category: cat,
    tenantId: cat === 'BRAND_OWNER' || cat === 'BRAND_STAFF' ? tenant.id : undefined,
    tenantName: cat === 'BRAND_OWNER' || cat === 'BRAND_STAFF' ? tenant.name : 'Global Platform',
    roleLabel:
      cat === 'SUPER_ADMIN'
        ? 'SUPER_ADMIN'
        : cat === 'PLATFORM_STAFF'
        ? roles[idx % roles.length]
        : cat === 'BRAND_OWNER'
        ? 'OWNER'
        : cat === 'BRAND_STAFF'
        ? 'PRODUCT_MANAGER'
        : 'CUSTOMER',
    status: idx % 19 === 0 ? 'SUSPENDED' : idx % 17 === 0 ? 'PENDING_VERIFICATION' : 'ACTIVE',
    mfaEnabled: cat === 'SUPER_ADMIN' || cat === 'PLATFORM_STAFF' || idx % 3 === 0,
    registeredAt: `2026-10-${String((idx % 28) + 1).padStart(2, '0')}`,
    lastLoginAt: idx % 4 === 0 ? '2026-11-11 09:15' : '2026-11-10 16:40',
    activeSessionsCount: idx % 19 === 0 ? 0 : (idx % 3) + 1,
  };
});

export const DEMO_PLANS: SubscriptionPlanRecord[] = [
  {
    id: 'plan_free',
    name: 'Free Sandbox',
    slug: 'free',
    description: 'Evaluation tier for boutique discovery and catalog testing.',
    monthlyPrice: 0,
    annualPrice: 0,
    setupFee: 0,
    currency: 'USD',
    trialDays: 0,
    publicVisible: true,
    displayOrder: 1,
    limits: {
      maxProducts: 15,
      maxVariantsPerProduct: 10,
      maxCategories: 5,
      maxCollections: 2,
      monthlyAiCredits: 150,
      maxTeamSeats: 1,
      storageQuotaMb: 512,
      monthlyApiRequests: 1000,
    },
    allowedQualities: ['fast_preview'],
    allowedCategories: ['tops'],
    entitlements: {
      marketplaceEnabled: 'LIMITED',
      virtualTryOnEnabled: 'LIMITED',
      customDomainEnabled: 'DISABLED',
      storefrontBuilder: 'LIMITED',
      analyticsAccess: 'LIMITED',
      apiAccess: 'DISABLED',
      priorityGpuQueue: 'DISABLED',
      highFidelityModels: 'DISABLED',
    },
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Essential storefront and virtual try-on tools for emerging labels.',
    monthlyPrice: 39,
    annualPrice: 390,
    setupFee: 0,
    currency: 'USD',
    trialDays: 14,
    publicVisible: true,
    displayOrder: 2,
    limits: {
      maxProducts: 100,
      maxVariantsPerProduct: 25,
      maxCategories: 20,
      maxCollections: 10,
      monthlyAiCredits: 1000,
      maxTeamSeats: 3,
      storageQuotaMb: 2048,
      monthlyApiRequests: 25000,
    },
    allowedQualities: ['fast_preview', 'balanced'],
    allowedCategories: ['tops', 'bottoms'],
    entitlements: {
      marketplaceEnabled: 'ENABLED',
      virtualTryOnEnabled: 'ENABLED',
      customDomainEnabled: 'ENABLED',
      storefrontBuilder: 'ENABLED',
      analyticsAccess: 'LIMITED',
      apiAccess: 'DISABLED',
      priorityGpuQueue: 'DISABLED',
      highFidelityModels: 'DISABLED',
    },
  },
  {
    id: 'plan_pro',
    name: 'Professional',
    slug: 'pro',
    description: 'Full marketplace reach, higher-fidelity try-on models, and custom themes.',
    monthlyPrice: 99,
    annualPrice: 990,
    setupFee: 0,
    currency: 'USD',
    trialDays: 14,
    publicVisible: true,
    recommended: true,
    displayOrder: 3,
    limits: {
      maxProducts: 1000,
      maxVariantsPerProduct: 60,
      maxCategories: 50,
      maxCollections: 40,
      monthlyAiCredits: 5000,
      maxTeamSeats: 10,
      storageQuotaMb: 10240,
      monthlyApiRequests: 150000,
    },
    allowedQualities: ['fast_preview', 'balanced', 'high_fidelity'],
    allowedCategories: ['tops', 'bottoms', 'dresses', 'outerwear'],
    entitlements: {
      marketplaceEnabled: 'ENABLED',
      virtualTryOnEnabled: 'ENABLED',
      customDomainEnabled: 'ENABLED',
      storefrontBuilder: 'ENABLED',
      analyticsAccess: 'ENABLED',
      apiAccess: 'ENABLED',
      priorityGpuQueue: 'DISABLED',
      highFidelityModels: 'ENABLED',
    },
  },
  {
    id: 'plan_business',
    name: 'Business',
    slug: 'business',
    description: 'High-volume omnichannel commerce with multi-warehouse & API webhooks.',
    monthlyPrice: 179,
    annualPrice: 1790,
    setupFee: 0,
    currency: 'USD',
    trialDays: 14,
    publicVisible: true,
    displayOrder: 4,
    limits: {
      maxProducts: 5000,
      maxVariantsPerProduct: 100,
      maxCategories: 100,
      maxCollections: 80,
      monthlyAiCredits: 10000,
      maxTeamSeats: 20,
      storageQuotaMb: 25600,
      monthlyApiRequests: 500000,
    },
    allowedQualities: ['fast_preview', 'balanced', 'high_fidelity'],
    allowedCategories: ['tops', 'bottoms', 'dresses', 'outerwear', 'all'],
    entitlements: {
      marketplaceEnabled: 'ENABLED',
      virtualTryOnEnabled: 'ENABLED',
      customDomainEnabled: 'ENABLED',
      storefrontBuilder: 'ENABLED',
      analyticsAccess: 'ENABLED',
      apiAccess: 'ENABLED',
      priorityGpuQueue: 'ENABLED',
      highFidelityModels: 'ENABLED',
    },
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Dedicated GPU inference lanes, SLA guarantees, and custom AI routing.',
    monthlyPrice: 299,
    annualPrice: 2990,
    setupFee: 250,
    currency: 'USD',
    trialDays: 30,
    publicVisible: true,
    displayOrder: 5,
    limits: {
      maxProducts: 50000,
      maxVariantsPerProduct: 250,
      maxCategories: 500,
      maxCollections: 500,
      monthlyAiCredits: 25000,
      maxTeamSeats: 100,
      storageQuotaMb: 102400,
      monthlyApiRequests: 5000000,
    },
    allowedQualities: ['fast_preview', 'balanced', 'high_fidelity'],
    allowedCategories: ['tops', 'bottoms', 'dresses', 'outerwear', 'all'],
    entitlements: {
      marketplaceEnabled: 'ENABLED',
      virtualTryOnEnabled: 'ENABLED',
      customDomainEnabled: 'ENABLED',
      storefrontBuilder: 'ENABLED',
      analyticsAccess: 'ENABLED',
      apiAccess: 'ENABLED',
      priorityGpuQueue: 'ENABLED',
      highFidelityModels: 'ENABLED',
    },
  },
];

export const DEMO_SUBSCRIPTIONS: TenantSubscriptionRecord[] = DEMO_TENANTS.map((t, idx) => ({
  id: `sub_${String(idx + 1).padStart(4, '0')}`,
  tenantId: t.id,
  tenantName: t.name,
  planId: `plan_${t.plan.toLowerCase()}`,
  planName: t.plan,
  interval: idx % 3 === 0 ? 'ANNUAL' : 'MONTHLY',
  amount: t.monthlySpend,
  currency: 'USD',
  status: t.subscriptionStatus,
  paymentProvider: idx % 4 === 0 ? 'SSLCOMMERZ' : 'STRIPE',
  startedAt: t.joinedDate,
  renewalDate: '2026-12-01',
  trialEndsAt: t.subscriptionStatus === 'TRIALING' ? '2026-11-24' : undefined,
}));

export const DEMO_TRANSACTIONS: PaymentTransaction[] = [
  { id: 'txn_9012', tenantId: 'tenant_vogue', tenantName: 'Vogue Nova', customerOrEntity: 'Marcus Sterling', type: 'SUBSCRIPTION', amount: 299, currency: 'USD', provider: 'STRIPE', providerRef: 'pi_3Q8xL92a', status: 'SUCCEEDED', createdAt: '2026-11-11 08:12' },
  { id: 'txn_9011', tenantId: 'tenant_aura', tenantName: 'Aura Atelier', customerOrEntity: 'Elena Rostova', type: 'SUBSCRIPTION', amount: 99, currency: 'USD', provider: 'SSLCOMMERZ', providerRef: 'SSL-88412A', status: 'SUCCEEDED', createdAt: '2026-11-10 17:45' },
  { id: 'txn_9010', tenantId: 'tenant_012', tenantName: 'Velvet Thread', customerOrEntity: 'Maya Chen', type: 'SUBSCRIPTION', amount: 99, currency: 'USD', provider: 'STRIPE', providerRef: 'pi_3Q8vF11c', status: 'FAILED', failureReason: 'insufficient_funds', createdAt: '2026-11-10 14:02' },
  { id: 'txn_9009', tenantId: 'tenant_003', tenantName: 'Aarong Heritage Studio', customerOrEntity: 'Farhana Rahman', type: 'CREDIT_PACK', amount: 150, currency: 'USD', provider: 'BKASH', providerRef: 'BK-910283', status: 'SUCCEEDED', createdAt: '2026-11-09 12:30' },
  { id: 'txn_9008', tenantId: 'tenant_014', tenantName: 'Monsoon Outerwear', customerOrEntity: 'Arjun Mehta', type: 'SUBSCRIPTION', amount: 99, currency: 'USD', provider: 'STRIPE', providerRef: 'pi_3Q8kQ71b', status: 'REFUNDED', createdAt: '2026-11-08 09:18' },
];

export const DEMO_INVOICES: PlatformInvoice[] = [
  { id: 'INV-2026-441', tenantId: 'tenant_vogue', tenantName: 'Vogue Nova', subscriptionId: 'sub_0002', period: 'Nov 2026', subtotal: 299, taxAmount: 0, total: 299, currency: 'USD', status: 'PAID', dueDate: '2026-11-01', issuedAt: '2026-11-01' },
  { id: 'INV-2026-440', tenantId: 'tenant_aura', tenantName: 'Aura Atelier', subscriptionId: 'sub_0001', period: 'Nov 2026', subtotal: 99, taxAmount: 4.95, total: 103.95, currency: 'USD', status: 'PAID', dueDate: '2026-11-01', issuedAt: '2026-11-01' },
  { id: 'INV-2026-439', tenantId: 'tenant_012', tenantName: 'Velvet Thread', subscriptionId: 'sub_0012', period: 'Nov 2026', subtotal: 99, taxAmount: 0, total: 99, currency: 'USD', status: 'PAST_DUE', dueDate: '2026-11-05', issuedAt: '2026-11-01' },
];

export const DEMO_REFUNDS: RefundRequest[] = [
  { id: 'ref_301', transactionId: 'txn_9008', tenantName: 'Monsoon Outerwear', amount: 99, currency: 'USD', reason: 'Duplicate billing cycle charge', status: 'COMPLETED_BY_PROVIDER', requestedBy: 'Finance Ops', approvedBy: 'Platform Owner', createdAt: '2026-11-08 10:15' },
  { id: 'ref_302', transactionId: 'txn_9009', tenantName: 'Aarong Heritage Studio', amount: 45, currency: 'USD', reason: 'AI service timeout batch compensation', status: 'REQUESTED', requestedBy: 'Support Manager', createdAt: '2026-11-11 09:05' },
];

export const DEMO_RECONCILIATIONS: ReconciliationItem[] = [
  { id: 'rec_101', provider: 'STRIPE', providerEventId: 'evt_3Q8vF11c99', type: 'WEBHOOK_FAILURE', expectedAmount: 99, providerAmount: 0, status: 'OPEN', detectedAt: '2026-11-10 14:04', notes: 'Stripe invoice.payment_failed webhook retry exhausted.' },
  { id: 'rec_102', provider: 'SSLCOMMERZ', providerEventId: 'ipn_88412_v2', type: 'MISMATCHED_AMOUNT', expectedAmount: 103.95, providerAmount: 99.0, status: 'INVESTIGATING', detectedAt: '2026-11-09 19:20', notes: 'VAT calculation rounding delta ($4.95) flagged in settlement batch.' },
];

export const DEMO_AI_PROVIDERS: AiProviderRecord[] = [
  { id: 'gemini', name: 'Google Gemini Vision + Fashion Synthesis', category: 'CLOUD_API', enabled: true, status: 'HEALTHY', avgLatencyMs: 1420, errorRatePct: 0.9, estimatedCostPerRunUsd: 0.032, models: ['gemini-2.5-flash-image', 'gemini-3.6-flash'], lastCheckedAt: '2026-11-11 11:30' },
  { id: 'fal', name: 'Fal AI FLUX Pro Virtual Try-On', category: 'CLOUD_API', enabled: true, status: 'HEALTHY', avgLatencyMs: 2650, errorRatePct: 1.4, estimatedCostPerRunUsd: 0.045, models: ['fal-ai/flux-pro/v1/vto'], lastCheckedAt: '2026-11-11 11:30' },
  { id: 'openai', name: 'OpenAI Vision Attribute QA', category: 'CLOUD_API', enabled: false, status: 'KEY_REQUIRED', avgLatencyMs: 0, errorRatePct: 0, estimatedCostPerRunUsd: 0.028, models: ['gpt-image-1'], lastCheckedAt: '2026-11-11 11:00' },
  { id: 'viton', name: 'Internal VITON-HD FastAPI Worker (vton-ai-service)', category: 'SELF_HOSTED_GPU', enabled: true, status: 'HEALTHY', avgLatencyMs: 1180, errorRatePct: 2.1, estimatedCostPerRunUsd: 0.008, models: ['viton-hd-unet-v2', 'schp-garment-seg'], lastCheckedAt: '2026-11-11 11:30' },
];

export const DEMO_AI_MODELS: AiModelRecord[] = [
  { id: 'gemini-3.6-flash', name: 'Gemini Multimodal Try-On Engine', providerId: 'gemini', category: 'VIRTUAL_TRYON', version: 'v3.6', supportedGarments: ['tops', 'bottoms', 'dresses', 'outerwear'], resolution: '1024x1366', avgDurationSec: 1.42, estCostUsd: 0.032, requiredEntitlement: 'highFidelityModels', active: true, isDefault: true },
  { id: 'fal-flux-vto', name: 'FLUX Pro Photoreal Garment Drape', providerId: 'fal', category: 'VIRTUAL_TRYON', version: 'v1.0', supportedGarments: ['tops', 'dresses', 'outerwear'], resolution: '1024x1366', avgDurationSec: 2.65, estCostUsd: 0.045, requiredEntitlement: 'priorityGpuQueue', active: true },
  { id: 'viton-hd-unet-v2', name: 'VITON-HD Local UNet Pipeline', providerId: 'viton', category: 'VIRTUAL_TRYON', version: 'v2.4', supportedGarments: ['tops', 'bottoms'], resolution: '768x1024', avgDurationSec: 1.18, estCostUsd: 0.008, requiredEntitlement: 'virtualTryOnEnabled', active: true },
  { id: 'schp-garment-seg', name: 'SCHP Garment Mask & Limb Segmenter', providerId: 'viton', category: 'GARMENT_SEGMENTATION', version: 'v1.8', supportedGarments: ['all'], resolution: '768x1024', avgDurationSec: 0.35, estCostUsd: 0.002, requiredEntitlement: 'virtualTryOnEnabled', active: true },
  { id: 'bg-rem-v2', name: 'Studio Background Isolation', providerId: 'viton', category: 'BACKGROUND_REMOVAL', version: 'v2.0', supportedGarments: ['all'], resolution: '1024x1024', avgDurationSec: 0.28, estCostUsd: 0.001, requiredEntitlement: 'virtualTryOnEnabled', active: true },
  { id: 'quality-eval-v1', name: 'Pose & Artifact Evaluator', providerId: 'gemini', category: 'QUALITY_CHECK', version: 'v1.2', supportedGarments: ['all'], resolution: '512x512', avgDurationSec: 0.45, estCostUsd: 0.004, requiredEntitlement: 'highFidelityModels', active: true },
];

export const DEMO_AI_ROUTING: AiRoutingPolicy = {
  primaryProvider: 'gemini',
  secondaryProvider: 'fal',
  fallbackModelId: 'viton-hd-unet-v2',
  timeoutSeconds: 25,
  maxRetries: 2,
  categoryRoutes: {
    tops: 'gemini-3.6-flash',
    bottoms: 'viton-hd-unet-v2',
    dresses: 'fal-flux-vto',
    outerwear: 'gemini-3.6-flash',
  },
};

export const DEMO_TRYON_JOBS: TryOnJobRecord[] = [
  { id: 'job_88204', tenantId: 'tenant_aura', tenantName: 'Aura Atelier', productId: 'prod_1', productName: 'Silk Evening Slip Dress', modelId: 'gemini-3.6-flash', provider: 'gemini', status: 'COMPLETED', durationMs: 1480, creditsConsumed: 1, estProviderCostUsd: 0.032, retryCount: 0, privateMediaRedacted: true, createdAt: '2026-11-11 11:22' },
  { id: 'job_88203', tenantId: 'tenant_vogue', tenantName: 'Vogue Nova', productId: 'prod_9', productName: 'Double-Breasted Wool Coat', modelId: 'fal-flux-vto', provider: 'fal', status: 'PROCESSING', queuePosition: 1, durationMs: 920, creditsConsumed: 1, estProviderCostUsd: 0.045, retryCount: 0, privateMediaRedacted: true, createdAt: '2026-11-11 11:21' },
  { id: 'job_88202', tenantId: 'tenant_003', tenantName: 'Aarong Heritage Studio', productId: 'prod_22', productName: 'Jamdani Embroidered Tunic', modelId: 'gemini-3.6-flash', provider: 'gemini', status: 'QUEUED', queuePosition: 2, durationMs: 0, creditsConsumed: 0, estProviderCostUsd: 0, retryCount: 0, privateMediaRedacted: true, createdAt: '2026-11-11 11:20' },
  { id: 'job_88201', tenantId: 'tenant_014', tenantName: 'Monsoon Outerwear', productId: 'prod_41', productName: 'Waxed Canvas Trench', modelId: 'fal-flux-vto', provider: 'fal', status: 'FAILED', durationMs: 25010, creditsConsumed: 0, estProviderCostUsd: 0.012, retryCount: 2, failureCategory: 'PROVIDER_TIMEOUT', errorMessage: 'Upstream provider timed out after 25s window.', privateMediaRedacted: true, createdAt: '2026-11-11 10:58' },
  { id: 'job_88200', tenantId: 'tenant_018', tenantName: 'Modest Vogue', productId: 'prod_55', productName: 'Pleated Crepe Abaya', modelId: 'viton-hd-unet-v2', provider: 'viton', status: 'FAILED', durationMs: 410, creditsConsumed: 0, estProviderCostUsd: 0.001, retryCount: 0, failureCategory: 'IMAGE_VALIDATION', errorMessage: 'Person photo aspect ratio failed garment framing validation.', privateMediaRedacted: true, createdAt: '2026-11-11 10:41' },
];

export const DEMO_CREDIT_LEDGER: CreditLedgerEntry[] = [
  { id: 'crd_401', tenantId: 'tenant_vogue', tenantName: 'Vogue Nova', type: 'GRANT_PROMO', delta: 500, balanceAfter: 17080, reason: 'Enterprise partner seasonal onboarding bonus', actor: 'root1@vton-platform.io', referenceId: 'PROMO-NOV-26', createdAt: '2026-11-11 09:00' },
  { id: 'crd_400', tenantId: 'tenant_aura', tenantName: 'Aura Atelier', type: 'CONSUMED', delta: -1, balanceAfter: 3760, reason: 'Try-On Job job_88204 completed', actor: 'system_metering', referenceId: 'job_88204', createdAt: '2026-11-11 11:22' },
  { id: 'crd_399', tenantId: 'tenant_014', tenantName: 'Monsoon Outerwear', type: 'RELEASED', delta: 1, balanceAfter: 11, reason: 'Released credit reservation on timeout job_88201', actor: 'system_metering', referenceId: 'job_88201', createdAt: '2026-11-11 10:59' },
];

export const DEMO_MOD_PRODUCTS: ModerationProductItem[] = [
  { id: 'mod_p1', productId: 'prod_1', productName: 'Midnight Mulberry Silk Slip', brandId: 'tenant_aura', brandName: 'Aura Atelier', category: 'Dresses', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', price: 245, moderationStatus: 'APPROVED', visibility: 'PUBLIC', featured: true, reportsCount: 0, submittedAt: '2026-11-08' },
  { id: 'mod_p2', productId: 'prod_12', productName: 'Monsoon Waterproof Trench', brandId: 'tenant_014', brandName: 'Monsoon Outerwear', category: 'Jackets', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', price: 185, moderationStatus: 'PENDING_REVIEW', visibility: 'HIDDEN', featured: false, reportsCount: 2, submittedAt: '2026-11-10' },
  { id: 'mod_p3', productId: 'prod_19', productName: 'Handwoven Jamdani Panjabi', brandId: 'tenant_003', brandName: 'Aarong Heritage Studio', category: 'Traditional Wear', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', price: 120, moderationStatus: 'APPROVED', visibility: 'PUBLIC', featured: true, sponsored: true, reportsCount: 0, submittedAt: '2026-11-07' },
  { id: 'mod_p4', productId: 'prod_27', productName: 'Oversized Fleece Hoodie', brandId: 'tenant_022', brandName: 'Urban Streetwear BD', category: 'Hoodies', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', price: 68, moderationStatus: 'CHANGES_REQUESTED', visibility: 'HIDDEN', featured: false, reportsCount: 1, submittedAt: '2026-11-09' },
];

export const DEMO_MOD_BRANDS: ModerationBrandItem[] = [
  { id: 'mod_b1', tenantId: 'tenant_018', brandName: 'Modest Vogue', verificationStatus: 'PENDING_REVIEW', reportsCount: 0, marketplaceStatus: 'ALLOWED', reviewerNote: 'Awaiting trade license scan confirmation.' },
  { id: 'mod_b2', tenantId: 'tenant_014', brandName: 'Monsoon Outerwear', verificationStatus: 'VERIFIED', reportsCount: 3, marketplaceStatus: 'RESTRICTED', reviewerNote: '2 misleading sizing complaints under review.' },
  { id: 'mod_b3', tenantId: 'tenant_aura', brandName: 'Aura Atelier', verificationStatus: 'VERIFIED', reportsCount: 0, marketplaceStatus: 'ALLOWED', reviewerNote: 'Verified flagship merchant.' },
];

export const DEMO_CATEGORIES: MarketplaceCategory[] = [
  { id: 'cat_1', name: "Women's Fashion", slug: 'womens-fashion', order: 1, active: true, productCount: 312, seoTitle: "Women's Virtual Try-On Fashion" },
  { id: 'cat_2', name: "Men's Fashion", slug: 'mens-fashion', order: 2, active: true, productCount: 248, seoTitle: "Men's Apparel & Tailoring" },
  { id: 'cat_3', name: 'Traditional Wear', slug: 'traditional-wear', order: 3, active: true, productCount: 164, seoTitle: 'Panjabi, Saree & Heritage Couture' },
  { id: 'cat_4', name: 'Dresses', slug: 'dresses', order: 4, active: true, productCount: 145, seoTitle: 'Dresses with AI Virtual Fitting' },
  { id: 'cat_5', name: 'Jackets & Outerwear', slug: 'outerwear', order: 5, active: true, productCount: 92, seoTitle: 'Coats & Outerwear' },
];

export const DEMO_COLLECTIONS: MarketplaceCollection[] = [
  { id: 'col_1', title: 'Trending Try-On Looks', slug: 'trending', description: 'Most fitted garments across the platform this week.', active: true, sponsored: false, itemCount: 24 },
  { id: 'col_2', title: 'Eid Heritage Collection', slug: 'eid-collection', description: 'Handwoven panjabis, muslin sarees, and evening couture.', active: true, sponsored: false, itemCount: 42 },
  { id: 'col_3', title: 'Sponsored Flagship Brands', slug: 'featured-brands', description: 'Promoted placement slots clearly disclosed to shoppers.', active: true, sponsored: true, itemCount: 12 },
];

export const DEMO_MKT_REPORTS: MarketplaceReportItem[] = [
  { id: 'rep_501', targetType: 'PRODUCT', targetName: 'Monsoon Waterproof Trench', reason: 'MISLEADING_DESCRIPTION', reporter: 'shopper_192@example.com', status: 'OPEN', createdAt: '2026-11-10' },
  { id: 'rep_502', targetType: 'PRODUCT', targetName: 'Oversized Fleece Hoodie', reason: 'COPYRIGHT', reporter: 'legal@brand-watch.io', status: 'INVESTIGATING', createdAt: '2026-11-09' },
];

export const DEMO_CMS_PAGES: CmsPageRecord[] = [
  { id: 'cms_1', title: 'Global Marketplace Hero Banner', slug: 'home-hero', type: 'HOMEPAGE_SECTION', status: 'PUBLISHED', order: 1, summary: 'Main holiday 2026 virtual fitting hero showcase.', updatedAt: '2026-11-10' },
  { id: 'cms_2', title: 'Privacy & Customer Photo Consent Policy', slug: '/privacy', type: 'STATIC_PAGE', status: 'PUBLISHED', order: 2, summary: 'Explains temporary try-on image processing and customer erasure rights.', updatedAt: '2026-11-01' },
  { id: 'cms_3', title: 'Winter Collection Promo Ribbon', slug: 'banner-winter', type: 'BANNER', status: 'SCHEDULED', order: 3, summary: 'Scheduled homepage strip for multi-brand winter sale.', updatedAt: '2026-11-11' },
  { id: 'cms_4', title: 'How Brands Cut Return Rates by 28% with V-TRY', slug: '/blog/reduce-returns-vton', type: 'BLOG', status: 'PUBLISHED', order: 4, summary: 'Editorial merchant case study.', updatedAt: '2026-11-06' },
];

export const DEMO_TICKETS: SupportTicketRecord[] = [
  {
    id: 'TKT-4821',
    subject: 'Custom domain CNAME SSL stuck in pending state',
    requesterName: 'Elena Rostova',
    requesterEmail: 'elena@auraatelier.com',
    tenantId: 'tenant_aura',
    tenantName: 'Aura Atelier',
    category: 'TECHNICAL',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedAgent: 'Arif Chowdhury',
    messages: [
      { sender: 'Elena Rostova', role: 'BRAND_OWNER', text: 'We pointed shop.auraatelier.com CNAME 4 hours ago, SSL is still pending.', at: '2026-11-11 08:20' },
      { sender: 'Arif Chowdhury', role: 'SUPPORT_AGENT', text: 'Checking edge DNS propagation and ACME TXT challenge now.', internal: true, at: '2026-11-11 09:05' },
    ],
    createdAt: '2026-11-11 08:20',
    updatedAt: '2026-11-11 09:05',
  },
  {
    id: 'TKT-4819',
    subject: 'Billing webhook retry on Velvet Thread renewal',
    requesterName: 'Maya Chen',
    requesterEmail: 'owner@velvet-thread.com',
    tenantId: 'tenant_012',
    tenantName: 'Velvet Thread',
    category: 'PAYMENT',
    priority: 'CRITICAL',
    status: 'ESCALATED',
    assignedAgent: 'Finance Ops',
    relatedTransactionId: 'txn_9010',
    messages: [
      { sender: 'Maya Chen', role: 'BRAND_OWNER', text: 'Our card was declined yesterday, we updated the card—please advise on invoice INV-2026-439.', at: '2026-11-10 18:12' },
    ],
    createdAt: '2026-11-10 18:12',
    updatedAt: '2026-11-10 19:00',
  },
  {
    id: 'TKT-4814',
    subject: 'Try-on timeout on Trench Coat studio test',
    requesterName: 'Arjun Mehta',
    requesterEmail: 'owner@monsoon-outer.com',
    tenantId: 'tenant_014',
    tenantName: 'Monsoon Outerwear',
    category: 'AI_ENGINE',
    priority: 'MEDIUM',
    status: 'OPEN',
    relatedJobId: 'job_88201',
    messages: [
      { sender: 'Arjun Mehta', role: 'BRAND_OWNER', text: 'Job 88201 timed out at 25 seconds. Please confirm credits were not deducted.', at: '2026-11-11 11:02' },
    ],
    createdAt: '2026-11-11 11:02',
    updatedAt: '2026-11-11 11:02',
  },
];

export const DEMO_ALERTS: PlatformAlert[] = [
  { id: 'alt_1', severity: 'WARNING', category: 'PAYMENT', title: 'Stripe webhook invoice.payment_failed retry exhausted', details: 'Tenant Velvet Thread (rec_101) requires billing reconciliation check.', owner: 'Finance Manager', status: 'INVESTIGATING', createdAt: '2026-11-11 09:14' },
  { id: 'alt_2', severity: 'CRITICAL', category: 'USAGE_LIMIT', title: 'Monsoon Outerwear at 99.8% monthly AI quota', details: 'Tenant approaching hard monthly generation ceiling (4,990 / 5,000 credits).', owner: 'Operations Manager', status: 'OPEN', createdAt: '2026-11-11 10:55' },
  { id: 'alt_3', severity: 'INFO', category: 'BACKUP', title: 'Automated PostgreSQL snapshot verification succeeded', details: 'Nightly logical dump verified across 4 tenant schemas.', owner: 'SRE On-Call', status: 'RESOLVED', createdAt: '2026-11-11 03:00' },
];

export const DEMO_SECURITY_EVENTS: SecurityEventRecord[] = [
  { id: 'sec_91', type: 'FAILED_LOGIN', severity: 'MEDIUM', actor: 'unknown@scanner.net', ipMasked: '185.220.xxx.14', details: '6 failed admin login attempts blocked by edge rate limiter.', status: 'OPEN', timestamp: '2026-11-11 10:22' },
  { id: 'sec_90', type: 'CROSS_TENANT_BLOCKED', severity: 'HIGH', actor: 'token:brand_014', ipMasked: '103.112.xxx.88', details: 'Blocked unauthorized cross-tenant PATCH /api/v1/products lookup.', status: 'ACKNOWLEDGED', timestamp: '2026-11-10 21:14' },
];

export const DEMO_AUDIT_EVENTS: AuditEventRecord[] = [
  { id: 'AUD-902', action: 'SYSTEM_BOOTSTRAP', actor: 'admin@vton-platform.io', actorRole: 'SUPER_ADMIN', target: 'PLATFORM_CORE', details: 'Fastify v5 core APIs & vton-ai-service worker mounted', timestamp: '2026-11-11 08:00', correlationId: 'corr_902a1' },
  { id: 'AUD-901', action: 'AI_ROUTING_VERIFIED', actor: 'ai-ops@vton-platform.io', actorRole: 'AI_OPS_ENGINEER', target: 'gemini-3.6-flash', details: 'Validated fallback chain gemini -> fal -> viton-hd-unet-v2', timestamp: '2026-11-11 09:30', correlationId: 'corr_901b4' },
  { id: 'AUD-899', action: 'MODERATION_APPROVED', actor: 'mod@vton-platform.io', actorRole: 'MARKETPLACE_MODERATOR', tenantContext: 'tenant_aura', target: 'Midnight Mulberry Silk Slip', details: 'Approved listing for global marketplace visibility', timestamp: '2026-11-10 16:40', correlationId: 'corr_899c2' },
];

export const DEMO_DATA_REQUESTS: DataGovernanceRequest[] = [
  { id: 'dgr_201', type: 'DATA_EXPORT', requester: 'Caspian Cashmere (Owner)', tenantName: 'Caspian Cashmere', status: 'COMPLETED', retentionDeadline: '2026-12-10', createdAt: '2026-11-05' },
  { id: 'dgr_202', type: 'PHOTO_PURGE', requester: 'shopper_418@example.com', tenantName: 'Aura Atelier', status: 'PENDING_REVIEW', retentionDeadline: '2026-11-13', createdAt: '2026-11-11' },
];

export const DEMO_FEATURE_FLAGS: FeatureFlagRecord[] = [
  { key: 'marketplace_enabled', name: 'Global Marketplace Discovery', description: 'Enables cross-brand public discovery feed and search.', owner: 'Product Ops', globalEnabled: true, rolloutPct: 100, planOverrides: { FREE: false, STARTER: true, PRO: true, BUSINESS: true, ENTERPRISE: true }, updatedAt: '2026-11-01' },
  { key: 'virtual_tryon_enabled', name: 'AI Virtual Try-On Pipeline', description: 'Enables garment virtual fitting across brand storefronts and marketplace.', owner: 'AI Engineering', globalEnabled: true, rolloutPct: 100, planOverrides: { FREE: true, STARTER: true, PRO: true, BUSINESS: true, ENTERPRISE: true }, updatedAt: '2026-11-05' },
  { key: 'custom_domains_enabled', name: 'Merchant Custom Domains & TLS', description: 'Allows brands to map custom CNAME domains.', owner: 'Platform Infra', globalEnabled: true, rolloutPct: 100, planOverrides: { FREE: false, STARTER: true, PRO: true, BUSINESS: true, ENTERPRISE: true }, updatedAt: '2026-10-20' },
  { key: 'high_res_vto_1024', name: '1024px HD Try-On Rendering', description: 'Gradual rollout of 1024x1366 resolution mode on Pro+ plans.', owner: 'AI Engineering', globalEnabled: true, rolloutPct: 50, planOverrides: { FREE: false, STARTER: false, PRO: true, BUSINESS: true, ENTERPRISE: true }, updatedAt: '2026-11-10' },
];

export const DEMO_WEBHOOKS: WebhookSubscription[] = [
  { id: 'wh_p1', url: 'https://ops-alerts.vton-platform.io/hooks/billing', events: ['subscription.updated', 'payment.failed'], active: true, lastResponseCode: 200, retryCount: 0, lastAttemptAt: '2026-11-11 10:15' },
  { id: 'wh_p2', url: 'https://bi-warehouse.internal.example/ingest', events: ['tryon.completed', 'tenant.created'], active: true, lastResponseCode: 502, retryCount: 2, lastAttemptAt: '2026-11-11 11:05' },
];

export const DEMO_PLATFORM_SETTINGS: PlatformGlobalSettings = {
  platformName: 'V-TRY Multi-Tenant SaaS',
  supportEmail: 'platform-ops@vton-platform.io',
  defaultCurrency: 'USD',
  defaultLanguage: 'English (en-US)',
  timezone: 'UTC',
  maxImageUploadMb: 10,
  imageRetentionDays: 7,
  tryOnResultRetentionDays: 30,
  tenantDeletionGraceDays: 30,
  requireAdminMfa: true,
  maintenanceMode: {
    enabled: false,
    message: 'Scheduled platform database maintenance is underway.',
    scope: 'ALL_APPS',
  },
};

export const DEMO_SERIES_REVENUE = [
  { label: 'Jun', revenue: 41200, mrr: 18400, generations: 42100 },
  { label: 'Jul', revenue: 48900, mrr: 21200, generations: 51800 },
  { label: 'Aug', revenue: 56300, mrr: 24900, generations: 64200 },
  { label: 'Sep', revenue: 69400, mrr: 29100, generations: 78500 },
  { label: 'Oct', revenue: 81200, mrr: 34600, generations: 94100 },
  { label: 'Nov', revenue: 94800, mrr: 39400, generations: 112400 },
];

