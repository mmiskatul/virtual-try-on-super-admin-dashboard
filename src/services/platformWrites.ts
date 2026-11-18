/**
 * Write-through layer for Super Admin mutations.
 *
 * Every change is sent to the backend. The UI is updated optimistically so it feels instant; if the backend
 * rejects (or is unreachable) the admin sees an error toast and the store is re-pulled from the backend, which
 * rolls the optimistic change back. Nothing is ever "saved" only in the browser.
 *
 * Each function resolves to `true` when the backend accepted the change, so callers show their success
 * message only on success.
 */
import { store } from '../store';
import { platformActions } from '../store/slices/platformSlice';
import { adminUiActions } from '../store/slices/legacyAdminSlices';
import { ApiError, superAdminApi, type TenantAdminContext } from '../lib/api';
import type {
  AiRoutingPolicy,
  CmsPageRecord,
  CreditLedgerEntry,
  DataGovernanceRequest,
  FeatureFlagRecord,
  ModerationProductItem,
  PlatformUserRecord,
  RefundRequest,
  SupportTicketRecord,
  TenantLifecycleStatus,
} from '../types';

const TOAST_MS = 4000;

function toast(message: string) {
  store.dispatch(adminUiActions.showToast(message));
  setTimeout(() => store.dispatch(adminUiActions.hideToast()), TOAST_MS);
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session expired. Please sign in again.';
    if (err.status === 403) return "You don't have permission to do this.";
    if (err.status === 404) return 'The record no longer exists on the server.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Unexpected error.';
}

/** Re-pulls the control-plane collections (users, AI models, flags, webhooks, CMS, moderation, ledger, ...). */
async function refreshSnapshot() {
  try {
    const res = await superAdminApi.getControlPlaneSnapshot();
    if (res?.data) store.dispatch(platformActions.hydrateControlPlaneSnapshot(res.data));
  } catch {
    /* the write result is already reported; a failed refresh must not mask it */
  }
}

async function refreshTenants() {
  try {
    const rows = await superAdminApi.getTenants();
    if (Array.isArray(rows)) store.dispatch(platformActions.mergeLiveTenants(rows));
  } catch {
    /* see refreshSnapshot */
  }
}

interface WriteOptions {
  /** Human label used in error toasts, e.g. "Suspend user". */
  label: string;
  /** The backend call. Must throw on failure. */
  call: () => Promise<unknown>;
  /** Applied to the UI immediately, before the backend answers. */
  optimistic?: () => void;
  /** What to re-pull afterwards (on success to pick up server ids/ledgers, on failure to roll back). */
  refresh?: Array<'snapshot' | 'tenants'>;
}

async function writeThrough({ label, call, optimistic, refresh = ['snapshot'] }: WriteOptions): Promise<boolean> {
  if (!store.getState().platform.isLiveBackend) {
    toast(`Backend not connected — "${label}" was not saved.`);
    return false;
  }
  const doRefresh = () =>
    Promise.all([
      refresh.includes('snapshot') ? refreshSnapshot() : undefined,
      refresh.includes('tenants') ? refreshTenants() : undefined,
    ]);

  optimistic?.();
  try {
    await call();
    await doRefresh();
    return true;
  } catch (err) {
    toast(`${label} failed: ${describeError(err)}`);
    await doRefresh(); // rolls the optimistic change back to the server's truth
    return false;
  }
}

const syncedStatus = (s: string): s is 'ACTIVE' | 'SUSPENDED' => s === 'ACTIVE' || s === 'SUSPENDED';

// --- Tenants -----------------------------------------------------------------------------------------------

export async function createTenantRemote(input: {
  name: string;
  slug: string;
  contactEmail: string;
  planSlug: string;
}): Promise<{ ok: boolean; id?: string }> {
  const planSlug = input.planSlug.toUpperCase();
  if (planSlug !== 'STARTER' && planSlug !== 'PRO' && planSlug !== 'ENTERPRISE') {
    toast(`Create tenant failed: unknown plan "${input.planSlug}".`);
    return { ok: false };
  }
  let id: string | undefined;
  const ok = await writeThrough({
    label: 'Create tenant',
    call: async () => {
      const res = await superAdminApi.createTenant({ ...input, planSlug });
      id = res?.data?.tenant?.id;
    },
    refresh: ['tenants', 'snapshot'],
  });
  return { ok, id };
}

