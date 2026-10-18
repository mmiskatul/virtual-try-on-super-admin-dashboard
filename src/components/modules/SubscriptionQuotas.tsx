import React from 'react';

export function SubscriptionQuotas() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-5">
        <div className="admin-card p-6 rounded-2xl space-y-3">
          <h4 className="font-bold text-sm text-white">Free Tier</h4>
          <p className="text-2xl font-black text-amber-400">$0 <span className="text-xs text-slate-400">/mo</span></p>
          <ul className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
            <li>• Up to 10 Products</li>
            <li>• 100 AI Try-On Jobs / mo</li>
            <li>• Standard Storefront</li>
          </ul>
        </div>

        <div className="admin-card p-6 rounded-2xl space-y-3 border-amber-500/50">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-white">Pro Tier</h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">Popular</span>
          </div>
          <p className="text-2xl font-black text-amber-400">$199 <span className="text-xs text-slate-400">/mo</span></p>
          <ul className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
            <li>• Up to 150 Products</li>
            <li>• 1,000 AI Try-On Jobs / mo</li>
            <li>• Marketplace Priority Sync</li>
          </ul>
        </div>

        <div className="admin-card p-6 rounded-2xl space-y-3">
          <h4 className="font-bold text-sm text-white">Enterprise Tier</h4>
          <p className="text-2xl font-black text-amber-400">$699 <span className="text-xs text-slate-400">/mo</span></p>
          <ul className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
            <li>• 500+ Products</li>
            <li>• 5,000 AI Try-On Jobs / mo</li>
            <li>• Custom Domains & Dedicated Support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
