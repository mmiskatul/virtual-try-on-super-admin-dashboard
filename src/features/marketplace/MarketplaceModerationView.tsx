'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Flag,
  Globe,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminUiStore } from '../../stores/useAdminUiStore';
import { useMounted } from '../../hooks/useMounted';
import { usePermissions } from '../../hooks/usePermissions';
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

export type MarketplaceCmsTab =
  | 'marketplace-overview'
  | 'products'
  | 'featured'
  | 'cms-dashboard'
  | 'homepage'
  | 'pages'
  | 'banners'
  | 'blog';

type CmsType = 'HOMEPAGE_SECTION' | 'STATIC_PAGE' | 'BANNER' | 'BLOG';

const CMS_TYPE_TABS: Array<{ tab: MarketplaceCmsTab; type: CmsType; label: string; href: string }> = [
  { tab: 'homepage', type: 'HOMEPAGE_SECTION', label: 'Homepage Sections', href: '/admin/cms/homepage' },
  { tab: 'pages', type: 'STATIC_PAGE', label: 'Static Pages', href: '/admin/cms/pages' },
  { tab: 'banners', type: 'BANNER', label: 'Banners', href: '/admin/cms/banners' },
  { tab: 'blog', type: 'BLOG', label: 'Blog & Articles', href: '/admin/cms/blog' },
];

const CMS_TAB_META: Record<string, { title: string; subtitle?: string; noun: string; placeholder: string; slugPrefix: string }> = {
  'cms-dashboard': { title: 'All Platform Content', subtitle: 'Every CMS item across all types. Open a type to add new content.', noun: 'content', placeholder: '', slugPrefix: '' },
  homepage: { title: 'Homepage Sections', noun: 'homepage section', placeholder: 'New homepage section title...', slugPrefix: 'home/' },
  pages: { title: 'Static Pages', noun: 'page', placeholder: 'New page title (e.g. Terms of Service)...', slugPrefix: '' },
  banners: { title: 'Banners', noun: 'banner', placeholder: 'New banner headline...', slugPrefix: 'banners/' },
  blog: { title: 'Blog & Articles', noun: 'article', placeholder: 'New article title...', slugPrefix: 'blog/' },
};