export function setTenantLifecycleRemote(id: string, next: TenantLifecycleStatus, reason: string) {
  if (!syncedStatus(next)) {
    toast(`"${next}" is not supported by the backend yet — only ACTIVE and SUSPENDED can be saved.`);
    return Promise.resolve(false);
  }
  return writeThrough({
    label: next === 'SUSPENDED' ? 'Suspend tenant' : 'Activate tenant',
    call: () => superAdminApi.setTenantStatus(id, next),
    optimistic: () => store.dispatch(platformActions.updateTenantLifecycle({ id, lifecycleStatus: next, reason })),
    refresh: ['tenants'],
  });
}

export function updateTenantPlanRemote(id: string, plan: string, tryOnQuota: number) {
  const slug = plan.toUpperCase();
  if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(slug)) {
    toast(`Change plan failed: "${plan}" is not a plan the backend knows.`);
    return Promise.resolve(false);
  }
  return writeThrough({
    label: 'Change tenant plan',
    call: () => superAdminApi.updateTenantPlan(id, { plan: slug, tryOnMonthlyQuota: tryOnQuota }),
    optimistic: () => store.dispatch(platformActions.updateTenantPlanLocal({ id, plan: slug, tryOnQuota })),
    refresh: ['tenants'],
  });
}

// --- Users -------------------------------------------------------------------------------------------------

export function setUserStatusRemote(id: string, status: PlatformUserRecord['status'], reason?: string) {
  if (!syncedStatus(status)) {
    toast(`"${status}" cannot be set manually — only ACTIVE and SUSPENDED.`);
    return Promise.resolve(false);
  }
  return writeThrough({
    label: status === 'SUSPENDED' ? 'Suspend user' : 'Reactivate user',
    call: () => superAdminApi.setUserStatus(id, status, reason),
    optimistic: () => store.dispatch(platformActions.updateUserStatus({ id, status })),
  });
}

// --- Marketplace moderation / CMS --------------------------------------------------------------------------

/** The dashboard has two states the backend does not: it uses FLAGGED for "changes requested" and REJECTED for "unpublished". */
const BACKEND_MODERATION: Record<ModerationProductItem['moderationStatus'], string> = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'FLAGGED',
  REJECTED: 'REJECTED',
  UNPUBLISHED: 'REJECTED',
};

export function moderateProductRemote(
  id: string,
  moderationStatus: ModerationProductItem['moderationStatus'],
  opts: { featured?: boolean; note?: string } = {}
) {
  return writeThrough({
    label: 'Moderate product',
    call: () =>
      superAdminApi.moderateProduct(id, {
        moderationStatus: BACKEND_MODERATION[moderationStatus],
        ...(opts.note ? { note: opts.note } : {}),
        ...(opts.featured !== undefined ? { featured: opts.featured } : {}),
      }),
    optimistic: () =>
      store.dispatch(platformActions.moderateProduct({ id, moderationStatus, featured: opts.featured })),
  });
}

export function saveCmsPageRemote(page: CmsPageRecord) {
  return writeThrough({
    label: 'Save CMS page',
    call: () =>
      superAdminApi.saveCmsPage({
        slug: page.slug,
        type: page.type,
        title: page.title,
        summary: page.summary,
        status: page.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        sortOrder: Math.trunc(page.order) || 0,
      }),
    optimistic: () => store.dispatch(platformActions.saveCmsPage(page)),
  });
}

// --- AI ----------------------------------------------------------------------------------------------------

export function toggleAiModelRemote(id: string, active?: boolean, isDefault?: boolean) {
  return writeThrough({
    label: 'Update AI model',
    call: () =>
      superAdminApi.toggleAiModel(id, {
        ...(active !== undefined ? { active } : {}),
        ...(isDefault !== undefined ? { isDefault } : {}),
      }),
    optimistic: () => store.dispatch(platformActions.toggleAiModel({ id, active, isDefault })),
  });
}

export function updateAiRoutingRemote(partial: Partial<AiRoutingPolicy>) {
  const { secondaryProvider, ...rest } = partial;
  return writeThrough({
    label: 'Update AI routing',
    // The backend calls the secondary provider "fallbackProvider".
    call: () =>
      superAdminApi.updateAiRouting({
        ...rest,
        ...(secondaryProvider !== undefined ? { fallbackProvider: secondaryProvider } : {}),
      }),
    optimistic: () => store.dispatch(platformActions.updateAiRouting(partial)),
  });
}

