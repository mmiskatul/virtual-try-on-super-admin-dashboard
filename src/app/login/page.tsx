'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession, useSession, signOut } from 'next-auth/react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { superAdminApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw === '/' || raw.startsWith('/login')) {
    return '/admin';
  }
  return raw;
}

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));
  const verifiedParam = searchParams.get('verified');
  const resetParam = searchParams.get('reset');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleCredential = async (idToken: string) => {
    setErrorMsg(null);
    setSigningIn(true);
    try {
      // 1. The backend checks the Google token and the allowed email, then sets the secure session cookies.
      const res = await superAdminApi.loginWithGoogle(idToken);

      // 2. The console session picks those cookies up (no password involved).
      const result = await signIn('credentials', { redirect: false, email: res?.admin?.email || '' });
      if (result?.error) {
        setErrorMsg(
          result.error === 'SERVICE_UNAVAILABLE'
            ? 'The backend server is unreachable. Please try again shortly.'
            : 'Could not establish the administrator session. Please try again.'
        );
        return;
      }
      await getSession();
      window.location.assign(callbackUrl);
    } catch (err: any) {
      if (err?.data?.code === 'NOT_AN_ADMIN' || err?.status === 403) {
        setErrorMsg('This Google account is not authorised for the Super Admin console. Use the Google account set up by the platform owner.');
      } else if (err?.status === 429) {
        setErrorMsg(err?.message || 'Too many attempts. Please wait a few minutes and try again.');
      } else if (err?.status === 503) {
        setErrorMsg('Google sign-in is not set up on the server yet.');
      } else {
        setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <AuthShell
      title="Super Admin Governance Sign In"
      subtitle="Continue with the Google account of the platform owner to manage tenants, quotas, and AI infrastructure."
      badge="Restricted Control Plane"
      footer={
        <p className="text-[11px] text-gray-500">
          Only the Google account set up by the platform owner can sign in here.
        </p>
      }
    >
      {session?.user && (
        <div className="p-3.5 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-gray-900 font-semibold">Signed in as {session.user.name || session.user.email}</p>
            <p className="text-gray-500 text-[11px]">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={callbackUrl}
              className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white font-bold"
            >
              Console
            </Link>
            <button
              type="button"
              onClick={async () => {
                const { logoutAdmin } = await import('../../lib/logout');
                await logoutAdmin({ redirect: false });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Switch
            </button>
          </div>
        </div>
      )}

      {verifiedParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Administrator email verified! You can now sign in.</span>
        </div>
      )}

      {resetParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password updated.</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={signingIn} />
        {signingIn && (
          <p className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4" />
            Checking your account...
          </p>
        )}
      </div>
    </AuthShell>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AdminLoginContent />
    </Suspense>
  );
}

