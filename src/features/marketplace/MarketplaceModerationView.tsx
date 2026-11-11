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
import { canAdminPerform } from '../../config/permissions';
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
  | 'brands'
  | 'categories'
  | 'collections'
  | 'featured'
  | 'reports'
  | 'cms-dashboard'
  | 'homepage'
  | 'pages'
  | 'banners'
  | 'media'
  | 'blog';

export function MarketplaceModerationView({
  initialTab = 'marketplace-overview',
  productId,
}: {
  initialTab?: MarketplaceCmsTab;
  productId?: string;
}) {
  const mounted = useMounted();
  const activeRole = usePlatformStore((s) => s.activeRole);
  const roleOverrides = usePlatformStore((s) => s.roleOverrides);
  const modProducts = usePlatformStore((s) => s.modProducts);
  const modBrands = usePlatformStore((s) => s.modBrands);
  const categories = usePlatformStore((s) => s.categories);
  const collections = usePlatformStore((s) => s.collections);
  const mktReports = usePlatformStore((s) => s.mktReports);
  const cmsPages = usePlatformStore((s) => s.cmsPages);

  const moderateProduct = usePlatformStore((s) => s.moderateProduct);
  const moderateBrand = usePlatformStore((s) => s.moderateBrand);
  const saveCategory = usePlatformStore((s) => s.saveCategory);
  const saveCollection = usePlatformStore((s) => s.saveCollection);
  const resolveMktReport = usePlatformStore((s) => s.resolveMktReport);
  const saveCmsPage = usePlatformStore((s) => s.saveCmsPage);

  const showToast = useAdminUiStore((s) => s.showToast);
  const hideToast = useAdminUiStore((s) => s.hideToast);

  const [tab, setTab] = useState<MarketplaceCmsTab>(initialTab);
  const [newCatName, setNewCatName] = useState('');
  const [newCmsTitle, setNewCmsTitle] = useState('');
  const [confirmReject, setConfirmReject] = useState<{ id: string; name: string } | null>(null);

  const canModerate = canAdminPerform(activeRole, 'marketplace', 'approve', roleOverrides);
  const canEditCms = canAdminPerform(activeRole, 'cms', 'edit', roleOverrides);

  const safeProducts = mounted ? modProducts : [];
  const safeBrands = mounted ? modBrands : [];
  const safeCats = mounted ? categories : [];
  const safeCols = mounted ? collections : [];
  const safeReports = mounted ? mktReports : [];
  const safeCms = mounted ? cmsPages : [];

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
                <div><span className="text-slate-400">Price</span><p className="font-bold">${prod.price}</p></div>
                <div><span className="text-slate-400">Visibility</span><p><StatusPill status={prod.visibility} /></p></div>
                <div><span className="text-slate-400">Featured</span><p>{prod.featured ? 'Featured' : 'Standard'}</p></div>
                <div><span className="text-slate-400">Reports</span><p className="font-bold">{prod.reportsCount}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <Button size="sm" disabled={!canModerate} onClick={() => { moderateProduct(prod.id, 'APPROVED'); notify('Approved for public marketplace.'); }}>
                  Approve Listing
                </Button>
                <Button size="sm" variant="outline" disabled={!canModerate} onClick={() => { moderateProduct(prod.id, 'CHANGES_REQUESTED'); notify('Requested listing updates from brand.'); }}>
                  Request Changes
                </Button>
                <Button size="sm" variant="destructive" disabled={!canModerate} onClick={() => { moderateProduct(prod.id, 'REJECTED'); notify('Rejected from public marketplace.'); }}>
                  Reject & Unpublish
                </Button>
              </div>
            </SectionPanel>
          )}
        </div>
      </AdminPermissionGate>
    );
  }

  const isCmsView = ['cms-dashboard', 'homepage', 'pages', 'banners', 'media', 'blog'].includes(tab);

  return (
    <AdminPermissionGate module={isCmsView ? 'cms' : 'marketplace'} action="view">
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={isCmsView ? 'Platform Content & Homepage CMS' : 'Global Marketplace Governance'}
          title={isCmsView ? 'Platform CMS, Homepage & Media Library' : 'Marketplace Moderation, Categories & Collections'}
          subtitle="Approve published brand listings, manage global taxonomies, enforce sponsored labeling, and build global marketplace homepage blocks."
        />

        <div className="flex flex-wrap gap-1.5">
          {(isCmsView
            ? [
                ['cms-dashboard', 'CMS Dashboard', '/admin/cms'],
                ['homepage', 'Homepage Builder', '/admin/cms/homepage'],
                ['pages', 'Static Pages', '/admin/cms/pages'],
                ['banners', 'Banners', '/admin/cms/banners'],
                ['media', 'Media Library', '/admin/cms/media'],
                ['blog', 'Blog & Articles', '/admin/cms/blog'],
              ]
            : [
                ['marketplace-overview', 'Overview', '/admin/marketplace'],
                ['products', 'Product Moderation', '/admin/marketplace/products'],
                ['brands', 'Brand Moderation', '/admin/marketplace/brands'],
                ['categories', 'Categories', '/admin/marketplace/categories'],
                ['collections', 'Collections', '/admin/marketplace/collections'],
                ['featured', 'Featured Placements', '/admin/marketplace/featured'],
                ['reports', 'Abuse Reports', '/admin/marketplace/reports'],
              ]
          ).map(([id, lbl, href]) => (
            <Link
              key={id}
              href={href}
              onClick={() => setTab(id as MarketplaceCmsTab)}
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
          <MetricCard label="Public Approved Listings" value={safeProducts.filter((p) => p.visibility === 'PUBLIC').length} icon={<Globe className="w-4 h-4 text-emerald-600" />} />
          <MetricCard label="Pending Moderation" value={safeProducts.filter((p) => p.moderationStatus === 'PENDING_REVIEW').length} icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} />
          <MetricCard label="Open Abuse Reports" value={safeReports.filter((r) => r.status !== 'RESOLVED').length} icon={<Flag className="w-4 h-4 text-rose-600" />} />
          <MetricCard label="Global Categories" value={safeCats.length} icon={<Layers className="w-4 h-4" />} />
        </div>

        {(tab === 'marketplace-overview' || tab === 'products' || tab === 'featured') && (
          <SectionPanel title="Marketplace Listing Moderation Queue" subtitle="Moderation unpublishes non-compliant listings without editing the brand's private source product.">
            <div className="overflow-x-auto">
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
                              onClick={() => { moderateProduct(p.id, 'APPROVED', true); notify(`Approved & featured ${p.productName}.`); }}
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

        {tab === 'brands' && (
          <SectionPanel title="Brand Verification & Marketplace Standing">
            <div className="space-y-2 text-xs">
              {safeBrands.map((b) => (
                <div key={b.id} className="p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{b.brandName}</p>
                    <p className="text-slate-500">{b.reviewerNote} • Reports: {b.reportsCount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={b.verificationStatus} />
                    <StatusPill status={b.marketplaceStatus} />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canModerate}
                      onClick={() => {
                        moderateBrand(b.id, {
                          verificationStatus: 'VERIFIED',
                          marketplaceStatus: b.marketplaceStatus === 'ALLOWED' ? 'RESTRICTED' : 'ALLOWED',
                        });
                        notify(`Updated moderation standing for ${b.brandName}.`);
                      }}
                    >
                      Toggle Restriction
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {tab === 'categories' && (
          <SectionPanel title="Global Marketplace Categories">
            <form
              className="flex gap-2 pb-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                saveCategory({
                  id: `cat_${Date.now()}`,
                  name: newCatName.trim(),
                  slug: newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  order: safeCats.length + 1,
                  active: true,
                  productCount: 0,
                  seoTitle: `${newCatName.trim()} | Marketplace`,
                });
                setNewCatName('');
                notify('Added marketplace category.');
              }}
            >
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New global category (e.g. Footwear)" className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
              <Button type="submit" size="sm" disabled={!canModerate} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Category</Button>
            </form>
            <div className="space-y-2 text-xs">
              {safeCats.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{c.order}. {c.name}</p>
                    <p className="text-slate-500">/{c.slug} • {c.productCount} products • SEO: {c.seoTitle}</p>
                  </div>
                  <StatusPill status={c.active ? 'ACTIVE' : 'DISABLED'} />
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {tab === 'collections' && (
          <SectionPanel title="Platform Curated & Sponsored Collections">
            <div className="space-y-2 text-xs">
              {safeCols.map((col) => (
                <div key={col.id} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{col.title} {col.sponsored && '(SPONSORED)'}</p>
                    <p className="text-slate-500">{col.description} • {col.itemCount} items</p>
                  </div>
                  <StatusPill status={col.active ? 'ACTIVE' : 'DISABLED'} />
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {tab === 'reports' && (
          <SectionPanel title="Policy, Copyright & Quality Reports">
            <div className="space-y-2 text-xs">
              {safeReports.map((r) => (
                <div key={r.id} className="p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{r.targetName} — {r.reason}</p>
                    <p className="text-slate-500">Reporter: {r.reporter} • {r.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={r.status} />
                    {r.status !== 'RESOLVED' && (
                      <Button size="sm" variant="outline" disabled={!canModerate} onClick={() => { resolveMktReport(r.id, 'RESOLVED'); notify(`Resolved report ${r.id}.`); }}>
                        Resolve Report
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {isCmsView && (
          <SectionPanel title="Platform CMS Sections, Pages & Editorial Assets" subtitle="Tenant-private product photos and customer try-on photos are strictly excluded from platform media libraries.">
            {tab === 'media' && (
              <InlineAlert tone="info">
                <span>Platform public media bucket displays curated global campaign assets only — zero private merchant/customer photos are indexed here.</span>
              </InlineAlert>
            )}
            <form
              className="flex gap-2 pb-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCmsTitle.trim()) return;
                saveCmsPage({
                  id: `cms_${Date.now()}`,
                  title: newCmsTitle.trim(),
                  slug: `/${newCmsTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                  type: tab === 'blog' ? 'BLOG' : tab === 'banners' ? 'BANNER' : tab === 'homepage' ? 'HOMEPAGE_SECTION' : 'STATIC_PAGE',
                  status: 'PUBLISHED',
                  order: safeCms.length + 1,
                  summary: 'Published platform CMS block.',
                  updatedAt: new Date().toISOString().slice(0, 10),
                });
                setNewCmsTitle('');
                notify('Saved platform CMS block.');
              }}
            >
              <input value={newCmsTitle} onChange={(e) => setNewCmsTitle(e.target.value)} placeholder="Add homepage section, banner, page, or article title..." className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs" />
              <Button type="submit" size="sm" disabled={!canEditCms}>Publish Block</Button>
            </form>
            <div className="space-y-2 text-xs">
              {safeCms.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
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
          onConfirm={() => {
            if (confirmReject) {
              moderateProduct(confirmReject.id, 'UNPUBLISHED');
              notify(`Unpublished ${confirmReject.name}.`);
            }
            setConfirmReject(null);
          }}
          onCancel={() => setConfirmReject(null)}
        />
      </div>
    </AdminPermissionGate>
  );
}

