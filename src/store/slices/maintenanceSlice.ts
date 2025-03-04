import { StateCreator } from 'zustand';
import { QueryState, PaginationState, FilterState, PaginatedResult } from '../types';
import { TypeEntretien } from '@prisma/client';
import { getMaintenances, getMaintenanceById, finaliserMaintenance } from '@/app/actions/maintenances';
import { getPlanningMaintenances, completerPlanningMaintenance } from '@/app/actions/planning';

// Types pour les maintenances
export interface MaintenanceWithRelations {
  id: string;
  type: TypeEntretien;
  dateRealisation: Date;
  kilometrageEffectue: number;
  coutTotal: number;
  technicien: string;
  description: string;
  notes?: string | null;
  cycleId?: string | null;
  moteurId?: string | null;
  cycle?: {
    id: string;
    numSerie: string;
    modele: string;
  } | null;
  moteur?: {
    id: string;
    numSerie: string;
    type: string;
  } | null;
  piecesUtilisees: Array<{
    id: string;
    quantite: number;
    prixUnitaire: number;
    piece: {
      id: string;
      reference: string;
      nom: string;
    };
  }>;
}

// Type pour les plannings de maintenance
export interface PlanningMaintenanceWithRelations {
  id: string;
  titre: string;
  description: string;
  type: TypeEntretien;
  dateEstimee: Date;
  estMoteur: boolean;
  entiteId: string;
  kilometragePrevu: number;
  criticite: string;
  technicienAssigne?: string | null;
  estComplete: boolean;
  entite?: any; // Entité associée (cycle ou moteur)
}

// Type pour les filtres de maintenance
export interface MaintenanceFilters extends FilterState {
  type?: TypeEntretien;
  cycleId?: string;
  moteurId?: string;
  dateDebut?: Date;
  dateFin?: Date;
}

// Type pour les filtres de planning
export interface PlanningFilters extends FilterState {
  type?: TypeEntretien;
  estComplete?: boolean;
  dateMin?: Date;
  dateMax?: Date;
  criticite?: string;
}

export interface MaintenanceSlice {
  // Liste des maintenances avec pagination et filtres
  maintenances: QueryState<MaintenanceWithRelations[]>;
  maintenancePagination: PaginationState;
  maintenanceFilters: MaintenanceFilters;
  
  // Liste des plannings avec pagination et filtres
  plannings: QueryState<PlanningMaintenanceWithRelations[]>;
  planningPagination: PaginationState;
  planningFilters: PlanningFilters;
  
  // Éléments sélectionnés
  currentMaintenance: QueryState<MaintenanceWithRelations>;
  currentPlanning: QueryState<PlanningMaintenanceWithRelations>;
  
  // Actions pour les maintenances
  fetchMaintenances: () => Promise<void>;
  fetchMaintenanceById: (id: string) => Promise<void>;
  finaliserMaintenance: (id: string, notes?: string) => Promise<boolean>;
  
  // Actions pour les plannings
  fetchPlannings: () => Promise<void>;
  completerPlanning: (id: string, maintenanceId?: string) => Promise<boolean>;
  
  // Gestion des filtres et pagination pour les maintenances
  setMaintenancePage: (page: number) => void;
  setMaintenanceLimit: (limit: number) => void;
  setMaintenanceFilters: (filters: Partial<MaintenanceFilters>) => void;
  resetMaintenanceFilters: () => void;
  
  // Gestion des filtres et pagination pour les plannings
  setPlanningPage: (page: number) => void;
  setPlanningLimit: (limit: number) => void;
  setPlanningFilters: (filters: Partial<PlanningFilters>) => void;
  resetPlanningFilters: () => void;
  
  // Sélecteurs dérivés
  getMaintenancesParType: (type: TypeEntretien) => MaintenanceWithRelations[];
  getPlanningsActifs: () => PlanningMaintenanceWithRelations[];
  getCoutTotalMaintenances: () => number;
}

// Valeurs par défaut
const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const defaultMaintenanceFilters: MaintenanceFilters = {
  search: '',
  sortBy: 'dateRealisation',
  sortDirection: 'desc',
};

const defaultPlanningFilters: PlanningFilters = {
  search: '',
  sortBy: 'dateEstimee',
  sortDirection: 'asc',
  estComplete: false,
};

