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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-center py-10 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-amber-500/20">
              A
            </div>
            <div>
              <span className="font-black tracking-tight text-base text-white block leading-none">
                V-TRY <span className="text-xs text-amber-400 font-bold">ADMIN</span>
              </span>
              <span className="text-[10px] text-slate-400">Platform Governance Control Plane</span>
            </div>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400">
            Zero-Trust Gate
          </span>
        </div>

        <div className="admin-card rounded-3xl p-7 shadow-2xl border border-slate-800/90 space-y-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/25">
              <ShieldAlert className="w-3 h-3" />
              {badge}
            </span>
            <h1 className="text-xl font-black text-white tracking-tight pt-1">{title}</h1>
            <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && <div className="text-center text-xs text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}

