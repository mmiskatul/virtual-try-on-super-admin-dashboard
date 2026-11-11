import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Super Admin Security Portal',
      credentials: {
        email: { label: 'Admin Email', type: 'email', placeholder: 'admin@vton-platform.io' },
        password: { label: 'Security Key', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Administrator email and security password are required.');
        }

        let response: Response;
        try {
          response = await fetch(`${BACKEND_API_URL}/api/v1/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
          backendToken: data.token
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
        token.backendToken = user.backendToken;
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
      session.backendToken = token.backendToken;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'vton-super-admin-fallback-secret-key-32chars'
};
