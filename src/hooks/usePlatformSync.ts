'use client';

import { useEffect } from 'react';
import { platformService } from '../services/platformService';
import { usePlatformStore } from '../stores/usePlatformStore';

/**
 * Pulls the live platform data (health, overview, tenants, audit logs, generations, AI metrics, control-plane
 * snapshot, revenue series) into the store.
 *
 * It is a module-level function, not per-component state, so every caller shares the same run: while a sync is
 * in flight, further calls (a second component, a StrictMode double-mount, a double-clicked Sync button) get the
 * same promise back instead of firing another 8 requests.
 */
let inFlight: Promise<boolean> | null = null;
let lastSyncStartedAt = 0;

/** How often the dashboard re-pulls live data while the tab is visible. */
export const AUTO_REFRESH_MS = 60_000;

async function runSync(): Promise<boolean> {
  const store = usePlatformStore.getState();
  const healthCheck = await platformService.checkBackendHealth();

  if (!healthCheck.reachable) {
    store.setLiveStatus(false, healthCheck.health, healthCheck.latencyMs);
    return false;
  }

  try {
    const [overview, tenants, logs, gens, aiMetrics, snapshotRes, seriesRes, rbacRes] = await Promise.allSettled([
      platformService.getOverview(),
      platformService.getTenants(),
      platformService.getAuditLogs(),
      platformService.getGenerations(undefined, 50),
      platformService.getAiMetrics(),
      platformService.getControlPlaneSnapshot(),
      platformService.getAnalyticsSeries(6),
      platformService.getRbacMe(),
    ]);

    const anyAuthedOk =
      overview.status === 'fulfilled' ||
      rbacRes.status === 'fulfilled' ||
      tenants.status === 'fulfilled' ||
      snapshotRes.status === 'fulfilled';

    if (tenants.status === 'fulfilled' && Array.isArray(tenants.value)) {
      store.mergeLiveTenants(tenants.value);
    }
    if (logs.status === 'fulfilled' && Array.isArray(logs.value)) {
      store.setLiveAuditLogs(logs.value);
    }
    if (gens.status === 'fulfilled' && Array.isArray(gens.value)) {
      store.setLiveGenerations(gens.value);
    }
    if (snapshotRes.status === 'fulfilled' && snapshotRes.value?.data) {
      store.hydrateControlPlaneSnapshot?.(snapshotRes.value.data);
    }
    if (seriesRes.status === 'fulfilled' && Array.isArray(seriesRes.value?.data?.points)) {
      store.setRevenueSeries(seriesRes.value.data.points);
    }
    if (rbacRes.status === 'fulfilled' && rbacRes.value?.data) {
      const { role, roleCodes, permissions } = rbacRes.value.data;
      store.setRbac({
        role: role || '',
        roleCodes: Array.isArray(roleCodes) ? roleCodes : [],
        permissions: Array.isArray(permissions) ? permissions : [],
      });
    }
    store.setBackendTelemetry({
      overview: overview.status === 'fulfilled' ? overview.value : null,
      aiMetrics: aiMetrics.status === 'fulfilled' ? aiMetrics.value : null,
    });

    store.setLiveStatus(anyAuthedOk, healthCheck.health, healthCheck.latencyMs);
    return anyAuthedOk;
  } catch {
    store.setLiveStatus(false, healthCheck.health, healthCheck.latencyMs);
    return false;
  }
}

/**
 * The repeating refresh only re-pulls what changes while someone is looking at the dashboard (the control-plane
 * snapshot and the tenant list): 2 requests instead of 11. The full sync (health probe, overview, audit logs, ...)
 * runs on page load and when the Sync button is pressed. Keeping steady traffic low matters because Cloudflare
 * rate-limits the API (error 1015) when too many calls arrive from one place.
 * If both calls fail the backend may be down, so it falls back to the full sync, which also updates the status.
 */
async function runLightSync(): Promise<boolean> {
  const store = usePlatformStore.getState();
  const [tenants, snapshotRes] = await Promise.allSettled([
    platformService.getTenants(),
    platformService.getControlPlaneSnapshot(),
  ]);
  const tenantsOk = tenants.status === 'fulfilled' && Array.isArray(tenants.value);
  const snapshotOk = snapshotRes.status === 'fulfilled' && Boolean(snapshotRes.value?.data);
  if (!tenantsOk && !snapshotOk) return runSync();

  if (tenantsOk) store.mergeLiveTenants((tenants as PromiseFulfilledResult<any[]>).value);
  if (snapshotOk) store.hydrateControlPlaneSnapshot?.((snapshotRes as PromiseFulfilledResult<any>).value.data);
  store.setLiveStatus(true, store.backendHealth, store.backendLatencyMs ?? undefined);
  return true;
}

/** Runs a sync, or joins the one already running. `light` is for the repeating background refresh. */
export function syncPlatformNow(options: { light?: boolean } = {}): Promise<boolean> {
  if (!inFlight) {
    lastSyncStartedAt = Date.now();
    inFlight = (options.light ? runLightSync() : runSync()).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * `syncNow` is the same function for every component. Pass `{ auto: true }` from exactly one place (the admin
 * shell): it loads the data when the dashboard opens, then refreshes every minute while the tab is visible, and
 * again as soon as you return to a tab that has gone stale. Hidden tabs make no requests.
 */
export function usePlatformSync(options: { auto?: boolean } = {}) {
  const auto = options.auto === true;

  useEffect(() => {
    if (!auto) return;
    void syncPlatformNow();

    const tick = () => {
      if (document.visibilityState === 'visible') void syncPlatformNow({ light: true });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncStartedAt >= AUTO_REFRESH_MS) {
        void syncPlatformNow({ light: true });
      }
    };

    const timer = window.setInterval(tick, AUTO_REFRESH_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [auto]);

  // Buttons call syncNow() with no arguments, which always runs the full sync.
  return { syncNow: () => syncPlatformNow() };
}
