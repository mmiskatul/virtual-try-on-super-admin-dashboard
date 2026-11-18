'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Database,
  Download,
  RefreshCw,
  Server,
} from 'lucide-react';
import { InfrastructureConfig } from '../../components/modules/InfrastructureConfig';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { usePlatformSync } from '../../hooks/usePlatformSync';
import { usePermissions } from '../../hooks/usePermissions';
import {
  AdminPageHeader,
  AdminPermissionGate,
  ConfirmActionDialog,
  InlineAlert,
  MetricCard,
  SectionPanel,
  StatusPill,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';

export type GovernanceAreaTab =
  | 'health'
  | 'security-overview'
  | 'audit'
  | 'governance-overview'
  | 'requests'
  | 'integrations-overview'
  | 'int-email'
  | 'webhooks'
  | 'features'
  | 'configuration';

export function SystemSecurityGovernanceView({
  initialTab = 'health',
}: {
  initialTab?: GovernanceAreaTab;
}) {
  const mounted = useMounted();
  const { syncNow } = usePlatformSync();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const backendHealth = usePlatformStore((s) => s.backendHealth);
  const backendLatencyMs = usePlatformStore((s) => s.backendLatencyMs);
  const { can } = usePermissions();

  const auditEvents = usePlatformStore((s) => s.auditEvents);
  const dataRequests = usePlatformStore((s) => s.dataRequests);
  const featureFlags = usePlatformStore((s) => s.featureFlags);
  const webhooks = usePlatformStore((s) => s.webhooks);
  const settings = usePlatformStore((s) => s.settings);

  const updateDataRequest = usePlatformStore((s) => s.updateDataRequest);
  const toggleFeatureFlag = usePlatformStore((s) => s.toggleFeatureFlag);
  const addWebhook = usePlatformStore((s) => s.addWebhook);
  const updateSettings = usePlatformStore((s) => s.updateSettings);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab] = useState<GovernanceAreaTab>(initialTab);
  const [whUrl, setWhUrl] = useState('');
  const [confirmCritical, setConfirmCritical] = useState<{
    title: string;
    desc: string;
    twoPerson: string;
    onRun: (reason: string) => void;
  } | null>(null);

  const canConfig = can('configuration', 'configure');
  const canInfra = can('system', 'configure');
  const safeAudit = mounted ? auditEvents : [];
  const safeGov = mounted ? dataRequests : [];
  const safeFlags = mounted ? featureFlags : [];
  const safeHooks = mounted ? webhooks : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const gateModule = tab.startsWith('security') || tab === 'audit'
    ? 'security'
    : ['governance-overview', 'requests'].includes(tab)
    ? 'governance'
    : ['integrations-overview', 'int-email', 'webhooks'].includes(tab)
    ? 'integrations'
    : ['features', 'configuration'].includes(tab)
    ? 'configuration'
    : 'system';

  return (
    <AdminPermissionGate module={gateModule} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={`Control Plane / ${gateModule.toUpperCase()}`}
          title={
            gateModule === 'system'
              ? 'System Health & Infrastructure'
              : gateModule === 'security'
              ? 'Platform Audit Logs'
              : gateModule === 'governance'
              ? 'Data Governance & Privacy Requests'
              : gateModule === 'integrations'
              ? 'Service Integrations & Webhooks'
              : 'Feature Flags & Global Platform Settings'
          }
          subtitle="Real backend probe checks, PostgreSQL/Resend wiring, immutable governance audit logs, feature rollout gates, and high-risk action safeguards."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await syncNow();
                notify('Refreshed live backend probe.');
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Probe :4000 Now
            </Button>
          }
        />

        {/* Quick Context Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap text-xs">
          {[
            ['Health & Email/DB', '/admin/system/health'],
            ['Audit Logs', '/admin/security/audit'],
            ['Privacy Requests', '/admin/governance/requests'],
            ['Webhooks', '/admin/integrations/webhooks'],
            ['Feature Flags', '/admin/features'],
            ['Settings', '/admin/configuration'],
          ].map(([lbl, href]) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 whitespace-nowrap shrink-0"
            >
              {lbl}
            </Link>
          ))}
        </div>

        {/* SYSTEM OPERATIONS & LIVE DB/EMAIL INFRASTRUCTURE */}
        {gateModule === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard label="Backend :4000 Probe" value={isLiveBackend ? 'HEALTHY' : 'UNREACHABLE / NOT SIGNED IN'} icon={<Server className="w-4 h-4 text-emerald-600" />} />
              <MetricCard label="Probe Latency" value={backendLatencyMs != null ? `${backendLatencyMs} ms` : 'Unprobed'} icon={<Activity className="w-4 h-4" />} />
              <MetricCard label="Persistence Layer" value={backendHealth?.persistence || 'Unknown'} icon={<Database className="w-4 h-4 text-indigo-600" />} />
              <MetricCard label="Maintenance Mode" value={settings.maintenanceMode.enabled ? 'ENABLED' : 'OFF'} icon={<AlertTriangle className="w-4 h-4" />} />
            </div>

            {tab === 'health' && (
              <SectionPanel title="Live Resend Email & Supabase / PostgreSQL Infrastructure Configuration" subtitle="Direct connection to /api/v1/admin/infrastructure/*">
                {canInfra ? (
                  <InfrastructureConfig />
                ) : (
                  <p className="text-xs text-slate-600">Database and email settings contain secrets and can only be viewed and changed by a Super Admin.</p>
                )}
              </SectionPanel>
            )}

            {tab === 'health' && (
              <SectionPanel title="Platform Maintenance Mode">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50/40 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Global Platform Maintenance Mode</p>
                    <p className="text-slate-600">Temporarily blocks storefront/marketplace traffic while keeping admin routes accessible.</p>
                  </div>
                  <Button
                    size="sm"
                    variant={settings.maintenanceMode.enabled ? 'outline' : 'destructive'}
                    onClick={() =>
                      setConfirmCritical({
                        title: settings.maintenanceMode.enabled ? 'Disable Maintenance Mode?' : 'Enable Global Maintenance Mode?',
                        desc: 'Changes public ingress availability across storefronts and try-on endpoints.',
                        twoPerson: 'Maintenance mode toggle requires second administrator sign-off.',
                        onRun: () => {
                          updateSettings({
                            maintenanceMode: {
                              ...settings.maintenanceMode,
                              enabled: !settings.maintenanceMode.enabled,
                            },
                          });
                          notify(`Maintenance mode ${!settings.maintenanceMode.enabled ? 'ENABLED' : 'DISABLED'}.`);
                        },
                      })
                    }
                  >
                    {settings.maintenanceMode.enabled ? 'Disable Maintenance' : 'Enable Maintenance Mode'}
                  </Button>
                </div>
              </SectionPanel>
            )}
          </div>
        )}

        {/* SECURITY & IMMUTABLE AUDIT LOGS */}
        {gateModule === 'security' && (
          <div className="space-y-6">
            <SectionPanel
              title="Append-Only Platform Audit Trail"
              subtitle="Secrets, passwords, payment PANs, and tokens are strictly excluded from audit records."
              right={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const csv = [
                      ['ID', 'Action', 'Actor', 'Role', 'Target', 'Tenant', 'Correlation', 'Timestamp'].join(','),
                      ...safeAudit.map((a) =>
                        [a.id, a.action, a.actor, a.actorRole, a.target, a.tenantContext || '', a.correlationId, a.timestamp]
                          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'platform-audit-log.csv';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Audit CSV
                </Button>
              }
            >
              <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
                {safeAudit.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-slate-900 break-all">{a.action}</span>
                      <span className="text-slate-500"> &rarr; {a.target}</span>
                      <p className="text-slate-600 mt-0.5 break-words">{a.details} {a.reason && `(Reason: ${a.reason})`}</p>
                    </div>
                    <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0">
                      <p className="font-semibold text-slate-700">{a.actor} ({a.actorRole})</p>
                      <p className="font-mono break-all">{a.correlationId} • {a.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        )}

        {/* DATA GOVERNANCE & PRIVACY */}
        {gateModule === 'governance' && (
          <SectionPanel title="GDPR / Privacy Data Exports, Retention & Deletion Queue">
            <InlineAlert tone="info">
              <span>Customer try-on photographs are deleted according to the platform upload retention deadline ({settings.imageRetentionDays} days) and tenant cancellation grace window ({settings.tenantDeletionGraceDays} days).</span>
            </InlineAlert>
            <div className="space-y-2 text-xs pt-2">
              {safeGov.map((r) => (
                <div key={r.id} className="p-3 sm:p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 break-words">{r.id} — {r.type.replace('_', ' ')} ({r.tenantName})</p>
                    <p className="text-slate-500 break-words">Requester: {r.requester} • Retention Deadline: {r.retentionDeadline}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StatusPill status={r.status} />
                    {r.status !== 'COMPLETED' && (
                      <Button size="sm" variant="outline" onClick={async () => { if (await updateDataRequest(r.id, 'COMPLETED')) notify(`Completed governance request ${r.id}.`); }}>
                        Execute Policy
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {/* INTEGRATIONS & WEBHOOKS */}
        {gateModule === 'integrations' && (
          <div className="space-y-6">
            {tab === 'int-email' ? (
              <SectionPanel title="Live Email & Database Integration Controls">
                {canInfra ? (
                  <InfrastructureConfig />
                ) : (
                  <p className="text-xs text-slate-600">Database and email settings contain secrets and can only be viewed and changed by a Super Admin.</p>
                )}
              </SectionPanel>
            ) : null}

            <SectionPanel title="Platform Event Webhooks & Retry Monitor">
              <form
                className="flex flex-col sm:flex-row gap-2 pb-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!whUrl.trim()) return;
                  if (await addWebhook(whUrl.trim(), ['tenant.created', 'subscription.updated', 'tryon.failed'])) {
                    setWhUrl('');
                    notify('Registered webhook endpoint.');
                  }
                }}
              >
                <input type="url" required value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://ops-alerts.yourcompany.io/webhook" className="w-full sm:flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono" />
                <Button type="submit" size="sm" className="w-full sm:w-auto">Add Webhook</Button>
              </form>
              <div className="space-y-2 text-xs">
                {safeHooks.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-bold text-slate-900 break-all">{w.url}</p>
                      <p className="text-slate-500 break-words">{w.events.join(', ')} • Retries: {w.retryCount} • {w.lastAttemptAt}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <StatusPill status={String(w.lastResponseCode)} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        )}

        {/* FEATURE FLAGS & GLOBAL CONFIGURATION */}
        {gateModule === 'configuration' && (
          <div className="space-y-6">
            <SectionPanel title="Platform Feature Flags & Staged Rollout" subtitle="Controlled global feature activation without scattering plan checks.">
              <div className="space-y-3 text-xs">
                {safeFlags.map((fl) => (
                  <div key={fl.key} className="p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{fl.name}</p>
                        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded break-all">{fl.key}</code>
                      </div>
                      <p className="text-slate-500 mt-0.5 break-words">{fl.description} • Owner: {fl.owner} • Rollout: {fl.rolloutPct}%</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <StatusPill status={fl.globalEnabled ? 'ENABLED' : 'DISABLED'} />
                      <Button
                        size="sm"
                        variant={fl.globalEnabled ? 'outline' : 'default'}
                        disabled={!canConfig}
                        onClick={async () => {
                          if (await toggleFeatureFlag(fl.key, { globalEnabled: !fl.globalEnabled })) {
                            notify(`${fl.key} ${!fl.globalEnabled ? 'enabled' : 'disabled'}.`);
                          }
                        }}
                      >
                        {fl.globalEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>

            <SectionPanel title="Global Platform Defaults & Security Retention">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Max Image Upload Size (MB)</span>
                  <input
                    type="number"
                    value={settings.maxImageUploadMb}
                    onChange={(e) => updateSettings({ maxImageUploadMb: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Customer Photo Retention (Days)</span>
                  <input
                    type="number"
                    value={settings.imageRetentionDays}
                    onChange={(e) => updateSettings({ imageRetentionDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-slate-700">Cancelled Tenant Grace Window (Days)</span>
                  <input
                    type="number"
                    value={settings.tenantDeletionGraceDays}
                    onChange={(e) => updateSettings({ tenantDeletionGraceDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
            </SectionPanel>
          </div>
        )}

        <ConfirmActionDialog
          open={Boolean(confirmCritical)}
          title={confirmCritical?.title || ''}
          description={confirmCritical?.desc || ''}
          requireReason
          twoPersonApprovalNote={confirmCritical?.twoPerson}
          confirmLabel="Authorize Critical Action"
          onConfirm={(r) => {
            confirmCritical?.onRun(r);
            setConfirmCritical(null);
          }}
          onCancel={() => setConfirmCritical(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

