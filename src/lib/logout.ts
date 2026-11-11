'use client';

import { signOut } from 'next-auth/react';
import { superAdminApi } from './api';

export async function logoutAdmin(options: { callbackUrl?: string; redirect?: boolean } = {}) {
  try {
    await superAdminApi.logout();
  } catch {
    // Still proceed to clear NextAuth cookie if backend is temporarily unreachable
  }

  if (typeof window !== 'undefined' && localStorage.getItem('admin_token')) {
    localStorage.removeItem('admin_token');
  }

  if (options.redirect === false) {
    await signOut({ redirect: false });
    return;
  }

  await signOut({ callbackUrl: options.callbackUrl || '/login' });
}

