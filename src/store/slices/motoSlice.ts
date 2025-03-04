import { StateCreator } from 'zustand';
import { QueryState, PaginationState, FilterState, PaginatedResult } from '../types';
import { EtatEntite } from '@prisma/client';
import { getMotos, getMotoById, updateMotoKilometrage, changeEtatMoto } from '@/app/actions/motos';

// Type pour une moto avec ses relations
export interface MotoWithRelations {
  id: string;
  numSerie: string;
  modele: string;
  dateAcquisition: Date;
  kilometrage: number;
  etat: EtatEntite;
  notesEtat?: string | null;
  couleur?: string | null;
  moteurCourantId?: string | null;
  moteurCourant?: {
    id: string;
    numSerie: string;
    type: string;
    kilometrage: number;
  } | null;
  controles?: {
    id: string;
    date: Date;
    estConforme: boolean;
  }[];
  // Relations additionnelles peuvent être ajoutées selon les besoins
}

// Type pour les filtres de moto
export interface MotoFilters extends FilterState {
  etat?: EtatEntite;
  modele?: string;
  disponible?: boolean;
}

export interface MotoSlice {
  // Liste des motos avec pagination et filtres
  motos: QueryState<MotoWithRelations[]>;
  pagination: PaginationState;
  filters: MotoFilters;
  
  // Moto actuellement sélectionnée
  currentMoto: QueryState<MotoWithRelations>;
  
  // Actions
  fetchMotos: () => Promise<void>;
  fetchMotoById: (id: string) => Promise<void>;
  updateKilometrage: (id: string, nouveauKilometrage: number) => Promise<boolean>;
  changeEtat: (id: string, nouvelEtat: EtatEntite, notes?: string) => Promise<boolean>;
  
  // Gestion des filtres et pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<MotoFilters>) => void;
  resetFilters: () => void;
  
  // Sélecteurs dérivés
  getMotosDisponibles: () => MotoWithRelations[];
  getMotosSansMoteur: () => MotoWithRelations[];
}

// Valeurs par défaut
const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const defaultFilters: MotoFilters = {
  search: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

export const createMotoSlice: StateCreator<MotoSlice, [], []> = (set, get) => ({
  // État initial
  motos: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  pagination: { ...defaultPagination },
  
  filters: { ...defaultFilters },
  
  currentMoto: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  // Actions pour récupérer les données
  fetchMotos: async () => {
    const { page, limit } = get().pagination;
    const { search, etat, modele } = get().filters;
    
    try {
      set(state => ({
        motos: { ...state.motos, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<MotoWithRelations> = await getMotos({
        page,
        limit,
        etat,
        modele,
        search: search || undefined
      });
      
      set({
        motos: {
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
        motos: {
          ...state.motos,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des motos',
        }
      }));
    }
  },
  
  fetchMotoById: async (id) => {
    try {
      set(state => ({
        currentMoto: { ...state.currentMoto, status: 'loading', error: null }
      }));
      
      const result = await getMotoById(id);
      
      set({
        currentMoto: {
          data: result as MotoWithRelations,
          status: 'success',
          error: null,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      set(state => ({
        currentMoto: {
          ...state.currentMoto,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement de la moto',
        }
      }));
    }
  },
  
  updateKilometrage: async (id, nouveauKilometrage) => {
    try {
      const result = await updateMotoKilometrage(id, nouveauKilometrage);
      
      if (result.success) {
        // Mettre à jour la moto dans l'état si elle est dans la liste
        set(state => {
          if (!state.motos.data) return state;
          
          const updatedMotos = state.motos.data.map(moto => 
            moto.id === id 
              ? { ...moto, kilometrage: nouveauKilometrage } 
              : moto
          );
          
          // Mettre à jour également la moto courante si c'est celle qui a été modifiée
          const updatedCurrentMoto = state.currentMoto.data?.id === id
            ? { ...state.currentMoto.data, kilometrage: nouveauKilometrage }
            : state.currentMoto.data;
            
          return {
            motos: {
              ...state.motos,
              data: updatedMotos
            },
            currentMoto: {
              ...state.currentMoto,
              data: updatedCurrentMoto
            }
          };
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du kilométrage:', error);
      return false;
    }
  },
  
  changeEtat: async (id, nouvelEtat, notes) => {
    try {
      const result = await changeEtatMoto(id, nouvelEtat, notes);
      
      if (result.success) {
        // Mettre à jour la moto dans l'état
        set(state => {
          if (!state.motos.data) return state;
          
          const updatedMotos = state.motos.data.map(moto => 
            moto.id === id 
              ? { ...moto, etat: nouvelEtat, notesEtat: notes || moto.notesEtat } 
              : moto
          );
          
          // Mettre à jour également la moto courante si c'est celle qui a été modifiée
          const updatedCurrentMoto = state.currentMoto.data?.id === id
            ? { ...state.currentMoto.data, etat: nouvelEtat, notesEtat: notes || state.currentMoto.data.notesEtat }
            : state.currentMoto.data;
            
          return {
            motos: {
              ...state.motos,
              data: updatedMotos
            },
            currentMoto: {
              ...state.currentMoto,
              data: updatedCurrentMoto
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
  getMotosDisponibles: () => {
    const { motos } = get();
    if (!motos.data) return [];
    return motos.data.filter(moto => moto.etat === 'DISPONIBLE');
  },
  
  getMotosSansMoteur: () => {
    const { motos } = get();
    if (!motos.data) return [];
    return motos.data.filter(moto => moto.moteurCourantId === null);
  }
});