import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_SESSION_COOKIE,
  buildAdminCookieHeader,
  isAllowedAdminRole,
  isValidAdminAccessCookie,
  isValidAdminRefreshCookie,
  verifyAdminSessionWithBackend,
} from './portal-auth';

export interface VerifiedAdminSession {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

/**
 * Verifies NextAuth admin session + HttpOnly backend access/refresh token cookies
 * in Server Components, Route Handlers, and Server Actions.
 */
export async function getVerifiedAdminSession(): Promise<VerifiedAdminSession | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!session?.user || !userId || !isAllowedAdminRole(role)) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  const hasValidAccess = isValidAdminAccessCookie(accessToken, userId, sessionCookie);
  const hasValidRefresh = isValidAdminRefreshCookie(refreshToken, userId, sessionCookie);

  if (!hasValidAccess && !hasValidRefresh) {
    return null;
  }

  // Confirm live backend session state using access + HttpOnly session cookies (avoid unnecessary refresh rotation when access is valid)
  const sessionCheckCookie = hasValidAccess
    ? buildAdminCookieHeader({ accessToken, sessionToken: sessionCookie })
    : buildAdminCookieHeader({ accessToken, sessionToken: sessionCookie, refreshToken });

  const verification = await verifyAdminSessionWithBackend(sessionCheckCookie, userId);
  if (!verification.ok) {
    return null;
  }

  return {
    userId,
    email: session.user.email || '',
    name: session.user.name,
    role,
  };
}

export async function requireAdminPageSession(loginRedirect = '/login'): Promise<VerifiedAdminSession> {
  const verified = await getVerifiedAdminSession();
  if (!verified) {
    redirect(loginRedirect);
  }
  return verified;
}

export async function requireAdminServerAction(): Promise<VerifiedAdminSession> {
  const verified = await getVerifiedAdminSession();
  if (!verified) {
    throw new Error('Unauthorized: valid Super Admin authentication and access token required.');
  }
  return verified;
}
