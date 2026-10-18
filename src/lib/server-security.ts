import {
  experimental_taintUniqueValue,
  experimental_taintObjectReference,
} from 'react';

/**
 * Tainted Data Protection: Platform Master Security Keys
 * Uses React's experimental_taintUniqueValue to permanently block internal secrets,
 * GPU cluster credentials, and database connection strings from ever being leaked across the
 * React Server Component (RSC) boundary into client-side JavaScript.
 */
export function taintServerSecret(
  secretValue: string | undefined | null,
  secretIdentifier: string
): void {
  if (!secretValue || typeof secretValue !== 'string') {
    return;
  }

  try {
    experimental_taintUniqueValue(
      `[SECURITY ERROR] Super Admin Violation: Master platform secret "${secretIdentifier}" cannot be leaked to client-side JavaScript bundles.`,
      globalThis,
      secretValue
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint platform master secret "${secretIdentifier}":`, error);
    }
  }
}

/**
 * Tainted Data Protection: Raw Admin & Governance Objects
 * Uses React's experimental_taintObjectReference to lock down raw admin credentials,
 * platform audit logs, and infrastructure keys. If passed directly to a Client Component,
 * React immediately throws a build/runtime boundary exception.
 */
export function taintRawUserData<T extends object>(
  rawData: T,
  resourceName: string = 'Raw Admin Credential Record'
): T {
  if (!rawData || typeof rawData !== 'object') {
    return rawData;
  }

  try {
    experimental_taintObjectReference(
      `[SECURITY ERROR] Data Leak Violation: ${resourceName} contains sensitive root governance credentials and cannot be passed directly to Client Components. Extract a sanitized Public DTO first.`,
      rawData
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint object reference for "${resourceName}":`, error);
    }
  }

  return rawData;
}

/**
 * Tainted Data Protection: Specific Unique Admin Governance Fields
 */
export function taintSensitiveUserField(
  fieldValue: string | undefined | null,
  fieldName: string,
  lifetime: object = globalThis
): void {
  if (!fieldValue || typeof fieldValue !== 'string') {
    return;
  }

  try {
    experimental_taintUniqueValue(
      `[SECURITY ERROR] Governance Violation: Sensitive root field "${fieldName}" cannot be transmitted to client components.`,
      lifetime,
      fieldValue
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint unique governance field "${fieldName}":`, error);
    }
  }
}

// Automatically taint super-admin master secrets on module load
const PLATFORM_SECRETS_TO_PROTECT: Array<[string | undefined, string]> = [
  [process.env.NEXTAUTH_SECRET, 'NEXTAUTH_SECRET'],
  [process.env.SUPER_ADMIN_SECURITY_KEY, 'SUPER_ADMIN_SECURITY_KEY'],
  [process.env.GPU_CLUSTER_TOKEN, 'GPU_CLUSTER_TOKEN'],
  [process.env.DATABASE_URL, 'DATABASE_URL'],
  [process.env.INTERNAL_SERVICE_KEY, 'INTERNAL_SERVICE_KEY'],
];

for (const [secret, name] of PLATFORM_SECRETS_TO_PROTECT) {
  if (secret) {
    taintServerSecret(secret, name);
  }
}
