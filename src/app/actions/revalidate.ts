'use server';

import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Server Action for Administrative Data Cache Revalidation
 */
export async function revalidateAdminTenants(tag: string = 'admin-tenants') {
  try {
    revalidateTag(tag);
    revalidatePath('/');
    return {
      success: true,
      tag,
      revalidatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Tag revalidation failed',
    };
  }
}
