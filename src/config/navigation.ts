import { PlatformModule } from '../types';

export interface AdminNavItem {
  label: string;
  href: string;
  module: PlatformModule;
  badgeKey?: 'pendingTenants' | 'failedJobs' | 'openTickets' | 'moderationQueue';
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon:
    | 'LayoutDashboard'
    | 'Building2'
    | 'Users'
    | 'CreditCard'
    | 'DollarSign'
    | 'Cpu'
    | 'Globe'
    | 'FileText'
    | 'LifeBuoy'
    | 'Megaphone'
    | 'Activity'
    | 'ShieldAlert'
    | 'Plug'
    | 'Settings';
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'OVERVIEW',
    icon: 'LayoutDashboard',
    items: [
      { label: 'Executive Dashboard', href: '/admin', module: 'overview' },
    ],
  },
  {
    id: 'tenants',
    label: 'TENANT MANAGEMENT',
    icon: 'Building2',
    items: [
      { label: 'All Tenants', href: '/admin/tenants', module: 'tenants', badgeKey: 'pendingTenants' },
      { label: 'Create Tenant', href: '/admin/tenants/create', module: 'tenants' },
    ],
  },
  {
    id: 'users',
    label: 'USERS & PLATFORM STAFF',
    icon: 'Users',
    items: [
      { label: 'All Users', href: '/admin/users', module: 'users' },
      { label: 'Pending Invitations', href: '/admin/users/invitations', module: 'users' },
      { label: 'Platform Staff', href: '/admin/staff', module: 'staff' },
      { label: 'Staff Roles', href: '/admin/staff/roles', module: 'staff' },
      { label: 'Permissions Matrix', href: '/admin/staff/permissions', module: 'staff' },
    ],
  },
  {
    id: 'subscriptions',
    label: 'SUBSCRIPTIONS & PLANS',
    icon: 'CreditCard',
    items: [
      { label: 'All Subscriptions', href: '/admin/subscriptions', module: 'subscriptions' },
      { label: 'Subscription Plans', href: '/admin/plans', module: 'subscriptions' },
      { label: 'Free Trials', href: '/admin/subscriptions/trials', module: 'subscriptions' },
      { label: 'Subscription History', href: '/admin/subscriptions/history', module: 'subscriptions' },
    ],
  },
  {
    id: 'finance',
    label: 'BILLING & FINANCE',
    icon: 'DollarSign',
    items: [
      { label: 'Financial Overview', href: '/admin/finance', module: 'finance' },
      { label: 'Transactions', href: '/admin/finance/transactions', module: 'finance' },
      { label: 'Invoices', href: '/admin/finance/invoices', module: 'finance' },
      { label: 'Refunds', href: '/admin/finance/refunds', module: 'finance' },
      { label: 'Failed Payments', href: '/admin/finance/failed-payments', module: 'finance' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & VIRTUAL TRY-ON',
    icon: 'Cpu',
    items: [
      { label: 'AI Overview', href: '/admin/ai', module: 'ai' },
      { label: 'AI Providers', href: '/admin/ai/providers', module: 'ai' },
      { label: 'Model Registry', href: '/admin/ai/models', module: 'ai' },
      { label: 'Routing & Config', href: '/admin/ai/configuration', module: 'ai' },
      { label: 'Cost Analytics', href: '/admin/ai/costs', module: 'ai' },
      { label: 'Generation Jobs', href: '/admin/try-on/jobs', module: 'tryon' },
      { label: 'Generation Queue', href: '/admin/try-on/queue', module: 'tryon' },
      { label: 'Failed Generations', href: '/admin/try-on/failed', module: 'tryon', badgeKey: 'failedJobs' },
      { label: 'AI Quality Metrics', href: '/admin/try-on/quality', module: 'tryon' },
    ],
  },
  {
    id: 'marketplace',
    label: 'MARKETPLACE MODERATION',
    icon: 'Globe',
    items: [
      { label: 'Marketplace Overview', href: '/admin/marketplace', module: 'marketplace' },
      { label: 'Product Moderation', href: '/admin/marketplace/products', module: 'marketplace', badgeKey: 'moderationQueue' },
      { label: 'Featured Placement', href: '/admin/marketplace/featured', module: 'marketplace' },
    ],
  },
  {
    id: 'cms',
    label: 'CONTENT MANAGEMENT',
    icon: 'FileText',
    items: [
      { label: 'CMS Dashboard', href: '/admin/cms', module: 'cms' },
      { label: 'Homepage Builder', href: '/admin/cms/homepage', module: 'cms' },
      { label: 'Static Pages', href: '/admin/cms/pages', module: 'cms' },
      { label: 'Banners', href: '/admin/cms/banners', module: 'cms' },
      { label: 'Blog & Articles', href: '/admin/cms/blog', module: 'cms' },
    ],
  },
  {
    id: 'support',
    label: 'SUPPORT CENTER',
    icon: 'LifeBuoy',
    items: [
      { label: 'Support Overview', href: '/admin/support', module: 'support' },
      { label: 'All Tickets', href: '/admin/support/tickets', module: 'support', badgeKey: 'openTickets' },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM OPERATIONS',
    icon: 'Activity',
    items: [
      { label: 'System Health', href: '/admin/system/health', module: 'system' },
    ],
  },
  {
    id: 'security',
    label: 'SECURITY & GOVERNANCE',
    icon: 'ShieldAlert',
    items: [
      { label: 'Immutable Audit Logs', href: '/admin/security/audit', module: 'security' },
      { label: 'Privacy Requests', href: '/admin/governance/requests', module: 'governance' },
    ],
  },
  {
    id: 'integrations',
    label: 'INTEGRATIONS',
    icon: 'Plug',
    items: [
      { label: 'Integrations Hub', href: '/admin/integrations', module: 'integrations' },
      { label: 'Email (Resend)', href: '/admin/integrations/email', module: 'integrations' },
      { label: 'Webhooks', href: '/admin/integrations/webhooks', module: 'integrations' },
    ],
  },
  {
    id: 'settings',
    label: 'CONFIGURATION',
    icon: 'Settings',
    items: [
      { label: 'Feature Flags', href: '/admin/features', module: 'configuration' },
      { label: 'Platform Config', href: '/admin/configuration', module: 'configuration' },
    ],
  },
];

