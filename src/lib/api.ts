/**
 * Production API Client for Super Admin Governance Dashboard
 * Uses HttpOnly cookies (`vtry_admin_access`, `vtry_admin_refresh`, `vtry_admin_sid`) + single-flight refresh.
 */

export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export interface RbacCatalog {
  roles: Array<{
    code: string;
    name: string;
    description: string;
    scope: 'PLATFORM' | 'TENANT' | 'CUSTOMER';
    isSystem: boolean;
    mfaRequired: boolean;
    permissions: string[];
  }>;
  permissions: Array<{ module: string; action: string; description: string }>;
}

export interface TenantAdminContext {
  notes: Array<{ id: string; note: string; author: string; createdAt: string }>;
  assignedSupportAgent: { id: string; name: string } | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function isBackendUrl(url: string): boolean {
  return url.startsWith(BACKEND_API_URL) || url.startsWith('/');
}

function shouldAttemptRefresh(url: string): boolean {
  const lower = url.toLowerCase();
  return !(
    lower.includes('/auth/login') ||
    lower.includes('/auth/oauth-google') ||
    lower.includes('/auth/register') ||
    lower.includes('/auth/refresh') ||
    lower.includes('/auth/logout')
  );
}

export async function refreshAdminSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/v1/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Auth-Portal': 'admin',
          'X-Auth-Transport': 'cookie',
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const backendCall = isBackendUrl(url);
  if (backendCall) {
    headers.set('X-Auth-Portal', 'admin');
    headers.set('X-Auth-Transport', 'cookie');
  }

  const doFetch = () =>
    fetch(url, {
      ...options,
      headers,
      credentials: backendCall ? 'include' : options.credentials,
    });

  let response = await doFetch();
  if (response.status === 401 && backendCall && shouldAttemptRefresh(url)) {
    const refreshed = await refreshAdminSession();
    if (refreshed) {
      response = await doFetch();
    }
  }
  return response;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await adminFetch(url, options);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, errorData?.message || `HTTP ${response.status}`, errorData);
  }

  return response.json();
}

