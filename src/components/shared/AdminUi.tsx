'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Lock,
  PackageOpen,
} from 'lucide-react';
import { PlatformAction, PlatformModule } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { Button } from '../ui/button';

export function StatusPill({ status }: { status: string }) {
  const s = String(status).toUpperCase();
  let cls = 'bg-slate-100 text-slate-700 border-slate-200';
  if (
    [
      'ACTIVE',
      'SUCCEEDED',
      'PAID',
      'APPROVED',
      'HEALTHY',
      'VERIFIED',
      'PUBLISHED',
      'COMPLETED',
      'COMPLETED_BY_PROVIDER',
      'ENABLED',
      'RESOLVED',
      'ALLOWED',
      '200',
    ].includes(s)
  ) {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    [
      'TRIAL',
      'TRIALING',
      'PENDING',
      'PENDING_REVIEW',
      'PENDING_VERIFICATION',
      'ONBOARDING',
      'PROCESSING',
      'QUEUED',
      'INVESTIGATING',
      'IN_PROGRESS',
      'WARNING',
      'PAST_DUE',
      'LIMITED',
      'SCHEDULED',
      'CHANGES_REQUESTED',
      'REQUESTED',
      'ASSIGNED',
      'MEDIUM',
    ].includes(s)
  ) {
    cls = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (
    [
      'SUSPENDED',
      'FAILED',
      'REJECTED',
      'CANCELLED',
      'CRITICAL',
      'HIGH',
      'OFFLINE',
      'RESTRICTED',
      'ESCALATED',
      'KEY_REQUIRED',
      'UNPUBLISHED',
      'DISABLED',
      '502',
    ].includes(s)
  ) {
    cls = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['INFO', 'OPEN', 'NEW_COHORT'].includes(s)) {
    cls = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 leading-tight break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{actions}</div>}
    </div>
  );
}

export function SectionPanel({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-sm ${className}`}
    >
      {(title || right) && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm sm:text-base font-bold text-slate-900 break-words">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {right && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">{right}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  positive = true,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const [showHint, setShowHint] = React.useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-1.5 sm:space-y-2 shadow-sm hover:border-slate-300 transition-colors min-w-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-1 min-w-0">
          <span className="truncate">{label}</span>
          {hint && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              title={hint}
              aria-label={hint}
              className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
        {icon && (
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">{icon}</div>
        )}
      </div>
      <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums break-words">
        {value}
      </p>
      {delta && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span
            className={`inline-flex items-center font-bold ${
              positive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {positive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {delta}
          </span>
          <span className="text-slate-400">vs prior 30d</span>
        </div>
      )}
      {hint && showHint && (
        <p className="text-[10px] text-slate-500 leading-snug pt-1 border-t border-slate-100">
          {hint}
        </p>
      )}
    </div>
  );
}

export function AdminPermissionGate({
  module,
  action = 'view',
  children,
}: {
  module: PlatformModule;
  action?: PlatformAction;
  children: React.ReactNode;
}) {
  const { can, roleLabel } = usePermissions();

  const allowed = can(module, action);
  if (allowed) return <>{children}</>;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3 max-w-lg mx-auto my-8">
      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">
        Permission Restricted for Current Admin Role
      </h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Your role <strong>{roleLabel}</strong> does not include <code>{action}</code> access to <code>{module}</code>. Roles are defined and enforced by the backend. Ask a Super Admin to assign you a different role.
      </p>
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center space-y-2">
      <PackageOpen className="w-7 h-7 text-slate-400 mx-auto" />
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}

export function InlineAlert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const cls =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-indigo-200 bg-indigo-50 text-indigo-900';

  return (
    <div className={`rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${cls}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  requireReason = false,
  twoPersonApprovalNote,
  confirmLabel = 'Confirm Action',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  requireReason?: boolean;
  twoPersonApprovalNote?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [secondApprover, setSecondApprover] = useState('');

  if (!open) return null;
  const blocked =
    (requireReason && !reason.trim()) ||
    (Boolean(twoPersonApprovalNote) && !secondApprover.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

        {twoPersonApprovalNote && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-xs">
            <p className="font-bold text-amber-900">
              High-Risk Two-Person Approval Policy
            </p>
            <p className="text-amber-800">{twoPersonApprovalNote}</p>
            <input
              type="email"
              value={secondApprover}
              onChange={(e) => setSecondApprover(e.target.value)}
              placeholder="Approving second admin email (e.g. owner@vton-platform.io)"
              className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs"
            />
          </div>
        )}

        {requireReason && (
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-slate-700">
              Audit Reason (Required)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document operational reason for audit log..."
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
            />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            disabled={blocked}
            onClick={() => {
              onConfirm(reason.trim() || 'Confirmed by administrator');
              setReason('');
              setSecondApprover('');
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SvgTrendChart({
  data,
  valueKey,
  labelKey = 'label',
  color = '#4f46e5',
  prefix = '',
}: {
  data: Array<Record<string, any>>;
  valueKey: string;
  labelKey?: string;
  color?: string;
  prefix?: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyPanel title="No series data" description="No metrics available for the chosen window." />;
  }
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] || 0)));

  return (
    <div className="overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      <div
        className="grid gap-2.5 sm:gap-3 items-end h-44 pt-4 min-w-full"
        style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(44px, 1fr))` }}
      >
      {data.map((d, idx) => {
        const val = Number(d[valueKey] || 0);
        const pct = Math.max(6, Math.round((val / max) * 100));
        return (
          <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5 group">
            <span className="text-[10px] font-bold text-slate-500">
              {prefix}
              {val.toLocaleString('en-US')}
            </span>
            <div className="w-full max-w-[44px] h-full flex items-end bg-slate-100 rounded-t-lg overflow-hidden">
              <div
                className="w-full rounded-t-lg transition-all duration-300"
                style={{ height: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-600">{d[labelKey]}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}

