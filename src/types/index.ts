// Backward-compatible legacy types + full enterprise SaaS governance domain types

export type AdminTab = 'overview' | 'tenants' | 'ai' | 'infrastructure' | 'subscriptions' | 'audit';

export type PlatformRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_OWNER'
  | 'OPERATIONS_MANAGER'
  | 'FINANCE_MANAGER'
  | 'SUPPORT_MANAGER'
  | 'SUPPORT_AGENT'
  | 'MARKETPLACE_MODERATOR'
  | 'AI_OPS_ENGINEER'
  | 'SECURITY_ADMIN'
  | 'ANALYST'
  | string;

export type PlatformAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'suspend'
  | 'publish'
  | 'refund'
  | 'export'
  | 'configure'
  | 'manage_users';

export type PlatformModule =
  | 'overview'
  | 'tenants'
  | 'users'
  | 'staff'
  | 'subscriptions'
  | 'finance'
  | 'ai'
  | 'tryon'
  | 'marketplace'
  | 'cms'
  | 'support'
  | 'communications'
  | 'marketing'
  | 'system'
  | 'security'
  | 'governance'
  | 'integrations'
  | 'configuration'
  | 'analytics';

export type TenantLifecycleStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'ONBOARDING'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'
  | 'OFFBOARDING';

export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  owner: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | string;
  plan: string;
  productsCount: number;
  ordersCount: number;
  gmv: number;
  tryOnUsed: number;
  tryOnQuota: number;
  joinedDate: string;
}

export interface TenantRecord extends TenantItem {
  legalName?: string;
  logoUrl?: string;
  phone?: string;
  country: string;
  group: 'ENTERPRISE_PARTNER' | 'GROWTH_BOUTIQUE' | 'NEW_COHORT' | 'SANDBOX';
  verificationStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'UNVERIFIED';
  lifecycleStatus: TenantLifecycleStatus;
  subscriptionStatus: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  teamCount: number;
  marketplacePublishedCount: number;
  monthlySpend: number;
  storageUsedMb: number;
  storageLimitMb: number;
  apiRequests30d: number;
  assignedSupportAgent?: string;
  retentionGraceDays: number;
  scheduledPurgeAt?: string;
  internalNotes: Array<{ id: string; author: string; note: string; at: string }>;
  timeline: Array<{ label: string; at: string; category: string }>;
}

export interface ImpersonationSession {
  active: boolean;
  tenantId: string;
  tenantName: string;
  mode: 'READ_ONLY' | 'ELEVATED_WRITE';
  reason: string;
  adminEmail: string;
  startedAt: string;
  expiresAt: string;
}

export interface PlatformUserRecord {
  id: string;
  name: string;
  email: string;
  category: 'SUPER_ADMIN' | 'PLATFORM_STAFF' | 'BRAND_OWNER' | 'BRAND_STAFF' | 'MARKETPLACE_CUSTOMER';
  tenantId?: string;
  tenantName?: string;
  roleLabel: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  mfaEnabled: boolean;
  registeredAt: string;
  lastLoginAt: string;
  activeSessionsCount: number;
}

export interface PlanEntitlement {
  marketplaceEnabled: 'ENABLED' | 'LIMITED' | 'DISABLED';
  virtualTryOnEnabled: 'ENABLED' | 'LIMITED' | 'DISABLED';
  customDomainEnabled: 'ENABLED' | 'DISABLED';
  storefrontBuilder: 'ENABLED' | 'LIMITED' | 'DISABLED';
  analyticsAccess: 'ENABLED' | 'LIMITED' | 'DISABLED';
  apiAccess: 'ENABLED' | 'DISABLED';
  priorityGpuQueue: 'ENABLED' | 'DISABLED';
  highFidelityModels: 'ENABLED' | 'DISABLED';
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  setupFee: number;
  currency: string;
  trialDays: number;
  publicVisible: boolean;
  recommended?: boolean;
  displayOrder: number;
  limits: {
    maxProducts: number;
    maxVariantsPerProduct: number;
    maxCategories: number;
    maxCollections: number;
    monthlyAiCredits: number;
    maxTeamSeats: number;
    storageQuotaMb: number;
    monthlyApiRequests: number;
  };
  allowedQualities: string[];
  allowedCategories: string[];
  entitlements: PlanEntitlement;
}

