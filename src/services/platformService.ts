import { superAdminApi } from '../lib/api';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export const platformService = {
  ...superAdminApi,

  checkBackendHealth: async (): Promise<{
    reachable: boolean;
    health?: any;
    ready?: any;
    latencyMs: number;
  }> => {
    const start = Date.now();
    try {
      const [hRes, rRes] = await Promise.all([
        fetch(`${BACKEND_BASE}/health`, { cache: 'no-store' }),
        fetch(`${BACKEND_BASE}/ready`, { cache: 'no-store' }),
      ]);
      const health = hRes.ok ? await hRes.json().catch(() => null) : null;
      const ready = rRes.ok ? await rRes.json().catch(() => null) : null;
      return {
        reachable: hRes.ok,
        health,
        ready,
        latencyMs: Date.now() - start,
      };
    } catch {
      return { reachable: false, latencyMs: Date.now() - start };
    }
  },
};

