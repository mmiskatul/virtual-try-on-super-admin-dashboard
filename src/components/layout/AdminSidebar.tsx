'use client';

import React from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  Sparkles,
  Layers,
  Clock,
  Database
} from 'lucide-react';
import { AdminTab } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  tenantCount: number;
}

export function AdminSidebar({ activeTab, onSelectTab, tenantCount }: AdminSidebarProps) {
  return (
    <aside className="w-72 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Platform Identity */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              SUPER ADMIN
            </h2>
            <p className="text-[11px] text-amber-400 font-mono font-semibold">Governance Control</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" /> Platform Overview
          </button>
          <button
            onClick={() => onSelectTab('tenants')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'tenants'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" /> Tenant Governance ({tenantCount})
          </button>
          <button
            onClick={() => onSelectTab('ai')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'ai'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Engine & Hardware
          </button>
          <button
            onClick={() => onSelectTab('infrastructure')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'infrastructure'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" /> SMTP &amp; Database DB
          </button>
          <button
            onClick={() => onSelectTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" /> Subscription Quotas
          </button>
          <button
            onClick={() => onSelectTab('audit')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" /> Immutable Audit Trail
          </button>
        </nav>
      </div>

      {/* System Health Status */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Core Services</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Nominal
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 space-y-0.5">
            <p>backend-api: :4000</p>
            <p>ai-service: :8000</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