export const createMaintenanceSlice: StateCreator<MaintenanceSlice, [], []> = (set, get) => ({
  // États initiaux
  maintenances: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  maintenancePagination: { ...defaultPagination },
  
  maintenanceFilters: { ...defaultMaintenanceFilters },
  
  plannings: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  planningPagination: { ...defaultPagination },
  
  planningFilters: { ...defaultPlanningFilters },
  
  currentMaintenance: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  currentPlanning: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  // Actions pour les maintenances
  fetchMaintenances: async () => {
    const { maintenancePagination, maintenanceFilters } = get();
    const { page, limit } = maintenancePagination;
    const { search, type, cycleId, moteurId, dateDebut, dateFin } = maintenanceFilters;
    
    try {
      set(state => ({
        maintenances: { ...state.maintenances, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<MaintenanceWithRelations> = await getMaintenances({
        page,
        limit,
        type,
        cycleId,
        moteurId,
        dateDebut,
        dateFin
      });
      
      set({
        maintenances: {
          data: result.data,
          status: 'success',
          error: null,
          timestamp: Date.now()
        },
        maintenancePagination: {
          ...get().maintenancePagination,
          total: result.pagination.total,
          totalPages: result.pagination.pageCount
        }
      });
    } catch (error) {
      set(state => ({
        maintenances: {
          ...state.maintenances,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des maintenances',
        }
      }));
    }
  },
  
  fetchMaintenanceById: async (id) => {
    try {
      set(state => ({
        currentMaintenance: { ...state.currentMaintenance, status: 'loading', error: null }
      }));
      
      const result = await getMaintenanceById(id);
      
      set({
        currentMaintenance: {
          data: result as MaintenanceWithRelations,
          status: 'success',
          error: null,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      set(state => ({
        currentMaintenance: {
          ...state.currentMaintenance,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement de la maintenance',
        }
      }));
    }
  },
  
  finaliserMaintenance: async (id, notes) => {
    try {
      const result = await finaliserMaintenance(id, notes);
      
      if (result.success) {
        // Rafraîchir les données
        get().fetchMaintenances();
        if (get().currentMaintenance.data?.id === id) {
          get().fetchMaintenanceById(id);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la finalisation de la maintenance:', error);
      return false;
    }
  },
  
  // Actions pour les plannings
  fetchPlannings: async () => {
    const { planningPagination, planningFilters } = get();
    const { page, limit } = planningPagination;
    const { search, type, estComplete, dateMin, dateMax, criticite } = planningFilters;
    
    try {
      set(state => ({
        plannings: { ...state.plannings, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<PlanningMaintenanceWithRelations> = await getPlanningMaintenances({
        page,
        limit,
        type,
        estComplete,
        dateMin,
        dateMax,
        criticite: criticite as any
      });
      
      set({
        plannings: {
          data: result.data,
          status: 'success',
          error: null,
          timestamp: Date.now()
        },
        planningPagination: {
          ...get().planningPagination,
          total: result.pagination.total,
          totalPages: result.pagination.pageCount
        }
      });
    } catch (error) {
      set(state => ({
        plannings: {
          ...state.plannings,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des plannings',
        }
      }));
    }
  },
  
  completerPlanning: async (id, maintenanceId) => {
    try {
      const result = await completerPlanningMaintenance(id, maintenanceId);
      
      if (result.success) {
        // Mise à jour du planning dans l'état
        set(state => {
          if (!state.plannings.data) return state;
          
          const updatedPlannings = state.plannings.data.map(planning => 
            planning.id === id 
              ? { ...planning, estComplete: true } 
              : planning
          );
          
          return {
            plannings: {
              ...state.plannings,
              data: updatedPlannings
            }
          };
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la complétion du planning:', error);
      return false;
    }
  },
  
  // Gestion des filtres et pagination pour les maintenances
  setMaintenancePage: (page) => set(state => ({
    maintenancePagination: { ...state.maintenancePagination, page }
  })),
  
  setMaintenanceLimit: (limit) => set(state => ({
    maintenancePagination: { ...state.maintenancePagination, limit, page: 1 }
  })),
  
  setMaintenanceFilters: (filters) => set(state => ({
    maintenanceFilters: { ...state.maintenanceFilters, ...filters },
    maintenancePagination: { ...state.maintenancePagination, page: 1 }
  })),
  
  resetMaintenanceFilters: () => set(state => ({
    maintenanceFilters: { ...defaultMaintenanceFilters },
    maintenancePagination: { ...state.maintenancePagination, page: 1 }
  })),
  
  // Gestion des filtres et pagination pour les plannings
  setPlanningPage: (page) => set(state => ({
    planningPagination: { ...state.planningPagination, page }
  })),
  
  setPlanningLimit: (limit) => set(state => ({
    planningPagination: { ...state.planningPagination, limit, page: 1 }
  })),
  
  setPlanningFilters: (filters) => set(state => ({
    planningFilters: { ...state.planningFilters, ...filters },
    planningPagination: { ...state.planningPagination, page: 1 }
  })),
  
  resetPlanningFilters: () => set(state => ({
    planningFilters: { ...defaultPlanningFilters },
    planningPagination: { ...state.planningPagination, page: 1 }
  })),
  
  // Sélecteurs dérivés
  getMaintenancesParType: (type) => {
    const { maintenances } = get();
    if (!maintenances.data) return [];
    return maintenances.data.filter(maintenance => maintenance.type === type);
  },
  
  getPlanningsActifs: () => {
    const { plannings } = get();
    if (!plannings.data) return [];
    return plannings.data.filter(planning => !planning.estComplete);
  },
  
  getCoutTotalMaintenances: () => {
    const { maintenances } = get();
    if (!maintenances.data) return 0;
    
    return maintenances.data.reduce((total, maintenance) => {
      return total + maintenance.coutTotal;
    }, 0);
  }
});