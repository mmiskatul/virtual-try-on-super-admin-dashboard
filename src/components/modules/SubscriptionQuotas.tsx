'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../../lib/api';

const PLANS = ['STARTER', 'PRO', 'ENTERPRISE'] as const;

const LEDGER_STYLE: Record<string, string> = {
  RESERVED: 'bg-gray-100 text-black',
  CONSUMED: 'bg-emerald-500/20 text-emerald-700',
  RELEASED: 'bg-gray-300/20 text-gray-700'
};
const JOB_STYLE: Record<string, string> = {
  QUEUED: 'bg-gray-300/20 text-gray-700',
  PROCESSING: 'bg-gray-100 text-black',
  COMPLETED: 'bg-emerald-500/20 text-emerald-700',
  FAILED: 'bg-red-500/20 text-red-700'
};

function Pill({ value, styles }: { value: string; styles: Record<string, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[value] || 'bg-gray-200 text-gray-700'}`}>
      {value}
    </span>
  );
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

export function SubscriptionQuotas() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ plan: 'STARTER', tryOnMonthlyQuota: 0, productLimit: 0 });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const usage = useQuery({ queryKey: ['admin-usage'], queryFn: superAdminApi.getUsageSummary, refetchInterval: 15000 });
  const ledger = useQuery({
    queryKey: ['admin-ledger', selected],
    queryFn: () => superAdminApi.getUsageLedger(selected || undefined, 25),
    refetchInterval: 15000
  });
  const jobs = useQuery({
    queryKey: ['admin-generations', selected],
    queryFn: () => superAdminApi.getGenerations(selected || undefined, 25),
    refetchInterval: 15000
  });

  const rows: any[] = usage.data || [];
  const nameOf = (id: string) => rows.find(r => r.tenantId === id)?.name || id;

  const startEdit = (r: any) => {
    setEditing(r.tenantId);
    setMessage(null);
    setForm({ plan: r.plan || 'STARTER', tryOnMonthlyQuota: r.quota, productLimit: r.productLimit });
  };

  const save = async (tenantId: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await superAdminApi.updateTenantPlan(tenantId, {
        plan: form.plan,
        tryOnMonthlyQuota: Number(form.tryOnMonthlyQuota),
        productLimit: Number(form.productLimit)
      });
      setEditing(null);
      setMessage({ ok: true, text: 'Plan updated and recorded in the audit log.' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-usage'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
      ]);
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Could not update plan.' });
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-24 px-2 py-1 rounded bg-white border border-gray-300 text-xs text-gray-900';

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl p-3 text-xs ${message.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="admin-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-gray-900">Shop Usage &amp; Quotas</h3>
        {usage.isError && <p className="text-xs text-red-700">Could not load usage. Check the backend connection.</p>}
        {usage.isLoading && <p className="text-xs text-gray-500">Loading…</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-2 pr-3">Shop</th>
                <th className="pr-3">Plan</th>
                <th className="pr-3 min-w-[170px]">Try-on usage</th>
                <th className="pr-3">Jobs (done / failed / total)</th>
                <th className="pr-3">Ledger (res / cons / rel)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isEditing = editing === r.tenantId;
                const bar = r.percentUsed >= 100 ? 'bg-red-500' : r.percentUsed >= 80 ? 'bg-black' : 'bg-emerald-500';
                return (
                  <tr key={r.tenantId} className="border-b border-gray-200 align-top">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-gray-900">{r.name}</div>
                      <div className="text-gray-500">{r.tenantStatus}</div>
                    </td>
                    <td className="pr-3">
                      {isEditing ? (
                        <select className={input} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <span className="text-black font-bold">{r.plan || '-'}</span>
                      )}
                    </td>
                    <td className="pr-3">
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="block text-gray-500">Monthly quota
                            <input type="number" min={0} className={`${input} ml-2`} value={form.tryOnMonthlyQuota}
                              onChange={e => setForm({ ...form, tryOnMonthlyQuota: Number(e.target.value) })} />
                          </label>
                          <label className="block text-gray-500">Product limit
                            <input type="number" min={0} className={`${input} ml-2`} value={form.productLimit}
                              onChange={e => setForm({ ...form, productLimit: Number(e.target.value) })} />
                          </label>
                        </div>
                      ) : (
                        <>
                          <div className="text-gray-800">{r.used} / {r.quota} <span className="text-gray-500">({r.remaining} left)</span></div>
                          <div className="h-1.5 mt-1 rounded bg-gray-100 overflow-hidden">
                            <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, r.percentUsed)}%` }} />
                          </div>
                        </>
                      )}
                    </td>
                    <td className="pr-3 text-gray-700">
                      {r.generations.completed} / {r.generations.failed} / {r.generations.total}
                    </td>
                    <td className="pr-3 text-gray-700">
                      {r.ledger.reserved} / {r.ledger.consumed} / {r.ledger.released}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button disabled={saving} onClick={() => save(r.tenantId)} className="px-2.5 py-1 rounded bg-black text-white font-bold disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditing(null)} className="ml-2 px-2.5 py-1 rounded border border-gray-300 text-gray-700">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(r)} className="px-2.5 py-1 rounded border border-gray-300 text-gray-800 hover:border-black">Change plan</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!usage.isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-500">No shops yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-500">Filter ledger and jobs by shop:</span>
        <select className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-900" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">All shops</option>
          {rows.map(r => <option key={r.tenantId} value={r.tenantId}>{r.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="admin-card rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-base text-gray-900">Usage Ledger</h3>
          {(ledger.data || []).map((l: any) => (
            <div key={l.id} className="p-3 rounded-xl bg-white border border-gray-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <div className="font-mono text-black truncate">{l.generationId}</div>
                <div className="text-gray-500">{nameOf(l.tenantId)} • {l.billingPeriod} • {fmt(l.createdAt)}</div>
              </div>
              <div className="text-right shrink-0">
                <Pill value={l.status} styles={LEDGER_STYLE} />
                <div className="text-gray-500 mt-1">{l.finalUnits ?? '-'} / {l.reservedUnits} units</div>
              </div>
            </div>
          ))}
          {!ledger.isLoading && (ledger.data || []).length === 0 && <p className="text-xs text-gray-500">No ledger entries yet.</p>}
        </div>

        <div className="admin-card rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-base text-gray-900">Recent Generations</h3>
          {(jobs.data || []).map((j: any) => (
            <div key={j.id} className="p-3 rounded-xl bg-white border border-gray-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <div className="font-mono text-black truncate">{j.id}</div>
                <div className="text-gray-500">{nameOf(j.tenantId)} • {j.category} • {fmt(j.createdAt)}</div>
                {j.errorCode && <div className="text-red-700 mt-0.5">{j.errorCode}</div>}
              </div>
              <Pill value={j.status} styles={JOB_STYLE} />
            </div>
          ))}
          {!jobs.isLoading && (jobs.data || []).length === 0 && <p className="text-xs text-gray-500">No generations yet.</p>}
        </div>
      </div>
    </div>
  );
}
