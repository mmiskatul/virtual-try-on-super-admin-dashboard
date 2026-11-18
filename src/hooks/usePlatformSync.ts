'use client';

import { useCallback, useEffect } from 'react';
import { platformService } from '../services/platformService';
import { usePlatformStore } from '../stores/usePlatformStore';

export function usePlatformSync() {
  const setLiveStatus = usePlatformStore((s) => s.setLiveStatus);
  const mergeLiveTenants = usePlatformStore((s) => s.mergeLiveTenants);
  const setLiveAuditLogs = usePlatformStore((s) => s.setLiveAuditLogs);
  const setLiveGenerations = usePlatformStore((s) => s.setLiveGenerations);
  const setBackendTelemetry = usePlatformStore((s) => s.setBackendTelemetry);
  const setRevenueSeries = usePlatformStore((s) => s.setRevenueSeries);

  const syncNow = useCallback(async () => {
    const healthCheck = await platformService.checkBackendHealth();

    if (!healthCheck.reachable) {
      setLiveStatus(false, healthCheck.health, healthCheck.latencyMs);
      return false;
    }

    try {
      const [overview, tenants, logs, gens, aiMetrics, snapshotRes, seriesRes] = await Promise.allSettled([
        platformService.getOverview(),
        platformService.getTenants(),
        platformService.getAuditLogs(),
        platformService.getGenerations(undefined, 50),
        platformService.getAiMetrics(),
        platformService.getControlPlaneSnapshot(),
        platformService.getAnalyticsSeries(6),
      ]);

      const anyAuthedOk =
        overview.status === 'fulfilled' ||
        tenants.status === 'fulfilled' ||
        snapshotRes.status === 'fulfilled';

      if (tenants.status === 'fulfilled' && Array.isArray(tenants.value)) {
        mergeLiveTenants(tenants.value);
      }
      if (logs.status === 'fulfilled' && Array.isArray(logs.value)) {
        setLiveAuditLogs(logs.value);
      }
      if (gens.status === 'fulfilled' && Array.isArray(gens.value)) {
        setLiveGenerations(gens.value);
      }
      if (snapshotRes.status === 'fulfilled' && snapshotRes.value?.data) {
        usePlatformStore.getState().hydrateControlPlaneSnapshot?.(snapshotRes.value.data);
      }
      if (seriesRes.status === 'fulfilled' && Array.isArray(seriesRes.value?.data?.points)) {
        setRevenueSeries(seriesRes.value.data.points);
      }
      setBackendTelemetry({
        overview: overview.status === 'fulfilled' ? overview.value : null,
        aiMetrics: aiMetrics.status === 'fulfilled' ? aiMetrics.value : null,
      });

      setLiveStatus(anyAuthedOk, healthCheck.health, healthCheck.latencyMs);
      return anyAuthedOk;
    } catch {
      setLiveStatus(false, healthCheck.health, healthCheck.latencyMs);
      return false;
    }
  }, [
    mergeLiveTenants,
    setBackendTelemetry,
    setLiveAuditLogs,
    setLiveGenerations,
    setLiveStatus,
    setRevenueSeries,
  ]);

  useEffect(() => {
    syncNow();
  }, [syncNow]);

  return { syncNow };
}

