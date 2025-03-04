import { StateCreator } from 'zustand';
import { QueryState } from '../types';
import { getDashboardData, getUtilisationHebdomadaire } from '@/app/actions/dashboard';
import { getMaintenanceStats } from '@/app/actions/stats';
import { getUtilisationStats } from '@/app/actions/utilisations';

// Types pour les statistiques
export interface DashboardData {
  cycles: {
    total: number;
    disponibles: number;
    enMaintenance: number;
    aVerifier: number;
    horsService: number;
  };
  moteurs: {
    total: number;
    disponibles: number;
    montes: number;
    enMaintenance: number;
    horsService: number;
  };
  maintenances: {
    recentes: any[];
    coutTotal: number;
  };
  alertes: {
    piecesStockBas: any[];
  };
  activite: {
    controles: any[];
    montages: any[];
  };
  utilisation: {
    hebdomadaire: any[];
  };
  motosAvecEtat?: any[];
  controleManquants?: any[];
  prochainesMaintenances?: any[];
  alertesCreees?: any[];
  alertesStats?: any;
  planningsGeneres?: any[];
  planningStats?: any;
}

export interface MaintenanceStats {
  total: {
    count: number;
    cout: number;
  };
  coutParType: Record<string, number>;
  coutParModele: Record<string, number>;
  piecesLesPlusUtilisees: any[];
  maintenances: any[];
}

export interface UtilisationStats {
  cycle: {
    id: string;
    numSerie: string;
    modele: string;
  };
  totalDistance: number;
  totalTours: number;
  sessionCount: number;
  utilisations: any[];
}

export interface PeriodeDate {
  debut: Date;
  fin: Date;
}

export interface StatsSlice {
  // États de différentes statistiques
  dashboard: QueryState<DashboardData>;
  utilisationHebdomadaire: QueryState<any[]>;
  maintenanceStats: QueryState<MaintenanceStats>;
  utilisationStats: QueryState<UtilisationStats[]>;
  
  // Période sélectionnée pour les statistiques
  periodeMaintenance: PeriodeDate;
  periodeUtilisation: PeriodeDate;
  
  // Actions pour charger les statistiques
  fetchDashboardData: () => Promise<void>;
  fetchUtilisationHebdomadaire: () => Promise<void>;
  fetchMaintenanceStats: () => Promise<void>;
  fetchUtilisationStats: () => Promise<void>;
  
  // Gestion des périodes
  setPeriodeMaintenance: (periode: PeriodeDate) => void;
  setPeriodeUtilisation: (periode: PeriodeDate) => void;
  
  // Sélecteurs dérivés
  getTauxDisponibilite: () => number;
  getTauxUtilisation: () => number;
  getCoutMoyenParKm: () => number;
}

