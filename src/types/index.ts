export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  owner: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  productsCount: number;
  ordersCount: number;
  gmv: number;
  tryOnUsed: number;
  tryOnQuota: number;
  joinedDate: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

export type AdminTab = 'overview' | 'tenants' | 'ai' | 'infrastructure' | 'subscriptions' | 'audit';
