import { z } from 'zod';

export const tenantProvisioningSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand tenant name must be at least 2 characters')
    .max(60, 'Brand tenant name cannot exceed 60 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(40, 'Slug cannot exceed 40 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. nova-couture)'),
  owner: z
    .string()
    .min(2, 'Owner name must be at least 2 characters'),
  email: z
    .string()
    .email('Please enter a valid administrator email address'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
  tryOnQuota: z
    .number()
    .int('Quota must be an integer count')
    .positive('Try-on quota must be greater than zero')
    .max(100000, 'Quota exceeds platform enterprise cap')
});

export type TenantProvisioningFormValues = z.infer<typeof tenantProvisioningSchema>;

export const quotaAdjustmentSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  tryOnQuota: z.number().int().positive('Quota must be a positive integer')
});

export type QuotaAdjustmentFormValues = z.infer<typeof quotaAdjustmentSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
  password: z.string().min(6, 'Security password must be at least 6 characters'),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email('Please enter your administrator email address'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid administrator email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

