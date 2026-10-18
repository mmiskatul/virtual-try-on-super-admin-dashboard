import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import '../lib/server-security';
import { QueryProvider } from '../providers/QueryProvider';
import { WebVitalReporter } from '../components/telemetry/WebVitalReporter';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://admin.v-try.fashion';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Super Admin Governance | AI Virtual Try-On SaaS',
    template: '%s | V-TRY Platform Admin',
  },
  description: 'Platform control center for multi-tenant virtual try-on infrastructure, quotas, and AI engine telemetry.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Dynamic Cryptographic Nonce for Strict CSP Verification */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased"
        data-csp-protected={nonce ? 'true' : undefined}
      >
        <QueryProvider>
          {/* Live Real User Monitoring (RUM) for Core Web Vitals */}
          <WebVitalReporter serviceName="vton-super-admin" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
