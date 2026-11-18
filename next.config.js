// Local default so next-auth does not warn when .env only holds the backend URL.
// In production the host (e.g. Vercel) provides the URL.
if (process.env.NODE_ENV !== 'production' && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3002';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    taint: true,
  },
  // Old URLs for pages that duplicated another page; keep bookmarks working.
  async redirects() {
    return [
      { source: '/admin/overview', destination: '/admin', permanent: false },
      { source: '/admin/reports', destination: '/admin', permanent: false },
      { source: '/admin/analytics/:path*', destination: '/admin', permanent: false },
      { source: '/admin/security/access', destination: '/admin/staff/permissions', permanent: false },
      { source: '/admin/users/roles', destination: '/admin/staff/roles', permanent: false },
      { source: '/admin/tenants/:id/overview', destination: '/admin/tenants/:id', permanent: false },
      { source: '/admin/system', destination: '/admin/system/health', permanent: false },
      { source: '/admin/system/services', destination: '/admin/system/health', permanent: false },
      { source: '/admin/system/storage', destination: '/admin/system/health', permanent: false },
      { source: '/admin/system/queues', destination: '/admin/system/logs', permanent: false },
      { source: '/admin/system/jobs', destination: '/admin/system/logs', permanent: false },
      { source: '/admin/ai/performance', destination: '/admin/ai', permanent: false },
      { source: '/admin/ai/usage', destination: '/admin/ai', permanent: false },
      { source: '/admin/ai/credits', destination: '/admin/ai/costs', permanent: false },
      { source: '/admin/try-on', destination: '/admin/try-on/jobs', permanent: false },
      { source: '/admin/try-on/analytics', destination: '/admin/try-on/jobs', permanent: false },
      { source: '/admin/try-on/policies', destination: '/admin/try-on/quality', permanent: false },
      { source: '/admin/finance/payments', destination: '/admin/finance/transactions', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'api.vtrystudio.com'
      },
      {
        protocol: 'https',
        hostname: 'ai.vtrystudio.com'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1'
      }
    ]
  }
};

module.exports = nextConfig;
