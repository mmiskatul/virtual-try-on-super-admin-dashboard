'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Cpu,
  EyeOff,
  Layers,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { AiInfrastructure } from '../../components/modules/AiInfrastructure';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { canAdminPerform } from '../../config/permissions';
import {
  AdminPageHeader,
  AdminPermissionGate,
  ConfirmActionDialog,
  EmptyPanel,
  InlineAlert,
  MetricCard,
  SectionPanel,
  StatusPill,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';

export type AiOrTryOnTab =
  | 'ai-overview'
  | 'providers'
  | 'models'
  | 'configuration'
  | 'costs'
  | 'jobs'
  | 'queue'
  | 'failed'
  | 'quality';

export function AiOperationsView({
  initialTab = 'ai-overview',
  modelId,
  jobId,
}: {
  initialTab?: AiOrTryOnTab;
  modelId?: string;
  jobId?: string;
}) {
  const mounted = useMounted();
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const tenants = usePlatformStore((s) => s.tenants);
  const aiProviders = usePlatformStore((s) => s.aiProviders);
  const aiModels = usePlatformStore((s) => s.aiModels);
  const aiRouting = usePlatformStore((s) => s.aiRouting);
  const tryOnJobs = usePlatformStore((s) => s.tryOnJobs);
  const creditLedger = usePlatformStore((s) => s.creditLedger);
  const settings = usePlatformStore((s) => s.settings);

  const toggleAiModel = usePlatformStore((s) => s.toggleAiModel);
  const updateAiRouting = usePlatformStore((s) => s.updateAiRouting);
  const retryTryOnJob = usePlatformStore((s) => s.retryTryOnJob);
  const cancelTryOnJob = usePlatformStore((s) => s.cancelTryOnJob);
  const adjustTenantCredits = usePlatformStore((s) => s.adjustTenantCredits);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<AiOrTryOnTab>(initialTab);
  const [creditTenantId, setCreditTenantId] = useState(tenants[0]?.id || 'tenant_aura');
  const [creditDelta, setCreditDelta] = useState('500');
  const [creditType, setCreditType] = useState<'GRANT_PROMO' | 'ADMIN_ADJUSTMENT'>('GRANT_PROMO');
  const [creditReason, setCreditReason] = useState('');

  const [routingDraft, setRoutingDraft] = useState(aiRouting);
  const [confirmRouting, setConfirmRouting] = useState(false);

  const canConfigAi = canAdminPerform(activeRole, 'ai', 'configure', roleOverrides);
  const safeJobs = mounted ? tryOnJobs : [];
  const safeModels = mounted ? aiModels : [];
  const safeProviders = mounted ? aiProviders : [];
  const safeLedger = mounted ? creditLedger : [];
  const safeTenants = mounted ? tenants : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  if (modelId) {
    const model = safeModels.find((m) => m.id === modelId);
    return (
      <AdminPermissionGate module="ai" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="AI Model Registry"
            title={model ? model.name : `Model ${modelId}`}
            actions={
              <Link href="/admin/ai/models">
                <Button variant="outline" size="sm">Back to Models</Button>
              </Link>
            }
          />
          {!model ? (
            <EmptyPanel title="Model not found" description="No AI model ID matched." />
          ) : (
            <SectionPanel title={`${model.id} (${model.version})`} right={<StatusPill status={model.active ? 'ACTIVE' : 'DISABLED'} />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400">Provider</span><p className="font-bold uppercase">{model.providerId}</p></div>
                <div><span className="text-slate-400">Category</span><p className="font-semibold">{model.category}</p></div>
                <div><span className="text-slate-400">Resolution</span><p className="font-mono">{model.resolution}</p></div>
                <div><span className="text-slate-400">Est. Cost / Run</span><p className="font-bold">৳{model.estCostUsd.toFixed(3)}</p></div>
                <div><span className="text-slate-400">Required Entitlement</span><p className="font-mono">{model.requiredEntitlement}</p></div>
                <div><span className="text-slate-400">Garments</span><p>{model.supportedGarments.join(', ')}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <Button size="sm" disabled={!canConfigAi} onClick={() => { toggleAiModel(model.id, !model.active); notify('Toggled model active flag.'); }}>
                  {model.active ? 'Deactivate Model' : 'Activate Model'}
                </Button>
                <Button size="sm" variant="outline" disabled={!canConfigAi || model.isDefault} onClick={() => { toggleAiModel(model.id, true, true); notify('Set as platform default.'); }}>
                  {model.isDefault ? 'Default Model' : 'Promote to Default'}
                </Button>
              </div>
            </SectionPanel>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  if (jobId) {
    const job = safeJobs.find((j) => j.id === jobId);
    return (
      <AdminPermissionGate module="tryon" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Virtual Try-On Job Telemetry"
            title={job ? `Job ${job.id}` : `Job ${jobId}`}
            subtitle="Operational telemetry view. Uploaded customer photographs remain hidden by default per Platform Data Governance policies."
            actions={
              <Link href="/admin/try-on/jobs">
                <Button variant="outline" size="sm">Back to Jobs</Button>
              </Link>
            }
          />
          {!job ? (
            <EmptyPanel title="Generation job not found" description="No try-on generation record matched this ID." />
          ) : (
            <SectionPanel title={`${job.tenantName} — ${job.productName}`} right={<StatusPill status={job.status} />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400">Tenant ID</span><p className="font-mono">{job.tenantId}</p></div>
                <div><span className="text-slate-400">Provider / Model</span><p className="font-bold">{job.provider} / {job.modelId}</p></div>
                <div><span className="text-slate-400">Duration</span><p>{(job.durationMs / 1000).toFixed(2)}s</p></div>
                <div><span className="text-slate-400">Credits Consumed</span><p className="font-bold">{job.creditsConsumed}</p></div>
                {job.failureCategory && (
                  <div className="col-span-2"><span className="text-slate-400">Failure Category</span><p className="font-bold text-rose-700">{job.failureCategory}: {job.errorMessage}</p></div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3 text-xs text-slate-700">
                <EyeOff className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Private Customer Photograph Redacted</p>
                  <p>Customer uploads and try-on outputs are access-restricted under retention policy ({settings.imageRetentionDays} days). Viewing customer photography requires a formal privacy inspection request.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {job.status === 'FAILED' && (
                  <Button size="sm" disabled={!canConfigAi} onClick={() => { retryTryOnJob(job.id); notify(`Queued retry for ${job.id}.`); }}>
                    Retry Generation Job
                  </Button>
                )}
                {(job.status === 'QUEUED' || job.status === 'PROCESSING') && (
                  <Button size="sm" variant="destructive" disabled={!canConfigAi} onClick={() => { cancelTryOnJob(job.id); notify(`Cancelled ${job.id}.`); }}>
                    Cancel Job
                  </Button>
                )}
              </div>
            </SectionPanel>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  const completedJobs = safeJobs.filter((j) => j.status === 'COMPLETED');
  const failedJobs = safeJobs.filter((j) => j.status === 'FAILED');
  const queueJobs = safeJobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING');

  const totalEstCost = safeJobs.reduce((s, j) => s + j.estProviderCostUsd, 0);
  const failureBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    failedJobs.forEach((f) => {
      const k = f.failureCategory || 'MODEL_FAILURE';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map);
  }, [failedJobs]);

  return (
    <AdminPermissionGate module={['jobs', 'queue', 'failed', 'quality'].includes(tab) ? 'tryon' : 'ai'} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="AI Infrastructure & Virtual Try-On Ops"
          title="AI Providers, Routing, Queues & Credit Ledger"
          subtitle="Govern multi-provider image generation APIs, GPU fallback policies, generation job failure triage, and tenant credit balances."
        />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          {[
            ['ai-overview', 'AI Overview', '/admin/ai'],
            ['providers', 'Live AI Keys & Providers', '/admin/ai/providers'],
            ['models', 'Model Registry', '/admin/ai/models'],
            ['configuration', 'Routing Policy', '/admin/ai/configuration'],
            ['costs', 'Costs & Credits', '/admin/ai/costs'],
            ['jobs', 'Try-On Jobs', '/admin/try-on/jobs'],
            ['queue', `Queue (${queueJobs.length})`, '/admin/try-on/queue'],
            ['failed', `Failures (${failedJobs.length})`, '/admin/try-on/failed'],
            ['quality', 'Quality & Privacy', '/admin/try-on/quality'],
          ].map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as AiOrTryOnTab)}
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
          <MetricCard label="Active AI Models" value={safeModels.filter((m) => m.active).length} icon={<Cpu className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="Queue Backlog" value={queueJobs.length} icon={<Activity className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Failed Jobs Logged" value={failedJobs.length} positive={failedJobs.length === 0} icon={<XCircle className="w-4 h-4 text-rose-600" />} />
          <MetricCard label="Sample Batch Est. Cost" value={`৳${totalEstCost.toFixed(3)}`} hint="Estimated inference spend across sample jobs; not a provider invoice." icon={<Coins className="w-4 h-4" />} />
        </div>

        {/* Live Backend AI Key & Engine Configuration Component (Existing backend-connected panel) */}
        {(tab === 'providers' || tab === 'configuration') && (
          <SectionPanel title="Live Backend AI Engine Secrets & Connectivity (:4000 -> :8000)" subtitle="Stores masked Gemini, Fal, and Cloudinary keys on the backend and runs live endpoint checks.">
            <AiInfrastructure />
          </SectionPanel>
        )}

        {tab === 'ai-overview' && (
          <SectionPanel title="Configured Inference Providers" subtitle="Real provider key readiness vs active model routing fallback chain">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {safeProviders.map((pr) => (
                <div key={pr.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{pr.name}</p>
                    <StatusPill status={pr.status} />
                  </div>
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 text-slate-600">
                    <div>Latency: <strong>{pr.avgLatencyMs}ms</strong></div>
                    <div>Err Rate: <strong>{pr.errorRatePct}%</strong></div>
                    <div>Est/Run: <strong>৳{pr.estimatedCostPerRunUsd}</strong></div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Models: {pr.models.join(', ')}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {(tab === 'ai-overview' || tab === 'models') && (
          <SectionPanel title="Platform Model Registry" subtitle="Brand owners cannot bypass model restrictions enforced per subscription entitlement.">
            <div className="sm:hidden space-y-2.5 text-xs">
              {safeModels.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/ai/models/${m.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block truncate">
                        {m.name} {m.isDefault && '(DEFAULT)'}
                      </Link>
                      <p className="text-[11px] font-mono text-slate-400 break-all">{m.id} • {m.version}</p>
                    </div>
                    <StatusPill status={m.active ? 'ACTIVE' : 'DISABLED'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="uppercase font-semibold">{m.providerId}</span>
                    <span>•</span>
                    <span>{m.category} ({m.resolution})</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-700">{m.requiredEntitlement}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900 tabular-nums">৳{m.estCostUsd.toFixed(3)} / run</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canConfigAi}
                      onClick={() => toggleAiModel(m.id, !m.active)}
                      className="h-7 px-3 text-[11px]"
                    >
                      {m.active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Category & Res</th>
                    <th className="py-2 pr-4">Entitlement Gate</th>
                    <th className="py-2 pr-4">Est Cost</th>
                    <th className="py-2 pr-4">State</th>
                    <th className="py-2 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeModels.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 pr-4">
                        <Link href={`/admin/ai/models/${m.id}`} className="font-bold text-slate-900 hover:text-indigo-600">
                          {m.name} {m.isDefault && '(DEFAULT)'}
                        </Link>
                        <p className="text-[11px] font-mono text-slate-400">{m.id} • {m.version}</p>
                      </td>
                      <td className="py-2.5 pr-4 uppercase font-semibold">{m.providerId}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{m.category} • {m.resolution}</td>
                      <td className="py-2.5 pr-4 font-mono text-indigo-700">{m.requiredEntitlement}</td>
                      <td className="py-2.5 pr-4 font-bold">৳{m.estCostUsd.toFixed(3)}</td>
                      <td className="py-2.5 pr-4"><StatusPill status={m.active ? 'ACTIVE' : 'DISABLED'} /></td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canConfigAi}
                          onClick={() => toggleAiModel(m.id, !m.active)}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          {m.active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        )}

        {tab === 'configuration' && (
          <SectionPanel title="AI Fallback Routing Policy" subtitle="Changing model routing affects platform-wide inference SLA and costs.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Primary Provider</span>
                <select
                  value={routingDraft.primaryProvider}
                  onChange={(e) => setRoutingDraft({ ...routingDraft, primaryProvider: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                >
                  {safeProviders.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Secondary Provider</span>
                <select
                  value={routingDraft.secondaryProvider}
                  onChange={(e) => setRoutingDraft({ ...routingDraft, secondaryProvider: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                >
                  {safeProviders.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Request Timeout (Seconds)</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={routingDraft.timeoutSeconds}
                  onChange={(e) => setRoutingDraft({ ...routingDraft, timeoutSeconds: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <Button size="sm" disabled={!canConfigAi} onClick={() => setConfirmRouting(true)}>
              Validate & Deploy Routing Policy
            </Button>
          </SectionPanel>
        )}

        {tab === 'costs' && (
          <div className="space-y-6">
            <InlineAlert tone="info">
              <span>
                <strong>Cost Accounting Notice:</strong> Provider BDT figures reflect estimated internal per-run pricing rates, NOT audited supplier billing invoices. Margin = Subscription Revenue - Estimated AI Costs.
              </span>
            </InlineAlert>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SectionPanel className="lg:col-span-7" title="Immutable AI Credit Ledger" subtitle="Tracks promotional grants, billing purchases, consumed deductions, and released reservations.">
                <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
                  {safeLedger.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 break-words">{c.tenantName} — {c.type}</p>
                        <p className="text-slate-500 break-words">{c.reason} • Ref: <code className="break-all">{c.referenceId}</code></p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className={`font-bold ${c.delta >= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {c.delta >= 0 ? `+${c.delta}` : c.delta} credits
                        </p>
                        <p className="text-[11px] text-slate-400">Bal: {c.balanceAfter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel className="lg:col-span-5" title="Grant / Adjust Tenant AI Credits" subtitle="Creates an immutable ledger record with admin ID & reason.">
                <form
                  className="space-y-3 text-xs"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!creditReason.trim()) return;
                    adjustTenantCredits(creditTenantId, Number(creditDelta) || 0, creditReason.trim(), creditType);
                    notify(`Recorded ${creditDelta} credit adjustment.`);
                    setCreditReason('');
                  }}
                >
                  <select
                    value={creditTenantId}
                    onChange={(e) => setCreditTenantId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                  >
                    {safeTenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (Cap: {t.tryOnQuota})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                    <select
                      value={creditType}
                      onChange={(e) => setCreditType(e.target.value as any)}
                      className="rounded-lg border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="GRANT_PROMO">Promotional Grant</option>
                      <option value="ADMIN_ADJUSTMENT">Correction Delta</option>
                    </select>
                    <input
                      type="number"
                      value={creditDelta}
                      onChange={(e) => setCreditDelta(e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <input
                    required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Mandatory audit reason..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <Button type="submit" disabled={!canConfigAi} size="sm" className="w-full">
                    Commit Ledger Adjustment
                  </Button>
                </form>
              </SectionPanel>
            </div>
          </div>
        )}

        {(tab === 'jobs' || tab === 'queue' || tab === 'failed') && (
          <SectionPanel
            title={tab === 'failed' ? 'Failed Generation Triage' : tab === 'queue' ? 'Active Generation Queue' : 'Virtual Try-On Operations'}
            subtitle="Customer uploaded images are redacted by default. Only operational metadata and failure codes display here."
          >
            {tab === 'failed' && failureBreakdown.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {failureBreakdown.map(([cat, count]) => (
                  <span key={cat} className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    {cat}: {count}
                  </span>
                ))}
              </div>
            )}

            <div className="sm:hidden space-y-2.5 text-xs">
              {(tab === 'failed' ? failedJobs : tab === 'queue' ? queueJobs : safeJobs).map((j) => (
                <div key={j.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/try-on/jobs/${j.id}`} className="font-mono font-bold text-indigo-700 hover:underline break-all">
                        {j.id}
                      </Link>
                      <p className="font-bold text-slate-900 truncate">{j.tenantName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{j.productName}</p>
                    </div>
                    <StatusPill status={j.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="font-mono">{j.provider} / {j.modelId}</span>
                    <span>•</span>
                    <span>{(j.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                  {j.failureCategory && (
                    <p className="text-[11px] font-medium text-rose-700 break-words">{j.failureCategory}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    {j.status === 'FAILED' && (
                      <Button variant="outline" size="sm" disabled={!canConfigAi} onClick={() => { retryTryOnJob(j.id); notify(`Re-queued ${j.id}.`); }} className="h-7 px-2.5 text-[11px]">
                        Retry
                      </Button>
                    )}
                    {(j.status === 'QUEUED' || j.status === 'PROCESSING') && (
                      <Button variant="ghost" size="sm" disabled={!canConfigAi} onClick={() => { cancelTryOnJob(j.id); notify(`Cancelled ${j.id}.`); }} className="h-7 px-2.5 text-[11px] text-rose-700">
                        Cancel
                      </Button>
                    )}
                    <Link href={`/admin/try-on/jobs/${j.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">Inspect</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Job ID</th>
                    <th className="py-2 pr-4">Tenant / Garment</th>
                    <th className="py-2 pr-4">Model / Provider</th>
                    <th className="py-2 pr-4">Latency</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(tab === 'failed' ? failedJobs : tab === 'queue' ? queueJobs : safeJobs).map((j) => (
                    <tr key={j.id}>
                      <td className="py-2.5 pr-4 font-mono font-bold text-slate-900">
                        <Link href={`/admin/try-on/jobs/${j.id}`} className="hover:underline text-indigo-700">
                          {j.id}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        <p className="font-bold text-slate-900">{j.tenantName}</p>
                        <p className="text-[11px] text-slate-500">{j.productName}</p>
                      </td>
                      <td className="py-2.5 pr-4 font-mono">{j.provider} / {j.modelId}</td>
                      <td className="py-2.5 pr-4">{(j.durationMs / 1000).toFixed(2)}s</td>
                      <td className="py-2.5 pr-4">
                        <StatusPill status={j.status} />
                        {j.failureCategory && <span className="ml-1.5 text-[11px] text-rose-700">{j.failureCategory}</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          {j.status === 'FAILED' && (
                            <Button variant="outline" size="sm" disabled={!canConfigAi} onClick={() => { retryTryOnJob(j.id); notify(`Re-queued ${j.id}.`); }} className="h-7 px-2 text-[11px]">
                              Retry
                            </Button>
                          )}
                          {(j.status === 'QUEUED' || j.status === 'PROCESSING') && (
                            <Button variant="ghost" size="sm" disabled={!canConfigAi} onClick={() => { cancelTryOnJob(j.id); notify(`Cancelled ${j.id}.`); }} className="h-7 px-2 text-[11px] text-rose-700">
                              Cancel
                            </Button>
                          )}
                          <Link href={`/admin/try-on/jobs/${j.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">Inspect</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        )}

        {tab === 'quality' && (
          <SectionPanel title="AI Output Quality & Privacy Governance">
            <InlineAlert tone="warning">
              <span>
                <strong>Quality Engineering Standard:</strong> HTTP 200 status codes measure technical transport completion only — true garment fit fidelity requires aggregated quality-check evaluator scores and shopper retry/feedback telemetry.
              </span>
            </InlineAlert>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500">Garment Preservation Evaluator (Sample)</p>
                <p className="text-xl font-bold text-slate-900 mt-1">91.4%</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500">Customer Photo Upload Retention</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{settings.imageRetentionDays} Days</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <p className="text-slate-500">Customer Retry Frequency</p>
                <p className="text-xl font-bold text-slate-900 mt-1">6.8%</p>
              </div>
            </div>
          </SectionPanel>
        )}

        <ConfirmActionDialog
          open={confirmRouting}
          title="Deploy Global AI Routing Policy Change?"
          description={`Updates primary provider to ${routingDraft.primaryProvider}, fallback to ${routingDraft.secondaryProvider}, and timeout to ${routingDraft.timeoutSeconds}s for all virtual try-on requests.`}
          destructive={false}
          confirmLabel="Deploy Routing Policy"
          onConfirm={() => {
            updateAiRouting(routingDraft);
            setConfirmRouting(false);
            notify('Deployed AI routing policy update.');
          }}
          onCancel={() => setConfirmRouting(false)}
        />
      </div>
    </AdminPermissionGate>
  );
}

