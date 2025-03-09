import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUISlice, UISlice } from './slices/uiSlice';

export const useUIStore = create<UISlice>()(
  persist(
    createUISlice,
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        viewMode: state.viewMode,
        density: state.density,
        dashboardLayout: state.dashboardLayout,
        // On ne stocke pas mobileSidebarOpen qui est un état temporaire
      }),
    }
  )
);