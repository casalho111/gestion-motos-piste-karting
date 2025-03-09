import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createMotoSlice, MotoSlice } from './slices/motoSlice';

export const useMotoStore = create<MotoSlice>()(
  devtools(
    persist(
      createMotoSlice,
      {
        name: 'moto-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          filters: state.filters,
          pagination: {
            currentPage: state.pagination.currentPage,
            perPage: state.pagination.perPage
          }
          // On ne stocke pas les données elles-mêmes, juste les préférences
        }),
      }
    ),
    { name: 'MotoStore' }
  )
);