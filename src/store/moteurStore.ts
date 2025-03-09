import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createMoteurSlice, MoteurSlice } from './slices/moteurSlice';

export const useMoteurStore = create<MoteurSlice>()(
  devtools(
    persist(
      createMoteurSlice,
      {
        name: 'moteur-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          filters: state.filters,
          pagination: {
            currentPage: state.pagination.currentPage,
            perPage: state.pagination.perPage
          }
        }),
      }
    ),
    { name: 'MoteurStore' }
  )
);