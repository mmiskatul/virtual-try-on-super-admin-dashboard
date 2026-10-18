import { create } from 'zustand';
import { AdminTab } from '../types';

interface AdminUiState {
  activeTab: AdminTab;
  toastMessage: string | null;
  setActiveTab: (tab: AdminTab) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  activeTab: 'overview',
  toastMessage: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  showToast: (toastMessage) => set({ toastMessage }),
  hideToast: () => set({ toastMessage: null })
}));
