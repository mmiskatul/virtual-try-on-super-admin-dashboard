import { PlatformModule } from '../types';

export interface AdminNavItem {
  label: string;
  href: string;
  module: PlatformModule;
  badgeKey?: 'pendingTenants' | 'failedJobs' | 'openTickets' | 'moderationQueue' | 'securityAlerts';
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
    label: 'PLATFORM OVERVIEW',
    icon: 'LayoutDashboard',
    items: [
      { label: 'Executive Dashboard', href: '/admin', module: 'overview' },
      { label: 'Platform Overview', href: '/admin/overview', module: 'overview' },
      { label: 'Executive Reports', href: '/admin/reports', module: 'analytics' },
      { label: 'Business Analytics', href: '/admin/analytics', module: 'analytics' },
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
      { label: 'User Roles', href: '/admin/users/roles', module: 'users' },
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
      { label: 'Create Plan', href: '/admin/plans/create', module: 'subscriptions' },
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
      { label: 'Payments', href: '/admin/finance/payments', module: 'finance' },
      { label: 'Transactions', href: '/admin/finance/transactions', module: 'finance' },
      { label: 'Invoices', href: '/admin/finance/invoices', module: 'finance' },
      { label: 'Refunds', href: '/admin/finance/refunds', module: 'finance' },
      { label: 'Failed Payments', href: '/admin/finance/failed-payments', module: 'finance' },
      { label: 'Reconciliation', href: '/admin/finance/reconciliation', module: 'finance' },
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
      { label: 'AI Usage & Costs', href: '/admin/ai/usage', module: 'ai' },
      { label: 'Cost Analytics', href: '/admin/ai/costs', module: 'ai' },
      { label: 'Model Performance', href: '/admin/ai/performance', module: 'ai' },
      { label: 'Credit Ledger', href: '/admin/ai/credits', module: 'ai' },
      { label: 'Try-On Operations', href: '/admin/try-on', module: 'tryon' },
      { label: 'Generation Jobs', href: '/admin/try-on/jobs', module: 'tryon' },
      { label: 'Generation Queue', href: '/admin/try-on/queue', module: 'tryon' },
      { label: 'Failed Generations', href: '/admin/try-on/failed', module: 'tryon', badgeKey: 'failedJobs' },
      { label: 'Try-On Analytics', href: '/admin/try-on/analytics', module: 'tryon' },
      { label: 'AI Quality Metrics', href: '/admin/try-on/quality', module: 'tryon' },
      { label: 'Try-On Policies', href: '/admin/try-on/policies', module: 'tryon' },
    ],
  },
  {
    id: 'marketplace',
    label: 'MARKETPLACE MODERATION',
    icon: 'Globe',
    items: [
      { label: 'Marketplace Overview', href: '/admin/marketplace', module: 'marketplace' },
      { label: 'Product Moderation', href: '/admin/marketplace/products', module: 'marketplace', badgeKey: 'moderationQueue' },
      { label: 'Brand Moderation', href: '/admin/marketplace/brands', module: 'marketplace' },
      { label: 'Categories', href: '/admin/marketplace/categories', module: 'marketplace' },
      { label: 'Collections', href: '/admin/marketplace/collections', module: 'marketplace' },
      { label: 'Featured Placement', href: '/admin/marketplace/featured', module: 'marketplace' },
      { label: 'Moderation Reports', href: '/admin/marketplace/reports', module: 'marketplace' },
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
      { label: 'Media Library', href: '/admin/cms/media', module: 'cms' },
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
      { label: 'Knowledge Base', href: '/admin/support/knowledge-base', module: 'support' },
    ],
  },
  {
    id: 'communications',
    label: 'COMMUNICATIONS & GROWTH',
    icon: 'Megaphone',
    items: [
      { label: 'Comms Center', href: '/admin/communications', module: 'communications' },
      { label: 'Announcements', href: '/admin/communications/announcements', module: 'communications' },
      { label: 'Email Management', href: '/admin/communications/email', module: 'communications' },
      { label: 'Templates', href: '/admin/communications/templates', module: 'communications' },
      { label: 'Notification Feed', href: '/admin/communications/notifications', module: 'communications' },
      { label: 'Platform Marketing', href: '/admin/marketing', module: 'marketing' },
      { label: 'Campaigns', href: '/admin/marketing/campaigns', module: 'marketing' },
      { label: 'Referrals', href: '/admin/marketing/referrals', module: 'marketing' },
      { label: 'Affiliates', href: '/admin/marketing/affiliates', module: 'marketing' },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM OPERATIONS',
    icon: 'Activity',
    items: [
      { label: 'System Monitoring', href: '/admin/system', module: 'system' },
      { label: 'System Health', href: '/admin/system/health', module: 'system' },
      { label: 'Services Status', href: '/admin/system/services', module: 'system' },
      { label: 'Queue Monitoring', href: '/admin/system/queues', module: 'system' },
      { label: 'Background Jobs', href: '/admin/system/jobs', module: 'system' },
      { label: 'Application Logs', href: '/admin/system/logs', module: 'system' },
      { label: 'Storage Monitoring', href: '/admin/system/storage', module: 'system' },
      { label: 'Backups & Recovery', href: '/admin/system/backups', module: 'system' },
    ],
  },
  {
    id: 'security',
    label: 'SECURITY & GOVERNANCE',
    icon: 'ShieldAlert',
    items: [
      { label: 'Security Overview', href: '/admin/security', module: 'security' },
      { label: 'Security Events', href: '/admin/security/events', module: 'security', badgeKey: 'securityAlerts' },
      { label: 'Active Sessions', href: '/admin/security/sessions', module: 'security' },
      { label: 'Immutable Audit Logs', href: '/admin/security/audit', module: 'security' },
      { label: 'Access Policies', href: '/admin/security/policies', module: 'security' },
      { label: 'Data Governance', href: '/admin/governance', module: 'governance' },
      { label: 'Privacy Requests', href: '/admin/governance/requests', module: 'governance' },
      { label: 'Retention Policies', href: '/admin/governance/retention', module: 'governance' },
      { label: 'Data Exports', href: '/admin/governance/exports', module: 'governance' },
    ],
  },
  {
    id: 'integrations',
    label: 'INTEGRATIONS',
    icon: 'Plug',
    items: [
      { label: 'Integrations Hub', href: '/admin/integrations', module: 'integrations' },
      { label: 'Payment Providers', href: '/admin/integrations/payments', module: 'integrations' },
      { label: 'AI Providers', href: '/admin/integrations/ai', module: 'integrations' },
      { label: 'Email / SMTP', href: '/admin/integrations/email', module: 'integrations' },
      { label: 'Storage & CDN', href: '/admin/integrations/storage', module: 'integrations' },
      { label: 'Webhooks', href: '/admin/integrations/webhooks', module: 'integrations' },
    ],
  },
  {
    id: 'settings',
    label: 'CONFIG & ANALYTICS',
    icon: 'Settings',
    items: [
      { label: 'Feature Flags', href: '/admin/features', module: 'configuration' },
      { label: 'Platform Config', href: '/admin/configuration', module: 'configuration' },
      { label: 'General Config', href: '/admin/configuration/general', module: 'configuration' },
      { label: 'Marketplace Policy', href: '/admin/configuration/marketplace', module: 'configuration' },
      { label: 'AI Configuration', href: '/admin/configuration/ai', module: 'configuration' },
      { label: 'Upload Restrictions', href: '/admin/configuration/uploads', module: 'configuration' },
      { label: 'Revenue Reports', href: '/admin/analytics/revenue', module: 'analytics' },
      { label: 'Tenant Analytics', href: '/admin/analytics/tenants', module: 'analytics' },
      { label: 'Subscription Analytics', href: '/admin/analytics/subscriptions', module: 'analytics' },
      { label: 'AI Cost Reports', href: '/admin/analytics/ai', module: 'analytics' },
      { label: 'Marketplace Analytics', href: '/admin/analytics/marketplace', module: 'analytics' },
      { label: 'Customer Analytics', href: '/admin/analytics/customers', module: 'analytics' },
      { label: 'Platform Metrics', href: '/admin/analytics/platform', module: 'analytics' },
    ],
  },
];

