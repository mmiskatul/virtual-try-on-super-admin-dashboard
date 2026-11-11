'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Database,
  Download,
  Flag,
  Lock,
  Plug,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { InfrastructureConfig } from '../../components/modules/InfrastructureConfig';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { usePlatformSync } from '../../hooks/usePlatformSync';
import { canAdminPerform } from '../../config/permissions';
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
  | 'system-overview'
  | 'health'
  | 'services'
  | 'queues'
  | 'jobs'
  | 'logs'
  | 'storage'
  | 'backups'
  | 'security-overview'
  | 'events'
  | 'sessions'
  | 'audit'
  | 'policies'
  | 'governance-overview'
  | 'requests'
  | 'retention'
  | 'exports'
  | 'integrations-overview'
  | 'int-payments'
  | 'int-ai'
  | 'int-email'
  | 'int-storage'
  | 'webhooks'
  | 'features'
  | 'configuration'
  | 'cfg-general'
  | 'cfg-marketplace'
  | 'cfg-ai'
  | 'cfg-uploads';

export function SystemSecurityGovernanceView({
  initialTab = 'system-overview',
}: {
  initialTab?: GovernanceAreaTab;
}) {
  const mounted = useMounted();
  const { syncNow } = usePlatformSync();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const backendHealth = usePlatformStore((s) => s.backendHealth);
  const backendLatencyMs = usePlatformStore((s) => s.backendLatencyMs);
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);

  const securityEvents = usePlatformStore((s) => s.securityEvents);
  const auditEvents = usePlatformStore((s) => s.auditEvents);
  const dataRequests = usePlatformStore((s) => s.dataRequests);
  const featureFlags = usePlatformStore((s) => s.featureFlags);
  const webhooks = usePlatformStore((s) => s.webhooks);
  const settings = usePlatformStore((s) => s.settings);

  const updateSecurityEvent = usePlatformStore((s) => s.updateSecurityEvent);
  const updateDataRequest = usePlatformStore((s) => s.updateDataRequest);
  const toggleFeatureFlag = usePlatformStore((s) => s.toggleFeatureFlag);
  const addWebhook = usePlatformStore((s) => s.addWebhook);
  const retryWebhook = usePlatformStore((s) => s.retryWebhook);
  const updateSettings = usePlatformStore((s) => s.updateSettings);
  const recordAudit = usePlatformStore((s) => s.recordAudit);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<GovernanceAreaTab>(initialTab);
  const [whUrl, setWhUrl] = useState('');
  const [confirmCritical, setConfirmCritical] = useState<{
    title: string;
    desc: string;
    twoPerson: string;
    onRun: (reason: string) => void;
  } | null>(null);

  const canConfig = canAdminPerform(activeRole, 'configuration', 'configure', roleOverrides);
  const safeSecurity = mounted ? securityEvents : [];
  const safeAudit = mounted ? auditEvents : [];
  const safeGov = mounted ? dataRequests : [];
  const safeFlags = mounted ? featureFlags : [];
  const safeHooks = mounted ? webhooks : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const gateModule = tab.startsWith('security') || ['events', 'sessions', 'audit', 'policies'].includes(tab)
    ? 'security'
    : ['governance-overview', 'requests', 'retention', 'exports'].includes(tab)
    ? 'governance'
    : ['integrations-overview', 'int-payments', 'int-ai', 'int-email', 'int-storage', 'webhooks'].includes(tab)
    ? 'integrations'
    : ['features', 'configuration', 'cfg-general', 'cfg-marketplace', 'cfg-ai', 'cfg-uploads'].includes(tab)
    ? 'configuration'
    : 'system';

  return (
    <AdminPermissionGate module={gateModule} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={`Control Plane / ${gateModule.toUpperCase()}`}
          title={
            gateModule === 'system'
              ? 'System Operations, Infrastructure & Backups'
              : gateModule === 'security'
              ? 'Platform Security, Sessions & Append-Only Audit Logs'
              : gateModule === 'governance'
              ? 'Data Governance, Privacy Retention & Exports'
              : gateModule === 'integrations'
              ? 'Service Integrations & Webhooks'
              : 'Feature Flags & Global Platform Settings'
          }
          subtitle="Real backend probe checks, PostgreSQL/SMTP wiring, immutable governance audit logs, feature rollout gates, and high-risk action safeguards."
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
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            ['Health & SMTP/DB', '/admin/system/health'],
            ['Queues & Jobs', '/admin/system/queues'],
            ['Logs', '/admin/system/logs'],
            ['Backups', '/admin/system/backups'],
            ['Security Events', '/admin/security/events'],
            ['Audit Logs', '/admin/security/audit'],
            ['Privacy Requests', '/admin/governance/requests'],
            ['Webhooks', '/admin/integrations/webhooks'],
            ['Feature Flags', '/admin/features'],
            ['Settings', '/admin/configuration'],
          ].map(([lbl, href]) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700"
            >
              {lbl}
            </Link>
          ))}
        </div>

        {/* SYSTEM OPERATIONS & LIVE DB/SMTP INFRASTRUCTURE */}
        {gateModule === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Backend :4000 Probe" value={isLiveBackend ? 'HEALTHY' : 'DEMO / AUTH REQUIRED'} icon={<Server className="w-4 h-4 text-emerald-600" />} />
              <MetricCard label="Probe Latency" value={backendLatencyMs != null ? `${backendLatencyMs} ms` : 'Unprobed'} icon={<Activity className="w-4 h-4" />} />
              <MetricCard label="Persistence Layer" value={backendHealth?.persistence || 'In-Memory / Demo'} icon={<Database className="w-4 h-4 text-indigo-600" />} />
              <MetricCard label="Maintenance Mode" value={settings.maintenanceMode.enabled ? 'ENABLED' : 'OFF'} icon={<AlertTriangle className="w-4 h-4" />} />
            </div>

            {(tab === 'system-overview' || tab === 'health' || tab === 'services' || tab === 'storage') && (
              <SectionPanel title="Live SMTP & Supabase / PostgreSQL Infrastructure Configuration" subtitle="Direct connection to /api/v1/admin/infrastructure/*">
                <InfrastructureConfig />
              </SectionPanel>
            )}

            {(tab === 'queues' || tab === 'jobs' || tab === 'logs') && (
              <SectionPanel title="Masked Application Logs & Background Workers" subtitle="PII tokens, passwords, and API secrets are redacted automatically.">
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 text-emerald-400">
                    [INFO] service=vton-backend req_id=corr_8841 path=/health status=200 latency={backendLatencyMs ?? 12}ms
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 text-amber-300">
                    [WARN] service=webhook-worker event=invoice.payment_failed target=stripe status=retrying tenant=tenant_012
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 text-slate-300">
                    [AUDIT] service=auth-guard masked_actor=ad***@vton-platform.io role=SUPER_ADMIN cross_tenant_check=ENFORCED
                  </div>
                </div>
              </SectionPanel>
            )}

            {tab === 'backups' && (
              <SectionPanel title="Backups, Recovery & High-Risk Maintenance Gate">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Production Snapshot Restore</p>
                    <p className="text-slate-500">Destructive recovery requires two-person elevated Super Admin approval.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setConfirmCritical({
                        title: 'Trigger Database Snapshot Restore?',
                        desc: 'Overwrites active state from point-in-time recovery snapshot.',
                        twoPerson: 'Destructive backup restoration requires two-person executive approval.',
                        onRun: (reason) => {
                          recordAudit('BACKUP_RESTORE_REQUESTED', 'PostgreSQL Primary', 'Logged restore approval workflow', undefined, reason);
                          notify('Recorded two-person restore request in audit trail (dry-run safeguard).');
                        },
                      })
                    }
                  >
                    Request Restore
                  </Button>
                </div>

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
                        onRun: (reason) => {
                          updateSettings({
                            maintenanceMode: {
                              ...settings.maintenanceMode,
                              enabled: !settings.maintenanceMode.enabled,
                            },
                          });
                          recordAudit('MAINTENANCE_MODE_TOGGLED', 'Platform Ingress', `Enabled: ${!settings.maintenanceMode.enabled}`, undefined, reason);
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
            <SectionPanel title="Security Intrusion & Isolation Events">
              <div className="space-y-2 text-xs">
                {safeSecurity.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{ev.type} — {ev.actor} (IP {ev.ipMasked})</p>
                      <p className="text-slate-600">{ev.details} • {ev.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={ev.severity} />
                      <StatusPill status={ev.status} />
                      {ev.status === 'OPEN' && (
                        <Button size="sm" variant="outline" onClick={() => { updateSecurityEvent(ev.id, 'ACKNOWLEDGED'); notify(`Acknowledged ${ev.id}.`); }}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>

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
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{a.action}</span>
                      <span className="text-slate-500"> &rarr; {a.target}</span>
                      <p className="text-slate-600 mt-0.5">{a.details} {a.reason && `(Reason: ${a.reason})`}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <p className="font-semibold text-slate-700">{a.actor} ({a.actorRole})</p>
                      <p className="font-mono">{a.correlationId} • {a.timestamp}</p>
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
                <div key={r.id} className="p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{r.id} — {r.type.replace('_', ' ')} ({r.tenantName})</p>
                    <p className="text-slate-500">Requester: {r.requester} • Retention Deadline: {r.retentionDeadline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={r.status} />
                    {r.status !== 'COMPLETED' && (
                      <Button size="sm" variant="outline" onClick={() => { updateDataRequest(r.id, 'COMPLETED'); notify(`Completed governance request ${r.id}.`); }}>
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
            {tab === 'int-email' || tab === 'int-storage' ? (
              <SectionPanel title="Live SMTP & Database Integration Controls">
                <InfrastructureConfig />
              </SectionPanel>
            ) : null}

            <SectionPanel title="Platform Event Webhooks & Retry Monitor">
              <form
                className="flex gap-2 pb-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!whUrl.trim()) return;
                  addWebhook(whUrl.trim(), ['tenant.created', 'subscription.updated', 'tryon.failed']);
                  setWhUrl('');
                  notify('Registered webhook endpoint.');
                }}
              >
                <input type="url" required value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://ops-alerts.yourcompany.io/webhook" className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono" />
                <Button type="submit" size="sm">Add Webhook</Button>
              </form>
              <div className="space-y-2 text-xs">
                {safeHooks.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-slate-900">{w.url}</p>
                      <p className="text-slate-500">{w.events.join(', ')} • Retries: {w.retryCount} • {w.lastAttemptAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={String(w.lastResponseCode)} />
                      <Button size="sm" variant="outline" onClick={() => { retryWebhook(w.id); notify('Queued webhook redelivery.'); }}>
                        Retry
                      </Button>
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
                  <div key={fl.key} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{fl.name}</p>
                        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{fl.key}</code>
                      </div>
                      <p className="text-slate-500 mt-0.5">{fl.description} • Owner: {fl.owner} • Rollout: {fl.rolloutPct}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={fl.globalEnabled ? 'ENABLED' : 'DISABLED'} />
                      <Button
                        size="sm"
                        variant={fl.globalEnabled ? 'outline' : 'default'}
                        disabled={!canConfig}
                        onClick={() => {
                          toggleFeatureFlag(fl.key, { globalEnabled: !fl.globalEnabled });
                          notify(`${fl.key} ${!fl.globalEnabled ? 'enabled' : 'disabled'}.`);
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

