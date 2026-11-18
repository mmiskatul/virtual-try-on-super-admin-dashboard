import { PlatformAction, PlatformModule } from '../types';

/**
 * Dashboard permissions are NOT defined here. The backend owns roles and permissions
 * (Virtual-Try-On-Backend/src/modules/rbac/rbac.catalog.ts) and enforces them on every route. After sign-in the
 * dashboard loads the signed-in admin's real permission set (GET /api/v1/auth/rbac/me) and this file only answers
 * "which backend permission does this screen or button need?" so the UI can hide what the backend would refuse.
 *
 * Hiding a button is a convenience, never a security control.
 */

/** Backend permission keys that unlock a (module, action) in the dashboard. Any one of them is enough. */
type Needs = string[] | 'EVERYONE';

const SUPER = '*:*';

/** Actions that only read data. Everything else is treated as a change. */
const READ_ACTIONS: PlatformAction[] = ['view', 'export'];

const NEEDS: Partial<Record<PlatformModule, { read: Needs; write: Record<string, Needs>; fallbackWrite: Needs }>> = {
  overview: { read: 'EVERYONE', write: {}, fallbackWrite: [SUPER] },
  analytics: { read: ['tenants:read', 'billing:read', 'ai:read'], write: {}, fallbackWrite: [SUPER] },
  tenants: {
    read: ['tenants:read'],
    write: {
      create: ['tenants:write'],
      edit: ['tenants:write'],
      suspend: ['tenants:suspend'],
      approve: ['tenants:suspend'],
      delete: ['tenants:suspend'],
      view_as: ['tenants:view_as'],
    },
    fallbackWrite: ['tenants:write'],
  },
  users: {
    read: ['users:read'],
    write: { suspend: ['users:suspend'], manage_users: ['staff:manage'], edit: ['users:write'], create: ['users:write'] },
    fallbackWrite: ['users:write'],
  },
  staff: { read: ['staff:manage'], write: {}, fallbackWrite: ['staff:manage'] },
  subscriptions: { read: ['plans:read', 'billing:read'], write: {}, fallbackWrite: ['billing:write'] },
  finance: {
    read: ['billing:read'],
    write: { refund: ['billing:refund'], approve: ['billing:refund'] },
    fallbackWrite: ['billing:write'],
  },
  ai: { read: ['ai:read'], write: {}, fallbackWrite: ['ai:manage'] },
  tryon: { read: ['ai:read'], write: {}, fallbackWrite: ['ai:manage'] },
  marketplace: { read: ['moderation:read'], write: {}, fallbackWrite: ['moderation:action'] },
  cms: { read: ['cms:manage'], write: {}, fallbackWrite: ['cms:manage'] },
  support: { read: ['support:read'], write: {}, fallbackWrite: ['support:manage'] },
  // Infrastructure (database, email, AI keys) is Super Admin only on the backend.
  system: { read: ['security:manage'], write: {}, fallbackWrite: [SUPER] },
  integrations: { read: ['security:manage'], write: {}, fallbackWrite: ['security:manage'] },
  configuration: { read: ['security:manage'], write: {}, fallbackWrite: ['security:manage'] },
  security: { read: ['audit:read', 'security:manage'], write: {}, fallbackWrite: ['security:manage'] },
  governance: { read: ['security:manage'], write: {}, fallbackWrite: ['security:manage'] },
};

export interface RbacState {
  /** false until the backend has answered, or when it is unreachable */
  loaded: boolean;
  role: string;
  roleCodes: string[];
  permissions: string[];
}

export const EMPTY_RBAC: RbacState = { loaded: false, role: '', roleCodes: [], permissions: [] };

/** Same wildcard rules as the backend's hasPermission(): "*:*", exact match, or "module:*". */
export function hasBackendPermission(permissions: string[], key: string): boolean {
  if (permissions.includes(SUPER) || permissions.includes(key)) return true;
  const [mod] = key.split(':');
  return Boolean(mod) && permissions.includes(`${mod}:*`);
}

export function canPerform(
  rbac: RbacState,
  module: PlatformModule,
  action: PlatformAction | 'view_as'
): boolean {
  const rule = NEEDS[module];
  const isRead = (READ_ACTIONS as string[]).includes(action);

  // Before the permission set is known, show read-only screens (the backend still enforces) and hide changes.
  if (!rbac.loaded) return isRead;

  // Modules we have no rule for stay Super Admin only rather than open to everyone.
  if (!rule) return hasBackendPermission(rbac.permissions, SUPER);

  const needs: Needs = isRead ? rule.read : rule.write[action] ?? rule.fallbackWrite;
  if (needs === 'EVERYONE') return true;
  return needs.some((key) => hasBackendPermission(rbac.permissions, key));
}

/** "PLATFORM_OPERATIONS_ADMIN" -> "Platform Operations Admin" */
export function formatRoleLabel(code: string): string {
  if (!code) return 'Unknown role';
  return code
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
