'use client';

import { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Activity,
} from 'lucide-react';
import { superAdminApi } from '../../lib/api';

interface EngineConfig {
  activeProvider: string;
  gemini: {
    configured: boolean;
    model: string;
    imageModel: string;
    maskedKey: string;
  };
}

interface Telemetry {
  configured?: boolean;
  imageModel?: string;
  totalGenerations?: number;
  completed?: number;
  failed?: number;
  inProgress?: number;
  successRate?: number | null;
  status?: string;
}

const VISION_MODELS = [
  { id: 'gemini-3.6-flash', label: 'gemini-3.6-flash (recommended)' },
  { id: 'gemini-3.5-flash', label: 'gemini-3.5-flash' },
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (fastest)' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite' },
];

const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', label: 'gemini-2.5-flash-image (recommended)' },
  { id: 'gemini-3.1-flash-image', label: 'gemini-3.1-flash-image' },
  { id: 'gemini-3-pro-image', label: 'gemini-3-pro-image' },
];

export function AiInfrastructure() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.6-flash');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');
  const [showKey, setShowKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [configured, setConfigured] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [metrics, setMetrics] = useState<Telemetry | null>(null);

  useEffect(() => {
    void fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data: EngineConfig = await superAdminApi.getAiEngineConfig();
      if (data?.gemini) {
        setMaskedKey(data.gemini.maskedKey || '');
        setConfigured(Boolean(data.gemini.configured));
        if (data.gemini.model) setGeminiModel(data.gemini.model);
        if (data.gemini.imageModel) setImageModel(data.gemini.imageModel);
      }
    } catch {
      // keep the defaults
    }
    try {
      setMetrics(await superAdminApi.getAiMetrics());
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await superAdminApi.updateAiEngineConfig({
        geminiApiKey: geminiKey,
        geminiModel,
        geminiImageModel: imageModel,
      });
      setGeminiKey('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchConfig();
    } catch (err: any) {
      alert(`Could not save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await superAdminApi.testAiEngineKey({ provider: 'gemini', apiKey: geminiKey }));
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'The check failed.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-sm font-semibold">Loading the try-on engine...</p>
      </div>
    );
  }

  const ready = configured || Boolean(geminiKey);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="admin-card p-6 rounded-3xl bg-gradient-to-r from-white via-gray-100 to-white border border-gray-300 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gray-100 text-black ring-1 ring-black/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                Virtual try-on engine
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    configured ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {configured ? 'READY' : 'KEY NEEDED'}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Try-on runs inside the backend and uses Google Gemini. There is no separate AI service to run.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchConfig()}
              className="px-3.5 py-2 rounded-xl bg-gray-100/80 hover:bg-gray-200 text-gray-700 hover:text-black text-xs font-semibold flex items-center gap-1.5 transition-colors border border-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-black/10 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Saved
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4" /> Save settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card p-6 rounded-3xl bg-white/80 border border-gray-200 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-100 text-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Google Gemini</h4>
              <p className="text-[11px] text-gray-500">Writes the fitting prompt, then creates the try-on picture.</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              configured ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            {configured ? 'Key saved' : 'No key yet'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gemini API key (Google AI Studio)</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={maskedKey ? `Saved (${maskedKey}). Paste a new key to replace it.` : 'Paste your Gemini API key'}
                autoComplete="off"
                className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black p-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">The key is saved on the backend and is never shown again in full.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vision model (writes the prompt)</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-black"
              >
                {!VISION_MODELS.some((m) => m.id === geminiModel) && <option value={geminiModel}>{geminiModel}</option>}
                {VISION_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image model (creates the picture)</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-black"
              >
                {!IMAGE_MODELS.some((m) => m.id === imageModel) && <option value={imageModel}>{imageModel}</option>}
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">Image models may need a paid Google AI plan.</p>
            </div>
          </div>

          <button
            onClick={() => void handleTest()}
            disabled={testing || !ready}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-2 border border-gray-300 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking with Google...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" /> Check that the key works
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-bold">{testResult.success ? 'The key works' : 'The key did not work'}</p>
                <p className="text-[11px] mt-0.5 opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-card p-6 rounded-3xl bg-white/80 border border-gray-200 space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" /> Try-ons so far (all shops)
        </h4>
        {metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              ['All try-ons', String(metrics.totalGenerations ?? 0)],
              ['Worked', String(metrics.completed ?? 0)],
              ['Did not work', String(metrics.failed ?? 0)],
              ['Success rate', metrics.successRate === null || metrics.successRate === undefined ? '-' : `${Math.round(metrics.successRate)}%`],
            ].map(([label, value]) => (
              <div key={label} className="p-4 rounded-2xl bg-white border border-gray-200">
                <span className="text-xs text-gray-500">{label}</span>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">The numbers could not be loaded. Press Refresh to try again.</p>
        )}
      </div>
    </div>
  );
}
