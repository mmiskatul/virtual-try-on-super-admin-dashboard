import {
  AiProviderRecord,
  AiRoutingPolicy,
  MarketplaceCategory,
  MarketplaceCollection,
  MarketplaceReportItem,
  ModerationBrandItem,
  PaymentTransaction,
  PlatformAlert,
  PlatformGlobalSettings,
  ReconciliationItem,
  SecurityEventRecord,
} from '../types';

export const DEMO_TRANSACTIONS: PaymentTransaction[] = [
  { id: 'txn_9012', tenantId: 'tenant_vogue', tenantName: 'Vogue Nova', customerOrEntity: 'Marcus Sterling', type: 'SUBSCRIPTION', amount: 299, currency: 'BDT', provider: 'STRIPE', providerRef: 'pi_3Q8xL92a', status: 'SUCCEEDED', createdAt: '2026-11-11 08:12' },
  { id: 'txn_9011', tenantId: 'tenant_aura', tenantName: 'Aura Atelier', customerOrEntity: 'Elena Rostova', type: 'SUBSCRIPTION', amount: 99, currency: 'BDT', provider: 'SSLCOMMERZ', providerRef: 'SSL-88412A', status: 'SUCCEEDED', createdAt: '2026-11-10 17:45' },
  { id: 'txn_9010', tenantId: 'tenant_012', tenantName: 'Velvet Thread', customerOrEntity: 'Maya Chen', type: 'SUBSCRIPTION', amount: 99, currency: 'BDT', provider: 'STRIPE', providerRef: 'pi_3Q8vF11c', status: 'FAILED', failureReason: 'insufficient_funds', createdAt: '2026-11-10 14:02' },
  { id: 'txn_9009', tenantId: 'tenant_003', tenantName: 'Aarong Heritage Studio', customerOrEntity: 'Farhana Rahman', type: 'CREDIT_PACK', amount: 150, currency: 'BDT', provider: 'BKASH', providerRef: 'BK-910283', status: 'SUCCEEDED', createdAt: '2026-11-09 12:30' },
  { id: 'txn_9008', tenantId: 'tenant_014', tenantName: 'Monsoon Outerwear', customerOrEntity: 'Arjun Mehta', type: 'SUBSCRIPTION', amount: 99, currency: 'BDT', provider: 'STRIPE', providerRef: 'pi_3Q8kQ71b', status: 'REFUNDED', createdAt: '2026-11-08 09:18' },
];

export const DEMO_RECONCILIATIONS: ReconciliationItem[] = [
  { id: 'rec_101', provider: 'STRIPE', providerEventId: 'evt_3Q8vF11c99', type: 'WEBHOOK_FAILURE', expectedAmount: 99, providerAmount: 0, status: 'OPEN', detectedAt: '2026-11-10 14:04', notes: 'Stripe invoice.payment_failed webhook retry exhausted.' },
  { id: 'rec_102', provider: 'SSLCOMMERZ', providerEventId: 'ipn_88412_v2', type: 'MISMATCHED_AMOUNT', expectedAmount: 103.95, providerAmount: 99.0, status: 'INVESTIGATING', detectedAt: '2026-11-09 19:20', notes: 'VAT calculation rounding delta (৳4.95) flagged in settlement batch.' },
];

export const DEMO_AI_PROVIDERS: AiProviderRecord[] = [
  { id: 'gemini', name: 'Google Gemini Vision + Fashion Synthesis', category: 'CLOUD_API', enabled: true, status: 'HEALTHY', avgLatencyMs: 1420, errorRatePct: 0.9, estimatedCostPerRunUsd: 0.032, models: ['gemini-2.5-flash-image', 'gemini-3.6-flash'], lastCheckedAt: '2026-11-11 11:30' },
  { id: 'fal', name: 'Fal AI FLUX Pro Virtual Try-On', category: 'CLOUD_API', enabled: true, status: 'HEALTHY', avgLatencyMs: 2650, errorRatePct: 1.4, estimatedCostPerRunUsd: 0.045, models: ['fal-ai/flux-pro/v1/vto'], lastCheckedAt: '2026-11-11 11:30' },
  { id: 'openai', name: 'OpenAI Vision Attribute QA', category: 'CLOUD_API', enabled: false, status: 'KEY_REQUIRED', avgLatencyMs: 0, errorRatePct: 0, estimatedCostPerRunUsd: 0.028, models: ['gpt-image-1'], lastCheckedAt: '2026-11-11 11:00' },
  { id: 'viton', name: 'Internal VITON-HD FastAPI Worker (vton-ai-service)', category: 'SELF_HOSTED_GPU', enabled: true, status: 'HEALTHY', avgLatencyMs: 1180, errorRatePct: 2.1, estimatedCostPerRunUsd: 0.008, models: ['viton-hd-unet-v2', 'schp-garment-seg'], lastCheckedAt: '2026-11-11 11:30' },
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

export const DEMO_ALERTS: PlatformAlert[] = [
  { id: 'alt_1', severity: 'WARNING', category: 'PAYMENT', title: 'Stripe webhook invoice.payment_failed retry exhausted', details: 'Tenant Velvet Thread (rec_101) requires billing reconciliation check.', owner: 'Finance Manager', status: 'INVESTIGATING', createdAt: '2026-11-11 09:14' },
  { id: 'alt_2', severity: 'CRITICAL', category: 'USAGE_LIMIT', title: 'Monsoon Outerwear at 99.8% monthly AI quota', details: 'Tenant approaching hard monthly generation ceiling (4,990 / 5,000 credits).', owner: 'Operations Manager', status: 'OPEN', createdAt: '2026-11-11 10:55' },
  { id: 'alt_3', severity: 'INFO', category: 'BACKUP', title: 'Automated PostgreSQL snapshot verification succeeded', details: 'Nightly logical dump verified across 4 tenant schemas.', owner: 'SRE On-Call', status: 'RESOLVED', createdAt: '2026-11-11 03:00' },
];

export const DEMO_SECURITY_EVENTS: SecurityEventRecord[] = [
  { id: 'sec_91', type: 'FAILED_LOGIN', severity: 'MEDIUM', actor: 'unknown@scanner.net', ipMasked: '185.220.xxx.14', details: '6 failed admin login attempts blocked by edge rate limiter.', status: 'OPEN', timestamp: '2026-11-11 10:22' },
  { id: 'sec_90', type: 'CROSS_TENANT_BLOCKED', severity: 'HIGH', actor: 'token:brand_014', ipMasked: '103.112.xxx.88', details: 'Blocked unauthorized cross-tenant PATCH /api/v1/products lookup.', status: 'ACKNOWLEDGED', timestamp: '2026-11-10 21:14' },
];

export const DEMO_PLATFORM_SETTINGS: PlatformGlobalSettings = {
  platformName: 'V-TRY Multi-Tenant SaaS',
  supportEmail: 'platform-ops@vton-platform.io',
  defaultCurrency: 'BDT',
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

