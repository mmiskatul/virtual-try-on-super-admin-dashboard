import React from 'react';
import { TenantItem } from '../../types';

interface PlatformOverviewProps {
  tenants: TenantItem[];
  totalGMV: number;
  totalTryOnSessions: number;
}

export function PlatformOverview({ tenants, totalGMV, totalTryOnSessions }: PlatformOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <div className="admin-card p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Total Brand Tenants</p>
          <p className="text-3xl font-black text-white mt-2">{tenants.length}</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-bold">{tenants.filter((t) => t.status === 'ACTIVE').length} Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-bold">{tenants.filter((t) => t.status === 'SUSPENDED').length} Suspended</span>
          </div>
        </div>

        <div className="admin-card p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Platform GMV</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">${totalGMV.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-3">Aggregated across all brand checkouts</p>
        </div>

        <div className="admin-card p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">Total Try-On Sessions</p>
          <p className="text-3xl font-black text-purple-400 mt-2">{totalTryOnSessions.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-3">AI inference requests served</p>
        </div>

        <div className="admin-card p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400">AI Service Latency</p>
          <p className="text-3xl font-black text-sky-400 mt-2">30.2 ms</p>
          <p className="text-xs text-slate-400 mt-3">Success rate: 100.0%</p>
        </div>
      </div>

      {/* Quick Tenant Table */}
      <div className="admin-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white">Registered Tenants Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Garments</th>
                <th className="py-3 px-4">Try-On Quota</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-white font-bold">{t.name}</td>
                  <td className="py-3 px-4 text-slate-400">{t.owner} ({t.email})</td>
                  <td className="py-3 px-4 font-mono text-amber-400">{t.plan}</td>
                  <td className="py-3 px-4 text-slate-300">{t.productsCount} items</td>
                  <td className="py-3 px-4 font-mono text-purple-400">{t.tryOnUsed} / {t.tryOnQuota}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
