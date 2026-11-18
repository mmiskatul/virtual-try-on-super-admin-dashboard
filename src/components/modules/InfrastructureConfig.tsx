'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Server,
  UploadCloud,
} from 'lucide-react';
import { superAdminApi } from '../../lib/api';

interface InfrastructureState {
  resend: {
    activeTransport: string;
    configured: boolean;
    hasApiKey: boolean;
    maskedApiKey: string;
    from: string;
  };
  database: {
    provider: string;
    connected: boolean;
    prismaActive: boolean;
    latencyMs: number | null;
    dbHost: string;
    hasDatabaseUrl: boolean;
    maskedDatabaseUrl: string;
    tableCounts: Record<string, number> | null;
    snapshotCounts: {
      tenants: number;
      users: number;
      products: number;
      orders: number;
    };
  };
}

export function InfrastructureConfig() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InfrastructureState | null>(null);

  // Resend email form state
  const [resendKey, setResendKey] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);
  const [emailFrom, setEmailFrom] = useState('V-TRY Studio <onboarding@resend.dev>');
  const [testRecipient, setTestRecipient] = useState('');

  // Supabase / Database form state
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [showDbUri, setShowDbUri] = useState(false);

  // Action feedback states
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [savingDb, setSavingDb] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [syncingDb, setSyncingDb] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data: InfrastructureState = await superAdminApi.getInfrastructureConfig();
      setInfo(data);
      setEmailFrom(data.resend?.from || 'V-TRY Studio <onboarding@resend.dev>');
    } catch (err: any) {
      setDbFeedback({
        success: false,
        message: err?.message || 'Sign in as Super Admin to view live backend infrastructure settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveResend = async () => {
    setSavingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await superAdminApi.saveResendConfig({
        ...(resendKey.trim() ? { apiKey: resendKey.trim() } : {}),
        from: emailFrom,
      });
      setResendKey('');
      setEmailFeedback({ success: Boolean(res.success), message: res.message });
      await loadConfig();
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err?.message || 'Failed to save email settings.' });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleVerifyResend = async () => {
    setTestingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await superAdminApi.testResendConfig({
        action: 'verify',
        ...(resendKey.trim() ? { apiKey: resendKey.trim() } : {}),
        from: emailFrom,
      });
      setEmailFeedback({ success: Boolean(res.success), message: res.message });
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err?.message || 'Resend verification failed.' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient.trim()) {
      setEmailFeedback({ success: false, message: 'Enter a recipient email address first.' });
      return;
    }
    setSendingTestEmail(true);
    setEmailFeedback(null);
    try {
      const res = await superAdminApi.testResendConfig({
        action: 'send',
        testRecipient: testRecipient.trim(),
        ...(resendKey.trim() ? { apiKey: resendKey.trim() } : {}),
        from: emailFrom,
      });
      setEmailFeedback({ success: Boolean(res.success), message: res.message });
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err?.message || 'Failed to send test email.' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbFeedback(null);
    try {
      const res = await superAdminApi.testDatabaseConfig({
        ...(databaseUrl.trim() ? { databaseUrl: databaseUrl.trim() } : {}),
      });
      setDbFeedback({ success: Boolean(res.success), message: res.message });
    } catch (err: any) {
      setDbFeedback({ success: false, message: err?.message || 'Database connection test failed.' });
    } finally {
      setTestingDb(false);
    }
  };

  const handleSaveDatabase = async () => {
    setSavingDb(true);
    setDbFeedback(null);
    try {
      const res = await superAdminApi.saveDatabaseConfig({
        ...(databaseUrl.trim() ? { databaseUrl: databaseUrl.trim() } : {}),
      });
      setDatabaseUrl('');
      setDbFeedback({ success: true, message: res.message });
      await loadConfig();
    } catch (err: any) {
      setDbFeedback({ success: false, message: err?.message || 'Failed to save database configuration.' });
    } finally {
      setSavingDb(false);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncingDb(true);
    setDbFeedback(null);
    try {
      const res = await superAdminApi.syncDatabase();
      setDbFeedback({ success: true, message: res.message });
      await loadConfig();
    } catch (err: any) {
      setDbFeedback({ success: false, message: err?.message || 'Failed to sync snapshot data to PostgreSQL.' });
    } finally {
      setSyncingDb(false);
    }
  };

  if (loading && !info) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-sm font-semibold">Loading Email &amp; PostgreSQL Infrastructure Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Status Banner */}
      <div className="admin-card p-6 rounded-3xl bg-gradient-to-r from-white via-gray-100 to-white border border-gray-300 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <Server className="w-5 h-5 text-black" />
              Resend Email Delivery &amp; PostgreSQL Database Control
            </h2>
            <p className="text-xs text-gray-500">
              Configure real-time Resend email verification/recovery delivery and connect NeonDB, Supabase, or PostgreSQL persistence without restarting the server.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                info?.resend?.configured
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  : 'bg-gray-100 text-black border-gray-300'
              }`}
            >
              Mail: {info?.resend?.activeTransport?.toUpperCase() || 'DEV-PREVIEW'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                info?.database.connected
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              DB: {info?.database.provider || 'Snapshot'}
            </span>
            <button
              type="button"
              onClick={loadConfig}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 flex items-center gap-1.5 border border-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================== 1. RESEND EMAIL CONFIGURATION ==================== */}
        <div className="admin-card p-6 rounded-3xl bg-white/80 border border-gray-200 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gray-100 text-black">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Resend Email (Verification &amp; Password Reset)</h3>
                <p className="text-[11px] text-gray-500">Used by all 3 portals for signup verification &amp; reset codes</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                info?.resend?.hasApiKey
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {info?.resend?.hasApiKey ? 'Resend Configured' : 'Not Configured'}
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">Resend API Key</label>
            <div className="relative">
              <input
                type={showResendKey ? 'text' : 'password'}
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                placeholder={
                  info?.resend?.hasApiKey
                    ? `Saved (${info.resend.maskedApiKey}) — enter to replace`
                    : 're_xxxxxxxxxxxxxxxx'
                }
                autoComplete="off"
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowResendKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showResendKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">From Email Header</label>
            <input
              type="text"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
              placeholder="V-TRY Studio <noreply@yourdomain.com>"
              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-black"
            />
            <p className="text-[11px] text-gray-500">
              The sending domain must be verified in Resend. <code>onboarding@resend.dev</code> only delivers to your own Resend account email.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleVerifyResend}
              disabled={testingEmail}
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-1.5 border border-gray-300 disabled:opacity-50"
            >
              {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-black" />}
              <span>Verify API Key</span>
            </button>

            <button
              type="button"
              onClick={handleSaveResend}
              disabled={savingEmail}
              className="py-2.5 px-3 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {savingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Email Settings</span>
            </button>
          </div>

          {/* Send Real Test Email Box */}
          <div className="pt-3 border-t border-gray-200 flex gap-2">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Send test email to (e.g. you@example.com)"
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center gap-1.5 border border-gray-300 disabled:opacity-50"
            >
              {sendingTestEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-black" />}
              <span>Send Test</span>
            </button>
          </div>

          {emailFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                emailFeedback.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-700'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-700'
              }`}
            >
              {emailFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{emailFeedback.message}</span>
            </div>
          )}
        </div>

        {/* ==================== 2. SUPABASE DATABASE CONFIGURATION ==================== */}
        <div className="admin-card p-6 rounded-3xl bg-white/80 border border-gray-200 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">{info?.database.provider || 'PostgreSQL'} Database</h3>
                <p className="text-[11px] text-gray-500">Authoritative persistence for users, tokens, tenants, &amp; orders</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                info?.database.connected
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-gray-100 text-black border-gray-300'
              }`}
            >
              {info?.database.connected ? 'Connected' : 'Fallback Snapshot'}
            </span>
          </div>

          {/* Live Table Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Tenants</span>
              <span className="text-sm font-extrabold text-gray-900">
                {info?.database.tableCounts?.tenants ?? info?.database.snapshotCounts.tenants ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Users</span>
              <span className="text-sm font-extrabold text-gray-900">
                {info?.database.tableCounts?.users ?? info?.database.snapshotCounts.users ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Products</span>
              <span className="text-sm font-extrabold text-gray-900">
                {info?.database.tableCounts?.products ?? info?.database.snapshotCounts.products ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Latency</span>
              <span className="text-sm font-extrabold text-emerald-600">
                {info?.database.latencyMs !== null && info?.database.latencyMs !== undefined ? `${info.database.latencyMs}ms` : 'Local'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                PostgreSQL Connection URI (DATABASE_URL)
              </label>
              <div className="relative">
                <input
                  type={showDbUri ? 'text' : 'password'}
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  placeholder={
                    info?.database.maskedDatabaseUrl
                      ? `Active (${info.database.maskedDatabaseUrl}) — paste to switch`
                      : 'postgresql://user:password@ep-...-pooler.aws.neon.tech/neondb?sslmode=require'
                  }
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDbUri((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showDbUri ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                Supports NeonDB (`*.neon.tech`), Supabase Pooler/Direct, and standard PostgreSQL URIs with automatic SSL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleTestDatabase}
              disabled={testingDb}
              className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-1.5 border border-gray-300 disabled:opacity-50"
            >
              {testingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-600" />}
              <span>Test DB Connection</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDatabase}
              disabled={savingDb}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {savingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save &amp; Reconnect DB</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncDatabase}
            disabled={syncingDb || !info?.database.connected}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold flex items-center justify-center gap-2 border border-gray-200 disabled:opacity-50"
          >
            {syncingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-black" />}
            <span>Sync Local Seed / Snapshot Records to {info?.database.provider || 'PostgreSQL'}</span>
          </button>

          {dbFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                dbFeedback.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-700'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-700'
              }`}
            >
              {dbFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{dbFeedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

