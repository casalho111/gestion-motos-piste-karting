import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createStatsSlice, StatsSlice } from './slices/statsSlice';

export const useStatsStore = create<StatsSlice>()(
  devtools(
    persist(
      createStatsSlice,
      {
        name: 'stats-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          selectedTimeRange: state.selectedTimeRange,
          customDateRange: state.customDateRange
          // On ne persiste que les préférences, pas les données elles-mêmes
        }),
      }
    ),
    { name: 'StatsStore' }
  )
);