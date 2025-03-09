import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createMaintenanceSlice, MaintenanceSlice } from './slices/maintenanceSlice';

export const useMaintenanceStore = create<MaintenanceSlice>()(
  devtools(
    persist(
      createMaintenanceSlice,
      {
        name: 'maintenance-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          filters: state.filters,
          pagination: {
            currentPage: state.pagination.currentPage,
            perPage: state.pagination.perPage
          },
          draftPiecesUtilisees: state.draftPiecesUtilisees
        }),
      }
    ),
    { name: 'MaintenanceStore' }
  )
);