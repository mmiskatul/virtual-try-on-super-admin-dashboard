'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { superAdminApi } from '../../lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Could not load Google sign-in.')));
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

interface Props {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * "Continue with Google". The Google client id comes from the backend, so this site only needs the backend URL.
 * Google hands back a signed token; the backend verifies it and only lets the owner's email in.
 */
export function GoogleSignInButton({ onCredential, disabled = false }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [state, setState] = useState<'loading' | 'ready' | 'off' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await superAdminApi.googleConfig();
        if (cancelled) return;
        if (!cfg.enabled || !cfg.googleClientId) {
          setState('off');
          return;
        }
        await loadGoogleScript();
        if (cancelled || !holder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: (resp: { credential?: string }) => {
            if (resp.credential) void callbackRef.current(resp.credential);
          },
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.min(holder.current.offsetWidth || 320, 400),
        });
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      {state === 'loading' && (
        <div className="w-full min-h-[44px] flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        </div>
      )}
      {/* Google owns everything inside this div, so React must never render children into it. */}
      <div
        ref={holder}
        className={`w-full flex items-center justify-center ${state === 'ready' ? 'min-h-[44px]' : 'hidden'} ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        aria-label="Continue with Google"
      />
      {state === 'off' && (
        <p className="text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 leading-relaxed">
          Google sign-in is not set up yet. Add <code>GOOGLE_CLIENT_ID</code> and your email as <code>SEED_ADMIN_EMAIL</code> to the backend settings.
        </p>
      )}
      {state === 'error' && (
        <p className="text-[11px] text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 leading-relaxed">
          Google sign-in could not load. Check your connection and that this site&apos;s address is added to your Google client&apos;s allowed origins.
        </p>
      )}
    </div>
  );
}
