'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TenantItem } from '../../types';

interface TenantGovernanceProps {
  tenants: TenantItem[];
  onToggleStatus: (tenantId: string) => void;
  onOpenAddTenant?: () => void;
}

export function TenantGovernance({ tenants, onToggleStatus, onOpenAddTenant }: TenantGovernanceProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.owner.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Filter brands by name, owner, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            All Tenants
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'SUSPENDED' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400'}`}
          >
            Suspended
          </button>
          {onOpenAddTenant && (
            <button
              onClick={onOpenAddTenant}
              className="ml-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
            >
              + Provision Tenant
            </button>
          )}
        </div>
      </div>

      <div className="admin-card rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Tenant Identity</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Plan Tier</th>
              <th className="py-3 px-4">Catalog / Orders</th>
              <th className="py-3 px-4">Revenue</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Governance Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredTenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/20">
                <td className="py-3 px-4">
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{t.slug}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white">{t.owner}</p>
                  <p className="text-[11px] text-slate-400">{t.email}</p>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-amber-400">{t.plan}</td>
                <td className="py-3 px-4 text-slate-300">
                  {t.productsCount} products • {t.ordersCount} orders
                </td>
                <td className="py-3 px-4 font-bold text-emerald-400">${t.gmv}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    t.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onToggleStatus(t.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      t.status === 'ACTIVE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {t.status === 'ACTIVE' ? 'Suspend Tenant' : 'Reactivate Tenant'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
