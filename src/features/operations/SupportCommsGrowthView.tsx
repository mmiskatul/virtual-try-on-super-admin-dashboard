'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  LifeBuoy,
  Mail,
  Megaphone,
  MessageSquare,
  Send,
  TrendingUp,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  AdminPageHeader,
  AdminPermissionGate,
  EmptyPanel,
  InlineAlert,
  MetricCard,
  SectionPanel,
  StatusPill,
} from '../../components/shared/AdminUi';
import { Button } from '../../components/ui/button';

export type SupportCommsTab =
  | 'support-overview'
  | 'tickets'
  | 'knowledge-base'
  | 'communications'
  | 'announcements'
  | 'email'
  | 'templates'
  | 'notifications'
  | 'marketing'
  | 'campaigns'
  | 'referrals'
  | 'affiliates';

export function SupportCommsGrowthView({
  initialTab = 'support-overview',
  ticketId,
}: {
  initialTab?: SupportCommsTab;
  ticketId?: string;
}) {
  const mounted = useMounted();
  const tickets = usePlatformStore((s) => s.tickets);
  const alerts = usePlatformStore((s) => s.alerts);
  const updateTicket = usePlatformStore((s) => s.updateTicket);
  const addTicketMessage = usePlatformStore((s) => s.addTicketMessage);
  const recordAudit = usePlatformStore((s) => s.recordAudit);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<SupportCommsTab>(initialTab);
  const [replyText, setReplyText] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);

  const [announcements, setAnnouncements] = useState([
    { id: 'ann_1', title: 'Gemini 3.6 Flash Try-On Model Active', audience: 'All Brands', status: 'PUBLISHED', date: '2026-11-10' },
  ]);
  const [annTitle, setAnnTitle] = useState('');
  const [annAudience, setAnnAudience] = useState('All Brands');

  const [kbArticles, setKbArticles] = useState([
    { id: 'kb_1', title: 'Custom CNAME & SSL Setup Guide', category: 'Domains', status: 'PUBLISHED' },
    { id: 'kb_2', title: 'Preparing Flat-Lay Garment Photos for VTON', category: 'Virtual Try-On', status: 'PUBLISHED' },
  ]);
  const [kbTitle, setKbTitle] = useState('');

  const safeTickets = mounted ? tickets : [];
  const safeAlerts = mounted ? alerts : [];

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
                    <div className="flex items-center justify-between">
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
                        onClick={() => {
                          addTicketMessage(tkt.id, replyText.trim(), replyInternal);
                          setReplyText('');
                          notify(replyInternal ? 'Added internal ticket note.' : 'Logged ticket reply.');
                        }}
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
                      onChange={(e) => {
                        updateTicket(tkt.id, { status: e.target.value as any });
                        notify(`Ticket ${tkt.id} updated to ${e.target.value}.`);
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

  const groupMode = ['communications', 'announcements', 'email', 'templates', 'notifications'].includes(tab)
    ? 'communications'
    : ['marketing', 'campaigns', 'referrals', 'affiliates'].includes(tab)
    ? 'marketing'
    : 'support';

  return (
    <AdminPermissionGate module={groupMode} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={
            groupMode === 'communications'
              ? 'Platform Communications'
              : groupMode === 'marketing'
              ? 'SaaS Growth & Referrals'
              : 'Tenant & Customer Support'
          }
          title={
            groupMode === 'communications'
              ? 'Announcements, Email Templates & Notifications'
              : groupMode === 'marketing'
              ? 'Platform Growth Campaigns, Referrals & Affiliates'
              : 'Support Helpdesk & Knowledge Base'
          }
          subtitle="Coordinate platform-wide communications, SLA escalations, and affiliate/referral acquisition separately from brand campaigns."
        />

        {groupMode === 'support' && (
          <>
            <div className="flex gap-1.5">
              {[
                ['support-overview', 'Support Dashboard', '/admin/support'],
                ['tickets', 'All Tickets', '/admin/support/tickets'],
                ['knowledge-base', 'Knowledge Base', '/admin/support/knowledge-base'],
              ].map(([id, lbl, href]) => (
                <Link
                  key={id}
                  href={href}
                  onClick={() => setTab(id as SupportCommsTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    tab === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {lbl}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard label="Open / Escalated Tickets" value={safeTickets.filter((t) => ['OPEN', 'ESCALATED', 'IN_PROGRESS'].includes(t.status)).length} icon={<LifeBuoy className="w-4 h-4 text-rose-600" />} />
              <MetricCard label="Sample Avg First Response" value="42 min" icon={<MessageSquare className="w-4 h-4" />} />
              <MetricCard label="Sample Resolution SLA" value="94.2%" icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} />
              <MetricCard label="Published KB Articles" value={kbArticles.length} icon={<BookOpen className="w-4 h-4" />} />
            </div>

            {tab !== 'knowledge-base' ? (
              <SectionPanel title="Support Queue">
                <div className="overflow-x-auto">
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
            ) : (
              <SectionPanel title="Knowledge Base Articles">
                <form
                  className="flex gap-2 pb-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!kbTitle.trim()) return;
                    setKbArticles([{ id: `kb_${Date.now()}`, title: kbTitle.trim(), category: 'Operations', status: 'PUBLISHED' }, ...kbArticles]);
                    setKbTitle('');
                    notify('Published KB article.');
                  }}
                >
                  <input value={kbTitle} onChange={(e) => setKbTitle(e.target.value)} placeholder="New KB guide title..." className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
                  <Button type="submit" size="sm">Publish Guide</Button>
                </form>
                <div className="space-y-2 text-xs">
                  {kbArticles.map((k) => (
                    <div key={k.id} className="p-3 rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-bold">{k.title} ({k.category})</span>
                      <StatusPill status={k.status} />
                    </div>
                  ))}
                </div>
              </SectionPanel>
            )}
          </>
        )}

        {groupMode === 'communications' && (
          <div className="space-y-6">
            <InlineAlert tone="warning">
              <span>
                Email delivery relies on the live SMTP settings under{' '}
                <Link href="/admin/integrations/email" className="underline font-bold">Integrations &rarr; Email / SMTP</Link>. Test email actions never report delivery succeeded unless confirmed by the configured SMTP transport.
              </span>
            </InlineAlert>
            <SectionPanel title="Platform Announcements & Email Templates">
              <form
                className="flex flex-wrap gap-2 pb-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!annTitle.trim()) return;
                  setAnnouncements([{ id: `ann_${Date.now()}`, title: annTitle.trim(), audience: annAudience, status: 'PUBLISHED', date: new Date().toISOString().slice(0, 10) }, ...announcements]);
                  recordAudit('PLATFORM_ANNOUNCEMENT_PUBLISHED', annAudience, annTitle.trim());
                  setAnnTitle('');
                  notify('Published in-app platform announcement.');
                }}
              >
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement headline..." className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
                <select value={annAudience} onChange={(e) => setAnnAudience(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white">
                  <option>All Brands</option>
                  <option>PRO + ENTERPRISE Tiers</option>
                  <option>Platform Staff</option>
                </select>
                <Button type="submit" size="sm" className="gap-1"><Send className="w-3.5 h-3.5" /> Broadcast In-App</Button>
              </form>
              <div className="space-y-2 text-xs">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-slate-200 flex justify-between">
                    <span><strong>{a.title}</strong> • Target: {a.audience} • {a.date}</span>
                    <StatusPill status={a.status} />
                  </div>
                ))}
                {safeAlerts.map((al) => (
                  <div key={al.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                    <span><strong>Alert:</strong> {al.title}</span>
                    <StatusPill status={al.severity} />
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        )}

        {groupMode === 'marketing' && (
          <SectionPanel title="SaaS Acquisition Campaigns, Referrals & Affiliates" subtitle="Separated strictly from individual merchant store promotions.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Dhaka Fashion Week SaaS Trial</p>
                <p className="text-slate-500">Code: DFW2026 • 18 brand signups • 44% trial conversion</p>
                <StatusPill status="ACTIVE" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Agency Referral Partner Program</p>
                <p className="text-slate-500">15% recurring rev-share for 12 months • 9 active agencies</p>
                <StatusPill status="ACTIVE" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Enterprise Studio Migration</p>
                <p className="text-slate-500">500 bonus VTON credits • 3 conversions</p>
                <StatusPill status="ACTIVE" />
              </div>
            </div>
          </SectionPanel>
        )}
      </div>
    </AdminPermissionGate>
  );
}

