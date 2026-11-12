'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Coins,
  Cpu,
  CreditCard,
  Download,
  Globe,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DEMO_SERIES_REVENUE } from '../../data/platformDemoSeed';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { usePlatformSync } from '../../hooks/usePlatformSync';
import {
  AdminPageHeader,
  AdminPermissionGate,
  InlineAlert,
  MetricCard,
  SectionPanel,
  StatusPill,
  SvgTrendChart,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';

export type OverviewOrAnalyticsTab =
  | 'executive'
  | 'overview'
  | 'reports'
  | 'analytics'
  | 'revenue'
  | 'tenants'
  | 'subscriptions'
  | 'ai'
  | 'marketplace'
  | 'customers'
  | 'platform';

export function ExecutiveOverviewView({
  mode = 'executive',
}: {
  mode?: OverviewOrAnalyticsTab;
}) {
  const mounted = useMounted();
  const { syncNow } = usePlatformSync();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const backendHealth = usePlatformStore((s) => s.backendHealth);
  const backendLatencyMs = usePlatformStore((s) => s.backendLatencyMs);
  const backendTelemetry = usePlatformStore((s) => s.backendTelemetry);

  const tenants = usePlatformStore((s) => s.tenants);
  const users = usePlatformStore((s) => s.users);
  const subscriptions = usePlatformStore((s) => s.subscriptions);
  const transactions = usePlatformStore((s) => s.transactions);
  const tryOnJobs = usePlatformStore((s) => s.tryOnJobs);
  const modProducts = usePlatformStore((s) => s.modProducts);
  const auditEvents = usePlatformStore((s) => s.auditEvents);
  const alerts = usePlatformStore((s) => s.alerts);
  const updateAlertStatus = usePlatformStore((s) => s.updateAlertStatus);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [chartMetric, setChartMetric] = useState<'revenue' | 'mrr' | 'generations'>('revenue');

  const safeTenants = mounted ? tenants : [];
  const safeUsers = mounted ? users : [];
  const safeSubs = mounted ? subscriptions : [];
  const safeTx = mounted ? transactions : [];
  const safeJobs = mounted ? tryOnJobs : [];
  const safeMod = mounted ? modProducts : [];
  const safeAudit = mounted ? auditEvents : [];
  const safeAlerts = mounted ? alerts : [];

  const liveOverview = backendTelemetry.overview;
  const totalBrands = liveOverview?.tenants?.total ?? safeTenants.length;
  const activeBrands =
    liveOverview?.tenants?.active ??
    safeTenants.filter((t) => t.status === 'ACTIVE').length;
  const mrr = safeSubs
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.amount, 0);
  const arr = mrr * 12;
  const totalGmv =
    liveOverview?.orders?.gmv ??
    safeTenants.reduce((sum, t) => sum + t.gmv, 0);
  const totalGenerations = safeTenants.reduce((s, t) => s + t.tryOnUsed, 0);
  const estimatedAiCost = Number((totalGenerations * 0.024).toFixed(2));
  const publishedProducts =
    liveOverview?.catalog?.marketplacePublished ??
    safeMod.filter((p) => p.visibility === 'PUBLIC').length;
  const totalOrders =
    liveOverview?.orders?.totalOrders ??
    safeTenants.reduce((s, t) => s + t.ordersCount, 0);
  const marketplaceCustomers = safeUsers.filter(
    (u) => u.category === 'MARKETPLACE_CUSTOMER'
  ).length;
  const activeSubsCount = safeSubs.filter((s) => s.status === 'ACTIVE').length;

  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    safeSubs.forEach((s) => {
      counts[s.planName] = (counts[s.planName] || 0) + 1;
    });
    return Object.entries(counts);
  }, [safeSubs]);

  const exportCsvReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Registered Brands', totalBrands],
      ['Active Brands', activeBrands],
      ['Total Platform Users', safeUsers.length],
      ['Marketplace Customers', marketplaceCustomers],
      ['Active Subscriptions', activeSubsCount],
      ['MRR (USD)', mrr],
      ['ARR (USD)', arr],
      ['Total Platform GMV (USD)', totalGmv],
      ['Total Try-On Generations', totalGenerations],
      ['Estimated AI Cost (USD)', estimatedAiCost],
      ['Published Marketplace Products', publishedProducts],
      ['Total Orders', totalOrders],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-executive-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported executive platform metrics CSV.');
    setTimeout(hideToast, 3000);
  };

  return (
    <AdminPermissionGate module={mode === 'executive' || mode === 'overview' ? 'overview' : 'analytics'} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={mode === 'executive' ? 'SaaS Executive Control Plane' : `Analytics / ${mode}`}
          title={
            mode === 'executive'
              ? 'Platform Governance & Operations'
              : `Platform Analytics — ${mode.charAt(0).toUpperCase() + mode.slice(1)}`
          }
          subtitle="Unified visibility into multi-tenant storefronts, subscription MRR, AI inference pipelines, marketplace moderation, and live infrastructure health."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await syncNow();
                  showToast('Re-queried backend /health and /api/v1/admin/* telemetry.');
                  setTimeout(hideToast, 3000);
                }}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
              </Button>
              <Button size="sm" onClick={exportCsvReport} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Download className="w-3.5 h-3.5" /> Export Report CSV
              </Button>
            </>
          }
        />

        {/* Quick Navigation Strip for Analytics modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 text-xs">
          {[
            ['Executive', '/admin'],
            ['Revenue', '/admin/analytics/revenue'],
            ['Tenants', '/admin/analytics/tenants'],
            ['Subscriptions', '/admin/analytics/subscriptions'],
            ['AI Costs', '/admin/analytics/ai'],
            ['Marketplace', '/admin/analytics/marketplace'],
            ['Customers', '/admin/analytics/customers'],
            ['Platform Metrics', '/admin/analytics/platform'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* 12 Executive Platform KPI Cards (Section 5A) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-3.5">
          <MetricCard label="Total Brands" value={totalBrands} delta="+3" icon={<Building2 className="w-4 h-4" />} hint="All registered tenant workspaces" />
          <MetricCard label="Active Brands" value={activeBrands} delta="88% active" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Platform Users" value={safeUsers.length} delta="+14%" icon={<Users className="w-4 h-4" />} />
          <MetricCard label="Marketplace Shoppers" value={marketplaceCustomers} delta="+18%" icon={<Users className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="Active Subscriptions" value={activeSubsCount} delta="+4" icon={<CreditCard className="w-4 h-4" />} />
          <MetricCard label="Monthly Recurring (MRR)" value={`$${mrr.toLocaleString()}`} delta="+14.2%" icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Annual Run Rate (ARR)" value={`$${arr.toLocaleString()}`} delta="+14.2%" icon={<TrendingUp className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="Platform GMV" value={`$${totalGmv.toLocaleString()}`} delta="+22.4%" icon={<ShoppingBag className="w-4 h-4" />} />
          <MetricCard label="Try-On Generations" value={totalGenerations.toLocaleString()} delta="+19.1%" icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Est. AI Infra Cost" value={`$${estimatedAiCost.toLocaleString()}`} delta="Est. $0.024/run" icon={<Cpu className="w-4 h-4" />} hint="Estimated model cost across providers" />
          <MetricCard label="Published Products" value={publishedProducts} delta="+6" icon={<Globe className="w-4 h-4" />} />
          <MetricCard label="Marketplace Orders" value={totalOrders.toLocaleString()} delta="+11.8%" icon={<Coins className="w-4 h-4" />} />
        </div>

        {/* Analytics Chart & System Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionPanel
            className="lg:col-span-8"
            title="Platform Growth & Revenue Trajectory"
            subtitle="Toggle between total SaaS + GMV volume, recurring MRR, and virtual try-on compute volume (Demo historical curve)"
            right={
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  ['revenue', 'Platform Revenue ($)'],
                  ['mrr', 'SaaS MRR ($)'],
                  ['generations', 'AI Try-Ons'],
                ].map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setChartMetric(k as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold border ${
                      chartMetric === k
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            }
          >
            <SvgTrendChart
              data={DEMO_SERIES_REVENUE}
              valueKey={chartMetric}
              prefix={chartMetric === 'generations' ? '' : '$'}
            />
          </SectionPanel>

          {/* Honest Live System Health Panel (Section 5G) */}
          <SectionPanel
            className="lg:col-span-4"
            title="Live System Health & Probe"
            subtitle="Verified directly from :4000/health — never fabricated"
            right={<StatusPill status={isLiveBackend ? 'HEALTHY' : 'OFFLINE'} />}
          >
            <div className="space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Backend API Connection</span>
                <span className="font-bold text-slate-900">
                  {isLiveBackend ? 'Connected (:4000)' : 'Unauthenticated / Demo Fallback'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Probe Roundtrip Latency</span>
                <span className="font-mono font-bold text-slate-900">
                  {backendLatencyMs != null ? `${backendLatencyMs} ms` : 'Not probed'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Persistence Engine</span>
                <span className="font-semibold text-slate-800">
                  {backendHealth?.persistence || 'Not detected yet'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Failed / Pending Jobs</span>
                <span className="font-bold text-rose-700">
                  {safeJobs.filter((j) => j.status === 'FAILED').length} failed •{' '}
                  {safeJobs.filter((j) => j.status === 'QUEUED').length} queued
                </span>
              </div>
              <Link href="/admin/system/health" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Open Full Infrastructure Health
                </Button>
              </Link>
            </div>
          </SectionPanel>
        </div>

        {/* Plan Distribution, Tenant Cohorts, Alerts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionPanel
            className="lg:col-span-4"
            title="Plan Distribution & Lifecycle"
            subtitle="Active entitlement breakdown across brands"
          >
            <div className="space-y-2 text-xs">
              {planDistribution.map(([planName, count]) => (
                <div key={planName} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">{planName}</span>
                  <span className="font-mono font-bold text-indigo-700">{count} tenants</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-900">
                  <strong>{safeTenants.filter((t) => t.lifecycleStatus === 'TRIAL').length}</strong> In Trial
                </div>
                <div className="p-2 rounded-lg bg-rose-50 text-rose-900">
                  <strong>{safeTenants.filter((t) => t.status === 'SUSPENDED').length}</strong> Suspended
                </div>
              </div>
            </div>
          </SectionPanel>

          {/* Alerts & Action Center (Section 5I) */}
          <SectionPanel
            className="lg:col-span-4"
            title="Alerts & Action Center"
            subtitle="Operational incidents requiring admin triage"
          >
            <div className="space-y-2.5 text-xs">
              {safeAlerts.map((al) => (
                <div key={al.id} className="p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 min-w-0 flex-1 break-words">{al.title}</p>
                    <StatusPill status={al.severity} />
                  </div>
                  <p className="text-slate-600 break-words">{al.details}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Owner: {al.owner || 'Unassigned'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {al.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => updateAlertStatus(al.id, 'RESOLVED')}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>

          {/* Recent Audit & Platform Events (Section 5H) */}
          <SectionPanel
            className="lg:col-span-4"
            title="Recent Platform Activity"
            subtitle="Latest immutable governance & system events"
            right={
              <Link href="/admin/security/audit" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            }
          >
            <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
              {safeAudit.slice(0, 6).map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[11px] text-slate-900 break-all">{ev.action}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{ev.timestamp}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{ev.details}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>

        {/* Honest Failed Payments & Transaction Snapshot */}
        {safeTx.filter((tx) => tx.status === 'FAILED').length > 0 && (
          <InlineAlert tone="warning">
            <span>
              <strong>Failed Subscription Payments Detected:</strong>{' '}
              {safeTx.filter((tx) => tx.status === 'FAILED').length} payment failure(s) require reconciliation review under{' '}
              <Link href="/admin/finance/failed-payments" className="underline font-bold">
                Billing & Finance &rarr; Failed Payments
              </Link>
              .
            </span>
          </InlineAlert>
        )}
      </div>
    </AdminPermissionGate>
  );
}

