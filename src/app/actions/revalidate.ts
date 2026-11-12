'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdminServerAction } from '@/lib/server-auth';

/**
 * Server Action for Administrative Data Cache Revalidation
 */
export async function revalidateAdminTenants(tag: string = 'admin-tenants') {
  try {
    await requireAdminServerAction();
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
