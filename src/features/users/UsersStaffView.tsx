'use client';

import React, { useMemo, useState } from 'react';
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
import {
  ALL_PLATFORM_ACTIONS,
  ALL_PLATFORM_MODULES,
  canAdminPerform,
  DEFAULT_ADMIN_PERMISSIONS,
  ROLE_METADATA,
} from '../../config/permissions';
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
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const customRoles = usePlatformStore((s) => s.customRoles);
  const users = usePlatformStore((s) => s.users);
  const updateUserStatus = usePlatformStore((s) => s.updateUserStatus);
  const revokeUserSessions = usePlatformStore((s) => s.revokeUserSessions);
  const toggleRolePermission = usePlatformStore((s) => s.toggleRolePermission);
  const createCustomRole = usePlatformStore((s) => s.createCustomRole);
  const recordAudit = usePlatformStore((s) => s.recordAudit);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<UsersStaffTab>(initialTab);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedMatrixRole, setSelectedMatrixRole] = useState('OPERATIONS_MANAGER');
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleSummary, setCustomRoleSummary] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<{
    title: string;
    desc: string;
    onRun: () => void;
  } | null>(null);

  const canManageUsers = canAdminPerform(activeRole, 'users', 'manage_users', roleOverrides);
  const safeUsers = mounted ? users : [];
  const allRolesMap = {
    ...ROLE_METADATA,
    ...Object.fromEntries(customRoles.map((r) => [r.id, r])),
  };

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div><span className="text-slate-400">User ID</span><p className="font-mono font-bold">{user.id}</p></div>
                <div><span className="text-slate-400">Email</span><p className="font-semibold">{user.email}</p></div>
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
                  onClick={() => {
                    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                    updateUserStatus(user.id, next);
                    notify(`User ${user.email} marked ${next}.`);
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

        <div className="flex flex-wrap gap-1.5">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                tab === id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Platform Identities" value={safeUsers.length} icon={<Users className="w-4 h-4" />} />
          <MetricCard label="Brand Owners & Staff" value={safeUsers.filter((u) => u.category.startsWith('BRAND')).length} icon={<UserCheck className="w-4 h-4" />} />
          <MetricCard label="Platform Staff + Super Admins" value={safeUsers.filter((u) => u.category === 'SUPER_ADMIN' || u.category === 'PLATFORM_STAFF').length} icon={<ShieldCheck className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="MFA Enabled Accounts" value={safeUsers.filter((u) => u.mfaEnabled).length} icon={<KeyRound className="w-4 h-4 text-emerald-600" />} />
        </div>

        {(tab === 'users' || tab === 'invitations' || tab === 'staff') && (
          <SectionPanel
            title={tab === 'staff' ? 'Platform Staff & Administrators' : tab === 'invitations' ? 'Pending Verification Invitations' : 'Global User Directory'}
            right={
              <div className="flex flex-wrap gap-2">
                <div className="relative w-56">
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
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white font-semibold"
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
            <div className="overflow-x-auto max-h-[520px]">
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
                                onRun: () => {
                                  updateUserStatus(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                  setConfirmTarget(null);
                                  notify(`Updated ${u.email}.`);
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

        {(tab === 'staff-roles' || tab === 'roles' || tab === 'permissions') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SectionPanel className="lg:col-span-7" title="Built-in & Custom Platform Roles" subtitle="Privileged roles enforce mandatory MFA verification.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(allRolesMap).map(([key, meta]) => (
                    <div key={key} className="p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{meta.label}</p>
                        {meta.mfaRequired && <StatusPill status="VERIFIED" />}
                      </div>
                      <p className="text-slate-500">{meta.summary}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel className="lg:col-span-5" title="Define Custom Platform Role">
                <form
                  className="space-y-3 text-xs"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customRoleName.trim()) return;
                    const id = customRoleName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
                    createCustomRole({
                      id,
                      label: customRoleName.trim(),
                      summary: customRoleSummary.trim() || 'Custom delegated platform role.',
                      mfaRequired: true,
                    });
                    setSelectedMatrixRole(id);
                    setCustomRoleName('');
                    setCustomRoleSummary('');
                    notify(`Created custom role ${id}. Configure module checkboxes below.`);
                  }}
                >
                  <input
                    required
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    placeholder="Role Title (e.g. Regional Compliance Lead)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <input
                    value={customRoleSummary}
                    onChange={(e) => setCustomRoleSummary(e.target.value)}
                    placeholder="Operational scope summary..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <Button type="submit" disabled={!canManageUsers} size="sm" className="w-full gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Custom Role
                  </Button>
                </form>
              </SectionPanel>
            </div>

            <SectionPanel
              title="19-Module x 11-Action RBAC Matrix"
              subtitle="Use the top-bar Role Tester dropdown to verify permission enforcement across navigation and guarded actions."
              right={
                <select
                  value={selectedMatrixRole}
                  onChange={(e) => setSelectedMatrixRole(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                >
                  {Object.entries(allRolesMap).map(([k, v]) => (
                    <option key={k} value={k}>
                      Editing: {v.label}
                    </option>
                  ))}
                </select>
              }
            >
              {selectedMatrixRole === 'SUPER_ADMIN' && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 pb-2">
                  <Lock className="w-3.5 h-3.5" /> Root Super Admin permissions are locked to prevent accidental lockout.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                      <th className="py-2 pr-3">Module</th>
                      {ALL_PLATFORM_ACTIONS.map((a) => (
                        <th key={a} className="py-2 px-1.5 text-center">{a.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ALL_PLATFORM_MODULES.map((mod) => {
                      const effective =
                        roleOverrides[selectedMatrixRole]?.[mod] ||
                        DEFAULT_ADMIN_PERMISSIONS[selectedMatrixRole]?.[mod] ||
                        [];
                      return (
                        <tr key={mod}>
                          <td className="py-2 pr-3 font-bold uppercase text-slate-800">{mod}</td>
                          {ALL_PLATFORM_ACTIONS.map((act) => {
                            const checked =
                              selectedMatrixRole === 'SUPER_ADMIN' || effective.includes(act);
                            return (
                              <td key={act} className="py-2 px-1.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!canManageUsers || selectedMatrixRole === 'SUPER_ADMIN'}
                                  onChange={() => toggleRolePermission(selectedMatrixRole, mod, act)}
                                  className="rounded border-slate-300 text-indigo-600"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionPanel>
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

