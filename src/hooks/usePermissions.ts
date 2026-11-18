'use client';

import { useCallback } from 'react';
import { usePlatformStore } from '../stores/usePlatformStore';
import { canPerform, formatRoleLabel } from '../config/permissions';
import type { PlatformAction, PlatformModule } from '../types';

/**
 * The signed-in admin's real permissions, as loaded from the backend.
 * `can(module, action)` is used to hide screens and buttons the backend would refuse anyway.
 */
export function usePermissions() {
  const rbac = usePlatformStore((s) => s.rbac);
  const can = useCallback(
    (module: PlatformModule, action: PlatformAction | 'view_as') => canPerform(rbac, module, action),
    [rbac]
  );
  return { can, rbac, role: rbac.role, roleLabel: formatRoleLabel(rbac.role) };
}
