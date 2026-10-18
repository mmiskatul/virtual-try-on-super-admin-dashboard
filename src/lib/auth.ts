import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Super Admin Security Portal',
      credentials: {
        email: { label: 'Admin Email', type: 'email', placeholder: 'admin@vton-platform.io' },
        password: { label: 'Security Key', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // Demo super admin credentials
        if (credentials.email === 'admin@vton-platform.io' || credentials.email.includes('admin')) {
          return {
            id: 'adm_master_01',
            name: 'Alexander Vance',
            email: credentials.email,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            role: 'SUPER_ADMIN'
          };
        }

        return {
          id: `adm_${Date.now()}`,
          name: 'Platform Operator',
          email: credentials.email,
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          role: 'SUPER_ADMIN'
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'SUPER_ADMIN';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'vton-super-admin-fallback-secret-key-32chars'
};
