import type {
  DataGovernanceRequest,
  ModerationProductItem,
  PaymentTransaction,
  SupportTicketRecord,
  TenantRecord,
  TryOnJobRecord,
} from '../types';

/**
 * "Needs attention" items computed from the live store data. Nothing here is stored or invented: when the
 * underlying records are fine, the list is empty.
 */
export interface DerivedAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  details: string;
  href: string;
}

export interface AlertSources {
  tenants: TenantRecord[];
  tryOnJobs: TryOnJobRecord[];
  tickets: SupportTicketRecord[];
  modProducts: ModerationProductItem[];
  dataRequests: DataGovernanceRequest[];
  transactions: PaymentTransaction[];
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function deriveAlerts(src: AlertSources): DerivedAlert[] {
  const out: DerivedAlert[] = [];

  const nearQuota = src.tenants.filter((t) => t.tryOnQuota > 0 && t.tryOnUsed / t.tryOnQuota >= 0.9);
  if (nearQuota.length) {
    const worst = [...nearQuota].sort((a, b) => b.tryOnUsed / b.tryOnQuota - a.tryOnUsed / a.tryOnQuota)[0];
    out.push({
      id: 'quota',
      severity: nearQuota.some((t) => t.tryOnUsed >= t.tryOnQuota) ? 'CRITICAL' : 'WARNING',
      title: `${plural(nearQuota.length, 'tenant')} at 90%+ of monthly AI quota`,
      details: `${worst.name} has used ${worst.tryOnUsed.toLocaleString('en-US')} of ${worst.tryOnQuota.toLocaleString('en-US')} credits.`,
      href: '/admin/tenants',
    });
  }

  const failedJobs = src.tryOnJobs.filter((j) => j.status === 'FAILED').length;
  if (failedJobs) {
    out.push({
      id: 'failed-jobs',
      severity: 'WARNING',
      title: `${plural(failedJobs, 'failed try-on generation')}`,
      details: 'Review the failure reasons and retry or contact the tenant.',
      href: '/admin/try-on/failed',
    });
  }

  const failedPayments = src.transactions.filter((t) => t.status === 'FAILED').length;
  if (failedPayments) {
    out.push({
      id: 'failed-payments',
      severity: 'CRITICAL',
      title: `${plural(failedPayments, 'failed payment')}`,
      details: 'Tenant billing could not be collected.',
      href: '/admin/finance/failed-payments',
    });
  }

  const urgentTickets = src.tickets.filter(
    (t) => ['CRITICAL', 'HIGH'].includes(t.priority) && !['RESOLVED', 'CLOSED'].includes(t.status)
  ).length;
  if (urgentTickets) {
    out.push({
      id: 'urgent-tickets',
      severity: 'WARNING',
      title: `${plural(urgentTickets, 'high-priority support ticket')} open`,
      details: 'Critical and high-priority tickets that are not yet resolved.',
      href: '/admin/support/tickets',
    });
  }

  const pendingProducts = src.modProducts.filter((p) => p.moderationStatus === 'PENDING_REVIEW').length;
  if (pendingProducts) {
    out.push({
      id: 'moderation',
      severity: 'INFO',
      title: `${plural(pendingProducts, 'product')} awaiting moderation`,
      details: 'New marketplace listings need an approve / flag / reject decision.',
      href: '/admin/marketplace/products',
    });
  }

  const pendingPrivacy = src.dataRequests.filter((r) => r.status === 'PENDING_REVIEW').length;
  if (pendingPrivacy) {
    out.push({
      id: 'privacy',
      severity: 'WARNING',
      title: `${plural(pendingPrivacy, 'privacy request')} pending review`,
      details: 'Data export and deletion requests have a retention deadline.',
      href: '/admin/governance/requests',
    });
  }

  const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
