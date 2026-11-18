import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminTab } from '../../types';

export interface AdminUiSliceState {
  activeTab: AdminTab;
  toastMessage: string | null;
}

export const adminUiSlice = createSlice({
  name: 'adminUi',
  initialState: { activeTab: 'overview', toastMessage: null } as AdminUiSliceState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<AdminTab>) => {
      state.activeTab = action.payload;
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toastMessage = action.payload;
    },
    hideToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const adminUiActions = adminUiSlice.actions;

