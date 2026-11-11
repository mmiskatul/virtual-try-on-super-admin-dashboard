'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ExternalLink } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';

export default function AdminRegisterRestrictedPage() {
  const brandPortalUrl = process.env.NEXT_PUBLIC_BRAND_PORTAL_URL || 'http://localhost:3001/register';

  return (
    <AuthShell
      title="Administrator enrollment is restricted"
      subtitle="For platform security, Super Administrator accounts cannot be publicly self-registered."
      badge="Access Governance Policy"
    >
      <div className="p-4 rounded-2xl bg-white/90 border border-gray-200 space-y-2.5 text-xs">
        <div className="flex items-center gap-2 text-black font-bold">
          <Lock className="w-4 h-4" />
          <span>Internal Provisioning Only</span>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Platform Super Admins must be provisioned by an existing root administrator or seeded directly in the secure backend database.
        </p>
        <p className="text-gray-500 leading-relaxed">
          If you are a fashion brand merchant looking to launch a storefront, please register via the Brand Merchant Portal instead.
        </p>
      </div>

      <div className="space-y-2.5">
        <Link
          href="/login"
          className="w-full h-10 px-4 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Super Admin Sign In</span>
        </Link>

        <a
          href={brandPortalUrl}
          className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white/60 hover:bg-gray-100 text-gray-800 font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
        >
          <span>Register a Fashion Brand Instead</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </AuthShell>
  );
}

