import { NextRequest, NextResponse } from 'next/server';
import { extractSetCookieHeaders, getBackendApiBaseUrl } from '@/lib/portal-auth';

/**
 * Google sign-in handoff. The browser posts the Google ID token here (same origin), we exchange it with the
 * backend server-side, and re-issue the backend's admin cookies on THIS site's origin. That way the edge
 * middleware sees them no matter which domain the API lives on.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
    if (!idToken) {
      return NextResponse.json({ message: 'Google sign-in token is missing.' }, { status: 400 });
    }

    const backendRes = await fetch(`${getBackendApiBaseUrl()}/api/v1/admin/auth/oauth-google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Portal': 'admin',
        'X-Auth-Transport': 'cookie',
      },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    });

    const data = await backendRes.json().catch(() => ({}));
    const out = NextResponse.json(data, { status: backendRes.status });
    if (!backendRes.ok) return out;

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    for (const raw of extractSetCookieHeaders(backendRes.headers)) {
      // Host-only cookie on this origin; drop Secure on plain-http local dev so the browser keeps it.
      let cookie = raw.replace(/;\s*Domain=[^;]*/i, '');
      if (!isHttps) cookie = cookie.replace(/;\s*Secure/i, '');
      out.headers.append('Set-Cookie', cookie);
    }
    return out;
  } catch {
    return NextResponse.json({ message: 'Backend server is unreachable.' }, { status: 502 });
  }
}