export const superAdminApi = {
  // Authentication & Recovery
  login: (credentials: { email: string; password: string }) => {
    return request<{ sessionId?: string; admin: any }>(`${BACKEND_API_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /** Whether Google sign-in is available, and the (public) Google client id to use. */
  googleConfig: () => {
    return request<{ enabled: boolean; googleClientId: string | null }>(
      `${BACKEND_API_URL}/api/v1/admin/auth/google-config`,
      { method: 'GET', cache: 'no-store' }
    );
  },

  /** Exchanges a Google sign-in token for an admin session (the backend checks the email against its allow-list). */
  loginWithGoogle: (idToken: string) => {
    return request<{ sessionId?: string; admin: any }>(`${BACKEND_API_URL}/api/v1/admin/auth/oauth-google`, {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });
  },

  session: () => {
    return request<{
      authenticated: boolean;
      refreshed?: boolean;
      sessionId?: string | null;
      user: any | null;
    }>(`${BACKEND_API_URL}/api/v1/admin/auth/session`, {
      method: 'GET',
      cache: 'no-store',
    });
  },

  logout: () => {
    return request<{ ok: boolean; loggedOut: boolean; message: string }>(
      `${BACKEND_API_URL}/api/v1/admin/auth/logout`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },

  verifyEmail: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{
      message: string;
      user: any;
      sessionId?: string;
    }>(`${BACKEND_API_URL}/api/v1/admin/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  resendVerification: (email: string) => {
    return request<{
      message: string;
      alreadyVerified?: boolean;
    }>(`${BACKEND_API_URL}/api/v1/admin/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email, portal: 'admin' })
    });
  },

  forgotPassword: (email: string) => {
    return request<{ message: string }>(
      `${BACKEND_API_URL}/api/v1/admin/auth/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify({ email, portal: 'admin' })
      }
    );
  },

  verifyResetToken: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ valid: boolean; email: string; expiresAt: number }>(
      `${BACKEND_API_URL}/api/v1/admin/auth/verify-reset-token`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  resetPassword: (payload: { token?: string; email?: string; code?: string; newPassword: string }) => {
    return request<{ message: string }>(`${BACKEND_API_URL}/api/v1/admin/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, portal: 'admin' })
    });
  },

  /** The signed-in admin's real role and permission keys (e.g. "tenants:read", or "*:*" for Super Admin). */
  getRbacMe: () => {
    return request<{
      success: boolean;
      data: { userId: string; role: string; roleCodes: string[]; permissions: string[] };
    }>(`${BACKEND_API_URL}/api/v1/auth/rbac/me`, { method: 'GET', cache: 'no-store' });
  },

  /** The full role and permission catalog. Needs the staff:manage permission. */
  getRbacRoles: () => {
    return request<{ success: boolean; data: RbacCatalog }>(`${BACKEND_API_URL}/api/v1/admin/rbac/roles`);
  },

  // Platform Analytics Overview
  getOverview: () => {
    return request<{
      tenants: { total: number; active: number; suspended: number };
      catalog: { totalProducts: number };
      orders: { totalOrders: number; gmv: number };
      aiTelemetry: any;
    }>(`${BACKEND_API_URL}/api/v1/admin/analytics/overview`);
  },

  // Tenant Governance
  getTenants: () => {
    return request<any[]>(`${BACKEND_API_URL}/api/v1/admin/tenants`);
  },

  setTenantStatus: (tenantId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Usage, quota and generation ledger
  getUsageSummary: () => {
    return request<any[]>(`${BACKEND_API_URL}/api/v1/admin/usage`);
  },

  getGenerations: (tenantId?: string, limit = 50) => {
    const qs = new URLSearchParams({ limit: String(limit), ...(tenantId ? { tenantId } : {}) });
    return request<any[]>(`${BACKEND_API_URL}/api/v1/admin/generations?${qs}`);
  },

  getUsageLedger: (tenantId?: string, limit = 50) => {
    const qs = new URLSearchParams({ limit: String(limit), ...(tenantId ? { tenantId } : {}) });
    return request<any[]>(`${BACKEND_API_URL}/api/v1/admin/usage-ledger?${qs}`);
  },

  updateTenantPlan: (
    tenantId: string,
    body: { plan?: string; tryOnMonthlyQuota?: number; productLimit?: number; status?: string }
  ) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/tenants/${tenantId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  // Audit Logs
  getAuditLogs: () => {
    return request<any[]>(`${BACKEND_API_URL}/api/v1/admin/audit-logs`);
  },

  // AI Service Metrics & Models
  getAiMetrics: () => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/ai/telemetry`);
  },


  // AI Engine Management & Model Control
  getAiEngineConfig: () => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/ai-engine/config`);
  },

  updateAiEngineConfig: (configPayload: any) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/ai-engine/config`, {
      method: 'POST',
      body: JSON.stringify(configPayload)
    });
  },

  testAiEngineKey: (testPayload: { provider: string; apiKey?: string; model?: string }) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/ai-engine/test-key`, {
      method: 'POST',
      body: JSON.stringify(testPayload)
    });
  },

  // Resend email & Supabase/PostgreSQL Database Infrastructure
  getInfrastructureConfig: () => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/config`);
  },

  /** Saves the Resend API key and/or From header (POST /infrastructure/resend). Leave `apiKey` out to keep the stored key. */
  saveResendConfig: (payload: { apiKey?: string; from?: string; clearApiKey?: boolean }) => {
    return request<{ success: boolean; activeTransport: string; message: string }>(
      `${BACKEND_API_URL}/api/v1/admin/infrastructure/resend`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  /** Verifies a Resend key, or sends a real test email (POST /infrastructure/resend/test). */
  testResendConfig: (payload: {
    action: 'verify' | 'send';
    testRecipient?: string;
    apiKey?: string;
    from?: string;
  }) => {
    return request<{ success: boolean; message: string }>(
      `${BACKEND_API_URL}/api/v1/admin/infrastructure/resend/test`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  testDatabaseConfig: (payload: { databaseUrl?: string }) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/database/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveDatabaseConfig: (payload: {
    databaseUrl?: string;
  }) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/database`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  syncDatabase: () => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/database/sync`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  // Phase 5 & 6 Complete Enterprise Control Plane APIs
  /** Real monthly revenue (paid invoices) and try-on generations, oldest month first. */
  getAnalyticsSeries: (months = 6) => {
    return request<{ success: boolean; data: { points: any[] } }>(
      `${BACKEND_API_URL}/api/v1/admin/analytics/series?months=${months}`
    );
  },

  getControlPlaneSnapshot: () => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/control-plane/snapshot`);
  },

  createTenant: (payload: { name: string; slug: string; contactEmail: string; planSlug: 'STARTER' | 'PRO' | 'ENTERPRISE' }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/tenants`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getUsers: () => {
    return request<{ success: boolean; data: { users: any[] } }>(`${BACKEND_API_URL}/api/v1/admin/users`);
  },

  setUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  },

  moderateProduct: (productId: string, payload: { moderationStatus: string; note?: string; featured?: boolean; sponsored?: boolean }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/moderation/products/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  grantCredits: (tenantId: string, payload: { delta: number; promo?: boolean; reason: string }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/credits/grant`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  toggleAiModel: (modelId: string, payload: { active?: boolean; isDefault?: boolean }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/ai/models/${encodeURIComponent(modelId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  updateAiRouting: (payload: Record<string, unknown>) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/ai/routing`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  cancelSubscription: (tenantId: string, reason: string) => {
    return request<{ success: boolean; data: { subscription: any } }>(
      `${BACKEND_API_URL}/api/v1/admin/subscriptions/${encodeURIComponent(tenantId)}/cancel`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
  },

  extendTrial: (tenantId: string, days: number) => {
    return request<{ success: boolean; data: { subscription: any } }>(
      `${BACKEND_API_URL}/api/v1/admin/subscriptions/${encodeURIComponent(tenantId)}/extend-trial`,
      { method: 'POST', body: JSON.stringify({ days }) }
    );
  },

  getTenantAdminContext: (tenantId: string) => {
    return request<{ success: boolean; data: TenantAdminContext }>(
      `${BACKEND_API_URL}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/admin-context`
    );
  },

  addTenantNote: (tenantId: string, note: string) => {
    return request<{ success: boolean; data: TenantAdminContext }>(
      `${BACKEND_API_URL}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/notes`,
      { method: 'POST', body: JSON.stringify({ note }) }
    );
  },

  assignSupportAgent: (tenantId: string, agentId: string) => {
    return request<{ success: boolean; data: TenantAdminContext }>(
      `${BACKEND_API_URL}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/support-agent`,
      { method: 'PUT', body: JSON.stringify({ agentId }) }
    );
  },

  updateTicket: (
    ticketId: string,
    payload: {
      status?: string;
      priority?: string;
      assignedAgent?: string;
      message?: string;
      internal?: boolean;
    }
  ) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/support/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  updateRefundStatus: (refundId: string, payload: { status: 'APPROVED' | 'REJECTED' | 'PROCESSED'; note?: string }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/finance/refunds/${encodeURIComponent(refundId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  updateDataRequest: (requestId: string, payload: { status: 'PENDING_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/governance/requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  toggleFeatureFlag: (key: string, payload: { globalEnabled?: boolean; rolloutPct?: number }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/feature-flags/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  saveCmsPage: (payload: Record<string, unknown>) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/cms`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  addWebhook: (payload: { url: string; events: string[]; tenantId?: string }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/webhooks`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateSettings: (payload: Record<string, unknown>) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  startViewAs: (tenantId: string, payload: { mode: 'READ_ONLY' | 'SUPPORT_WRITE'; reason: string }) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/view-as`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  endViewAs: (sessionId: string) => {
    return request<{ success: boolean; data: any }>(`${BACKEND_API_URL}/api/v1/admin/view-as/${encodeURIComponent(sessionId)}/end`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },
};
