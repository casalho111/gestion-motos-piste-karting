import { StateCreator } from 'zustand';
import { EtatEntite } from '@prisma/client';
import { immer } from 'zustand/middleware/immer';
import { 
  Moto, 
  PaginationState, 
  FilterOptions, 
  ServerActionResponse 
} from '../types';
import { 
  getMotos, 
  getMotoById, 
  updateMoto, 
  createMoto, 
  deleteMoto, 
  changeEtatMoto 
} from '@/app/actions/motos';

// Définition de l'état du store
export interface MotoState {
  motos: Moto[];
  activeMoto: Moto | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: FilterOptions;
  cache: Record<string, { data: Moto, timestamp: number }>;
  lastFetched: number | null;
}

// Définition des actions du store
export interface MotoActions {
  fetchMotos: (page?: number, options?: FilterOptions) => Promise<void>;
  fetchMotoById: (id: string, forceRefresh?: boolean) => Promise<Moto | null>;
  createNewMoto: (data: { 
    numSerie: string; 
    modele: string;
    dateAcquisition?: Date;
    etat?: EtatEntite;
    notesEtat?: string;
    couleur?: string;
    moteurCourantId?: string;
  }) => Promise<ServerActionResponse<Moto>>;
  updateExistingMoto: (id: string, data: Partial<Moto>) => Promise<ServerActionResponse<Moto>>;
  removeMoto: (id: string) => Promise<ServerActionResponse>;
  changeMotoStatus: (id: string, newStatus: EtatEntite, notes?: string) => Promise<ServerActionResponse<Moto>>;
  setFilters: (filters: FilterOptions) => void;
  setPage: (page: number) => void;
  clearCache: () => void;
  invalidateCache: (id?: string) => void;
}

// Type complet du slice
export type MotoSlice = MotoState & MotoActions;

// 30 minutes en millisecondes pour le cache
const CACHE_DURATION = 30 * 60 * 1000;

// État initial
const initialState: MotoState = {
  motos: [],
  activeMoto: null,
  isLoading: false,
  isLoadingDetails: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  },
  filters: {},
  cache: {},
  lastFetched: null
};

// Création du slice avec immer
export const createMotoSlice: StateCreator<
  MotoSlice,
  [["zustand/immer", never]],
  [["zustand/immer", never]],
  MotoSlice
