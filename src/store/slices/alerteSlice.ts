import { StateCreator } from 'zustand';
import { QueryState, PaginationState, FilterState, PaginatedResult } from '../types';
import { Criticite } from '@prisma/client';
import { getAlertes, traiterAlerte, genererAlertesEntretien } from '@/app/actions/alertes';

// Type pour une alerte
export interface AlerteWithRelations {
  id: string;
  titre: string;
  message: string;
  type: string;
  criticite: Criticite;
  dateCreation: Date;
  estTraitee: boolean;
  traitePar?: string | null;
  dateTraitement?: Date | null;
  cycleId?: string | null;
  moteurId?: string | null;
  pieceId?: string | null;
}

// Type pour les filtres d'alerte
export interface AlerteFilters extends FilterState {
  type?: string;
  criticite?: Criticite;
  estTraitee?: boolean;
}

export interface AlerteSlice {
  // Liste des alertes avec pagination et filtres
  alertes: QueryState<AlerteWithRelations[]>;
  pagination: PaginationState;
  filters: AlerteFilters;
  
  // Nombre d'alertes non traitées (pour l'interface)
  nombreAlertesNonTraitees: number;
  
  // Actions
  fetchAlertes: () => Promise<void>;
  traiterAlerte: (id: string, utilisateur: string) => Promise<boolean>;
  genererAlertes: () => Promise<{ success: boolean; count?: number }>;
  
  // Gestion des filtres et pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<AlerteFilters>) => void;
  resetFilters: () => void;
  
  // Sélecteurs dérivés
  getAlertesCritiques: () => AlerteWithRelations[];
  getAlertesParType: (type: string) => AlerteWithRelations[];
}

// Valeurs par défaut
const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const defaultFilters: AlerteFilters = {
  search: '',
  sortBy: 'dateCreation',
  sortDirection: 'desc',
  estTraitee: false, // Par défaut, afficher les alertes non traitées
};

export const createAlerteSlice: StateCreator<AlerteSlice, [], []> = (set, get) => ({
  // État initial
  alertes: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  pagination: { ...defaultPagination },
  
  filters: { ...defaultFilters },
  
  nombreAlertesNonTraitees: 0,
  
  // Actions
  fetchAlertes: async () => {
    const { page, limit } = get().pagination;
    const { search, type, criticite, estTraitee } = get().filters;
    
    try {
      set(state => ({
        alertes: { ...state.alertes, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<AlerteWithRelations> = await getAlertes({
        page,
        limit,
        type,
        criticite,
        estTraitee,
        search: search || undefined
      });
      
      set({
        alertes: {
          data: result.data,
          status: 'success',
          error: null,
          timestamp: Date.now()
        },
        pagination: {
          ...get().pagination,
          total: result.pagination.total,
          totalPages: result.pagination.pageCount
        }
      });
      
      // Si c'est la première page des alertes non traitées, mettre à jour le compteur
      if (page === 1 && estTraitee === false) {
        set({ nombreAlertesNonTraitees: result.pagination.total });
      }
    } catch (error) {
      set(state => ({
        alertes: {
          ...state.alertes,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des alertes',
        }
      }));
    }
  },
  
  traiterAlerte: async (id, utilisateur) => {
    try {
      const result = await traiterAlerte(id, utilisateur);
      
      if (result.success) {
        // Mettre à jour les alertes dans l'état
        set(state => {
          if (!state.alertes.data) return state;
          
          // Mettre à jour l'alerte traitée
          const updatedAlertes = state.alertes.data.map(alerte => 
            alerte.id === id 
              ? { 
                  ...alerte, 
                  estTraitee: true, 
                  traitePar: utilisateur,
                  dateTraitement: new Date()
                } 
              : alerte
          );
          
          // Si on affiche uniquement les alertes non traitées, filtrer celle qui vient d'être traitée
          const filteredAlertes = state.filters.estTraitee === false 
            ? updatedAlertes.filter(alerte => !alerte.estTraitee) 
            : updatedAlertes;
          
          // Mettre à jour le nombre d'alertes non traitées
          const newNombreAlertesNonTraitees = Math.max(0, state.nombreAlertesNonTraitees - 1);
          
          return {
            alertes: {
              ...state.alertes,
              data: filteredAlertes
            },
            nombreAlertesNonTraitees: newNombreAlertesNonTraitees
          };
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du traitement de l\'alerte:', error);
      return false;
    }
  },
  
  genererAlertes: async () => {
    try {
      const result = await genererAlertesEntretien();
      
      if (result.success) {
        // Rafraîchir les alertes après la génération
        get().fetchAlertes();
        
        return { 
          success: true, 
          count: result.stats?.total || 0 
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Erreur lors de la génération des alertes:', error);
      return { success: false };
    }
  },
  
  // Gestion des filtres et pagination
  setPage: (page) => set(state => ({
    pagination: { ...state.pagination, page }
  })),
  
  setLimit: (limit) => set(state => ({
    pagination: { ...state.pagination, limit, page: 1 }
  })),
  
  setFilters: (filters) => set(state => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 }
  })),
  
  resetFilters: () => set(state => ({
    filters: { ...defaultFilters },
    pagination: { ...state.pagination, page: 1 }
  })),
  
  // Sélecteurs dérivés
  getAlertesCritiques: () => {
    const { alertes } = get();
    if (!alertes.data) return [];
    return alertes.data.filter(
      alerte => alerte.criticite === 'ELEVEE' || alerte.criticite === 'CRITIQUE'
    );
  },
  
  getAlertesParType: (type) => {
    const { alertes } = get();
    if (!alertes.data) return [];
    return alertes.data.filter(alerte => alerte.type === type);
  }
});