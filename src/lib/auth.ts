import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

const PLATFORM_ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'PLATFORM_OPS',
  'SUPPORT_AGENT',
  'BILLING_ADMIN',
  'TRUST_SAFETY',
]);

function readCookieHeader(req: any): string | undefined {
  const headers = req?.headers;
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    return headers.get('cookie') || undefined;
  }
  return typeof headers.cookie === 'string' ? headers.cookie : undefined;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Super Admin Security Portal',
      credentials: {
        email: { label: 'Admin Email', type: 'email', placeholder: 'admin@vton-platform.io' },
        password: { label: 'Security Key', type: 'password' }
      },
      async authorize(credentials, req) {
        const cookieHeader = readCookieHeader(req);
        if (cookieHeader && (cookieHeader.includes('vtry_admin_access=') || cookieHeader.includes('vtry_admin_refresh='))) {
          try {
            const sessionRes = await fetch(`${BACKEND_API_URL}/api/v1/admin/auth/session`, {
              method: 'GET',
              headers: {
                Cookie: cookieHeader,
                'X-Auth-Portal': 'admin',
                'X-Auth-Transport': 'cookie',
              },
              cache: 'no-store',
            });
            const sessionData = await sessionRes.json().catch(() => ({}));
            if (sessionRes.ok && sessionData?.authenticated && sessionData?.user) {
              const role = sessionData.user.role || '';
              if (!PLATFORM_ADMIN_ROLES.has(role)) {
                throw new Error('Access restricted to Platform Super Admins only.');
              }
              return {
                id: sessionData.user.id,
                name: sessionData.user.name,
                email: sessionData.user.email,
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                role,
                emailVerified: Boolean(sessionData.user.emailVerified),
              };
            }
          } catch (err: any) {
            if (err?.message?.includes('restricted')) throw err;
          }
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Administrator email and security password are required.');
        }

        let response: Response;
        try {
          response = await fetch(`${BACKEND_API_URL}/api/v1/admin/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Portal': 'admin',
              'X-Auth-Transport': 'cookie',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });
        } catch {
          throw new Error('SERVICE_UNAVAILABLE');
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (data?.code === 'EMAIL_NOT_VERIFIED') {
            throw new Error('EMAIL_NOT_VERIFIED');
          }
          throw new Error(data?.message || 'Invalid super-admin credentials.');
        }

        if (!data?.admin) {
          return null;
        }

        return {
          id: data.admin.id,
          name: data.admin.name,
          email: data.admin.email,
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          role: data.admin.role || 'SUPER_ADMIN',
          emailVerified: Boolean(data.admin.emailVerified),
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'SUPER_ADMIN';
        token.emailVerified = Boolean(user.emailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'SUPER_ADMIN';
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
