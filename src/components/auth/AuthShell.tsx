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
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden flex flex-col justify-center py-10 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gray-100 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-black to-gray-700 flex items-center justify-center font-black text-white text-base shadow-lg shadow-black/10">
              A
            </div>
            <div>
              <span className="font-black tracking-tight text-base text-gray-900 block leading-none">
                V-TRY <span className="text-xs text-black font-bold">ADMIN</span>
              </span>
              <span className="text-[10px] text-gray-500">Platform Governance Control Plane</span>
            </div>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-white border border-gray-200 text-black">
            Zero-Trust Gate
          </span>
        </div>

        <div className="admin-card rounded-3xl p-7 shadow-2xl border border-gray-200 space-y-5">
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