export function MarketplaceModerationView({
  initialTab = 'marketplace-overview',
  productId,
}: {
  initialTab?: MarketplaceCmsTab;
  productId?: string;
}) {
  const mounted = useMounted();
  const { can } = usePermissions();
  const modProducts = usePlatformStore((s) => s.modProducts);
  const cmsPages = usePlatformStore((s) => s.cmsPages);

  const moderateProduct = usePlatformStore((s) => s.moderateProduct);
  const saveCmsPage = usePlatformStore((s) => s.saveCmsPage);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<MarketplaceCmsTab>(initialTab);
  const [newCmsTitle, setNewCmsTitle] = useState('');
  const [confirmReject, setConfirmReject] = useState<{ id: string; name: string } | null>(null);

  const canModerate = can('marketplace', 'approve');
  const canEditCms = can('cms', 'edit');
  const cmsType = CMS_TYPE_TABS.find((t) => t.tab === tab)?.type;
  const cmsTabMeta = CMS_TAB_META[tab] || CMS_TAB_META['cms-dashboard'];

  const safeProducts = mounted ? modProducts : [];
  const safeCms = mounted ? cmsPages : [];
  const visibleCms = cmsType ? safeCms.filter((p) => p.type === cmsType) : safeCms;

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  if (productId) {
    const prod = safeProducts.find((p) => p.productId === productId || p.id === productId);
    return (
      <AdminPermissionGate module="marketplace" action="view">
        <div className="space-y-6">
          <AdminPageHeader
            eyebrow="Marketplace Product Review"
            title={prod ? prod.productName : `Product ${productId}`}
            subtitle="Moderation modifies global marketplace publication visibility only — never altering the merchant's original catalog record."
            actions={
              <Link href="/admin/marketplace/products">
                <Button variant="outline" size="sm">Back to Moderation</Button>
              </Link>
            }
          />
          {!prod ? (
            <EmptyPanel title="Listing not found" description="No marketplace listing matched." />
          ) : (
            <SectionPanel title={`${prod.brandName} — ${prod.category}`} right={<StatusPill status={prod.moderationStatus} />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400">Price</span><p className="font-bold">৳{prod.price}</p></div>
                <div><span className="text-slate-400">Visibility</span><p><StatusPill status={prod.visibility} /></p></div>
                <div><span className="text-slate-400">Featured</span><p>{prod.featured ? 'Featured' : 'Standard'}</p></div>
                <div><span className="text-slate-400">Reports</span><p className="font-bold">{prod.reportsCount}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <Button size="sm" disabled={!canModerate} onClick={async () => { if (await moderateProduct(prod.id, 'APPROVED')) notify('Approved for public marketplace.'); }}>
                  Approve Listing
                </Button>
                <Button size="sm" variant="outline" disabled={!canModerate} onClick={async () => { if (await moderateProduct(prod.id, 'CHANGES_REQUESTED')) notify('Requested listing updates from brand.'); }}>
                  Request Changes
                </Button>
                <Button size="sm" variant="destructive" disabled={!canModerate} onClick={async () => { if (await moderateProduct(prod.id, 'REJECTED')) notify('Rejected from public marketplace.'); }}>
                  Reject & Unpublish
                </Button>
              </div>
            </SectionPanel>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  const isCmsView = ['cms-dashboard', 'homepage', 'pages', 'banners', 'blog'].includes(tab);

  return (
    <AdminPermissionGate module={isCmsView ? 'cms' : 'marketplace'} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={isCmsView ? 'Platform Content & Homepage CMS' : 'Global Marketplace Governance'}
          title={isCmsView ? 'Platform CMS & Homepage Content' : 'Marketplace Moderation'}
          subtitle="Approve, flag or reject published brand listings, feature products, and manage platform homepage content."
        />

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
          {(isCmsView
            ? [
                ['cms-dashboard', 'CMS Dashboard', '/admin/cms'],
                ['homepage', 'Homepage Builder', '/admin/cms/homepage'],
                ['pages', 'Static Pages', '/admin/cms/pages'],
                ['banners', 'Banners', '/admin/cms/banners'],
                ['blog', 'Blog & Articles', '/admin/cms/blog'],
              ]
            : [
                ['marketplace-overview', 'Overview', '/admin/marketplace'],
                ['products', 'Product Moderation', '/admin/marketplace/products'],
                ['featured', 'Featured Placements', '/admin/marketplace/featured'],
              ]
          ).map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as MarketplaceCmsTab)}
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
          <MetricCard label="Public Approved Listings" value={safeProducts.filter((p) => p.visibility === 'PUBLIC').length} icon={<Globe className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Pending Moderation" value={safeProducts.filter((p) => p.moderationStatus === 'PENDING_REVIEW').length} icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Featured Listings" value={safeProducts.filter((p) => p.featured).length} icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Flagged / Rejected" value={safeProducts.filter((p) => ['CHANGES_REQUESTED', 'REJECTED', 'UNPUBLISHED'].includes(p.moderationStatus)).length} icon={<Flag className="w-4 h-4 text-rose-600" />} />
        </div>

        {(tab === 'marketplace-overview' || tab === 'products' || tab === 'featured') && (
          <SectionPanel title="Marketplace Listing Moderation Queue" subtitle="Moderation unpublishes non-compliant listings without editing the brand's private source product.">
            <div className="sm:hidden space-y-2.5 text-xs">
              {safeProducts
                .filter((p) => (tab === 'featured' ? p.featured : true))
                .map((p) => (
                  <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/admin/marketplace/products/${p.productId}`} className="font-bold text-slate-900 hover:underline line-clamp-2 leading-snug">
                          {p.productName}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.brandName} • {p.category} • ${p.price}</p>
                      </div>
                      <StatusPill status={p.moderationStatus} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600">Reports: <strong>{p.reportsCount}</strong></span>
                      <div className="flex items-center gap-1">
                        {p.sponsored ? <StatusPill status="WARNING" /> : p.featured ? <StatusPill status="ACTIVE" /> : <span className="text-slate-500">Standard</span>}
                        {p.sponsored && <span className="text-[10px] font-bold text-amber-800">SPONSORED</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canModerate}
                        onClick={async () => { if (await moderateProduct(p.id, 'APPROVED', true)) notify(`Approved & featured ${p.productName}.`); }}
                        className="flex-1 h-8 text-[11px]"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canModerate}
                        onClick={() => setConfirmReject({ id: p.id, name: p.productName })}
                        className="flex-1 h-8 text-[11px] text-rose-700"
                      >
                        Unpublish
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Listing</th>
                    <th className="py-2 pr-4">Brand</th>
                    <th className="py-2 pr-4">Category & Price</th>
                    <th className="py-2 pr-4">Reports</th>
                    <th className="py-2 pr-4">Placement</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeProducts
                    .filter((p) => (tab === 'featured' ? p.featured : true))
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-4">
                          <Link href={`/admin/marketplace/products/${p.productId}`} className="font-bold text-slate-900 hover:underline">
                            {p.productName}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 font-semibold">{p.brandName}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{p.category} • ${p.price}</td>
                        <td className="py-2.5 pr-4 font-bold">{p.reportsCount}</td>
                        <td className="py-2.5 pr-4">
                          {p.sponsored ? <StatusPill status="WARNING" /> : p.featured ? <StatusPill status="ACTIVE" /> : 'Standard'}
                          {p.sponsored && <span className="ml-1 text-[10px] font-bold text-amber-800">SPONSORED</span>}
                        </td>
                        <td className="py-2.5 pr-4"><StatusPill status={p.moderationStatus} /></td>
                        <td className="py-2.5 text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canModerate}
                              onClick={async () => { if (await moderateProduct(p.id, 'APPROVED', true)) notify(`Approved & featured ${p.productName}.`); }}
                              className="h-7 px-2 text-[11px]"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canModerate}
                              onClick={() => setConfirmReject({ id: p.id, name: p.productName })}
                              className="h-7 px-2 text-[11px] text-rose-700"
                            >
                              Unpublish
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

        {isCmsView && (
          <SectionPanel title={cmsTabMeta.title} subtitle={cmsTabMeta.subtitle}>
            {tab === 'cms-dashboard' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-3 text-xs">
                {CMS_TYPE_TABS.map((t) => (
                  <Link key={t.tab} href={t.href} onClick={() => setTab(t.tab)} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <p className="text-slate-500">{t.label}</p>
                    <p className="text-xl font-bold text-slate-900">{safeCms.filter((p) => p.type === t.type).length}</p>
                  </Link>
                ))}
              </div>
            )}
            {cmsType && (
              <form
                className="flex flex-col sm:flex-row gap-2 pb-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCmsTitle.trim()) return;
                  const slugBase = newCmsTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  // The backend keys content by slug, so keep slugs unique per type.
                  const slug = `/${cmsTabMeta.slugPrefix}${slugBase}`;
                  const saved = await saveCmsPage({
                    id: `cms_${Date.now()}`,
                    title: newCmsTitle.trim(),
                    slug,
                    type: cmsType,
                    status: 'PUBLISHED',
                    order: visibleCms.length + 1,
                    summary: 'Published platform CMS block.',
                    updatedAt: new Date().toISOString().slice(0, 10),
                  });
                  if (saved) {
                    setNewCmsTitle('');
                    notify(`Saved ${cmsTabMeta.noun}.`);
                  }
                }}
              >
                <input value={newCmsTitle} onChange={(e) => setNewCmsTitle(e.target.value)} placeholder={cmsTabMeta.placeholder} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
                <Button type="submit" size="sm" disabled={!canEditCms || !newCmsTitle.trim()}>Publish</Button>
              </form>
            )}
            <div className="space-y-2 text-xs">
              {visibleCms.length === 0 && (
                <p className="p-3 rounded-lg bg-slate-50 text-slate-500">No {cmsType ? `${cmsTabMeta.noun}s` : 'content'} yet.</p>
              )}
              {visibleCms.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{p.title}</p>
                    <p className="text-slate-500">{p.type} • <code>{p.slug}</code> • Updated {p.updatedAt}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        <ConfirmActionDialog
          open={Boolean(confirmReject)}
          title={`Unpublish "${confirmReject?.name}" from Public Marketplace?`}
          description="Removes public marketplace visibility while leaving the brand's internal catalog intact."
          requireReason
          confirmLabel="Unpublish Listing"
          onConfirm={async () => {
            const target = confirmReject;
            setConfirmReject(null);
            if (target && (await moderateProduct(target.id, 'UNPUBLISHED'))) {
              notify(`Unpublished ${target.name}.`);
            }
          }}
          onCancel={() => setConfirmReject(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

