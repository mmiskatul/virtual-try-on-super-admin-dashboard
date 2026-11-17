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
import { PlanEntitlement, SubscriptionPlanRecord } from '../../types';
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
import { canAdminPerform } from '../../config/permissions';

export type SubscriptionsTab = 'subscriptions' | 'plans' | 'create-plan' | 'trials' | 'history';

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
  planId,
}: {
  initialTab?: SubscriptionsTab;
  subscriptionId?: string;
  planId?: string;
}) {
  const mounted = useMounted();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const plans = usePlatformStore((s) => s.plans);
  const subscriptions = usePlatformStore((s) => s.subscriptions);
  const savePlan = usePlatformStore((s) => s.savePlan);
  const updateSubscriptionStatus = usePlatformStore((s) => s.updateSubscriptionStatus);
  const updateTenantPlanLocal = usePlatformStore((s) => s.updateTenantPlanLocal);
  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<SubscriptionsTab>(planId ? 'create-plan' : initialTab);
  const existingPlan = planId ? plans.find((p) => p.id === planId) : undefined;

  const [planName, setPlanName] = useState(existingPlan?.name || '');
  const [planSlug, setPlanSlug] = useState(existingPlan?.slug || '');
  const [planDesc, setPlanDesc] = useState(existingPlan?.description || '');
  const [monthlyPrice, setMonthlyPrice] = useState(String(existingPlan?.monthlyPrice ?? 129));
  const [annualPrice, setAnnualPrice] = useState(String(existingPlan?.annualPrice ?? 1290));
  const [trialDays, setTrialDays] = useState(String(existingPlan?.trialDays ?? 14));
  const [maxProducts, setMaxProducts] = useState(String(existingPlan?.limits.maxProducts ?? 1000));
  const [monthlyCredits, setMonthlyCredits] = useState(String(existingPlan?.limits.monthlyAiCredits ?? 5000));
  const [maxSeats, setMaxSeats] = useState(String(existingPlan?.limits.maxTeamSeats ?? 10));
  const [entitlements, setEntitlements] = useState<PlanEntitlement>(
    existingPlan?.entitlements || {
      marketplaceEnabled: 'ENABLED',
      virtualTryOnEnabled: 'ENABLED',
      customDomainEnabled: 'ENABLED',
      storefrontBuilder: 'ENABLED',
      analyticsAccess: 'ENABLED',
      apiAccess: 'ENABLED',
      priorityGpuQueue: 'DISABLED',
      highFidelityModels: 'ENABLED',
    }
  );
  const [confirmSubCancel, setConfirmSubCancel] = useState<string | null>(null);

  const canConfigure = canAdminPerform(activeRole, 'subscriptions', 'configure', roleOverrides);
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
                <div><span className="text-slate-400">Next Renewal</span><p>{sub.renewalDate}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canConfigure}
                  onClick={() => {
                    updateSubscriptionStatus(sub.id, 'TRIALING', { trialEndsAt: '2026-12-15' });
                    notify('Extended trial window to 2026-12-15.');
                  }}
                >
                  Extend Trial +14d
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canConfigure}
                  onClick={() => {
                    updateSubscriptionStatus(sub.id, 'ACTIVE', { discountPercent: 20 });
                    notify('Applied 20% retention discount.');
                  }}
                >
                  Apply 20% Discount
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
            description="Marks subscription CANCELLED at period boundary and syncs payment gateway webhook policy."
            requireReason
            confirmLabel="Confirm Cancellation"
            onConfirm={() => {
              if (confirmSubCancel) {
                updateSubscriptionStatus(confirmSubCancel, 'CANCELLED');
                notify('Subscription marked CANCELLED.');
              }
              setConfirmSubCancel(null);
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
            ['create-plan', 'Plan Builder', '/admin/plans/create'],
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
                <Link href={`/admin/plans/${p.id}`} className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">Edit Plan & Entitlements</Button>
                </Link>
              </SectionPanel>
            ))}
          </div>
        )}

        {tab === 'create-plan' && (
          <SectionPanel title={existingPlan ? `Edit Entitlements — ${existingPlan.name}` : 'Create Entitlement Plan'}>
            <form
              className="space-y-4 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                const cleanSlug = (planSlug || planName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const record: SubscriptionPlanRecord = {
                  id: existingPlan?.id || `plan_${cleanSlug}_${Date.now()}`,
                  name: planName.trim(),
                  slug: cleanSlug,
                  description: planDesc.trim() || 'Configured entitlement tier.',
                  monthlyPrice: Number(monthlyPrice) || 0,
                  annualPrice: Number(annualPrice) || 0,
                  setupFee: existingPlan?.setupFee || 0,
                  currency: 'BDT',
                  trialDays: Number(trialDays) || 14,
                  publicVisible: true,
                  displayOrder: existingPlan?.displayOrder || safePlans.length + 1,
                  limits: {
                    maxProducts: Number(maxProducts) || 500,
                    maxVariantsPerProduct: 100,
                    maxCategories: 50,
                    maxCollections: 30,
                    monthlyAiCredits: Number(monthlyCredits) || 5000,
                    maxTeamSeats: Number(maxSeats) || 10,
                    storageQuotaMb: 10240,
                    monthlyApiRequests: 150000,
                  },
                  allowedQualities: ['fast_preview', 'balanced', 'high_fidelity'],
                  allowedCategories: ['tops', 'bottoms', 'dresses', 'outerwear'],
                  entitlements,
                };
                savePlan(record);
                notify(`Saved subscription plan "${record.name}" and its entitlement matrix.`);
                setTab('plans');
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Plan Name</span>
                  <input required value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Boutique Plus" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Monthly Price (৳)</span>
                  <input type="number" min="0" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Annual Price (৳)</span>
                  <input type="number" min="0" value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Monthly AI Credits</span>
                  <input type="number" min="0" value={monthlyCredits} onChange={(e) => setMonthlyCredits(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Max Products</span>
                  <input type="number" min="1" value={maxProducts} onChange={(e) => setMaxProducts(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Trial Duration (Days)</span>
                  <input type="number" min="0" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Structured Feature Entitlements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ENTITLEMENT_KEYS.map((ek) => (
                    <label key={ek.key} className="p-2.5 rounded-lg border border-slate-200 space-y-1 block">
                      <span className="font-semibold text-slate-700 block">{ek.label}</span>
                      <select
                        value={entitlements[ek.key]}
                        onChange={(e) =>
                          setEntitlements((prev) => ({
                            ...prev,
                            [ek.key]: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-slate-200 px-2 py-1 bg-white font-semibold"
                      >
                        <option value="ENABLED">ENABLED</option>
                        {['marketplaceEnabled', 'virtualTryOnEnabled', 'storefrontBuilder', 'analyticsAccess'].includes(ek.key) && (
                          <option value="LIMITED">LIMITED</option>
                        )}
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={!canConfigure} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-3.5 h-3.5" /> Save Entitlement Plan
              </Button>
            </form>
          </SectionPanel>
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

