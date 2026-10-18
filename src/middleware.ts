import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// Public paths for super admin console
const PUBLIC_PREFIXES = [
  '/api/auth',
  '/manifest.webmanifest',
  '/robots.txt',
];

/**
 * Generate a strict, dynamic Content Security Policy (CSP) with a cryptographic nonce.
 * Protects platform governance control plane, tenant billing, and GPU telemetry against XSS attacks.
 */
function createContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production';

  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''} https:;
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https:;
    img-src 'self' blob: data: https://images.unsplash.com https:;
    font-src 'self' data: https:;
    connect-src 'self' http://localhost:* ws://localhost:* https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Edge Runtime Middleware with Token Verification: Super Admin Governance
 * Protects governance control plane at the edge before any administrative view renders.
 * Blocks non-admin requests immediately with 401/403 or redirects to security portal sign-in.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Generate Cryptographic Nonce using Web Crypto
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = createContentSecurityPolicy(nonce);

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);
    requestHeaders.set('x-edge-routed', 'true');
    requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);
    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'DENY');
    response.headers.set('x-xss-protection', '1; mode=block');
    response.headers.set('x-edge-runtime', 'vercel-edge-v8');
    return response;
  }

  // 2. Edge JWT Token Verification
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'vton-super-admin-fallback-secret-key-32chars',
  });

  // 3. Immediate Edge Blocking if unauthenticated or non-admin
  if (!token || token.role !== 'SUPER_ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Super Admin credentials and platform security key required at routing edge.',
          code: 'EDGE_GOVERNANCE_BLOCKED',
        },
        {
          status: 401,
          headers: {
            'Content-Security-Policy': cspHeader,
            'x-nonce': nonce,
          },
        }
      );
    }

    const signInUrl = new URL('/api/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 4. Inject verified platform governance headers & cryptographic nonce downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-edge-routed', 'true');
  requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');
  requestHeaders.set('x-auth-admin-id', (token.id as string) || (token.sub as string) || '');
  requestHeaders.set('x-auth-admin-role', 'SUPER_ADMIN');
  requestHeaders.set('x-auth-verified-edge', 'true');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-xss-protection', '1; mode=block');
  response.headers.set('x-edge-runtime', 'vercel-edge-v8');
  response.headers.set('x-governance-layer', 'edge-v8-enforced');

  return response;
}
