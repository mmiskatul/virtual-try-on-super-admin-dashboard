import { AuditLog } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectAuditState } from '../store/selectors';
import { auditActions } from '../store/slices/legacyAdminSlices';

const auditBoundActions = {
  setLogs: (logs: AuditLog[]) => {
    store.dispatch(auditActions.setLogs(logs));
  },
  addAuditLog: (log: AuditLog) => {
    store.dispatch(auditActions.addAuditLog(log));
  },
};

export const useAuditStore = createSliceFacadeHook(selectAuditState, auditBoundActions);
