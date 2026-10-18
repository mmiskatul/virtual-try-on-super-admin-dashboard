'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { ToastNotification } from '../components/ui/ToastNotification';
import { PlatformOverview } from '../components/modules/PlatformOverview';
import { TenantGovernance } from '../components/modules/TenantGovernance';
import { AiInfrastructure } from '../components/modules/AiInfrastructure';
import { SubscriptionQuotas } from '../components/modules/SubscriptionQuotas';
import { AuditTrail } from '../components/modules/AuditTrail';
import { TenantOnboardingModal } from '../components/ui/TenantOnboardingModal';

import { useTenantStore } from '../stores/useTenantStore';
import { useAuditStore } from '../stores/useAuditStore';
import { useAdminUiStore } from '../stores/useAdminUiStore';
import { superAdminApi } from '../lib/api';
import { TenantItem } from '../types';
import { useOptimisticTenants } from '../hooks/useOptimisticTenants';

export default function SuperAdminDashboardPage() {
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);

  // Zustand Client State
  const tenants = useTenantStore((state) => state.items);
  const setTenants = useTenantStore((state) => state.setTenants);
  const toggleTenantStatus = useTenantStore((state) => state.toggleTenantStatus);

  const auditLogs = useAuditStore((state) => state.logs);
  const setAuditLogs = useAuditStore((state) => state.setLogs);
  const addAuditLog = useAuditStore((state) => state.addAuditLog);

  const { activeTab, toastMessage, setActiveTab, showToast, hideToast } = useAdminUiStore();

  // Server State via TanStack Query (queries super-admin-api)
  const { refetch: refetchTenants } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      try {
        const liveTenants = await superAdminApi.getTenants();
        if (Array.isArray(liveTenants) && liveTenants.length > 0) {
          setTenants(liveTenants);
        }
        return liveTenants;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false
  });

  const { refetch: refetchAuditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      try {
        const liveLogs = await superAdminApi.getAuditLogs();
        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          setAuditLogs(liveLogs);
        }
        return liveLogs;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false
  });

  const triggerToast = (msg: string) => {
    showToast(msg);
    setTimeout(() => {
      hideToast();
    }, 3000);
  };

  // TanStack Query Optimistic UI Mutation with Background Sync
  const { optimisticToggleTenant, isSyncing } = useOptimisticTenants(triggerToast);

  const handleRefresh = async () => {
    triggerToast('Synchronizing platform telemetry with database...');
    await Promise.allSettled([refetchTenants(), refetchAuditLogs()]);
    triggerToast('Platform governance cache synchronized.');
  };

  const handleToggleTenantStatus = (tenantId: string) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;

    const nextStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    optimisticToggleTenant(tenantId);

    addAuditLog({
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      action: nextStatus === 'SUSPENDED' ? 'TENANT_SUSPENDED' : 'TENANT_REACTIVATED',
      actor: 'admin@vton-platform.io',
      target: target.name,
      details: `Administrative status change to ${nextStatus}`,
      timestamp: 'Just now'
    });

    triggerToast(`Tenant ${target.name} status updated to ${nextStatus}.`);
  };

  const handleAddTenant = (tenant: TenantItem) => {
    setTenants([tenant, ...tenants]);
    setIsTenantModalOpen(false);

    addAuditLog({
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      action: 'TENANT_PROVISIONED',
      actor: 'admin@vton-platform.io',
      target: tenant.name,
      details: `New brand registered under ${tenant.plan} plan (${tenant.tryOnQuota} try-on quota)`,
      timestamp: 'Just now'
    });

    triggerToast(`Brand tenant '${tenant.name}' provisioned successfully!`);
  };

  const totalGMV = tenants.reduce((s, t) => s + t.gmv, 0);
  const totalTryOnSessions = tenants.reduce((s, t) => s + t.tryOnUsed, 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <ToastNotification message={toastMessage} />

      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tenantCount={tenants.length}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <AdminHeader
          activeTab={activeTab}
          onRefresh={handleRefresh}
        />

        {activeTab === 'overview' && (
          <PlatformOverview
            tenants={tenants}
            totalGMV={totalGMV}
            totalTryOnSessions={totalTryOnSessions}
          />
        )}

        {activeTab === 'tenants' && (
          <TenantGovernance
            tenants={tenants}
            onToggleStatus={handleToggleTenantStatus}
            onOpenAddTenant={() => setIsTenantModalOpen(true)}
          />
        )}

        {activeTab === 'ai' && <AiInfrastructure />}

        {activeTab === 'subscriptions' && <SubscriptionQuotas />}

        {activeTab === 'audit' && <AuditTrail logs={auditLogs} />}
      </main>

      <TenantOnboardingModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onAddTenant={handleAddTenant}
      />
    </div>
  );
}
