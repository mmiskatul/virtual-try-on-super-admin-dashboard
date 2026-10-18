import {
  experimental_taintObjectReference,
  experimental_taintUniqueValue,
} from 'react';
import './server-security';

export interface RawAdminRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN';
  rootSigningKey: string;
  twoFactorSecret: string;
  vaultEncryptionNonce: string;
  internalAuditLevel: string;
}

export interface PublicAdminDTO {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN';
}

/**
 * Fetch raw admin record from platform governance data store with Tainted Data Protection.
 * Protects root signing keys, vault nonces, and 2FA secrets from being transmitted to client JS.
 */
export async function getTaintedAdminRecord(adminId: string = 'adm_master_01'): Promise<RawAdminRecord> {
  const rawAdmin: RawAdminRecord = {
    id: adminId,
    name: 'Alexander Vance',
    email: 'admin@vton-platform.io',
    role: 'SUPER_ADMIN',
    rootSigningKey: 'rsa_priv_live_99f8e7d6c5b4a3_superadmin_root',
    twoFactorSecret: 'MZXW6YTBOI======',
    vaultEncryptionNonce: '01a9b8c7d6e5f4a3b2c1d0',
    internalAuditLevel: 'LEVEL_5_GOVERNANCE',
  };

  // 1. Taint unique sensitive primitives
  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak super-admin root signing key to client JavaScript!',
    rawAdmin,
    rawAdmin.rootSigningKey
  );

  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak super-admin 2FA secret key to client JavaScript!',
    rawAdmin,
    rawAdmin.twoFactorSecret
  );

  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak vault encryption nonce to client JavaScript!',
    rawAdmin,
    rawAdmin.vaultEncryptionNonce
  );

  // 2. Taint the entire raw admin object reference
  experimental_taintObjectReference(
    'CRITICAL SECURITY ERROR: Raw super-admin credential object cannot be passed directly to Client Components. Call sanitizeAdminToDTO() to extract a clean public DTO.',
    rawAdmin
  );

  return rawAdmin;
}

/**
 * Data Transfer Object (DTO) Sanitizer: Safely extract public client-safe fields.
 */
export function sanitizeAdminToDTO(raw: RawAdminRecord): PublicAdminDTO {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
  };
}