export function adjustTenantCreditsRemote(
  tenantId: string,
  delta: number,
  reason: string,
  type: CreditLedgerEntry['type']
) {
  if (!Number.isInteger(delta) || delta === 0) {
    toast('Credit adjustment failed: enter a non-zero whole number.');
    return Promise.resolve(false);
  }
  if (reason.trim().length < 4) {
    toast('Credit adjustment failed: reason must be at least 4 characters.');
    return Promise.resolve(false);
  }
  return writeThrough({
    label: 'Adjust credits',
    call: () => superAdminApi.grantCredits(tenantId, { delta, promo: type === 'GRANT_PROMO', reason: reason.trim() }),
    optimistic: () => store.dispatch(platformActions.adjustTenantCredits({ tenantId, delta, reason, type })),
    refresh: ['snapshot', 'tenants'],
  });
}

// --- Feature flags / webhooks ------------------------------------------------------------------------------

export function toggleFeatureFlagRemote(key: string, partial: Partial<FeatureFlagRecord>) {
  return writeThrough({
    label: 'Update feature flag',
    call: () =>
      superAdminApi.toggleFeatureFlag(key, {
        ...(partial.globalEnabled !== undefined ? { globalEnabled: partial.globalEnabled } : {}),
        ...(partial.rolloutPct !== undefined ? { rolloutPct: partial.rolloutPct } : {}),
      }),
    optimistic: () => store.dispatch(platformActions.toggleFeatureFlag({ key, partial })),
  });
}

export function addWebhookRemote(url: string, events: string[]) {
  return writeThrough({
    label: 'Register webhook',
    call: () => superAdminApi.addWebhook({ url, events }),
    // No optimistic row: the server assigns the id and delivery state.
  });
}

// --- Subscriptions ------------------------------------------------------------------------------------------

export function extendTrialRemote(tenantId: string, days = 14) {
  return writeThrough({
    label: 'Extend trial',
    call: () => superAdminApi.extendTrial(tenantId, days),
    refresh: ['snapshot', 'tenants'],
  });
}

export function cancelSubscriptionRemote(tenantId: string, reason: string) {
  return writeThrough({
    label: 'Cancel subscription',
    call: () => superAdminApi.cancelSubscription(tenantId, reason.trim()),
    refresh: ['snapshot', 'tenants'],
  });
}

// --- Tenant internal notes & support agent ------------------------------------------------------------------

function applyAdminContext(tenantId: string, ctx: TenantAdminContext) {
  store.dispatch(platformActions.setTenantAdminContext({ tenantId, ...ctx }));
}

/** Loads the notes and assigned agent for the tenant detail page. Failures are silent: the page still works. */
export async function loadTenantAdminContext(tenantId: string) {
  if (!store.getState().platform.isLiveBackend) return;
  try {
    const res = await superAdminApi.getTenantAdminContext(tenantId);
    if (res?.data) applyAdminContext(tenantId, res.data);
  } catch {
    /* keep whatever is shown */
  }
}

export async function addTenantNoteRemote(tenantId: string, note: string): Promise<boolean> {
  if (!note.trim()) return false;
  if (!store.getState().platform.isLiveBackend) {
    toast('Backend not connected — "Add note" was not saved.');
    return false;
  }
  try {
    const res = await superAdminApi.addTenantNote(tenantId, note.trim());
    if (res?.data) applyAdminContext(tenantId, res.data);
    return true;
  } catch (err) {
    toast(`Add note failed: ${describeError(err)}`);
    return false;
  }
}

export async function assignSupportAgentRemote(tenantId: string, agentId: string): Promise<boolean> {
  if (!store.getState().platform.isLiveBackend) {
    toast('Backend not connected — "Assign support agent" was not saved.');
    return false;
  }
  try {
    const res = await superAdminApi.assignSupportAgent(tenantId, agentId);
    if (res?.data) applyAdminContext(tenantId, res.data);
    return true;
  } catch (err) {
    toast(`Assign support agent failed: ${describeError(err)}`);
    return false;
  }
}

// --- Support tickets / refunds / data requests -------------------------------------------------------------

