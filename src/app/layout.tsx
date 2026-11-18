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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Super Admin Control Plane | AI Virtual Try-On SaaS',
    template: '%s | V-TRY Control Plane',
  },
  description:
    'Enterprise platform control center for multi-tenant virtual try-on SaaS governance, billing, AI infrastructure, moderation, and security.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased"
        data-csp-protected={nonce ? 'true' : undefined}
        suppressHydrationWarning
      >
        <QueryProvider>
          <WebVitalReporter serviceName="vton-super-admin" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
