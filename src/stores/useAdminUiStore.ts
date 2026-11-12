import { AdminTab } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectAdminUiState } from '../store/selectors';
import { adminUiActions } from '../store/slices/legacyAdminSlices';

const adminUiBoundActions = {
  setActiveTab: (tab: AdminTab) => {
    store.dispatch(adminUiActions.setActiveTab(tab));
  },
  showToast: (message: string) => {
    store.dispatch(adminUiActions.showToast(message));
  },
  hideToast: () => {
    store.dispatch(adminUiActions.hideToast());
  },
};

export const useAdminUiStore = createSliceFacadeHook(selectAdminUiState, adminUiBoundActions);