> = immer((set, get) => ({
  ...initialState,
  
  fetchMotos: async (page = 1, options = {}) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const filters = { ...get().filters, ...options };
      const result = await getMotos({
        page,
        limit: get().pagination.perPage,
        ...filters
      });
      
      set((state) => {
        state.motos = result.data as unknown as Moto[];
        state.pagination = {
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.pageCount,
          totalItems: result.pagination.total,
          perPage: result.pagination.perPage
        };
        state.filters = filters;
        state.isLoading = false;
        state.lastFetched = Date.now();
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
    }
  },
  
  fetchMotoById: async (id, forceRefresh = false) => {
    const { cache } = get();
    const now = Date.now();
    
    // Vérifier le cache d'abord si on ne force pas le rafraîchissement
    if (!forceRefresh && cache[id] && (now - cache[id].timestamp) < CACHE_DURATION) {
      set((state) => {
        state.activeMoto = cache[id].data;
      });
      return cache[id].data;
    }
    
    // Sinon, faire la requête
    try {
      set((state) => {
        state.isLoadingDetails = true;
        state.error = null;
      });
      
      const moto = await getMotoById(id);
      const typedMoto = moto as unknown as Moto;
      
      set((state) => {
        state.activeMoto = typedMoto;
        state.isLoadingDetails = false;
        state.cache[id] = { data: typedMoto, timestamp: now };
      });
      
      return typedMoto;
    } catch (error) {
      set((state) => {
        state.isLoadingDetails = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
        state.activeMoto = null;
      });
      return null;
    }
  },
  
  createNewMoto: async (data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await createMoto(data);
      
      if (result.success && result.data) {
        const newMoto = result.data as unknown as Moto;
        
        set((state) => {
          state.motos = [newMoto, ...state.motos];
          state.isLoading = false;
        });
        
        // Rafraîchir la liste pour être sûr que tout est à jour
        await get().fetchMotos(get().pagination.currentPage);
        return { success: true, data: newMoto };
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la création";
        });
        return result as ServerActionResponse<Moto>;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { 
        success: false, 
        error: get().error || 'Erreur inconnue' 
      };
    }
  },
  
  updateExistingMoto: async (id, data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // Get the current moto to provide required fields if they're missing
      const currentMoto = get().activeMoto || get().motos.find(m => m.id === id);
      
      // Create a clean version of data without null values
      const cleanData = { ...data };
      // Convertir toutes les valeurs null en undefined
      if (cleanData.notesEtat === null) cleanData.notesEtat = undefined;
      if (cleanData.couleur === null) cleanData.couleur = undefined;
      if (cleanData.moteurCourantId === null) cleanData.moteurCourantId = undefined;
      
      // Create update data object without spreading cleanData to ensure proper typing
      const updateData = {
        numSerie: cleanData.numSerie ?? currentMoto?.numSerie ?? '',
        modele: cleanData.modele ?? currentMoto?.modele ?? '',
        dateAcquisition: cleanData.dateAcquisition,
        etat: cleanData.etat,
        notesEtat: cleanData.notesEtat,
        couleur: cleanData.couleur, // Maintenant c'est string | undefined, plus de null
        moteurCourantId: cleanData.moteurCourantId, // Pareil ici
        kilometrage: cleanData.kilometrage
      };
      
      const result = await updateMoto(id, updateData);
      
      if (result.success && result.data) {
        const updatedMoto = result.data as unknown as Moto;
        
        set((state) => {
          state.motos = state.motos.map(moto => 
            moto.id === id ? { ...moto, ...updatedMoto } : moto
          );
          
          if (state.activeMoto && state.activeMoto.id === id) {
            state.activeMoto = { ...state.activeMoto, ...updatedMoto };
          }
          
          // Mettre à jour le cache
          if (state.cache[id]) {
            const cacheData = state.activeMoto || updatedMoto;
            state.cache[id] = { 
              data: cacheData, 
              timestamp: Date.now() 
            };
          }
          
          state.isLoading = false;
        });
        return { success: true, data: updatedMoto };
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la mise à jour";
        });
        return result as ServerActionResponse<Moto>;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { 
        success: false, 
        error: get().error || 'Erreur inconnue' 
      };
    }
  },
  
  removeMoto: async (id) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await deleteMoto(id);
      
      if (result.success) {
        set((state) => {
          state.motos = state.motos.filter(moto => moto.id !== id);
          
          if (state.activeMoto && state.activeMoto.id === id) {
            state.activeMoto = null;
          }
          
          // Supprimer du cache
          delete state.cache[id];
          
          state.isLoading = false;
        });
        return result;
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la suppression";
        });
        return result;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { 
        success: false, 
        error: get().error || 'Erreur inconnue' 
      };
    }
  },
  
  changeMotoStatus: async (id, newStatus, notes) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await changeEtatMoto(id, newStatus, notes);
      
      if (result.success && result.data) {
        const updatedMoto = result.data as unknown as Moto;
        
        set((state) => {
          state.motos = state.motos.map(moto => 
            moto.id === id ? { 
              ...moto, 
              etat: newStatus, 
              notesEtat: notes || moto.notesEtat 
            } : moto
          );
          
          if (state.activeMoto && state.activeMoto.id === id) {
            state.activeMoto = { 
              ...state.activeMoto, 
              etat: newStatus, 
              notesEtat: notes || state.activeMoto.notesEtat 
            };
          }
          
          // Mettre à jour le cache
          if (state.cache[id]) {
            const cacheData = state.cache[id].data;
            state.cache[id] = { 
              data: {
                ...cacheData,
                etat: newStatus,
                notesEtat: notes || cacheData.notesEtat
              }, 
              timestamp: Date.now() 
            };
          }
          
          state.isLoading = false;
        });
        return { success: true, data: updatedMoto };
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec du changement d'état";
        });
        return result as ServerActionResponse<Moto>;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { 
        success: false, 
        error: get().error || 'Erreur inconnue' 
      };
    }
  },
  
  setFilters: (filters) => {
    set((state) => {
      state.filters = filters;
    });
    // Appliquer les filtres immédiatement
    get().fetchMotos(1, filters);
  },
  
  setPage: (page) => {
    get().fetchMotos(page, get().filters);
  },
  
  clearCache: () => {
    set((state) => {
      state.cache = {};
    });
  },
  
  invalidateCache: (id) => {
    if (id) {
      set((state) => {
        delete state.cache[id];
      });
    } else {
      get().clearCache();
    }
  }
}));