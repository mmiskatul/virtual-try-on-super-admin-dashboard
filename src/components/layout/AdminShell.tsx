'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Cpu,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../../config/navigation';
import { canAdminPerform, ROLE_METADATA } from '../../config/permissions';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { usePlatformSync } from '../../hooks/usePlatformSync';
import { useMounted } from '../../hooks/useMounted';
import { ToastNotification } from '../ui/ToastNotification';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Cpu,
  Globe,
  FileText,
  LifeBuoy,
  Megaphone,
  Activity,
  ShieldAlert,
  Plug,
  Settings,
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const { data: session } = useSession();
  const { syncNow } = usePlatformSync();

  const isLiveBackend = usePlatformStore((s) => s.isLiveBackend);
  const backendLatencyMs = usePlatformStore((s) => s.backendLatencyMs);
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const sidebarCollapsed = usePlatformStore((s) => s.sidebarCollapsed);
  const openGroups = usePlatformStore((s) => s.openGroups);
  const impersonation = usePlatformStore((s) => s.impersonation);
  const settings = usePlatformStore((s) => s.settings);

  const tenants = usePlatformStore((s) => s.tenants);
  const users = usePlatformStore((s) => s.users);
  const subscriptions = usePlatformStore((s) => s.subscriptions);
  const transactions = usePlatformStore((s) => s.transactions);
  const tryOnJobs = usePlatformStore((s) => s.tryOnJobs);
  const modProducts = usePlatformStore((s) => s.modProducts);
  const tickets = usePlatformStore((s) => s.tickets);
  const securityEvents = usePlatformStore((s) => s.securityEvents);
  const alerts = usePlatformStore((s) => s.alerts);

  const setActiveRole = usePlatformStore((s) => s.setActiveRole);
  const toggleSidebarCollapsed = usePlatformStore((s) => s.toggleSidebarCollapsed);
  const toggleNavGroup = usePlatformStore((s) => s.toggleNavGroup);
  const endImpersonation = usePlatformStore((s) => s.endImpersonation);

  const toastMessage = useAdminUiStore((s) => s.toastMessage);
  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const badges = useMemo(
    () => ({
      pendingTenants: tenants.filter((t) => t.lifecycleStatus === 'PENDING_VERIFICATION').length,
      failedJobs: tryOnJobs.filter((j) => j.status === 'FAILED').length,
      openTickets: tickets.filter((t) => t.status === 'OPEN' || t.status === 'ESCALATED').length,
      moderationQueue: modProducts.filter((p) => p.moderationStatus === 'PENDING_REVIEW').length,
      securityAlerts: securityEvents.filter((e) => e.status === 'OPEN').length,
    }),
    [tenants, tryOnJobs, tickets, modProducts, securityEvents]
  );

  const visibleGroups = useMemo(() => {
    return ADMIN_NAV_GROUPS.map((grp) => ({
      ...grp,
      items: grp.items.filter((item) =>
        canAdminPerform(activeRole, item.module, 'view', roleOverrides)
      ),
    })).filter((grp) => grp.items.length > 0);
  }, [activeRole, roleOverrides]);

  // Global search across 7 entity categories respecting active RBAC
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const results: Array<{ category: string; label: string; sub: string; href: string }> = [];

    if (canAdminPerform(activeRole, 'tenants', 'view', roleOverrides)) {
      tenants
        .filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.slug.includes(q))
        .slice(0, 3)
        .forEach((t) =>
          results.push({ category: 'Tenant', label: t.name, sub: `${t.plan} • ${t.lifecycleStatus}`, href: `/admin/tenants/${t.id}` })
        );
    }
    if (canAdminPerform(activeRole, 'users', 'view', roleOverrides)) {
      users
        .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((u) =>
          results.push({ category: 'User', label: u.name, sub: `${u.email} • ${u.category}`, href: `/admin/users/${u.id}` })
        );
    }
    if (canAdminPerform(activeRole, 'subscriptions', 'view', roleOverrides)) {
      subscriptions
        .filter((s) => s.id.toLowerCase().includes(q) || s.tenantName.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((s) =>
          results.push({ category: 'Subscription', label: s.id, sub: `${s.tenantName} • ${s.planName}`, href: `/admin/subscriptions/${s.id}` })
        );
    }
    if (canAdminPerform(activeRole, 'finance', 'view', roleOverrides)) {
      transactions
        .filter((tx) => tx.id.toLowerCase().includes(q) || tx.tenantName.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((tx) =>
          results.push({ category: 'Transaction', label: tx.id, sub: `$${tx.amount} • ${tx.status}`, href: `/admin/finance/transactions` })
        );
    }
    if (canAdminPerform(activeRole, 'marketplace', 'view', roleOverrides)) {
      modProducts
        .filter((p) => p.productName.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((p) =>
          results.push({ category: 'Product', label: p.productName, sub: `${p.brandName} • ${p.moderationStatus}`, href: `/admin/marketplace/products/${p.productId}` })
        );
    }
    if (canAdminPerform(activeRole, 'support', 'view', roleOverrides)) {
      tickets
        .filter((tk) => tk.id.toLowerCase().includes(q) || tk.subject.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((tk) =>
          results.push({ category: 'Ticket', label: `${tk.id} — ${tk.subject}`, sub: `${tk.priority} • ${tk.status}`, href: `/admin/support/tickets/${tk.id}` })
        );
    }
    if (canAdminPerform(activeRole, 'tryon', 'view', roleOverrides)) {
      tryOnJobs
        .filter((j) => j.id.toLowerCase().includes(q) || j.productName.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((j) =>
          results.push({ category: 'Try-On Job', label: j.id, sub: `${j.tenantName} • ${j.status}`, href: `/admin/try-on/jobs/${j.id}` })
        );
    }

    return results;
  }, [searchQuery, activeRole, roleOverrides, tenants, users, subscriptions, transactions, modProducts, tickets, tryOnJobs]);

  const breadcrumbs = useMemo(() => {
    const parts = (pathname || '/admin').split('/').filter(Boolean);
    return parts.map((segment, i) => ({
      label: segment.replace(/-/g, ' '),
      href: '/' + parts.slice(0, i + 1).join('/'),
    }));
  }, [pathname]);

  const handleManualSync = async () => {
    setSyncing(true);
    const live = await syncNow();
    setSyncing(false);
    showToast(live ? 'Synchronized live platform data from :4000.' : 'Using local demo governance data.');
    setTimeout(hideToast, 3000);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <ToastNotification message={toastMessage} />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Deep Navy / Charcoal Enterprise Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-200 border-r border-slate-800 transition-all duration-200 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-[72px]' : 'w-[272px] shrink-0'}`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-extrabold tracking-tight text-white truncate">
                  V-TRY Control Plane
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  Super Admin Platform
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5">
          {visibleGroups.map((group) => {
            const Icon = ICONS[group.icon] || LayoutDashboard;
            const isOpen = openGroups.includes(group.id) || sidebarCollapsed;
            const hasActiveChild = group.items.some((it) => pathname === it.href);

            return (
              <div key={group.id} className="space-y-0.5">
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleNavGroup(group.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors ${
                      hasActiveChild ? 'text-indigo-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {group.label}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <div className="flex justify-center py-1 text-slate-500" title={group.label}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}

                {isOpen && !sidebarCollapsed && (
                  <div className="pl-3 space-y-0.5 border-l border-slate-800 ml-3">
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {mounted && badgeCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                              {badgeCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-[11px] space-y-2">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Role Context</span>
              <span className="text-indigo-400 font-bold">
                {ROLE_METADATA[activeRole]?.label || activeRole}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              const { logoutAdmin } = await import('../../lib/logout');
              await logoutAdmin({ callbackUrl: '/login' });
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && 'Sign Out Admin'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controlled Support View-As Banner (Section 6E) */}
        {mounted && impersonation?.active && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                <strong>ACTIVE TENANT VIEW-AS SESSION:</strong> Inspecting{' '}
                <strong>{impersonation.tenantName}</strong> ({impersonation.mode.replace('_', ' ')}) • Reason:{' '}
                <em>&ldquo;{impersonation.reason}&rdquo;</em> • Expires {impersonation.expiresAt}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                endImpersonation();
                showToast('Exited controlled support view-as session.');
                setTimeout(hideToast, 3000);
              }}
              className="px-3 py-1 rounded-md bg-white text-amber-900 font-bold text-[11px]"
            >
              Exit View-As Session
            </button>
          </div>
        )}

        {/* Maintenance Mode Alert Strip */}
        {mounted && settings.maintenanceMode.enabled && (
          <div className="bg-rose-600 text-white px-4 py-1.5 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              MAINTENANCE MODE ENABLED ({settings.maintenanceMode.scope}): {settings.maintenanceMode.message}
            </span>
            <Link href="/admin/system/health" className="underline font-bold">
              Manage
            </Link>
          </div>
        )}

        {/* Top Control Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden lg:inline-flex p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Toggle sidebar"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 capitalize truncate">
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.href}>
                  {idx > 0 && <span>/</span>}
                  <Link href={b.href} className="hover:text-slate-900 font-medium">
                    {b.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Global Multi-Entity Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenants, users, subscriptions, transactions, tickets, jobs..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl p-2 space-y-1 z-50 max-h-80 overflow-y-auto">
                {searchResults.map((res, idx) => (
                  <Link
                    key={idx}
                    href={res.href}
                    onClick={() => setSearchQuery('')}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{res.label}</p>
                      <p className="text-[11px] text-slate-500">{res.sub}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {res.category}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Admin Controls */}
          <div className="flex items-center gap-2">
            {/* Role Preview Switcher */}
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              title="Preview RBAC Staff Role"
              className="hidden xl:block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              {Object.keys(ROLE_METADATA).map((rk) => (
                <option key={rk} value={rk}>
                  Role: {ROLE_METADATA[rk].label}
                </option>
              ))}
            </select>

            {/* Quick Actions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Quick
              </button>
              {showQuickMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 text-xs z-50">
                  <Link href="/admin/tenants/create" onClick={() => setShowQuickMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold">
                    + Provision New Tenant
                  </Link>
                  <Link href="/admin/plans/create" onClick={() => setShowQuickMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold">
                    + Create Subscription Plan
                  </Link>
                  <Link href="/admin/marketplace/products" onClick={() => setShowQuickMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold">
                    Review Moderation Queue
                  </Link>
                  <Link href="/admin/system/health" onClick={() => setShowQuickMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold">
                    Check System Health
                  </Link>
                </div>
              )}
            </div>

            {/* Live / Demo Backend Indicator */}
            <button
              type="button"
              onClick={handleManualSync}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                isLiveBackend
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
              title="Click to re-sync with :4000 backend"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{isLiveBackend ? `LIVE${backendLatencyMs ? ` (${backendLatencyMs}ms)` : ''}` : 'DEMO MODE'}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 relative"
              >
                <Bell className="w-4 h-4" />
                {mounted && alerts.filter((a) => a.status !== 'RESOLVED').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {alerts.filter((a) => a.status !== 'RESOLVED').length}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl p-3 space-y-2 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Platform Alert Center</span>
                    <button type="button" onClick={() => setShowNotifs(false)} className="text-slate-400">
                      Close
                    </button>
                  </div>
                  {alerts.map((al) => (
                    <div key={al.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                      <p className="font-bold text-slate-900">{al.title}</p>
                      <p className="text-slate-600">{al.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="hidden sm:inline-flex p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Control Plane Docs"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {session?.user?.name || 'Platform Admin'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {session?.user?.email || 'admin@vton-platform.io'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Super Admin Control Plane Guide</h3>
            <p className="text-slate-600 leading-relaxed">
              This portal controls multi-tenant brands, entitlement plans, billing reconciliation, AI model routing, moderation, support, and system security. Live API status shows <strong>LIVE</strong> when authenticated against <code>:4000</code> and switches cleanly to clearly marked <strong>DEMO MODE</strong> data where standalone endpoints are absent.
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2 rounded-lg bg-slate-900 text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

