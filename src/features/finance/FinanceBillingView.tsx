'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
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

export type FinanceTab =
  | 'overview'
  | 'payments'
  | 'transactions'
  | 'invoices'
  | 'refunds'
  | 'failed-payments'
  | 'reconciliation';

export function FinanceBillingView({
  initialTab = 'overview',
}: {
  initialTab?: FinanceTab;
}) {
  const mounted = useMounted();
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const transactions = usePlatformStore((s) => s.transactions);
  const invoices = usePlatformStore((s) => s.invoices);
  const refunds = usePlatformStore((s) => s.refunds);
  const reconciliations = usePlatformStore((s) => s.reconciliations);
  const updateRefundStatus = usePlatformStore((s) => s.updateRefundStatus);
  const updateReconciliationStatus = usePlatformStore((s) => s.updateReconciliationStatus);
  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<FinanceTab>(initialTab);
  const [confirmRefund, setConfirmRefund] = useState<{ id: string; amount: number } | null>(null);

  const canRefund = canAdminPerform(activeRole, 'finance', 'refund', roleOverrides);
  const safeTx = mounted ? transactions : [];
  const safeInv = mounted ? invoices : [];
  const safeRefunds = mounted ? refunds : [];
  const safeRecon = mounted ? reconciliations : [];

  const gross = safeTx.filter((t) => t.status === 'SUCCEEDED').reduce((s, t) => s + t.amount, 0);
  const refundedSum = safeRefunds
    .filter((r) => r.status === 'COMPLETED_BY_PROVIDER')
    .reduce((s, r) => s + r.amount, 0);
  const net = gross - refundedSum;
  const failedCount = safeTx.filter((t) => t.status === 'FAILED').length;
  const unresolvedRecon = safeRecon.filter((r) => r.status !== 'RESOLVED').length;

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  return (
    <AdminPermissionGate module="finance" action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Billing & Financial Operations"
          title="Revenue, Transactions, Refunds & Reconciliation"
          subtitle="Audit Stripe / SSLCommerz / bKash billing settlements, process authorized refunds, and resolve provider webhook exceptions."
        />

        <div className="flex flex-wrap gap-1.5">
          {[
            ['overview', 'Financial Overview', '/admin/finance'],
            ['transactions', 'Transactions', '/admin/finance/transactions'],
            ['invoices', 'Invoices', '/admin/finance/invoices'],
            ['refunds', 'Refunds', '/admin/finance/refunds'],
            ['failed-payments', 'Failed Payments', '/admin/finance/failed-payments'],
            ['reconciliation', 'Reconciliation', '/admin/finance/reconciliation'],
          ].map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as FinanceTab)}
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

        <InlineAlert tone="info">
          <span>
            <strong>Financial Safeguards Active:</strong> Raw card PAN/CVV numbers are never persisted in this control plane. Refund completion strictly waits for payment provider webhook/API confirmation.
          </span>
        </InlineAlert>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Settled Sample Revenue" value={`$${gross.toFixed(2)}`} icon={<DollarSign className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Net Settled" value={`$${net.toFixed(2)}`} icon={<CreditCard className="w-4 h-4 text-indigo-600" />} />
          <MetricCard label="Failed Payments" value={failedCount} positive={failedCount === 0} icon={<AlertCircle className="w-4 h-4 text-rose-600" />} />
          <MetricCard label="Open Reconciliations" value={unresolvedRecon} positive={unresolvedRecon === 0} icon={<RotateCcw className="w-4 h-4 text-amber-600" />} />
        </div>

        {(tab === 'overview' || tab === 'payments' || tab === 'transactions' || tab === 'failed-payments') && (
          <SectionPanel title={tab === 'failed-payments' ? 'Failed Payment Incidents' : 'Payment Transactions Ledger'}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Transaction ID</th>
                    <th className="py-2 pr-4">Tenant</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Provider Ref</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(tab === 'failed-payments' ? safeTx.filter((t) => t.status === 'FAILED') : safeTx).map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4 font-mono font-bold text-slate-900">{t.id}</td>
                      <td className="py-2.5 pr-4 font-bold">{t.tenantName}</td>
                      <td className="py-2.5 pr-4">{t.type.replace('_', ' ')}</td>
                      <td className="py-2.5 pr-4 font-mono text-slate-500">{t.provider} • {t.providerRef}</td>
                      <td className="py-2.5 pr-4 font-bold">${t.amount.toFixed(2)}</td>
                      <td className="py-2.5 pr-4">
                        <StatusPill status={t.status} />
                        {t.failureReason && <span className="ml-1.5 text-[11px] text-rose-700">{t.failureReason}</span>}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{t.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        )}

        {(tab === 'overview' || tab === 'invoices') && (
          <SectionPanel title="Platform Subscription Invoices">
            <div className="space-y-2 text-xs">
              {safeInv.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{inv.id} — {inv.tenantName}</p>
                    <p className="text-slate-500">Period: {inv.period} • Tax: ${inv.taxAmount} • Due {inv.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">${inv.total.toFixed(2)} {inv.currency}</span>
                    <StatusPill status={inv.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([`Invoice ${inv.id}\nTenant: ${inv.tenantName}\nTotal: $${inv.total}\nStatus: ${inv.status}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${inv.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {(tab === 'overview' || tab === 'refunds') && (
          <SectionPanel title="Refund Approval & Provider Confirmation Queue" subtitle="Never marked completed until payment gateway confirms settlement.">
            <div className="space-y-2 text-xs">
              {safeRefunds.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">{r.id} ({r.transactionId}) — {r.tenantName}</p>
                    <p className="text-slate-500">{r.reason} • Requested by {r.requestedBy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">${r.amount.toFixed(2)}</span>
                    <StatusPill status={r.status} />
                    {r.status === 'REQUESTED' && (
                      <Button
                        size="sm"
                        disabled={!canRefund}
                        onClick={() => setConfirmRefund({ id: r.id, amount: r.amount })}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        Authorize Provider Refund
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {(tab === 'overview' || tab === 'reconciliation') && (
          <SectionPanel title="Billing Reconciliation Exceptions" subtitle="Track webhook gaps and settlement amount mismatches.">
            <div className="space-y-2 text-xs">
              {safeRecon.map((rec) => (
                <div key={rec.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">{rec.id} — {rec.provider} ({rec.type})</p>
                    <p className="text-slate-500">{rec.notes} • Expected ${rec.expectedAmount}, Provider ${rec.providerAmount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={rec.status} />
                    {rec.status !== 'RESOLVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateReconciliationStatus(rec.id, 'RESOLVED');
                          notify(`Resolved reconciliation exception ${rec.id}.`);
                        }}
                        className="h-7 px-2 text-[11px]"
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        <ConfirmActionDialog
          open={Boolean(confirmRefund)}
          title={`Authorize Provider Refund ($${confirmRefund?.amount.toFixed(2)})?`}
          description="Sends refund authorization to the provider queue. Status remains APPROVED_PENDING_PROVIDER until settlement webhook confirmation."
          requireReason
          twoPersonApprovalNote={
            confirmRefund && confirmRefund.amount >= 500
              ? 'Refunds $500+ require secondary finance officer approval.'
              : undefined
          }
          confirmLabel="Submit to Provider Queue"
          onConfirm={() => {
            if (confirmRefund) {
              updateRefundStatus(confirmRefund.id, 'APPROVED_PENDING_PROVIDER');
              notify(`Queued ${confirmRefund.id} awaiting provider confirmation.`);
            }
            setConfirmRefund(null);
          }}
          onCancel={() => setConfirmRefund(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

