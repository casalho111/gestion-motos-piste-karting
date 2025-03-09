import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createPieceSlice, PieceSlice } from './slices/pieceSlice';

export const usePieceStore = create<PieceSlice>()(
  devtools(
    persist(
      createPieceSlice,
      {
        name: 'piece-storage',
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
    { name: 'PieceStore' }
  )
);