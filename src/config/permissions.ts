import { PlatformAction, PlatformModule, PlatformRole } from '../types';

export const ALL_PLATFORM_MODULES: PlatformModule[] = [
  'overview',
  'tenants',
  'users',
  'staff',
  'subscriptions',
  'finance',
  'ai',
  'tryon',
  'marketplace',
  'cms',
  'support',
  'communications',
  'marketing',
  'system',
  'security',
  'governance',
  'integrations',
  'configuration',
  'analytics',
];

export const ALL_PLATFORM_ACTIONS: PlatformAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'suspend',
  'publish',
  'refund',
  'export',
  'configure',
  'manage_users',
];

export const ROLE_METADATA: Record<
  string,
  { label: string; summary: string; mfaRequired: boolean }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    summary: 'Full authorized platform control across operations, billing, AI, security, and governance.',
    mfaRequired: true,
  },
  PLATFORM_OWNER: {
    label: 'Platform Owner',
    summary: 'Highest governance tier including destructive approvals and executive configuration.',
    mfaRequired: true,
  },
  OPERATIONS_MANAGER: {
    label: 'Operations Manager',
    summary: 'Manages tenant lifecycle, system monitoring, background queues, and incidents.',
    mfaRequired: true,
  },
  FINANCE_MANAGER: {
    label: 'Finance Manager',
    summary: 'Controls subscriptions, invoices, refunds, and financial reconciliation.',
    mfaRequired: true,
  },
  SUPPORT_MANAGER: {
    label: 'Support Manager',
    summary: 'Manages support escalations, KB, and controlled read-only tenant view-as access.',
    mfaRequired: true,
  },
  SUPPORT_AGENT: {
    label: 'Support Agent',
    summary: 'Handles assigned support tickets with restricted tenant context.',
    mfaRequired: false,
  },
  MARKETPLACE_MODERATOR: {
    label: 'Marketplace Moderator',
    summary: 'Reviews product listings, brand verification, collections, and policy reports.',
    mfaRequired: false,
  },
  AI_OPS_ENGINEER: {
    label: 'AI Operations Engineer',
    summary: 'Configures AI providers, model routing, generation queues, and credit costs.',
    mfaRequired: true,
  },
  SECURITY_ADMIN: {
    label: 'Security Administrator',
    summary: 'Monitors security events, active sessions, audit logs, and data governance.',
    mfaRequired: true,
  },
  ANALYST: {
    label: 'Business Analyst',
    summary: 'Read-only access to approved analytics and platform-wide reports.',
    mfaRequired: false,
  },
};

export const DEFAULT_ADMIN_PERMISSIONS: Record<
  string,
  Partial<Record<PlatformModule, PlatformAction[]>>
> = {
  SUPER_ADMIN: Object.fromEntries(ALL_PLATFORM_MODULES.map((m) => [m, ALL_PLATFORM_ACTIONS])),
  PLATFORM_OWNER: Object.fromEntries(ALL_PLATFORM_MODULES.map((m) => [m, ALL_PLATFORM_ACTIONS])),
  OPERATIONS_MANAGER: {
    overview: ['view', 'export'],
    tenants: ['view', 'create', 'edit', 'approve', 'suspend', 'export'],
    users: ['view'],
    system: ['view', 'configure', 'export'],
    analytics: ['view', 'export'],
    support: ['view', 'edit'],
  },
  FINANCE_MANAGER: {
    overview: ['view'],
    tenants: ['view'],
    subscriptions: ['view', 'create', 'edit', 'configure', 'export'],
    finance: ['view', 'approve', 'refund', 'export', 'configure'],
    analytics: ['view', 'export'],
  },
  SUPPORT_MANAGER: {
    overview: ['view'],
    tenants: ['view', 'edit'],
    users: ['view', 'edit'],
    support: ['view', 'create', 'edit', 'approve', 'export'],
    communications: ['view', 'create', 'publish'],
    cms: ['view', 'edit'],
  },
  SUPPORT_AGENT: {
    overview: ['view'],
    tenants: ['view'],
    users: ['view'],
    support: ['view', 'edit'],
  },
  MARKETPLACE_MODERATOR: {
    overview: ['view'],
    tenants: ['view'],
    marketplace: ['view', 'approve', 'suspend', 'publish', 'edit'],
    cms: ['view', 'edit', 'publish'],
    analytics: ['view'],
  },
  AI_OPS_ENGINEER: {
    overview: ['view'],
    ai: ['view', 'create', 'edit', 'configure', 'export'],
    tryon: ['view', 'edit', 'configure', 'export'],
    system: ['view', 'configure'],
    integrations: ['view', 'configure'],
    analytics: ['view', 'export'],
  },
  SECURITY_ADMIN: {
    overview: ['view'],
    users: ['view', 'suspend', 'manage_users'],
    staff: ['view', 'edit', 'manage_users'],
    security: ['view', 'approve', 'suspend', 'configure', 'export'],
    governance: ['view', 'approve', 'export', 'configure'],
    configuration: ['view', 'configure'],
    system: ['view'],
  },
  ANALYST: {
    overview: ['view', 'export'],
    tenants: ['view', 'export'],
    subscriptions: ['view', 'export'],
    finance: ['view', 'export'],
    ai: ['view', 'export'],
    tryon: ['view', 'export'],
    marketplace: ['view', 'export'],
    analytics: ['view', 'export'],
  },
};

export const TWO_PERSON_APPROVAL_ACTIONS = [
  'TENANT_PERMANENT_DELETE',
  'FINANCIAL_REFUND_OVER_500',
  'GLOBAL_MAINTENANCE_MODE',
  'PRODUCTION_DATABASE_RESTORE',
  'SUPER_ADMIN_ROLE_ESCALATION',
];

export function canAdminPerform(
  role: PlatformRole,
  module: PlatformModule,
  action: PlatformAction,
  overrides?: Record<string, Partial<Record<PlatformModule, PlatformAction[]>>>
): boolean {
  const custom = overrides?.[role]?.[module];
  if (custom) return custom.includes(action);
  const base = DEFAULT_ADMIN_PERMISSIONS[role]?.[module] || [];
  return base.includes(action);
}

