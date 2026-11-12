'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, badge = 'Super Admin Governance', children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gray-100 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/login" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-black to-gray-700 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-lg shadow-black/10 shrink-0">
              A
            </div>
            <div className="min-w-0">
              <span className="font-black tracking-tight text-sm sm:text-base text-gray-900 block leading-none truncate">
                V-TRY <span className="text-xs text-black font-bold">ADMIN</span>
              </span>
              <span className="text-[10px] text-gray-500 truncate block">Platform Governance Control Plane</span>
            </div>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-white border border-gray-200 text-black whitespace-nowrap shrink-0">
            Zero-Trust Gate
          </span>
        </div>

        <div className="admin-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-200 space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-black border border-gray-300">
              <ShieldAlert className="w-3 h-3" />
              {badge}
            </span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight pt-1">{title}</h1>
            <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && <div className="text-center text-xs text-gray-500">{footer}</div>}
      </div>
    </div>
  );
}

