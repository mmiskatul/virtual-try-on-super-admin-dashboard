/**
 * Production API Client for Super Admin Governance Dashboard
 * Handles authenticated communication with the backend API only (the backend talks to the AI service)
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Authorization token if stored in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

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
    return request<{ token: string; admin: any }>(`${BACKEND_API_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  verifyEmail: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ message: string; user: any }>(`${BACKEND_API_URL}/api/v1/admin/auth/verify-email`, {
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

  // SMTP & Supabase Database Infrastructure
  getInfrastructureConfig: () => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/config`);
  },

  saveSmtpConfig: (payload: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  }) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/smtp`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  testSmtpConfig: (payload: {
    action: 'verify' | 'send';
    testRecipient?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  }) => {
    return request<any>(`${BACKEND_API_URL}/api/v1/admin/infrastructure/smtp/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
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
