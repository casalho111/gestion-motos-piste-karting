import { StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  DashboardStats,
  MaintenanceStats,
  UtilisationStats,
  TimeRangeOption
} from '../types';
import {
  getDashboardData,
  getUtilisationHebdomadaire
 } from '@/app/actions/dashboard';
 import {
  getMaintenanceStats
 } from '@/app/actions/stats';
 import {
  getUtilisationStats
 } from '@/app/actions/utilisations';
 
 export interface StatsState {
  dashboardStats: DashboardStats | null;
  maintenanceStats: MaintenanceStats | null;
  utilisationStats: UtilisationStats[] | null;
  utilisationHebdomadaire: any[] | null;
  isLoading: boolean;
  error: string | null;
  selectedTimeRange: TimeRangeOption;
  customDateRange: {
    start: Date | null;
    end: Date | null;
  };
  lastFetched: {
    dashboard: number | null;
    maintenance: number | null;
    utilisation: number | null;
  };
 }
 
 export interface StatsActions {
  fetchDashboardStats: () => Promise<void>;
  fetchMaintenanceStats: (dateDebut?: Date, dateFin?: Date) => Promise<void>;
  fetchUtilisationStats: (dateDebut?: Date, dateFin?: Date) => Promise<void>;
  fetchUtilisationHebdomadaire: () => Promise<void>;
  setTimeRange: (range: TimeRangeOption) => void;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  applySelectedTimeRange: () => Promise<void>;
  refreshAllStats: () => Promise<void>;
 }
 
 export type StatsSlice = StatsState & StatsActions;
 
 // Durée de mise en cache : 5 minutes pour les données de tableau de bord
 const DASHBOARD_CACHE_DURATION = 5 * 60 * 1000;
 
 // Les plages de temps prédéfinies
 const timeRangeOptions: TimeRangeOption[] = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: 'week' },
  { label: '30 derniers jours', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Année', value: 'year' },
  { label: 'Personnalisé', value: 'custom' }
 ];
 
 // Fonction utilitaire pour calculer la plage de dates en fonction de l'option sélectionnée
 const getDateRangeFromOption = (option: TimeRangeOption): { start: Date, end: Date } => {
  const end = new Date();
  let start = new Date();
  
  switch (option.value) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setDate(start.getDate() - 30);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'custom':
      if (option.dateRange) {
        return option.dateRange;
      }
      // Par défaut, 30 derniers jours si pas de plage personnalisée
      start.setDate(start.getDate() - 30);
      break;
  }
  
  return { start, end };
 };
 
 const initialState: StatsState = {
  dashboardStats: null,
  maintenanceStats: null,
  utilisationStats: null,
  utilisationHebdomadaire: null,
  isLoading: false,
  error: null,
  selectedTimeRange: timeRangeOptions[1], // Par défaut, 7 derniers jours
  customDateRange: {
    start: null,
    end: null
  },
  lastFetched: {
    dashboard: null,
    maintenance: null,
    utilisation: null
  }
 };
 
export const createStatsSlice: StateCreator<
  StatsSlice, 
  [["zustand/immer", never]], 
  [["zustand/immer", never]], 
  StatsSlice
 > = immer((set, get) => ({
  ...initialState,
  
  fetchDashboardStats: async () => {
    const now = Date.now();
    const lastFetched = get().lastFetched.dashboard;
    
    // Vérifier si on a récupéré les données récemment
    if (lastFetched && (now - lastFetched) < DASHBOARD_CACHE_DURATION) {
      return; // Utiliser les données en cache
    }
    
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const dashboardData = await getDashboardData();
      
      set((state) => {
        state.dashboardStats = dashboardData;
        state.isLoading = false;
        state.lastFetched.dashboard = now;
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
    }
  },
  
  fetchMaintenanceStats: async (dateDebut, dateFin) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const maintenanceStats = await getMaintenanceStats(dateDebut, dateFin);
      
      set((state) => {
        state.maintenanceStats = maintenanceStats;
        state.isLoading = false;
        state.lastFetched.maintenance = Date.now();
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
    }
  },
  
  fetchUtilisationStats: async (dateDebut, dateFin) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const utilisationStats = await getUtilisationStats(dateDebut, dateFin);
      
      set((state) => {
        state.utilisationStats = utilisationStats;
        state.isLoading = false;
        state.lastFetched.utilisation = Date.now();
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
    }
  },
  
  fetchUtilisationHebdomadaire: async () => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const utilisationHebdo = await getUtilisationHebdomadaire();
      
      set((state) => {
        state.utilisationHebdomadaire = utilisationHebdo;
        state.isLoading = false;
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
    }
  },
  
  setTimeRange: (range) => {
    set((state) => {
      state.selectedTimeRange = range;
    });
  },
  
  setCustomDateRange: (start, end) => {
    set((state) => {
      state.customDateRange = { start, end };
      if (start && end) {
        state.selectedTimeRange = {
          ...state.selectedTimeRange,
          value: 'custom',
          dateRange: { start, end }
        };
      }
    });
  },
  
  applySelectedTimeRange: async () => {
    const { selectedTimeRange, customDateRange } = get();
    
    let dateRange;
    
    if (selectedTimeRange.value === 'custom' && customDateRange.start && customDateRange.end) {
      dateRange = {
        start: customDateRange.start,
        end: customDateRange.end
      };
    } else {
      dateRange = getDateRangeFromOption(selectedTimeRange);
    }
    
    // Appliquer cette plage aux différentes statistiques
    await Promise.all([
      get().fetchMaintenanceStats(dateRange.start, dateRange.end),
      get().fetchUtilisationStats(dateRange.start, dateRange.end)
    ]);
  },
  
  refreshAllStats: async () => {
    await Promise.all([
      get().fetchDashboardStats(),
      get().fetchUtilisationHebdomadaire(),
      get().applySelectedTimeRange() // Cela mettra à jour maintenanceStats et utilisationStats
    ]);
  }
 }));