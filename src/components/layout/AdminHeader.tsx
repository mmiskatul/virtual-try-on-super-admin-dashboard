'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { RefreshCw, ShieldCheck, LogOut, User } from 'lucide-react';
import { logoutAdmin } from '../../lib/logout';
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
        <h1 className="text-2xl font-black text-gray-900">
          {activeTab === 'overview' && 'Platform Governance Overview'}
          {activeTab === 'tenants' && 'Brand Tenant Directory & Access Control'}
          {activeTab === 'ai' && 'AI Virtual Try-On Infrastructure'}
          {activeTab === 'infrastructure' && 'SMTP Email & Supabase Database'}
          {activeTab === 'subscriptions' && 'Tenant Subscription Quotas'}
          {activeTab === 'audit' && 'Security & Administration Audit Trail'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Super-Administrator level operations, tenant lifecycle, and system reliability
        </p>
      </div>

      <div className="flex items-center gap-3">
        {session?.user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Admin'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <ShieldCheck className="w-4 h-4 text-black" />
            )}
            <span className="font-semibold text-gray-900">{session.user.name || 'Super Admin'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-black">
              {(session.user as any).role || 'SUPER_ADMIN'}
            </span>
            <button
              onClick={() => logoutAdmin({ callbackUrl: '/login' })}
              title="Sign Out"
              className="ml-1 text-gray-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Admin Sign In</span>
          </Link>
        )}

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-black transition-colors"
          title="Sync Cache"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