export const createStatsSlice: StateCreator<StatsSlice, [], []> = (set, get) => {
  // Fonction pour initialiser une date début/fin (par défaut: dernier mois)
  const getDefaultPeriode = (): PeriodeDate => {
    const maintenant = new Date();
    const debut = new Date(maintenant);
    debut.setMonth(debut.getMonth() - 1);
    
    return {
      debut,
      fin: maintenant
    };
  };
  
  return {
    // États initiaux
    dashboard: {
      data: null,
      status: 'idle',
      error: null,
      timestamp: null
    },
    
    utilisationHebdomadaire: {
      data: null,
      status: 'idle',
      error: null,
      timestamp: null
    },
    
    maintenanceStats: {
      data: null,
      status: 'idle',
      error: null,
      timestamp: null
    },
    
    utilisationStats: {
      data: null,
      status: 'idle',
      error: null,
      timestamp: null
    },
    
    // Périodes par défaut
    periodeMaintenance: getDefaultPeriode(),
    periodeUtilisation: getDefaultPeriode(),
    
    // Actions pour charger les statistiques
    fetchDashboardData: async () => {
      try {
        set(state => ({
          dashboard: { ...state.dashboard, status: 'loading', error: null }
        }));
        
        const result = await getDashboardData();
        
        set({
          dashboard: {
            data: result as DashboardData,
            status: 'success',
            error: null,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        set(state => ({
          dashboard: {
            ...state.dashboard,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des données du dashboard',
          }
        }));
      }
    },
    
    fetchUtilisationHebdomadaire: async () => {
      try {
        set(state => ({
          utilisationHebdomadaire: { ...state.utilisationHebdomadaire, status: 'loading', error: null }
        }));
        
        const result = await getUtilisationHebdomadaire();
        
        set({
          utilisationHebdomadaire: {
            data: result,
            status: 'success',
            error: null,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        set(state => ({
          utilisationHebdomadaire: {
            ...state.utilisationHebdomadaire,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des données d\'utilisation hebdomadaire',
          }
        }));
      }
    },
    
    fetchMaintenanceStats: async () => {
      try {
        const { periodeMaintenance } = get();
        
        set(state => ({
          maintenanceStats: { ...state.maintenanceStats, status: 'loading', error: null }
        }));
        
        const result = await getMaintenanceStats(
          periodeMaintenance.debut, 
          periodeMaintenance.fin
        );
        
        set({
          maintenanceStats: {
            data: result as MaintenanceStats,
            status: 'success',
            error: null,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        set(state => ({
          maintenanceStats: {
            ...state.maintenanceStats,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques de maintenance',
          }
        }));
      }
    },
    
    fetchUtilisationStats: async () => {
      try {
        const { periodeUtilisation } = get();
        
        set(state => ({
          utilisationStats: { ...state.utilisationStats, status: 'loading', error: null }
        }));
        
        const result = await getUtilisationStats(
          periodeUtilisation.debut, 
          periodeUtilisation.fin
        );
        
        set({
          utilisationStats: {
            data: result as UtilisationStats[],
            status: 'success',
            error: null,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        set(state => ({
          utilisationStats: {
            ...state.utilisationStats,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques d\'utilisation',
          }
        }));
      }
    },
    
    // Gestion des périodes
    setPeriodeMaintenance: (periode) => set({ periodeMaintenance: periode }),
    setPeriodeUtilisation: (periode) => set({ periodeUtilisation: periode }),
    
    // Sélecteurs dérivés
    getTauxDisponibilite: () => {
      const { dashboard } = get();
      if (!dashboard.data) return 0;
      
      const { cycles } = dashboard.data;
      if (cycles.total === 0) return 0;
      
      return (cycles.disponibles / cycles.total) * 100;
    },
    
    getTauxUtilisation: () => {
      const { utilisationStats } = get();
      if (!utilisationStats.data || utilisationStats.data.length === 0) return 0;
      
      // Calculer le nombre total de jours de la période
      const { periodeUtilisation } = get();
      const joursPeriode = Math.ceil(
        (periodeUtilisation.fin.getTime() - periodeUtilisation.debut.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculer le nombre total de sessions pour toutes les motos
      const totalSessions = utilisationStats.data.reduce(
        (total, stat) => total + stat.sessionCount, 
        0
      );
      
      // Taux d'utilisation = sessions / (nombre de motos * jours de la période)
      const { dashboard } = get();
      if (!dashboard.data) return 0;
      
      const nombreMotos = dashboard.data.cycles.total;
      if (nombreMotos === 0 || joursPeriode === 0) return 0;
      
      return (totalSessions / (nombreMotos * joursPeriode)) * 100;
    },
    
    getCoutMoyenParKm: () => {
      const { maintenanceStats, utilisationStats } = get();
      
      if (!maintenanceStats.data || !utilisationStats.data) return 0;
      
      const coutTotal = maintenanceStats.data.total.cout;
      
      const distanceTotale = utilisationStats.data.reduce(
        (total, stat) => total + stat.totalDistance, 
        0
      );
      
      if (distanceTotale === 0) return 0;
      
      return coutTotal / distanceTotale;
    }
  };
};