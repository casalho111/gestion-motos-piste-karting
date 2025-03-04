import { StateCreator } from 'zustand';
import { QueryState, PaginationState, FilterState, PaginatedResult } from '../types';
import { EtatEntite } from '@prisma/client';
import { getMoteurs, getMoteurById, changeEtatMoteur, monterMoteur, demonterMoteur } from '@/app/actions/moteurs';

// Type pour un moteur avec ses relations
export interface MoteurWithRelations {
  id: string;
  numSerie: string;
  type: string;
  cylindree: number;
  dateAcquisition: Date;
  kilometrage: number;
  heuresMoteur?: number | null;
  etat: EtatEntite;
  notesEtat?: string | null;
  cycleActuel?: {
    id: string;
    numSerie: string;
    modele: string;
  } | null;
  // Relations additionnelles peuvent être ajoutées selon les besoins
}

// Type pour les filtres de moteur
export interface MoteurFilters extends FilterState {
  etat?: EtatEntite;
  type?: string;
  estMonte?: boolean;
}

export interface MoteurSlice {
  // Liste des moteurs avec pagination et filtres
  moteurs: QueryState<MoteurWithRelations[]>;
  pagination: PaginationState;
  filters: MoteurFilters;
  
  // Moteur actuellement sélectionné
  currentMoteur: QueryState<MoteurWithRelations>;
  
  // Actions
  fetchMoteurs: () => Promise<void>;
  fetchMoteurById: (id: string) => Promise<void>;
  changeEtat: (id: string, nouvelEtat: EtatEntite, notes?: string) => Promise<boolean>;
  monterMoteurSurCycle: (moteurId: string, cycleId: string, technicien: string, notes?: string) => Promise<boolean>;
  demonterMoteurDeCycle: (cycleId: string, technicien: string, notes?: string) => Promise<boolean>;
  
  // Gestion des filtres et pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<MoteurFilters>) => void;
  resetFilters: () => void;
  
  // Sélecteurs dérivés
  getMoteursDisponibles: () => MoteurWithRelations[];
  getMoteursMontes: () => MoteurWithRelations[];
}

// Valeurs par défaut
const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const defaultFilters: MoteurFilters = {
  search: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

export const createMoteurSlice: StateCreator<MoteurSlice, [], []> = (set, get) => ({
  // État initial
  moteurs: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  pagination: { ...defaultPagination },
  
  filters: { ...defaultFilters },
  
  currentMoteur: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  // Actions pour récupérer les données
  fetchMoteurs: async () => {
    const { page, limit } = get().pagination;
    const { search, etat, type, estMonte } = get().filters;
    
    try {
      set(state => ({
        moteurs: { ...state.moteurs, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<MoteurWithRelations> = await getMoteurs({
        page,
        limit,
        etat,
        type,
        estMonte,
        search: search || undefined
      });
      
      set({
        moteurs: {
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
    } catch (error) {
      set(state => ({
        moteurs: {
          ...state.moteurs,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des moteurs',
        }
      }));
    }
  },
  
  fetchMoteurById: async (id) => {
    try {
      set(state => ({
        currentMoteur: { ...state.currentMoteur, status: 'loading', error: null }
      }));
      
      const result = await getMoteurById(id);
      
      set({
        currentMoteur: {
          data: result as MoteurWithRelations,
          status: 'success',
          error: null,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      set(state => ({
        currentMoteur: {
          ...state.currentMoteur,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement du moteur',
        }
      }));
    }
  },
  
  changeEtat: async (id, nouvelEtat, notes) => {
    try {
      const result = await changeEtatMoteur(id, nouvelEtat, notes);
      
      if (result.success) {
        // Mettre à jour le moteur dans l'état
        set(state => {
          if (!state.moteurs.data) return state;
          
          const updatedMoteurs = state.moteurs.data.map(moteur => 
            moteur.id === id 
              ? { ...moteur, etat: nouvelEtat, notesEtat: notes || moteur.notesEtat } 
              : moteur
          );
          
          // Mettre à jour également le moteur courant si c'est celui qui a été modifié
          const updatedCurrentMoteur = state.currentMoteur.data?.id === id
            ? { ...state.currentMoteur.data, etat: nouvelEtat, notesEtat: notes || state.currentMoteur.data.notesEtat }
            : state.currentMoteur.data;
            
          return {
            moteurs: {
              ...state.moteurs,
              data: updatedMoteurs
            },
            currentMoteur: {
              ...state.currentMoteur,
              data: updatedCurrentMoteur
            }
          };
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du changement d\'état:', error);
      return false;
    }
  },
  
  monterMoteurSurCycle: async (moteurId, cycleId, technicien, notes) => {
    try {
      const result = await monterMoteur({
        moteurId,
        cycleId,
        technicien,
        date: new Date(),
        notes
      });
      
      if (result.success) {
        // Refetch les données pour refléter le montage
        get().fetchMoteurs();
        get().fetchMoteurById(moteurId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du montage du moteur:', error);
      return false;
    }
  },
  
  demonterMoteurDeCycle: async (cycleId, technicien, notes) => {
    try {
      const result = await demonterMoteur({
        cycleId,
        technicien,
        date: new Date(),
        notes
      });
      
      if (result.success) {
        // Refetch les données pour refléter le démontage
        get().fetchMoteurs();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du démontage du moteur:', error);
      return false;
    }
  },
  
  // Gestion des filtres et pagination
  setPage: (page) => set(state => ({
    pagination: { ...state.pagination, page }
  })),
  
  setLimit: (limit) => set(state => ({
    pagination: { ...state.pagination, limit, page: 1 } // Retour à la page 1 lors du changement de limite
  })),
  
  setFilters: (filters) => set(state => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 } // Retour à la page 1 lors du changement de filtres
  })),
  
  resetFilters: () => set(state => ({
    filters: { ...defaultFilters },
    pagination: { ...state.pagination, page: 1 }
  })),
  
  // Sélecteurs dérivés
  getMoteursDisponibles: () => {
    const { moteurs } = get();
    if (!moteurs.data) return [];
    return moteurs.data.filter(moteur => 
      moteur.etat === 'DISPONIBLE' && moteur.cycleActuel === null
    );
  },
  
  getMoteursMontes: () => {
    const { moteurs } = get();
    if (!moteurs.data) return [];
    return moteurs.data.filter(moteur => moteur.cycleActuel !== null);
  }
});