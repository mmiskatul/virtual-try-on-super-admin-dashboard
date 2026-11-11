'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession, useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { adminLoginSchema, AdminLoginFormValues } from '../../lib/schemas';
import { superAdminApi, DevEmailPreview } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { DevEmailPreviewCard } from '../../components/auth/DevEmailPreviewCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
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
  const prefillEmail = searchParams.get('email') || '';

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [devPreview, setDevPreview] = useState<DevEmailPreview | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: prefillEmail, password: '' },
  });

  const performLogin = async (email: string, password: string) => {
    setErrorMsg(null);
    setNeedsVerificationEmail(null);
    setResendMessage(null);
    setDevPreview(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerificationEmail(email);
        setErrorMsg('Administrator email verification is required before signing in.');
      } else if (result.error === 'SERVICE_UNAVAILABLE') {
        setErrorMsg('Backend server is unreachable. Please ensure the backend API is running on port 4000.');
      } else {
        setErrorMsg(result.error === 'CredentialsSignin' ? 'Invalid administrator email or password.' : result.error);
      }
      return;
    }

    const updatedSession = await getSession();
    if (updatedSession?.backendToken && typeof window !== 'undefined') {
      localStorage.setItem('admin_token', updatedSession.backendToken);
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const onSubmit = async (data: AdminLoginFormValues) => {
    await performLogin(data.email, data.password);
  };

  const handleResendVerification = async () => {
    const email = needsVerificationEmail || getValues('email');
    if (!email) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await superAdminApi.resendVerification(email);
      setResendMessage(res.message);
      if (res.devPreview) setDevPreview(res.devPreview);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      title="Super Admin Governance Sign In"
      subtitle="Authenticate with platform root credentials to manage tenants, quotas, and AI infrastructure."
      badge="Restricted Control Plane"
      footer={
        <p className="text-[11px] text-slate-500">
          Super Admin accounts are provisioned internally.{' '}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
            Security policy
          </Link>
        </p>
      }
    >
      {session?.user && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-white font-semibold">Signed in as {session.user.name || session.user.email}</p>
            <p className="text-slate-400 text-[11px]">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={callbackUrl}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Console
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('admin_token');
                signOut({ redirect: false });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Switch
            </button>
          </div>
        </div>
      )}

      {verifiedParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Administrator email verified! You can now sign in.</span>
        </div>
      )}

      {resetParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Security password updated! Sign in with your new credentials.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {needsVerificationEmail && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                >
                  {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
                  <span>Resend Verification</span>
                </button>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  <span>Verify Code</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {resendMessage && (
          <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs">
            {resendMessage}
          </div>
        )}

        <DevEmailPreviewCard preview={devPreview} actionLabel="Verify Admin Email" />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Administrator Email</label>
          <Input
            type="email"
            placeholder="admin@vton-platform.io"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500 focus-visible:border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-400 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Security Password"
          placeholder="Enter your administrator password"
          autoComplete="current-password"
          error={errors.password?.message}
          rightSlot={
            <Link href="/forgot-password" className="text-[11px] text-amber-400 hover:text-amber-300 font-medium">
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Governance Console'}</span>
        </Button>

      </form>
    </AuthShell>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AdminLoginContent />
    </Suspense>
  );
}

