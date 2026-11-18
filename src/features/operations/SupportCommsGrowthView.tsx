'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  LifeBuoy,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import type { SupportTicketRecord } from '../../types';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  AdminPageHeader,
  AdminPermissionGate,
  EmptyPanel,
  MetricCard,
  SectionPanel,
  StatusPill,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';

export type SupportCommsTab = 'support-overview' | 'tickets';

export function SupportCommsGrowthView({
  initialTab = 'support-overview',
  ticketId,
}: {
  initialTab?: SupportCommsTab;
  ticketId?: string;
}) {
  const mounted = useMounted();
  const tickets = usePlatformStore((s) => s.tickets);
  const updateTicket = usePlatformStore((s) => s.updateTicket);
  const addTicketMessage = usePlatformStore((s) => s.addTicketMessage);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<SupportCommsTab>(initialTab);
  const [replyText, setReplyText] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);

  const safeTickets = mounted ? tickets : [];

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  if (ticketId) {
    const tkt = safeTickets.find((t) => t.id === ticketId);
    return (
      <AdminPermissionGate module="support" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Support Operations"
            title={tkt ? `${tkt.id} — ${tkt.subject}` : `Ticket ${ticketId}`}
            subtitle={tkt ? `Requester: ${tkt.requesterName} (${tkt.requesterEmail}) • Tenant: ${tkt.tenantName || 'Platform'}` : ''}
            actions={
              <Link href="/admin/support/tickets">
                <Button variant="outline" size="sm">Back to Tickets</Button>
              </Link>
            }
          />
          {!tkt ? (
            <EmptyPanel title="Ticket not found" description="No support ticket matched this ID." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SectionPanel className="lg:col-span-8" title="Conversation History & Internal Notes">
                <div className="space-y-3 text-xs">
                  {tkt.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        m.internal
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{m.sender} ({m.role}) {m.internal && '• INTERNAL NOTE'}</span>
                        <span className="text-slate-400 font-normal">{m.at}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{m.text}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write support response or internal staff note..."
                      className="w-full rounded-lg border border-slate-200 p-3 text-xs"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={replyInternal}
                          onChange={(e) => setReplyInternal(e.target.checked)}
                        />
                        <span>Internal Admin Note (hidden from requester)</span>
                      </label>
                      <Button
                        size="sm"
                        disabled={!replyText.trim()}
                        onClick={async () => {
                          if (await addTicketMessage(tkt.id, replyText.trim(), replyInternal)) {
                            setReplyText('');
                            notify(replyInternal ? 'Added internal ticket note.' : 'Logged ticket reply.');
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        Post Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel className="lg:col-span-4" title="Ticket Metadata & Escalation" right={<StatusPill status={tkt.status} />}>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">Priority</span>
                    <p><StatusPill status={tkt.priority} /></p>
                  </div>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Status</span>
                    <select
                      value={tkt.status}
                      onChange={async (e) => {
                        const next = e.target.value as SupportTicketRecord['status'];
                        if (await updateTicket(tkt.id, { status: next })) {
                          notify(`Ticket ${tkt.id} updated to ${next}.`);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 bg-white font-semibold"
                    >
                      {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </label>
                  {tkt.tenantId && (
                    <Link href={`/admin/tenants/${tkt.tenantId}`} className="block text-indigo-600 font-bold hover:underline">
                      Inspect Related Tenant &rarr;
                    </Link>
                  )}
                  {tkt.relatedJobId && (
                    <Link href={`/admin/try-on/jobs/${tkt.relatedJobId}`} className="block text-indigo-600 font-bold hover:underline">
                      Inspect Related Try-On Job ({tkt.relatedJobId}) &rarr;
                    </Link>
                  )}
                </div>
              </SectionPanel>
            </div>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  return (
    <AdminPermissionGate module="support" action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Tenant & Customer Support"
          title="Support Helpdesk"
          subtitle="Triage tenant and customer tickets, reply, and escalate."
        />

        <>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
              {[
                ['support-overview', 'Support Dashboard', '/admin/support'],
                ['tickets', 'All Tickets', '/admin/support/tickets'],
              ].map(([id, lbl, href]) => (
                <Link
                  key={id}
                  href={href}
                  onClick={() => setTab(id as SupportCommsTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap shrink-0 ${
                    tab === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {lbl}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard label="Open / Escalated Tickets" value={safeTickets.filter((t) => ['OPEN', 'ESCALATED', 'IN_PROGRESS'].includes(t.status)).length} icon={<LifeBuoy className="w-4 h-4 text-rose-600" />} />
              <MetricCard label="Critical / High Priority" value={safeTickets.filter((t) => ['CRITICAL', 'HIGH'].includes(t.priority) && !['RESOLVED', 'CLOSED'].includes(t.status)).length} icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} />
              <MetricCard label="Waiting on Customer" value={safeTickets.filter((t) => t.status === 'WAITING_CUSTOMER').length} icon={<MessageSquare className="w-4 h-4" />} />
              <MetricCard label="Resolved / Closed" value={safeTickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length} icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} />
            </div>

            <SectionPanel title="Support Queue">
                <div className="sm:hidden space-y-2.5 text-xs">
                  {safeTickets.map((t) => (
                    <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/support/tickets/${t.id}`} className="font-bold text-indigo-700 hover:underline line-clamp-2 leading-snug">
                            {t.id} — {t.subject}
                          </Link>
                          <p className="text-[11px] text-slate-500 mt-0.5">{t.requesterName} ({t.tenantName || 'Platform'})</p>
                        </div>
                        <StatusPill status={t.status} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-600">{t.category}</span>
                          <StatusPill status={t.priority} />
                        </div>
                        <Link href={`/admin/support/tickets/${t.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">Inspect</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 pr-4">Ticket</th>
                        <th className="py-2 pr-4">Requester / Tenant</th>
                        <th className="py-2 pr-4">Category</th>
                        <th className="py-2 pr-4">Priority</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeTickets.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2.5 pr-4">
                            <Link href={`/admin/support/tickets/${t.id}`} className="font-bold text-indigo-700 hover:underline">
                              {t.id} — {t.subject}
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4">{t.requesterName} ({t.tenantName || 'Platform'})</td>
                          <td className="py-2.5 pr-4">{t.category}</td>
                          <td className="py-2.5 pr-4"><StatusPill status={t.priority} /></td>
                          <td className="py-2.5 pr-4"><StatusPill status={t.status} /></td>
                          <td className="py-2.5 text-right">
                            <Link href={`/admin/support/tickets/${t.id}`}>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]">Inspect</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionPanel>
        </>
      </div>
    </AdminPermissionGate>
  );
}

