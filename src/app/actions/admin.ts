'use server';

import { getTaintedAdminRecord, sanitizeAdminToDTO, PublicAdminDTO } from '@/lib/server-admin';

/**
 * Server Action: Safely retrieve super-admin profile.
 * Even if an engineer mistakenly tries to return the raw tainted object,
 * React's experimental taint system blocks it from reaching the client!
 */
export async function fetchAdminProfile(adminId: string = 'adm_master_01'): Promise<{
  success: boolean;
  profile?: PublicAdminDTO;
  error?: string;
}> {
  try {
    const rawTaintedAdmin = await getTaintedAdminRecord(adminId);

    // Secure DTO Sanitization: Strips rootSigningKey, twoFactorSecret, vaultEncryptionNonce
    const publicProfile = sanitizeAdminToDTO(rawTaintedAdmin);

    return {
      success: true,
      profile: publicProfile,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch admin profile safely',
    };
  }
}
