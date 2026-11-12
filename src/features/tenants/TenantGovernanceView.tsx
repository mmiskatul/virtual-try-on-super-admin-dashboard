'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  MailPlus,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { platformService } from '../../services/platformService';
import { canAdminPerform } from '../../config/permissions';
import { TenantLifecycleStatus } from '../../types';
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

export type TenantSubTab =
  | 'overview'
  | 'users'
  | 'subscription'
  | 'usage'
  | 'products'
  | 'try-on'
  | 'activity'
  | 'settings';

export function TenantGovernanceView({
  mode = 'list',
  tenantId,
  detailTab = 'overview',
}: {
  mode?: 'list' | 'create' | 'detail';
  tenantId?: string;
  detailTab?: TenantSubTab;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const tenants = usePlatformStore((s) => s.tenants);
  const users = usePlatformStore((s) => s.users);
  const modProducts = usePlatformStore((s) => s.modProducts);
  const tryOnJobs = usePlatformStore((s) => s.tryOnJobs);
  const invoices = usePlatformStore((s) => s.invoices);
  const tickets = usePlatformStore((s) => s.tickets);
  const auditEvents = usePlatformStore((s) => s.auditEvents);
  const plans = usePlatformStore((s) => s.plans);

  const createTenant = usePlatformStore((s) => s.createTenant);
  const updateTenantLifecycle = usePlatformStore((s) => s.updateTenantLifecycle);
  const updateTenantPlanLocal = usePlatformStore((s) => s.updateTenantPlanLocal);
  const addTenantNote = usePlatformStore((s) => s.addTenantNote);
  const assignSupportAgent = usePlatformStore((s) => s.assignSupportAgent);
  const startImpersonation = usePlatformStore((s) => s.startImpersonation);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    twoPerson?: string;
    confirmLabel: string;
    onRun: (reason: string) => void;
  } | null>(null);

  // Create tenant wizard state (explicitly invites owner without creating passwords)
  const [newBizName, setNewBizName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCountry, setNewCountry] = useState('Bangladesh');
  const [newPlan, setNewPlan] = useState('PRO');
  const [newStatus, setNewStatus] = useState<TenantLifecycleStatus>('TRIAL');

  // Detail tab internal controls
  const [subTab, setSubTab] = useState<TenantSubTab>(detailTab);
  const [noteDraft, setNoteDraft] = useState('');
  const [impReason, setImpReason] = useState('');
  const [impMode, setImpMode] = useState<'READ_ONLY' | 'ELEVATED_WRITE'>('READ_ONLY');

  const canSuspend = canAdminPerform(activeRole, 'tenants', 'suspend', roleOverrides);
  const canEdit = canAdminPerform(activeRole, 'tenants', 'edit', roleOverrides);
  const canCreate = canAdminPerform(activeRole, 'tenants', 'create', roleOverrides);

  const safeTenants = mounted ? tenants : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3200);
  };

  const handleLifecycleChange = async (
    id: string,
    next: TenantLifecycleStatus,
    reason: string
  ) => {
    try {
      if (isLiveBackend && (next === 'ACTIVE' || next === 'SUSPENDED')) {
        await platformService.setTenantStatus(id, next);
      }
      updateTenantLifecycle(id, next, reason);
      notify(`Tenant ${id} transitioned to ${next}.`);
    } catch (err: any) {
      updateTenantLifecycle(id, next, reason);
      notify(err?.message || `Updated locally (backend rejected transition).`);
    }
  };

  // --- CREATE TENANT VIEW ---
  if (mode === 'create') {
    return (
      <AdminPermissionGate module="tenants" action="create">
        <div className="space-y-6 max-w-3xl">
          <AdminPageHeader
            eyebrow="Tenant Provisioning"
            title="Create Brand Tenant & Send Owner Invite"
            subtitle="Provision an isolated multi-tenant brand workspace. Owners establish credentials through verification email rather than staff-assigned passwords."
            actions={
              <Link href="/admin/tenants">
                <Button variant="outline" size="sm">Back to Directory</Button>
              </Link>
            }
          />

          <InlineAlert tone="info">
            <span>
              <strong>Security Guarantee:</strong> Platform administrators never create or store plaintext merchant passwords. Provisioning triggers an isolated owner onboarding invitation workflow.
            </span>
          </InlineAlert>

          <SectionPanel title="Merchant Organization & Entitlements">
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                const slug = (newBrandName || newBizName)
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '');
                const chosenPlan = plans.find((p) => p.slug.toUpperCase() === newPlan) || plans[2];
                const created = createTenant({
                  name: newBrandName.trim(),
                  legalName: newBizName.trim() || newBrandName.trim(),
                  slug: slug || `brand-${Date.now()}`,
                  owner: newOwnerName.trim(),
                  email: newOwnerEmail.trim(),
                  phone: newPhone.trim(),
                  country: newCountry,
                  status: newStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
                  lifecycleStatus: newStatus,
                  subscriptionStatus: newStatus === 'TRIAL' ? 'TRIALING' : 'ACTIVE',
                  plan: newPlan,
                  group: 'NEW_COHORT',
                  verificationStatus: 'UNDER_REVIEW',
                  productsCount: 0,
                  marketplacePublishedCount: 0,
                  ordersCount: 0,
                  gmv: 0,
                  tryOnUsed: 0,
                  tryOnQuota: chosenPlan?.limits.monthlyAiCredits || 5000,
                  monthlySpend: chosenPlan?.monthlyPrice || 99,
                  storageUsedMb: 0,
                  storageLimitMb: chosenPlan?.limits.storageQuotaMb || 10240,
                  apiRequests30d: 0,
                  teamCount: 1,
                  retentionGraceDays: 30,
                  joinedDate: new Date().toISOString().slice(0, 10),
                });
                notify(`Provisioned ${created.name} and queued invitation to ${created.email}.`);
                router.push(`/admin/tenants/${created.id}`);
              }}
            >
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Legal Business Name</span>
                <input
                  required
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Deshi Couture Ltd."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Public Brand Name</span>
                <input
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Deshi Couture"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Primary Owner Name</span>
                <input
                  required
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Owner Invitation Email</span>
                <input
                  required
                  type="email"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="founder@brand.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Phone</span>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+880-17..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Country</span>
                <input
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Initial Entitlement Plan</span>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.slug.toUpperCase()}>
                      {p.name} (${p.monthlyPrice}/mo • {p.limits.monthlyAiCredits} AI credits)
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Initial Lifecycle Status</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TenantLifecycleStatus)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                >
                  <option value="TRIAL">14-Day Trial</option>
                  <option value="ACTIVE">Active Paid</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                </select>
              </label>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={!canCreate} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <MailPlus className="w-3.5 h-3.5" /> Provision Tenant & Dispatch Invite
                </Button>
              </div>
            </form>
          </SectionPanel>
        </div>
      </AdminPermissionGate>
    );
  }

  // --- SINGLE TENANT DETAIL WORKSPACE ---
  if (mode === 'detail' && tenantId) {
    const tenant = safeTenants.find((t) => t.id === tenantId);
    const tenantUsers = users.filter((u) => u.tenantId === tenantId);
    const tenantProducts = modProducts.filter((p) => p.brandId === tenantId);
    const tenantJobs = tryOnJobs.filter((j) => j.tenantId === tenantId);
    const tenantInvoices = invoices.filter((inv) => inv.tenantId === tenantId);
    const tenantTickets = tickets.filter((tkt) => tkt.tenantId === tenantId);
    const tenantAudit = auditEvents.filter((a) => a.tenantContext === tenantId);

    const DETAIL_TABS: Array<{ id: TenantSubTab; label: string; href: string }> = [
      { id: 'overview', label: 'Overview', href: `/admin/tenants/${tenantId}/overview` },
      { id: 'users', label: `Users (${tenantUsers.length})`, href: `/admin/tenants/${tenantId}/users` },
      { id: 'subscription', label: 'Subscription & Billing', href: `/admin/tenants/${tenantId}/subscription` },
      { id: 'usage', label: 'Usage & Quotas', href: `/admin/tenants/${tenantId}/usage` },
      { id: 'products', label: 'Products', href: `/admin/tenants/${tenantId}/products` },
      { id: 'try-on', label: 'Try-On Jobs', href: `/admin/tenants/${tenantId}/try-on` },
      { id: 'activity', label: 'Timeline & Audit', href: `/admin/tenants/${tenantId}/activity` },
      { id: 'settings', label: 'Lifecycle & Support', href: `/admin/tenants/${tenantId}/settings` },
    ];

    return (
      <AdminPermissionGate module="tenants" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Isolated Tenant Inspection"
            title={tenant ? tenant.name : `Tenant ${tenantId}`}
            subtitle={tenant ? `${tenant.legalName} • Slug: /${tenant.slug} • Country: ${tenant.country}` : ''}
            actions={
              <Link href="/admin/tenants">
                <Button variant="outline" size="sm">Back to Tenants</Button>
              </Link>
            }
          />

          {!tenant ? (
            <EmptyPanel title="Tenant not found" description="No brand organization matches this tenant ID." />
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {DETAIL_TABS.map((t) => (
                  <Link
                    key={t.id}
                    href={t.href}
                    onClick={() => setSubTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      subTab === t.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              {subTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <SectionPanel className="lg:col-span-6" title="Business & Owner Record" right={<StatusPill status={tenant.lifecycleStatus} />}>
                    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-400">Tenant ID</span><p className="font-mono font-bold">{tenant.id}</p></div>
                      <div><span className="text-slate-400">Owner</span><p className="font-bold">{tenant.owner}</p></div>
                      <div><span className="text-slate-400">Email</span><p>{tenant.email}</p></div>
                      <div><span className="text-slate-400">Verification</span><p><StatusPill status={tenant.verificationStatus} /></p></div>
                      <div><span className="text-slate-400">Registered</span><p>{tenant.joinedDate}</p></div>
                      <div><span className="text-slate-400">Support Owner</span><p>{tenant.assignedSupportAgent || 'Unassigned'}</p></div>
                    </div>
                  </SectionPanel>

                  <SectionPanel className="lg:col-span-6" title="Controlled View-As Support Session">
                    <div className="space-y-3 text-xs">
                      <p className="text-slate-600">
                        Opens an audited, time-limited inspection banner scoped strictly to <strong>{tenant.name}</strong>. Read-Only by default; never silently impersonates.
                      </p>
                      <input
                        value={impReason}
                        onChange={(e) => setImpReason(e.target.value)}
                        placeholder="Mandatory reason (e.g. Investigating ticket TKT-4821 DNS issue)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <select
                          value={impMode}
                          onChange={(e) => setImpMode(e.target.value as any)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white font-semibold"
                        >
                          <option value="READ_ONLY">Read-Only Support Mode (Default)</option>
                          <option value="ELEVATED_WRITE">Elevated Write Mode (Audited)</option>
                        </select>
                        <Button
                          size="sm"
                          disabled={!impReason.trim() || !canEdit}
                          onClick={() => {
                            startImpersonation(tenant.id, impMode, impReason.trim());
                            notify(`Started ${impMode} view-as session for ${tenant.name}.`);
                          }}
                          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <Eye className="w-3.5 h-3.5" /> Start View-As
                        </Button>
                      </div>
                    </div>
                  </SectionPanel>

                  <SectionPanel className="lg:col-span-12" title="Internal Administrative Notes & Support Context">
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add confidential internal note (never visible to brand or customers)..."
                          className="w-full sm:flex-1 rounded-lg border border-slate-200 px-3 py-1.5"
                        />
                        <Button
                          size="sm"
                          disabled={!noteDraft.trim() || !canEdit}
                          onClick={() => {
                            addTenantNote(tenant.id, noteDraft.trim());
                            setNoteDraft('');
                            notify('Added internal note.');
                          }}
                          className="w-full sm:w-auto"
                        >
                          Add Note
                        </Button>
                      </div>
                      {tenant.internalNotes.map((n) => (
                        <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="font-semibold text-slate-900">{n.note}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{n.author} • {n.at}</p>
                        </div>
                      ))}
                      {tenantTickets.length > 0 && (
                        <p className="text-[11px] text-slate-500">Open/Recent Tickets: {tenantTickets.map((t) => t.id).join(', ')}</p>
                      )}
                    </div>
                  </SectionPanel>
                </div>
              )}

              {subTab === 'users' && (
                <SectionPanel title="Tenant Owner & Brand Staff Accounts" subtitle="Authentication credentials remain hidden from staff.">
                  {tenantUsers.length === 0 ? (
                    <EmptyPanel title="No additional user records linked" description="Primary owner email: " />
                  ) : (
                    <div className="space-y-2 text-xs">
                      {tenantUsers.map((u) => (
                        <Link key={u.id} href={`/admin/users/${u.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{u.name} ({u.roleLabel})</p>
                            <p className="text-slate-500 break-all">{u.email}</p>
                          </div>
                          <StatusPill status={u.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </SectionPanel>
              )}

              {subTab === 'subscription' && (
                <SectionPanel title="Tenant Subscription & Invoices" right={<StatusPill status={tenant.subscriptionStatus} />}>
                  <div className="space-y-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">Active Plan: {tenant.plan}</p>
                        <p className="text-slate-500">Monthly Spend: ৳{tenant.monthlySpend} BDT</p>
                      </div>
                      <select
                        disabled={!canEdit}
                        value={tenant.plan}
                        onChange={async (e) => {
                          const planSlug = e.target.value;
                          const matched = plans.find((p) => p.slug.toUpperCase() === planSlug);
                          const quota = matched?.limits.monthlyAiCredits || 5000;
                          if (isLiveBackend && ['STARTER', 'PRO', 'ENTERPRISE'].includes(planSlug)) {
                            await platformService.updateTenantPlan(tenant.id, { plan: planSlug, tryOnMonthlyQuota: quota }).catch(() => {});
                          }
                          updateTenantPlanLocal(tenant.id, planSlug, quota);
                          notify(`Updated ${tenant.name} to ${planSlug}.`);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 bg-white font-bold"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.slug.toUpperCase()}>
                            {p.name} ({p.limits.monthlyAiCredits} AI credits)
                          </option>
                        ))}
                      </select>
                    </div>
                    {tenantInvoices.map((inv) => (
                      <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200">
                        <span className="font-mono font-bold">{inv.id} ({inv.period})</span>
                        <span>৳{inv.total} BDT</span>
                        <StatusPill status={inv.status} />
                      </div>
                    ))}
                  </div>
                </SectionPanel>
              )}

              {subTab === 'usage' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Catalog Products" value={tenant.productsCount} />
                  <MetricCard label="AI Try-On Used / Cap" value={`${tenant.tryOnUsed} / ${tenant.tryOnQuota}`} />
                  <MetricCard label="Storage (MB)" value={`${tenant.storageUsedMb} / ${tenant.storageLimitMb}`} />
                  <MetricCard label="30d API Requests" value={tenant.apiRequests30d.toLocaleString()} />
                </div>
              )}

              {subTab === 'products' && (
                <SectionPanel title="Marketplace Moderated Products (Tenant Subset)">
                  {tenantProducts.length === 0 ? (
                    <EmptyPanel title="No moderated products listed" description={`Tenant holds ${tenant.productsCount} private catalog products.`} />
                  ) : (
                    <div className="space-y-2 text-xs">
                      {tenantProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-bold text-slate-900">{p.productName}</p>
                            <p className="text-slate-500">{p.category} • ${p.price}</p>
                          </div>
                          <StatusPill status={p.moderationStatus} />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionPanel>
              )}

              {subTab === 'try-on' && (
                <SectionPanel title="Tenant Try-On Generation History" subtitle="Customer images remain redacted by privacy policy.">
                  {tenantJobs.length === 0 ? (
                    <EmptyPanel title="No recent jobs logged" description="Recent try-on telemetry jobs appear here." />
                  ) : (
                    <div className="space-y-2 text-xs">
                      {tenantJobs.map((j) => (
                        <Link key={j.id} href={`/admin/try-on/jobs/${j.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <span className="font-mono font-bold">{j.id} — {j.productName}</span>
                          <StatusPill status={j.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </SectionPanel>
              )}

              {subTab === 'activity' && (
                <SectionPanel title="Chronological Tenant Event Timeline">
                  <div className="space-y-2.5 text-xs">
                    {tenant.timeline.map((ev, i) => (
                      <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-900">{ev.label}</span>
                        <span className="text-slate-400">{ev.at}</span>
                      </div>
                    ))}
                    {tenantAudit.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200">
                        <span><strong>{a.action}</strong>: {a.details}</span>
                        <span className="text-slate-400">{a.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </SectionPanel>
              )}

              {subTab === 'settings' && (
                <SectionPanel title="Tenant Lifecycle, Support Assignment & Retention Policy">
                  <InlineAlert tone="warning">
                    <span>
                      Suspending or cancelling a tenant preserves data for a configurable grace period ({tenant.retentionGraceDays} days) for data export before scheduled purge.
                    </span>
                  </InlineAlert>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      disabled={!canEdit}
                      onClick={() => handleLifecycleChange(tenant.id, 'ACTIVE', 'Activated by Super Admin')}
                    >
                      Approve / Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!canSuspend}
                      onClick={() =>
                        setConfirmModal({
                          title: `Suspend ${tenant.name}?`,
                          description: 'Suspending immediately disables storefront & API access while preserving database records for grace recovery.',
                          confirmLabel: 'Suspend Tenant',
                          onRun: (reason) => {
                            handleLifecycleChange(tenant.id, 'SUSPENDED', reason);
                            setConfirmModal(null);
                          },
                        })
                      }
                    >
                      Suspend Tenant
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canSuspend}
                      onClick={() =>
                        setConfirmModal({
                          title: `Schedule Offboarding & Retention Grace (${tenant.retentionGraceDays}d)?`,
                          description: 'Starts post-cancellation retention countdown without immediately purging tenant records.',
                          twoPerson: 'Tenant permanent purge scheduling requires two-person approval verification.',
                          confirmLabel: 'Schedule Offboarding',
                          onRun: (reason) => {
                            handleLifecycleChange(tenant.id, 'OFFBOARDING', reason);
                            setConfirmModal(null);
                          },
                        })
                      }
                    >
                      Schedule Offboarding ({tenant.retentionGraceDays}d Grace)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        assignSupportAgent(tenant.id, 'Nusrat Jahan');
                        notify('Assigned support agent Nusrat Jahan.');
                      }}
                    >
                      Assign Support Agent
                    </Button>
                  </div>
                </SectionPanel>
              )}
            </>
          )}

          <ConfirmActionDialog
            open={Boolean(confirmModal)}
            title={confirmModal?.title || ''}
            description={confirmModal?.description || ''}
            requireReason
            twoPersonApprovalNote={confirmModal?.twoPerson}
            confirmLabel={confirmModal?.confirmLabel}
            onConfirm={(r) => confirmModal?.onRun(r)}
            onCancel={() => setConfirmModal(null)}
          />
        </div>
      </AdminPermissionGate>
    );
  }

  // --- TENANT DIRECTORY (/admin/tenants) ---
  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeTenants.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'ALL' || t.lifecycleStatus === statusFilter || t.status === statusFilter;
      const matchPlan = planFilter === 'ALL' || t.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [safeTenants, search, statusFilter, planFilter]);

  return (
    <AdminPermissionGate module="tenants" action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Multi-Tenant Governance"
          title="Registered Brands & Tenant Directory"
          subtitle="Manage onboarding approvals, suspensions, plan entitlements, usage saturation, and controlled support view-as access across all clothing brands."
          actions={
            canCreate ? (
              <Link href="/admin/tenants/create">
                <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> Create Tenant
                </Button>
              </Link>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Tenants" value={safeTenants.length} icon={<Building2 className="w-4 h-4" />} />
          <MetricCard label="Active Merchants" value={safeTenants.filter((t) => t.lifecycleStatus === 'ACTIVE').length} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Trial / Pending Verification" value={safeTenants.filter((t) => ['TRIAL', 'PENDING_VERIFICATION', 'ONBOARDING'].includes(t.lifecycleStatus)).length} icon={<UserCheck className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Suspended / Restricted" value={safeTenants.filter((t) => ['SUSPENDED', 'RESTRICTED', 'PAST_DUE'].includes(t.lifecycleStatus)).length} icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} />
        </div>

        <SectionPanel
          title="Tenant Organizations"
          subtitle="Click any tenant to open its isolated detail workspace, usage limits, or start a controlled view-as session."
          right={
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brand, slug, ID, owner..."
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white font-semibold"
              >
                <option value="ALL">All Lifecycle</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white font-semibold"
              >
                <option value="ALL">All Plans</option>
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="BUSINESS">Business</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          }
        >
          {filteredTenants.length === 0 ? (
            <EmptyPanel title="No matching tenants" description="Adjust lifecycle or plan filters to inspect brand tenants." />
          ) : (
            <>
              <div className="sm:hidden space-y-2.5 text-xs">
                {filteredTenants.map((t) => {
                  const pct = Math.min(100, Math.round((t.tryOnUsed / Math.max(1, t.tryOnQuota)) * 100));
                  return (
                    <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/tenants/${t.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block truncate">
                            {t.name}
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400 break-all">
                            /{t.slug} • {t.id}
                          </p>
                        </div>
                        <StatusPill status={t.lifecycleStatus} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                        <div className="min-w-0">
                          <span className="text-slate-400 block">Owner</span>
                          <span className="font-semibold text-slate-800 block truncate">{t.owner}</span>
                          <span className="text-slate-400 block truncate">{t.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block">Plan & GMV</span>
                          <span className="font-bold text-slate-900 block">{t.plan} (${t.monthlySpend}/mo)</span>
                          <span className="text-slate-600 font-semibold tabular-nums">GMV ${t.gmv.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">AI Credits: <strong className="text-slate-800">{t.tryOnUsed.toLocaleString()} / {t.tryOnQuota.toLocaleString()}</strong></span>
                          <span className="text-slate-500">{t.productsCount} SKUs / {t.marketplacePublishedCount} pub</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                        <Link href={`/admin/tenants/${t.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-8 text-[11px]">
                            Inspect
                          </Button>
                        </Link>
                        {t.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canSuspend}
                            onClick={() =>
                              setConfirmModal({
                                title: `Suspend ${t.name}?`,
                                description: 'Disables storefront and try-on inference immediately. Preserves data per retention policy.',
                                confirmLabel: 'Suspend',
                                onRun: (r) => {
                                  handleLifecycleChange(t.id, 'SUSPENDED', r);
                                  setConfirmModal(null);
                                },
                              })
                            }
                            className="h-8 px-3 text-[11px] text-rose-700"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => handleLifecycleChange(t.id, 'ACTIVE', 'Approved/Reactivated by Admin')}
                            className="h-8 px-3 text-[11px] text-emerald-700"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pr-4">Brand / Slug</th>
                    <th className="py-2.5 pr-4">Owner</th>
                    <th className="py-2.5 pr-4">Plan & Sub</th>
                    <th className="py-2.5 pr-4">Catalog / Mkt</th>
                    <th className="py-2.5 pr-4">AI Credits</th>
                    <th className="py-2.5 pr-4">GMV</th>
                    <th className="py-2.5 pr-4">Lifecycle</th>
                    <th className="py-2.5 text-right">Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((t) => {
                    const pct = Math.min(100, Math.round((t.tryOnUsed / Math.max(1, t.tryOnQuota)) * 100));
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4">
                          <Link href={`/admin/tenants/${t.id}`} className="font-bold text-slate-900 hover:text-indigo-600">
                            {t.name}
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400">
                            /{t.slug} • {t.id}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-800">{t.owner}</p>
                          <p className="text-[11px] text-slate-400">{t.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900">{t.plan}</p>
                          <p className="text-[11px] text-slate-500">৳{t.monthlySpend}/mo</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {t.productsCount} SKUs / {t.marketplacePublishedCount} pub
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-800">
                            {t.tryOnUsed.toLocaleString()} / {t.tryOnQuota.toLocaleString()}
                          </p>
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-bold text-slate-900">৳{t.gmv.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <StatusPill status={t.lifecycleStatus} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link href={`/admin/tenants/${t.id}`}>
                              <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                                Inspect
                              </Button>
                            </Link>
                            {t.status === 'ACTIVE' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canSuspend}
                                onClick={() =>
                                  setConfirmModal({
                                    title: `Suspend ${t.name}?`,
                                    description: 'Disables storefront and try-on inference immediately. Preserves data per retention policy.',
                                    confirmLabel: 'Suspend',
                                    onRun: (r) => {
                                      handleLifecycleChange(t.id, 'SUSPENDED', r);
                                      setConfirmModal(null);
                                    },
                                  })
                                }
                                className="h-7 px-2 text-[11px] text-rose-700"
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEdit}
                                onClick={() => handleLifecycleChange(t.id, 'ACTIVE', 'Approved/Reactivated by Admin')}
                                className="h-7 px-2 text-[11px] text-emerald-700"
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </SectionPanel>

        <ConfirmActionDialog
          open={Boolean(confirmModal)}
          title={confirmModal?.title || ''}
          description={confirmModal?.description || ''}
          requireReason
          confirmLabel={confirmModal?.confirmLabel}
          onConfirm={(r) => confirmModal?.onRun(r)}
          onCancel={() => setConfirmModal(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

