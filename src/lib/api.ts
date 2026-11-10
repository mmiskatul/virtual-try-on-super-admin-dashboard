/**
 * Production API Client for Super Admin Governance Dashboard
 * Handles authenticated communication with backend-api (:4000) and ai-service (:8000)
 */

const SUPER_ADMIN_API_URL = process.env.NEXT_PUBLIC_SUPER_ADMIN_API_URL || 'http://localhost:4000';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export interface DevEmailPreview {
  actionUrl?: string;
  otpCode?: string;
  expiresInMinutes?: number;
}

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
    return request<{ token: string; admin: any }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  verifyEmail: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ message: string; user: any }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  resendVerification: (email: string) => {
    return request<{
      message: string;
      alreadyVerified?: boolean;
      devPreview?: DevEmailPreview;
    }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email, portal: 'admin' })
    });
  },

  forgotPassword: (email: string) => {
    return request<{ message: string; devPreview?: DevEmailPreview }>(
      `${SUPER_ADMIN_API_URL}/api/v1/admin/auth/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify({ email, portal: 'admin' })
      }
    );
  },

  verifyResetToken: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ valid: boolean; email: string; expiresAt: number }>(
      `${SUPER_ADMIN_API_URL}/api/v1/admin/auth/verify-reset-token`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  resetPassword: (payload: { token?: string; email?: string; code?: string; newPassword: string }) => {
    return request<{ message: string }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/auth/reset-password`, {
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
    }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/analytics/overview`);
  },

  // Tenant Governance
  getTenants: () => {
    return request<any[]>(`${SUPER_ADMIN_API_URL}/api/v1/admin/tenants`);
  },

  setTenantStatus: (tenantId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Audit Logs
  getAuditLogs: () => {
    return request<any[]>(`${SUPER_ADMIN_API_URL}/api/v1/admin/audit-logs`);
  },

  // AI Service Metrics & Models
  getAiMetrics: () => {
    return request<any>(`${AI_SERVICE_URL}/api/v1/metrics`);
  },

  getAiModels: () => {
    return request<any>(`${AI_SERVICE_URL}/api/v1/models`);
  },

  // AI Engine Management & Model Control
  getAiEngineConfig: () => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/ai-engine/config`);
  },

  updateAiEngineConfig: (configPayload: any) => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/ai-engine/config`, {
      method: 'POST',
      body: JSON.stringify(configPayload)
    });
  },

  testAiEngineKey: (testPayload: { provider: string; apiKey?: string; model?: string }) => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/ai-engine/test-key`, {
      method: 'POST',
      body: JSON.stringify(testPayload)
    });
  },

  // SMTP & Supabase Database Infrastructure
  getInfrastructureConfig: () => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/config`);
  },

  saveSmtpConfig: (payload: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  }) => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/smtp`, {
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
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/smtp/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  testDatabaseConfig: (payload: { databaseUrl?: string }) => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/database/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveDatabaseConfig: (payload: {
    databaseUrl?: string;
  }) => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/database`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  syncDatabase: () => {
    return request<any>(`${SUPER_ADMIN_API_URL}/api/v1/admin/infrastructure/database/sync`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }
};
