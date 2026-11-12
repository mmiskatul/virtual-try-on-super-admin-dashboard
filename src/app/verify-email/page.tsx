'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle, Loader2, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { verifyEmailSchema, VerifyEmailFormValues } from '../../lib/schemas';
import { superAdminApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function AdminVerifyEmailContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email') || '';

  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    urlToken ? 'verifying' : 'idle'
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const attemptedAutoToken = useRef(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: urlEmail, code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const completeVerifiedSession = async (verifiedEmail: string): Promise<boolean> => {
    try {
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: verifiedEmail,
        password: '',
      });
      if (signInResult?.error) {
        return false;
      }
      await getSession();
      if (typeof window !== 'undefined') {
        window.location.assign('/admin');
      }
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!urlToken || attemptedAutoToken.current) return;
    attemptedAutoToken.current = true;
    setStatus('verifying');

    superAdminApi
      .verifyEmail({ token: urlToken })
      .then(async (res) => {
        const verifiedEmail = res?.user?.email || urlEmail;
        setStatus('verified');
        setMessage(res.message);
        if (verifiedEmail) {
          await completeVerifiedSession(verifiedEmail);
        }
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.message || 'Verification link is invalid or has expired.');
      });
  }, [urlToken, urlEmail]);

  const onSubmitCode = async (data: VerifyEmailFormValues) => {
    setMessage(null);
    try {
      const res = await superAdminApi.verifyEmail({ email: data.email, code: data.code });
      setStatus('verified');
      setMessage(res.message);
      await completeVerifiedSession(res?.user?.email || data.email);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    const email = getValues('email') || urlEmail;
    if (!email) {
      setStatus('error');
      setMessage('Enter your administrator email address first.');
      return;
    }

    setResending(true);
    setMessage(null);
    try {
      const res = await superAdminApi.resendVerification(email);
      setMessage(res.message);
      if (res.alreadyVerified) {
        setStatus('verified');
      } else {
        setStatus('idle');
        setCooldown(30);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <AuthShell title="Verifying administrator email..." subtitle="Validating your security verification link." badge="Email Verification">
        <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
          <p className="text-xs text-gray-700">Validating verification token...</p>
        </div>
      </AuthShell>
    );
  }

  if (status === 'verified') {
    return (
      <AuthShell title="Administrator email verified!" subtitle="Your governance account is verified and ready." badge="Verified Account">
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-gray-900">Verification complete</p>
            <p>{message || 'Your administrator email has been verified.'}</p>
          </div>
        </div>
        <Link
          href="/admin"
          className="w-full h-10 px-4 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all"
        >
          <span>Continue to Super Admin Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify administrator email"
      subtitle="Enter the 6-digit verification code sent to your inbox, or open the link from your email."
      badge="Email Verification"
      footer={
        <p>
          Already verified?{' '}
          <Link href="/login" className="text-black hover:text-gray-700 font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            status === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-700'
              : 'bg-gray-100 border-gray-300 text-black'
          }`}
        >
          {status === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Mail className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitCode)} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Administrator Email</label>
          <Input
            type="email"
            placeholder="admin@vton-platform.io"
            {...register('email')}
            className={errors.email ? 'border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-600 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">6-Digit Verification Code</label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            {...register('code')}
            className={`font-mono text-center text-base tracking-[0.4em] ${errors.code ? 'border-rose-500' : ''}`}
          />
          {errors.code && <p className="text-rose-600 text-[11px] font-medium">{errors.code.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{isSubmitting ? 'Verifying...' : 'Verify Email'}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={resending || cooldown > 0}
          onClick={handleResend}
          className="w-full gap-2"
        >
          {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          <span>{cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}</span>
        </Button>
      </form>
    </AuthShell>
  );
}

export default function AdminVerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AdminVerifyEmailContent />
    </Suspense>
  );
}

