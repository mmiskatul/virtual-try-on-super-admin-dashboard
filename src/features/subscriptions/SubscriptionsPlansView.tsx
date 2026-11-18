'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CreditCard,
  Layers,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { platformService } from '../../services/platformService';
import { PlanEntitlement } from '../../types';
import {
  AdminPageHeader,
  AdminPermissionGate,
  ConfirmActionDialog,
  EmptyPanel,
  MetricCard,
  SectionPanel,
  StatusPill,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';
import { usePermissions } from '../../hooks/usePermissions';

export type SubscriptionsTab = 'subscriptions' | 'plans' | 'trials' | 'history';

const ENTITLEMENT_KEYS: Array<{ key: keyof PlanEntitlement; label: string }> = [
  { key: 'marketplaceEnabled', label: 'Global Marketplace Access' },
  { key: 'virtualTryOnEnabled', label: 'Virtual Try-On Pipeline' },
  { key: 'customDomainEnabled', label: 'Custom Brand Domains' },
  { key: 'storefrontBuilder', label: 'Visual Storefront Builder' },
  { key: 'analyticsAccess', label: 'Business Analytics' },
  { key: 'apiAccess', label: 'Developer API & Webhooks' },
  { key: 'priorityGpuQueue', label: 'Priority GPU Inference' },
  { key: 'highFidelityModels', label: 'High-Fidelity 1024px Models' },
];

export function SubscriptionsPlansView({
  initialTab = 'subscriptions',
  subscriptionId,
}: {
  initialTab?: SubscriptionsTab;
  subscriptionId?: string;
}) {
  const mounted = useMounted();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const { can } = usePermissions();
  const plans = usePlatformStore((s) => s.plans);
  const subscriptions = usePlatformStore((s) => s.subscriptions);
  const extendTrial = usePlatformStore((s) => s.extendTrial);
  const cancelSubscription = usePlatformStore((s) => s.cancelSubscription);
  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<SubscriptionsTab>(initialTab);
  const [confirmSubCancel, setConfirmSubCancel] = useState<string | null>(null);

  const canConfigure = can('subscriptions', 'configure');
  const safeSubs = mounted ? subscriptions : [];
  const safePlans = mounted ? plans : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  if (subscriptionId) {
    const sub = safeSubs.find((s) => s.id === subscriptionId);
    return (
      <AdminPermissionGate module="subscriptions" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Subscription Lifecycle"
            title={sub ? `Subscription ${sub.id}` : `Subscription ${subscriptionId}`}
            actions={
              <Link href="/admin/subscriptions">
                <Button variant="outline" size="sm">Back to Subscriptions</Button>
              </Link>
            }
          />
          {!sub ? (
            <EmptyPanel title="Subscription not found" description="No billing subscription matches this identifier." />
          ) : (
            <SectionPanel title={`${sub.tenantName} — ${sub.planName}`} right={<StatusPill status={sub.status} />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400">Amount</span><p className="font-bold">৳{sub.amount} {sub.currency}/{sub.interval.toLowerCase()}</p></div>
                <div><span className="text-slate-400">Provider</span><p className="font-bold">{sub.paymentProvider}</p></div>
                <div><span className="text-slate-400">Started</span><p>{sub.startedAt}</p></div>
                <div><span className="text-slate-400">{sub.status === 'TRIALING' ? 'Trial Ends' : 'Next Renewal'}</span><p>{sub.status === 'TRIALING' ? sub.trialEndsAt || '—' : sub.renewalDate}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canConfigure || sub.status === 'CANCELLED'}
                  onClick={async () => {
                    if (await extendTrial(sub.tenantId, 14)) notify('Trial extended by 14 days.');
                  }}
                >
                  {sub.status === 'TRIALING' ? 'Extend Trial +14d' : 'Start 14-Day Trial'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!canConfigure || sub.status === 'CANCELLED'}
                  onClick={() => setConfirmSubCancel(sub.id)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </SectionPanel>
          )}
          <ConfirmActionDialog
            open={Boolean(confirmSubCancel)}
            title="Cancel Tenant Subscription?"
            description="Marks the subscription CANCELLED immediately. The reason is recorded in the audit log."
            requireReason
            confirmLabel="Confirm Cancellation"
            onConfirm={async (reason) => {
              const target = safeSubs.find((x) => x.id === confirmSubCancel);
              setConfirmSubCancel(null);
              if (target && (await cancelSubscription(target.tenantId, reason))) {
                notify('Subscription marked CANCELLED.');
              }
            }}
            onCancel={() => setConfirmSubCancel(null)}
          />
        </div>
      </AdminPermissionGate>
    );
  }

  const visibleSubs =
    tab === 'trials'
      ? safeSubs.filter((s) => s.status === 'TRIALING')
      : tab === 'history'
      ? safeSubs
      : safeSubs;

  const activeMrr = safeSubs.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + s.amount, 0);

  return (
    <AdminPermissionGate module="subscriptions" action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="SaaS Monetization & Entitlements"
          title="Subscription Plans, Feature Entitlements & Trials"
          subtitle="Define structured capability entitlements instead of hardcoded tier checks across all registered tenant accounts."
        />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          {[
            ['subscriptions', 'All Subscriptions', '/admin/subscriptions'],
            ['plans', 'Entitlement Plans', '/admin/plans'],
            ['trials', 'Free Trials', '/admin/subscriptions/trials'],
            ['history', 'Billing History', '/admin/subscriptions/history'],
          ].map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as SubscriptionsTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap shrink-0 ${
                tab === id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard label="Active MRR" value={`৳${activeMrr.toLocaleString('en-US')}`} icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Configured Plans" value={safePlans.length} icon={<Layers className="w-4 h-4" />} />
          <MetricCard label="Active Trials" value={safeSubs.filter((s) => s.status === 'TRIALING').length} icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Past Due / Cancelled" value={safeSubs.filter((s) => s.status === 'PAST_DUE' || s.status === 'CANCELLED').length} icon={<CreditCard className="w-4 h-4 text-rose-600" />} />
        </div>

        {(tab === 'plans') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safePlans.map((p) => (
              <SectionPanel
                key={p.id}
                title={p.name}
                subtitle={p.description}
                right={p.recommended ? <StatusPill status="ACTIVE" /> : undefined}
              >
                <p className="text-2xl font-bold text-slate-900">
                  ৳{p.monthlyPrice}
                  <span className="text-xs font-normal text-slate-500">/mo (৳{p.annualPrice}/yr)</span>
                </p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>Max Products: <strong>{p.limits.maxProducts.toLocaleString('en-US')}</strong></p>
                  <p>Monthly AI Credits: <strong>{p.limits.monthlyAiCredits.toLocaleString('en-US')}</strong></p>
                  <p>Team Seats: <strong>{p.limits.maxTeamSeats}</strong> • Trial: <strong>{p.trialDays}d</strong></p>
                </div>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-xs">
                  {ENTITLEMENT_KEYS.slice(0, 6).map((ek) => (
                    <div key={ek.key} className="flex items-center justify-between gap-1">
                      <span className="truncate text-slate-500">{ek.label.split(' ')[0]}</span>
                      <StatusPill status={p.entitlements[ek.key]} />
                    </div>
                  ))}
                </div>
              </SectionPanel>
            ))}
          </div>
        )}

        {(tab === 'subscriptions' || tab === 'trials' || tab === 'history') && (
          <SectionPanel title={tab === 'trials' ? 'Active Trial Tenants' : 'Tenant Subscriptions Ledger'}>
            <div className="sm:hidden space-y-2.5 text-xs">
              {visibleSubs.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-slate-900 break-all">{s.id}</p>
                      <p className="font-bold text-slate-800 truncate">{s.tenantName}</p>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span><strong className="text-slate-900">{s.planName}</strong> • ${s.amount}/{s.interval.toLowerCase()}</span>
                    <span>{s.paymentProvider}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">End: {s.trialEndsAt || s.renewalDate}</span>
                    <Link href={`/admin/subscriptions/${s.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                        Inspect Lifecycle
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Subscription</th>
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Plan & Interval</th>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Renewal / Trial End</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleSubs.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 pr-4 font-mono font-bold text-slate-900">{s.id}</td>
                      <td className="py-2.5 pr-4 font-bold">{s.tenantName}</td>
                      <td className="py-2.5 pr-4">{s.planName} • ${s.amount}/{s.interval.toLowerCase()}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{s.paymentProvider}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{s.trialEndsAt || s.renewalDate}</td>
                      <td className="py-2.5 pr-4"><StatusPill status={s.status} /></td>
                      <td className="py-2.5 text-right">
                        <Link href={`/admin/subscriptions/${s.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                            Inspect Lifecycle
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        )}
      </div>
    </AdminPermissionGate>
  );
}

