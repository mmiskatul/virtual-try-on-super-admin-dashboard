import { AiRoutingPolicy, PlatformGlobalSettings } from '../types';

/**
 * Starting values used until the backend answers. These are configuration defaults, not sample records.
 * The backend value always replaces them once the dashboard has synced.
 */

export const DEFAULT_AI_ROUTING: AiRoutingPolicy = {
  primaryProvider: 'gemini',
  secondaryProvider: 'fal',
  fallbackModelId: 'viton-hd-unet-v2',
  timeoutSeconds: 25,
  maxRetries: 2,
  categoryRoutes: {
    tops: 'gemini-3.6-flash',
    bottoms: 'viton-hd-unet-v2',
    dresses: 'fal-flux-vto',
    outerwear: 'gemini-3.6-flash',
  },
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformGlobalSettings = {
  platformName: 'V-TRY Multi-Tenant SaaS',
  supportEmail: 'platform-ops@vton-platform.io',
  defaultCurrency: 'BDT',
  defaultLanguage: 'English (en-US)',
  timezone: 'UTC',
  maxImageUploadMb: 10,
  imageRetentionDays: 7,
  tryOnResultRetentionDays: 30,
  tenantDeletionGraceDays: 30,
  requireAdminMfa: true,
  maintenanceMode: {
    enabled: false,
    message: 'Scheduled platform database maintenance is underway.',
    scope: 'ALL_APPS',
  },
};

