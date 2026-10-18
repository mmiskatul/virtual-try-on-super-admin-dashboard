'use client';

import React from 'react';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { RefreshCw, ShieldCheck, LogOut, User } from 'lucide-react';
import { AdminTab } from '../../types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onRefresh: () => void;
}

export function AdminHeader({ activeTab, onRefresh }: AdminHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-white">
          {activeTab === 'overview' && 'Platform Governance Overview'}
          {activeTab === 'tenants' && 'Brand Tenant Directory & Access Control'}
          {activeTab === 'ai' && 'AI Virtual Try-On Infrastructure'}
          {activeTab === 'subscriptions' && 'Tenant Subscription Quotas'}
          {activeTab === 'audit' && 'Security & Administration Audit Trail'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Super-Administrator level operations, tenant lifecycle, and system reliability
        </p>
      </div>

      <div className="flex items-center gap-3">
        {session?.user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Admin'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-semibold text-white">{session.user.name || 'Super Admin'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
              {(session.user as any).role || 'SUPER_ADMIN'}
            </span>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="ml-1 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('credentials', { email: 'admin@vton-platform.io' })}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Admin Sign In</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Sync Cache"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
