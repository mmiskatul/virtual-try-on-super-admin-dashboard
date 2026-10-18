import { TenantItem, AuditLog } from '../types';

export const INITIAL_TENANTS: TenantItem[] = [
  {
    id: 'tenant_aura',
    name: 'Aura Atelier',
    slug: 'aura-atelier',
    owner: 'Elena Rostova',
    email: 'elena@auraatelier.com',
    status: 'ACTIVE',
    plan: 'PRO',
    productsCount: 3,
    ordersCount: 24,
    gmv: 5880,
    tryOnUsed: 124,
    tryOnQuota: 1000,
    joinedDate: 'Oct 01, 2026'
  },
  {
    id: 'tenant_vogue',
    name: 'Vogue Nova',
    slug: 'vogue-nova',
    owner: 'Marcus Sterling',
    email: 'marcus@voguenova.com',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    productsCount: 2,
    ordersCount: 38,
    gmv: 12160,
    tryOnUsed: 890,
    tryOnQuota: 5000,
    joinedDate: 'Sep 15, 2026'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-902',
    action: 'SYSTEM_BOOTSTRAP',
    actor: 'admin@vton-platform.io',
    target: 'PLATFORM_CORE',
    details: 'Fastify v5 core microservices & VITON-HD pipeline mounted',
    timestamp: 'Today, 10:14 AM'
  },
  {
    id: 'AUD-884',
    action: 'TENANT_ONBOARDED',
    actor: 'system_webhook',
    target: 'tenant_aura',
    details: 'Brand tenant Aura Atelier registered under PRO tier',
    timestamp: 'Yesterday'
  }
];