export interface TenantSubscriptionRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  interval: 'MONTHLY' | 'ANNUAL';
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  paymentProvider: 'STRIPE' | 'SSLCOMMERZ' | 'MANUAL_INVOICE';
  discountPercent?: number;
  startedAt: string;
  renewalDate: string;
  trialEndsAt?: string;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  tenantName: string;
  customerOrEntity: string;
  type: 'SUBSCRIPTION' | 'CREDIT_PACK' | 'MARKETPLACE_COMMISSION';
  amount: number;
  currency: string;
  provider: 'STRIPE' | 'SSLCOMMERZ' | 'BKASH' | 'MANUAL';
  providerRef: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'REFUNDED';
  failureReason?: string;
  createdAt: string;
}

export interface PlatformInvoice {
  id: string;
  tenantId: string;
  tenantName: string;
  subscriptionId: string;
  period: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'PAST_DUE' | 'VOID';
  dueDate: string;
  issuedAt: string;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  tenantName: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED_PENDING_PROVIDER' | 'COMPLETED_BY_PROVIDER' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface ReconciliationItem {
  id: string;
  provider: 'STRIPE' | 'SSLCOMMERZ';
  providerEventId: string;
  type: 'MISMATCHED_AMOUNT' | 'MISSING_INTERNAL_RECORD' | 'DUPLICATE_EVENT' | 'WEBHOOK_FAILURE';
  expectedAmount: number;
  providerAmount: number;
  status: 'OPEN' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'RESOLVED';
  detectedAt: string;
  notes: string;
}

export interface AiProviderRecord {
  id: string;
  name: string;
  category: 'CLOUD_API' | 'SELF_HOSTED_GPU';
  enabled: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'KEY_REQUIRED' | 'OFFLINE';
  avgLatencyMs: number;
  errorRatePct: number;
  estimatedCostPerRunUsd: number;
  models: string[];
  lastCheckedAt: string;
}

export interface AiModelRecord {
  id: string;
  name: string;
  providerId: string;
  category: 'VIRTUAL_TRYON' | 'GARMENT_SEGMENTATION' | 'BACKGROUND_REMOVAL' | 'SUPER_RES' | 'QUALITY_CHECK';
  version: string;
  supportedGarments: string[];
  resolution: string;
  avgDurationSec: number;
  estCostUsd: number;
  requiredEntitlement: keyof PlanEntitlement;
  active: boolean;
  isDefault?: boolean;
}

export interface AiRoutingPolicy {
  primaryProvider: string;
  secondaryProvider: string;
  fallbackModelId: string;
  timeoutSeconds: number;
  maxRetries: number;
  categoryRoutes: Record<string, string>;
}

export interface TryOnJobRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  productId: string;
  productName: string;
  modelId: string;
  provider: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  queuePosition?: number;
  durationMs: number;
  creditsConsumed: number;
  estProviderCostUsd: number;
  retryCount: number;
  failureCategory?:
    | 'INVALID_INPUT'
    | 'IMAGE_VALIDATION'
    | 'PROVIDER_TIMEOUT'
    | 'MODEL_FAILURE'
    | 'STORAGE_FAILURE'
    | 'NETWORK_ERROR'
    | 'CREDIT_LIMIT'
    | 'UNSUPPORTED_GARMENT';
  errorMessage?: string;
  privateMediaRedacted: boolean;
  createdAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'GRANT_PROMO' | 'PURCHASE' | 'CONSUMED' | 'RELEASED' | 'ADMIN_ADJUSTMENT' | 'EXPIRED';
  delta: number;
  balanceAfter: number;
  reason: string;
  actor: string;
  referenceId: string;
  createdAt: string;
}

