import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'V-TRY | Super Admin Governance',
    short_name: 'V-TRY Admin',
    description: 'Platform control center for multi-tenant virtual try-on infrastructure, quotas, and AI engine telemetry.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