/** Changes status, priority or assignee of a ticket. Replies go through `addTicketMessageRemote`. */
export function updateTicketRemote(
  id: string,
  updates: Partial<Pick<SupportTicketRecord, 'status' | 'priority' | 'assignedAgent'>>
) {
  const body = {
    ...(updates.status !== undefined ? { status: updates.status } : {}),
    ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
    ...(updates.assignedAgent !== undefined ? { assignedAgent: updates.assignedAgent } : {}),
  };
  if (Object.keys(body).length === 0) return Promise.resolve(false);
  return writeThrough({
    label: 'Update ticket',
    call: () => superAdminApi.updateTicket(id, body),
    optimistic: () => store.dispatch(platformActions.updateTicket({ id, updates })),
  });
}

export function addTicketMessageRemote(id: string, text: string, internal = false) {
  if (!text.trim()) return Promise.resolve(false);
  return writeThrough({
    label: internal ? 'Add internal note' : 'Post reply',
    call: () => superAdminApi.updateTicket(id, { message: text.trim(), internal }),
    optimistic: () => store.dispatch(platformActions.addTicketMessage({ id, text: text.trim(), internal })),
  });
}

const BACKEND_REFUND_STATUS: Partial<Record<RefundRequest['status'], 'APPROVED' | 'REJECTED' | 'PROCESSED'>> = {
  APPROVED_PENDING_PROVIDER: 'APPROVED',
  COMPLETED_BY_PROVIDER: 'PROCESSED',
  REJECTED: 'REJECTED',
};

export function updateRefundStatusRemote(id: string, status: RefundRequest['status'], note?: string) {
  const backendStatus = BACKEND_REFUND_STATUS[status];
  if (!backendStatus) {
    toast(`Refund status "${status}" cannot be set manually.`);
    return Promise.resolve(false);
  }
  return writeThrough({
    label: 'Update refund',
    call: () => superAdminApi.updateRefundStatus(id, { status: backendStatus, ...(note ? { note } : {}) }),
    optimistic: () => store.dispatch(platformActions.updateRefundStatus({ id, status })),
  });
}

export function updateDataRequestRemote(id: string, status: DataGovernanceRequest['status']) {
  return writeThrough({
    label: 'Update data request',
    // The dashboard calls a refused request DENIED; the backend calls it REJECTED.
    call: () => superAdminApi.updateDataRequest(id, { status: status === 'DENIED' ? 'REJECTED' : status }),
    optimistic: () => store.dispatch(platformActions.updateDataRequest({ id, status })),
  });
}

// --- View-As (impersonation) -------------------------------------------------------------------------------

let activeViewAsSessionId: string | null = null;

export async function startViewAsRemote(
  tenantId: string,
  mode: 'READ_ONLY' | 'ELEVATED_WRITE',
  reason: string
): Promise<boolean> {
  if (!store.getState().platform.isLiveBackend) {
    toast('Backend not connected — view-as session was not started.');
    return false;
  }
  if (reason.trim().length < 5) {
    toast('View-as failed: a reason of at least 5 characters is required.');
    return false;
  }
  try {
    const res = await superAdminApi.startViewAs(tenantId, {
      mode: mode === 'READ_ONLY' ? 'READ_ONLY' : 'SUPPORT_WRITE',
      reason: reason.trim(),
    });
    activeViewAsSessionId = res?.data?.session?.id ?? null;
    store.dispatch(platformActions.startImpersonation({ tenantId, mode, reason: reason.trim() }));
    return true;
  } catch (err) {
    toast(`Start view-as failed: ${describeError(err)}`);
    return false;
  }
}

export async function endViewAsRemote(): Promise<boolean> {
  const sessionId = activeViewAsSessionId;
  activeViewAsSessionId = null;
  // Always leave the banner state locally so the admin is never trapped in it.
  store.dispatch(platformActions.endImpersonation());
  if (!sessionId) return true;
  try {
    await superAdminApi.endViewAs(sessionId);
    return true;
  } catch (err) {
    toast(`The view-as session could not be closed on the server (it will expire on its own): ${describeError(err)}`);
    return false;
  }
}

// --- Settings ----------------------------------------------------------------------------------------------

/** Used by the settings listener in store/middleware/persistence.ts. */
export async function reportSettingsSaveFailure(err: unknown) {
  toast(`Saving settings failed: ${describeError(err)}`);
  await refreshSnapshot();
}