export interface ModerationProductItem {
  id: string;
  productId: string;
  productName: string;
  brandId: string;
  brandName: string;
  category: string;
  imageUrl: string;
  price: number;
  moderationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'UNPUBLISHED';
  visibility: 'PUBLIC' | 'HIDDEN';
  featured: boolean;
  sponsored?: boolean;
  reportsCount: number;
  submittedAt: string;
}

export interface ModerationBrandItem {
  id: string;
  tenantId: string;
  brandName: string;
  verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'RESTRICTED';
  reportsCount: number;
  marketplaceStatus: 'ALLOWED' | 'RESTRICTED';
  reviewerNote: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  productCount: number;
  seoTitle: string;
}

export interface MarketplaceCollection {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  sponsored: boolean;
  itemCount: number;
}

export interface MarketplaceReportItem {
  id: string;
  targetType: 'PRODUCT' | 'BRAND';
  targetName: string;
  reason: 'COPYRIGHT' | 'INAPPROPRIATE_IMAGE' | 'MISLEADING_DESCRIPTION' | 'POLICY_VIOLATION';
  reporter: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface CmsPageRecord {
  id: string;
  title: string;
  slug: string;
  type: 'HOMEPAGE_SECTION' | 'STATIC_PAGE' | 'BANNER' | 'BLOG' | 'FAQ';
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
  order: number;
  summary: string;
  updatedAt: string;
}

export interface SupportTicketRecord {
  id: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  tenantId?: string;
  tenantName?: string;
  category: 'ACCOUNT' | 'SUBSCRIPTION' | 'PAYMENT' | 'PRODUCT' | 'MARKETPLACE' | 'TRY_ON' | 'AI_ENGINE' | 'TECHNICAL' | 'PRIVACY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  assignedAgent?: string;
  relatedJobId?: string;
  relatedTransactionId?: string;
  messages: Array<{ sender: string; role: string; text: string; internal?: boolean; at: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'PAYMENT' | 'AI_QUEUE' | 'USAGE_LIMIT' | 'STORAGE' | 'SECURITY' | 'BACKUP';
  title: string;
  details: string;
  owner?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
}

export interface SecurityEventRecord {
  id: string;
  type: 'FAILED_LOGIN' | 'PRIVILEGE_ATTEMPT' | 'CROSS_TENANT_BLOCKED' | 'API_ABUSE' | 'MFA_FAILURE' | 'IMPERSONATION_START';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  actor: string;
  ipMasked: string;
  details: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'DISMISSED';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface AuditEventRecord extends AuditLog {
  actorRole: string;
  tenantContext?: string;
  correlationId: string;
  reason?: string;
}

export interface DataGovernanceRequest {
  id: string;
  type: 'DATA_EXPORT' | 'DATA_DELETION' | 'PHOTO_PURGE' | 'CONSENT_AUDIT';
  requester: string;
  tenantName: string;
  status: 'PENDING_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'DENIED';
  retentionDeadline: string;
  createdAt: string;
}

export interface FeatureFlagRecord {
  key: string;
  name: string;
  description: string;
  owner: string;
  globalEnabled: boolean;
  rolloutPct: number;
  planOverrides: Record<string, boolean>;
  updatedAt: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastResponseCode: number;
  retryCount: number;
  lastAttemptAt: string;
}

export interface PlatformGlobalSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
  maxImageUploadMb: number;
  imageRetentionDays: number;
  tryOnResultRetentionDays: number;
  tenantDeletionGraceDays: number;
  requireAdminMfa: boolean;
  maintenanceMode: {
    enabled: boolean;
    message: string;
    scope: 'ALL_APPS' | 'MARKETPLACE_ONLY' | 'AI_TRYON_ONLY';
    scheduledWindow?: string;
  };
}
