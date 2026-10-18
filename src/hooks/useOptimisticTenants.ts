'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantItem } from '../types';
import { useTenantStore } from '../stores/useTenantStore';
import { revalidateAdminTenants } from '../app/actions/revalidate';

export function useOptimisticTenants(onToast: (msg: string) => void) {
  const queryClient = useQueryClient();
  const toggleStatusStore = useTenantStore((s) => s.toggleTenantStatus);
  const tenants = useTenantStore((s) => s.items);

  // Optimistic Mutation: Toggle Tenant Suspension
  const toggleTenantMutation = useMutation({
    mutationFn: async ({ tenantId }: { tenantId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { tenantId, success: true };
    },
    onMutate: async ({ tenantId }) => {
      // Cancel outgoing queries to prevent overwriting
      await queryClient.cancelQueries({ queryKey: ['admin-tenants'] });

      const previousTenants = queryClient.getQueryData<TenantItem[]>(['admin-tenants']) || tenants;

      // Update state optimistically and immediately (0ms)
      toggleStatusStore(tenantId);

      queryClient.setQueryData<TenantItem[]>(['admin-tenants'], (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === tenantId
            ? { ...t, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
            : t
        );
      });

      onToast(`Optimistically updated governance status for tenant ${tenantId}.`);

      return { previousTenants };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTenants) {
        queryClient.setQueryData(['admin-tenants'], context.previousTenants);
      }
      onToast('Governance sync failed! Reverting status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      revalidateAdminTenants('admin-tenants').catch(() => {});
    },
  });

  return {
    optimisticToggleTenant: (tenantId: string) => toggleTenantMutation.mutate({ tenantId }),
    isSyncing: toggleTenantMutation.isPending,
  };
}
