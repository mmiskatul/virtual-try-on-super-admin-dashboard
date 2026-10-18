'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantProvisioningSchema, TenantProvisioningFormValues } from '../../lib/schemas';
import { TenantItem } from '../../types';
import { Button } from './button';
import { Input } from './input';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: TenantItem) => void;
}

export function TenantOnboardingModal({ isOpen, onClose, onAddTenant }: TenantOnboardingModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TenantProvisioningFormValues>({
    resolver: zodResolver(tenantProvisioningSchema),
    defaultValues: {
      name: '',
      slug: '',
      owner: '',
      email: '',
      plan: 'PRO',
      tryOnQuota: 1000
    }
  });

  if (!isOpen) return null;

  const onFormSubmit = (data: TenantProvisioningFormValues) => {
    const newTenant: TenantItem = {
      id: `tenant_${Date.now()}`,
      name: data.name,
      slug: data.slug,
      owner: data.owner,
      email: data.email,
      status: 'ACTIVE',
      plan: data.plan,
      productsCount: 0,
      ordersCount: 0,
      gmv: 0,
      tryOnUsed: 0,
      tryOnQuota: data.tryOnQuota,
      joinedDate: 'Just now'
    };

    onAddTenant(newTenant);
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="admin-card w-full max-w-lg p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5 bg-slate-900/95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Provision Brand Tenant</h3>
            <p className="text-[11px] text-slate-400">Validated via React Hook Form & Zod Schema</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Brand Name *</label>
            <Input
              {...register('name')}
              placeholder="e.g. Maison de L'Ombre"
              className={errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.name && (
              <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Tenant Slug (Unique URL Identifier) *</label>
            <Input
              {...register('slug')}
              placeholder="e.g. maison-de-lombre"
              className={`font-mono ${errors.slug ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
            />
            {errors.slug && (
              <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Owner / Primary Contact *</label>
              <Input
                {...register('owner')}
                placeholder="e.g. Antoine Laurent"
                className={errors.owner ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.owner && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.owner.message}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Administrator Email *</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="antoine@maisonlombre.com"
                className={errors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.email && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Subscription Plan Tier *</label>
              <select
                {...register('plan')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="FREE">FREE Tier</option>
                <option value="PRO">PRO Tier</option>
                <option value="ENTERPRISE">ENTERPRISE Tier</option>
              </select>
              {errors.plan && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.plan.message}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Monthly AI Try-On Quota *</label>
              <Input
                type="number"
                {...register('tryOnQuota', { valueAsNumber: true })}
                className={errors.tryOnQuota ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.tryOnQuota && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.tryOnQuota.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
            >
              Provision & Register Tenant
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
