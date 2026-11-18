'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { ApiError, superAdminApi, type RbacCatalog } from '../../lib/api';
import { hasBackendPermission } from '../../config/permissions';
import { usePermissions } from '../../hooks/usePermissions';
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

export type UsersStaffTab =
  | 'users'
  | 'roles'
  | 'invitations'
  | 'staff'
  | 'staff-roles'
  | 'permissions';

export function UsersStaffView({
  initialTab = 'users',
  userId,
}: {
  initialTab?: UsersStaffTab;
  userId?: string;
}) {
  const mounted = useMounted();
  const { can, rbac } = usePermissions();
  const users = usePlatformStore((s) => s.users);
  const updateUserStatus = usePlatformStore((s) => s.updateUserStatus);
  const revokeUserSessions = usePlatformStore((s) => s.revokeUserSessions);
  const recordAudit = usePlatformStore((s) => s.recordAudit);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<UsersStaffTab>(initialTab);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedMatrixRole, setSelectedMatrixRole] = useState('');
  const [catalog, setCatalog] = useState<RbacCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    title: string;
    desc: string;
    onRun: () => void;
  } | null>(null);

  const canManageUsers = can('users', 'suspend');
  const safeUsers = mounted ? users : [];
  const isRoleTab = tab === 'staff-roles' || tab === 'roles' || tab === 'permissions';

  // Roles and permissions come from the backend; they are not editable in the dashboard.
  useEffect(() => {
    if (!isRoleTab || catalog || catalogLoading || catalogError) return;
    setCatalogLoading(true);
    superAdminApi
      .getRbacRoles()
      .then((res) => {
        setCatalog(res.data);
        setSelectedMatrixRole((cur) => cur || rbac.role || res.data.roles.find((r) => r.scope === 'PLATFORM')?.code || '');
      })
      .catch((err) => {
        setCatalogError(
          err instanceof ApiError && err.status === 403
            ? 'Your role cannot view the role catalog. It needs the staff:manage permission.'
            : err instanceof Error
              ? err.message
              : 'Could not load roles from the backend.'
        );
      })
      .finally(() => setCatalogLoading(false));
  }, [isRoleTab, catalog, catalogLoading, catalogError, rbac.role]);

  const platformRoles = useMemo(() => (catalog?.roles || []).filter((r) => r.scope === 'PLATFORM'), [catalog]);
  const platformPermissions = useMemo(
    () => (catalog?.permissions || []).filter((p) => p.module !== '*' && !p.module.startsWith('brand:')),
    [catalog]
  );
  const permissionsByModule = useMemo(() => {
    const grouped = new Map<string, typeof platformPermissions>();
    for (const p of platformPermissions) grouped.set(p.module, [...(grouped.get(p.module) || []), p]);
    return Array.from(grouped.entries());
  }, [platformPermissions]);
  const matrixRole = platformRoles.find((r) => r.code === selectedMatrixRole) || platformRoles[0];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  if (userId) {
    const user = safeUsers.find((u) => u.id === userId);
    return (
      <AdminPermissionGate module="users" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Identity Inspection"
            title={user ? user.name : `User ${userId}`}
            subtitle="Inspect tenant association, MFA compliance, and active sessions. Credentials and secret hashes are strictly masked."
            actions={
              <Link href="/admin/users">
                <Button variant="outline" size="sm">Back to Users</Button>
              </Link>
            }
          />
          {!user ? (
            <EmptyPanel title="User not found" description="No platform identity matches this ID." />
          ) : (
            <SectionPanel title="Identity Security Profile" right={<StatusPill status={user.status} />}>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                <div><span className="text-slate-400">User ID</span><p className="font-mono font-bold break-all">{user.id}</p></div>
                <div><span className="text-slate-400">Email</span><p className="font-semibold break-all">{user.email}</p></div>
                <div><span className="text-slate-400">Category</span><p className="font-bold">{user.category}</p></div>
                <div><span className="text-slate-400">Associated Tenant</span><p>{user.tenantName || 'Global'}</p></div>
                <div><span className="text-slate-400">MFA Enforcement</span><p><StatusPill status={user.mfaEnabled ? 'ACTIVE' : 'PENDING'} /></p></div>
                <div><span className="text-slate-400">Active Sessions</span><p className="font-bold">{user.activeSessionsCount}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                  disabled={!canManageUsers}
                  onClick={async () => {
                    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                    if (await updateUserStatus(user.id, next)) notify(`User ${user.email} marked ${next}.`);
                  }}
                >
                  {user.status === 'ACTIVE' ? 'Suspend User' : 'Reactivate User'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canManageUsers || user.activeSessionsCount === 0}
                  onClick={() => {
                    revokeUserSessions(user.id);
                    notify(`Revoked ${user.activeSessionsCount} session(s) for ${user.email}.`);
                  }}
                >
                  Revoke Active Sessions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    recordAudit('PASSWORD_RESET_DISPATCHED', user.email, 'Initiated standard password reset token workflow');
                    notify('Triggered secure password-reset email flow (never sets password manually).');
                  }}
                >
                  Send Password Reset Flow
                </Button>
              </div>
            </SectionPanel>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeUsers.filter((u) => {
      const matchCat =
        tab === 'staff'
          ? u.category === 'SUPER_ADMIN' || u.category === 'PLATFORM_STAFF'
          : tab === 'invitations'
          ? u.status === 'PENDING_VERIFICATION'
          : catFilter === 'ALL' || u.category === catFilter;
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.tenantName || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [safeUsers, search, catFilter, tab]);

  return (
    <AdminPermissionGate module={tab.startsWith('staff') || tab === 'permissions' ? 'staff' : 'users'} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Identity & Access Management"
          title="Platform Users, Staff & Granular RBAC Matrix"
          subtitle="Govern all 5 user tiers across multi-tenant organizations, enforce MFA on privileged staff roles, and manage permissions."
        />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          {[
            ['users', 'All Users (100)', '/admin/users'],
            ['invitations', 'Pending Invitations', '/admin/users/invitations'],
            ['staff', 'Platform Staff', '/admin/staff'],
            ['staff-roles', 'Staff Roles & Custom', '/admin/staff/roles'],
            ['permissions', 'Permissions Matrix', '/admin/staff/permissions'],
          ].map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as UsersStaffTab)}
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
          <MetricCard label="Total Platform Identities" value={safeUsers.length} icon={<Users className="w-4 h-4" />} />
          <MetricCard label="Brand Owners & Staff" value={safeUsers.filter((u) => u.category.startsWith('BRAND')).length} icon={<UserCheck className="w-4 h-4" />} />
          <MetricCard label="Platform Staff + Super Admins" value={safeUsers.filter((u) => u.category === 'SUPER_ADMIN' || u.category === 'PLATFORM_STAFF').length} icon={<ShieldCheck className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="MFA Enabled Accounts" value={safeUsers.filter((u) => u.mfaEnabled).length} icon={<KeyRound className="w-4 h-4 text-emerald-600" />} />
        </div>

        {(tab === 'users' || tab === 'invitations' || tab === 'staff') && (
          <SectionPanel
            title={tab === 'staff' ? 'Platform Staff & Administrators' : tab === 'invitations' ? 'Pending Verification Invitations' : 'Global User Directory'}
            right={
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search user name, email, tenant..."
                    className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
                {tab === 'users' && (
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="w-full sm:w-auto rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="PLATFORM_STAFF">Platform Staff</option>
                    <option value="BRAND_OWNER">Brand Owner</option>
                    <option value="BRAND_STAFF">Brand Staff</option>
                    <option value="MARKETPLACE_CUSTOMER">Marketplace Customer</option>
                  </select>
                )}
              </div>
            }
          >
            <div className="sm:hidden space-y-2.5 text-xs">
              {filteredUsers.slice(0, 40).map((u) => (
                <div key={u.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/users/${u.id}`} className="font-bold text-slate-900 hover:text-indigo-600 truncate block">
                        {u.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 break-all">{u.email}</p>
                    </div>
                    <StatusPill status={u.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{u.category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{u.tenantName || 'Global'}</span>
                    <span>•</span>
                    <span>MFA: {u.mfaEnabled ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">{u.lastLoginAt}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/admin/users/${u.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">Inspect</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canManageUsers}
                        onClick={() =>
                          setConfirmTarget({
                            title: `${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'} ${u.email}?`,
                            desc: 'Updates user access state across JWT authentication boundaries.',
                            onRun: async () => {
                              setConfirmTarget(null);
                              if (await updateUserStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')) notify(`Updated ${u.email}.`);
                            },
                          })
                        }
                        className="h-7 px-2 text-[11px]"
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Category / Role</th>
                    <th className="py-2 pr-4">Tenant Context</th>
                    <th className="py-2 pr-4">MFA</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Last Login</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.slice(0, 40).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-4">
                        <Link href={`/admin/users/${u.id}`} className="font-bold text-slate-900 hover:text-indigo-600">
                          {u.name}
                        </Link>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <p className="font-semibold text-slate-800">{u.category.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-400">{u.roleLabel}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{u.tenantName}</td>
                      <td className="py-2.5 pr-4">
                        <StatusPill status={u.mfaEnabled ? 'ACTIVE' : 'DISABLED'} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">{u.lastLoginAt}</td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex gap-1.5">
                          <Link href={`/admin/users/${u.id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]">Inspect</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canManageUsers}
                            onClick={() =>
                              setConfirmTarget({
                                title: `${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'} ${u.email}?`,
                                desc: 'Updates user access state across JWT authentication boundaries.',
                                onRun: async () => {
                                  setConfirmTarget(null);
                                  if (await updateUserStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')) notify(`Updated ${u.email}.`);
                                },
                              })
                            }
                            className="h-7 px-2 text-[11px]"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        )}

        {isRoleTab && (
          <div className="space-y-6">
            <p className="text-xs text-slate-600 flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Roles and permissions are defined in the backend and enforced on every request. This page shows what the
              backend enforces; it cannot be edited here.
            </p>

            {catalogLoading && <p className="text-xs text-slate-500">Loading roles from the backend...</p>}
            {catalogError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{catalogError}</div>
            )}

            {catalog && (
              <>
                <SectionPanel title="Platform Roles" subtitle="Roles marked MFA require multi-factor sign-in.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {platformRoles.map((r) => {
                      const staffCount = safeUsers.filter((u) => u.roleLabel === r.code).length;
                      return (
                        <div key={r.code} className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-slate-900">{r.name}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {r.code === rbac.role && <StatusPill status="ACTIVE" />}
                              {r.mfaRequired && <StatusPill status="VERIFIED" />}
                            </div>
                          </div>
                          <p className="text-slate-500">{r.description}</p>
                          <p className="text-[11px] text-slate-400">
                            <code>{r.code}</code> • {r.permissions.includes('*:*') ? 'All permissions' : `${r.permissions.length} permissions`} • {staffCount} {staffCount === 1 ? 'user' : 'users'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </SectionPanel>

                <SectionPanel
                  title="Permission Matrix"
                  subtitle="What each platform role is allowed to do."
                  right={
                    <select
                      value={matrixRole?.code || ''}
                      onChange={(e) => setSelectedMatrixRole(e.target.value)}
                      className="w-full sm:w-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                    >
                      {platformRoles.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  }
                >
                  {matrixRole && (
                    <div className="space-y-3 text-xs">
                      {permissionsByModule.map(([mod, perms]) => (
                        <div key={mod} className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <p className="font-bold uppercase text-[11px] text-slate-800">{mod}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {perms.map((p) => {
                              const allowed = hasBackendPermission(matrixRole.permissions, `${p.module}:${p.action}`);
                              return (
                                <div
                                  key={p.action}
                                  className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${
                                    allowed ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-400'
                                  }`}
                                >
                                  <span className="font-bold w-3 shrink-0">{allowed ? '\u2713' : '\u2013'}</span>
                                  <span>
                                    <code className="font-semibold">{p.action}</code> — {p.description}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionPanel>
              </>
            )}
          </div>
        )}

        <ConfirmActionDialog
          open={Boolean(confirmTarget)}
          title={confirmTarget?.title || ''}
          description={confirmTarget?.desc || ''}
          onConfirm={() => confirmTarget?.onRun()}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

