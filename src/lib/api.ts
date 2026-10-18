/**
 * Production API Client for Super Admin Governance Dashboard
 * Handles authenticated communication with super-admin-api (:4003) and ai-service (:8000)
 */

const SUPER_ADMIN_API_URL = process.env.NEXT_PUBLIC_SUPER_ADMIN_API_URL || 'http://localhost:4003';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

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
  // Authentication
  login: (credentials: { email: string; password: string }) => {
    return request<{ token: string; admin: any }>(`${SUPER_ADMIN_API_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
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
  }
};
