export const ADMIN_ACCESS_COOKIE = 'vtry_admin_access';
export const ADMIN_REFRESH_COOKIE = 'vtry_admin_refresh';
export const ADMIN_SESSION_COOKIE = 'vtry_admin_sid';

export const ADMIN_ALLOWED_ROLES = new Set<string>([
  'SUPER_ADMIN',
  'PLATFORM_OPERATIONS_ADMIN',
  'FINANCE_BILLING_ADMIN',
  'AI_INFRASTRUCTURE_ADMIN',
  'TRUST_SAFETY_MODERATOR',
  'MARKETPLACE_MANAGER',
  'CUSTOMER_SUPPORT_AGENT',
  'SECURITY_COMPLIANCE_OFFICER',
  'DATA_ANALYTICS_VIEWER',
  'PLATFORM_READ_ONLY_AUDITOR',
  'PLATFORM_OPS',
  'BILLING_ADMIN',
  'TRUST_SAFETY',
]);

export function getBackendApiBaseUrl(): string {
  const raw =
    process.env.INTERNAL_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    'http://localhost:4000';
  return raw.replace(/\/+$/, '');
}

export function isAllowedAdminRole(role: unknown): role is string {
  return typeof role === 'string' && ADMIN_ALLOWED_ROLES.has(role);
}

export function decodeJwtPayloadUnsafe(token: string | undefined): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isValidAdminAccessCookie(
  rawJwt: string | undefined,
  expectedUserId?: string,
  expectedSessionId?: string,
): boolean {
  const payload = decodeJwtPayloadUnsafe(rawJwt);
  if (!payload) return false;
  if (payload.tokenType !== 'access') return false;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 5000) return false;
  if (!isAllowedAdminRole(payload.role)) return false;

  const claimUserId =
    typeof payload.userId === 'string'
      ? payload.userId
      : typeof payload.sub === 'string'
        ? payload.sub
        : '';
  if (!claimUserId) return false;
  if (expectedUserId && claimUserId !== expectedUserId) return false;
  if (expectedSessionId && typeof payload.sid === 'string' && payload.sid !== expectedSessionId) {
    return false;
  }
  return true;
}

export function isValidAdminRefreshCookie(
  rawJwt: string | undefined,
  expectedUserId?: string,
  expectedSessionId?: string,
): boolean {
  const payload = decodeJwtPayloadUnsafe(rawJwt);
  if (!payload) return false;
  if (payload.tokenType !== 'refresh') return false;
  if (payload.portal !== 'admin') return false;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return false;

  const claimUserId = typeof payload.userId === 'string' ? payload.userId : '';
  if (!claimUserId) return false;
  if (expectedUserId && claimUserId !== expectedUserId) return false;
  if (expectedSessionId && typeof payload.sid === 'string' && payload.sid !== expectedSessionId) {
    return false;
  }
  return true;
}

export function buildAdminCookieHeader(tokens: {
  accessToken?: string;
  sessionToken?: string;
  refreshToken?: string;
}): string {
  return [
    tokens.accessToken ? `${ADMIN_ACCESS_COOKIE}=${encodeURIComponent(tokens.accessToken)}` : '',
    tokens.sessionToken ? `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(tokens.sessionToken)}` : '',
    tokens.refreshToken ? `${ADMIN_REFRESH_COOKIE}=${encodeURIComponent(tokens.refreshToken)}` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function sanitizeAdminCallbackUrl(
  raw: string | null | undefined,
  fallback = '/admin',
): string {
  if (!raw || typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (
    raw === '/' ||
    raw.startsWith('/login') ||
    raw.startsWith('/register') ||
    raw.startsWith('/verify-email') ||
    raw.startsWith('/forgot-password') ||
    raw.startsWith('/forget-password') ||
    raw.startsWith('/reset-password') ||
    raw.startsWith('/api/')
  ) {
    return fallback;
  }
  return raw;
}

export function extractSetCookieHeaders(headers: Headers): string[] {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

export async function refreshAdminSessionFromBackend(cookieHeader: string): Promise<{
  ok: boolean;
  setCookies: string[];
  revoked: boolean;
}> {
  if (!cookieHeader) {
    return { ok: false, setCookies: [], revoked: false };
  }

  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'X-Auth-Portal': 'admin',
        'X-Auth-Transport': 'cookie',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      return {
        ok: true,
        setCookies: extractSetCookieHeaders(res.headers),
        revoked: false,
      };
    }

    return {
      ok: false,
      setCookies: extractSetCookieHeaders(res.headers),
      revoked: res.status === 401 || res.status === 403,
    };
  } catch {
    return { ok: false, setCookies: [], revoked: false };
  }
}

export async function verifyAdminSessionWithBackend(
  cookieHeader: string,
  expectedUserId?: string,
): Promise<{
  ok: boolean;
  user?: { id?: string; role?: string };
}> {
  if (!cookieHeader) {
    return { ok: false };
  }

  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/api/v1/admin/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'X-Auth-Portal': 'admin',
        'X-Auth-Transport': 'cookie',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return { ok: false };
    }

    const data = await res.json().catch(() => null);
    if (!data || data.authenticated !== true || !data.user || !isAllowedAdminRole(data.user.role)) {
      return { ok: false };
    }

    if (expectedUserId && data.user.id && data.user.id !== expectedUserId) {
      return { ok: false };
    }

    return {
      ok: true,
      user: {
        id: typeof data.user.id === 'string' ? data.user.id : undefined,
        role: data.user.role,
      },
    };
  } catch {
    return { ok: false };
  }
}
