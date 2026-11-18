import { createListenerMiddleware } from '@reduxjs/toolkit';
import {
  PERSISTED_PLATFORM_KEYS,
  PersistedPlatformSlice,
  PlatformSliceState,
  platformActions,
} from '../slices/platformSlice';
import { superAdminApi } from '../../lib/api';
import { reportSettingsSaveFailure } from '../../services/platformWrites';

export const PLATFORM_STORAGE_KEY = 'vton_super_admin_v2';

export function readPersistedPlatformState(): Partial<PersistedPlatformSlice> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const candidate = parsed && typeof parsed === 'object' && 'state' in parsed ? parsed.state : parsed;
    if (!candidate || typeof candidate !== 'object') return null;
    return candidate as Partial<PersistedPlatformSlice>;
  } catch {
    return null;
  }
}

export const platformPersistenceMiddleware = createListenerMiddleware();

platformPersistenceMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (typeof window === 'undefined') return false;
    if (!action.type.startsWith('platform/') || action.type === 'platform/hydratePlatform') {
      return false;
    }
    const curr = (currentState as { platform: PlatformSliceState }).platform;
    const prev = (previousState as { platform: PlatformSliceState }).platform;
    if (!curr._hydrated || curr === prev) return false;
    return PERSISTED_PLATFORM_KEYS.some((key) => curr[key] !== prev[key]);
  },
  effect: (_action, listenerApi) => {
    try {
      const platform = (listenerApi.getState() as { platform: PlatformSliceState }).platform;
      const persisted = {} as PersistedPlatformSlice;
      for (const key of PERSISTED_PLATFORM_KEYS) {
        // @ts-expect-error key belongs to PERSISTED_PLATFORM_KEYS
        persisted[key] = platform[key];
      }
      window.localStorage.setItem(
        PLATFORM_STORAGE_KEY,
        JSON.stringify({ state: persisted, version: 0 })
      );
    } catch {
      // ignore storage quota errors
    }
  },
});

platformPersistenceMiddleware.startListening({
  actionCreator: platformActions.updateSettings,
  effect: (action, listenerApi) => {
    const platform = (listenerApi.getState() as { platform: PlatformSliceState }).platform;
    if (platform.isLiveBackend) {
      void superAdminApi.updateSettings(action.payload).catch((err) => reportSettingsSaveFailure(err));
    }
  },
});

