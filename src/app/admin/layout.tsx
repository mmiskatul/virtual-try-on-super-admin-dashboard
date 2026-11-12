import React from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { requireAdminPageSession } from '@/lib/server-auth';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageSession('/login');
  return <AdminShell>{children}</AdminShell>;
}

