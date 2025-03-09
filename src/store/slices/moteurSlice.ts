import { StateCreator } from 'zustand';
import { EtatEntite } from '@prisma/client';
import { immer } from 'zustand/middleware/immer';
import { MotoMoteur, PaginationState, MoteurFilterOptions } from '../types';
import { 
  getMoteurs, 
  getMoteurById, 
  createMoteur, 
  updateMoteur, 
  changeEtatMoteur,
  monterMoteur,
  demonterMoteur
} from '@/app/actions/moteurs';

export interface MoteurState {
  moteurs: MotoMoteur[];
  activeMoteur: MotoMoteur | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isMounting: boolean; // État spécifique pour les opérations de montage/démontage
  error: string | null;
  pagination: PaginationState;
  filters: MoteurFilterOptions;
  cache: Record<string, { data: MotoMoteur, timestamp: number }>;
  lastFetched: number | null;
}

export interface MoteurActions {
  fetchMoteurs: (page?: number, options?: MoteurFilterOptions) => Promise<void>;
  fetchMoteurById: (id: string, forceRefresh?: boolean) => Promise<MotoMoteur | null>;
  createNewMoteur: (data: Partial<MotoMoteur>) => Promise<{ success: boolean; data?: MotoMoteur; error?: string | null }>;
  updateExistingMoteur: (id: string, data: Partial<MotoMoteur>) => Promise<{ success: boolean; data?: MotoMoteur; error?: string | null }>;
  changeMoteurStatus: (id: string, newStatus: EtatEntite, notes?: string) => Promise<{ success: boolean; data?: MotoMoteur; error?: string | null }>;
  monterMoteurSurCycle: (params: { moteurId: string; cycleId: string; technicien: string; notes?: string }) => Promise<{ success: boolean; error?: string | null }>;
  demonterMoteurDeCycle: (params: { cycleId: string; technicien: string; notes?: string }) => Promise<{ success: boolean; error?: string | null }>;
  setFilters: (filters: MoteurFilterOptions) => void;
  setPage: (page: number) => void;
  clearCache: () => void;
  invalidateCache: (id?: string) => void;
}

export type MoteurSlice = MoteurState & MoteurActions;

// 30 minutes en millisecondes pour le cache
const CACHE_DURATION = 30 * 60 * 1000;

const initialState: MoteurState = {
  moteurs: [],
  activeMoteur: null,
  isLoading: false,
  isLoadingDetails: false,
  isMounting: false,
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

export const createMoteurSlice: StateCreator<
  MoteurSlice, 
  [["zustand/immer", never]], 
  [["zustand/immer", never]], 
  MoteurSlice
> = immer((set, get) => ({
  ...initialState,
  
  fetchMoteurs: async (page = 1, options = {}) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const filters = { ...get().filters, ...options };
      const result = await getMoteurs({
        page,
        limit: get().pagination.perPage,
        ...filters
      });
      
      set((state) => {
        state.moteurs = result.data;
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
  
  fetchMoteurById: async (id, forceRefresh = false) => {
    const { cache } = get();
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (!forceRefresh && cache[id] && (now - cache[id].timestamp) < CACHE_DURATION) {
      set((state) => {
        state.activeMoteur = cache[id].data;
      });
      return cache[id].data;
    }
    
    try {
      set((state) => {
        state.isLoadingDetails = true;
        state.error = null;
      });
      
      const moteur = await getMoteurById(id);
      
      set((state) => {
        state.activeMoteur = moteur;
        state.isLoadingDetails = false;
        // Mettre à jour le cache
        state.cache[id] = { data: moteur, timestamp: now };
      });
      
      return moteur;
    } catch (error) {
      set((state) => {
        state.isLoadingDetails = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
        state.activeMoteur = null;
      });
      return null;
    }
  },
  
  createNewMoteur: async (data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // Ensure required fields are present
      if (!data.numSerie || !data.type) {
        set((state) => {
          state.isLoading = false;
          state.error = "Le numéro de série et le type sont obligatoires";
        });
        return { success: false, error: "Le numéro de série et le type sont obligatoires" };
      }
      
      // Create motor data with required fields guaranteed
      const moteurData = {
        numSerie: data.numSerie,
        type: data.type,
        dateAcquisition: data.dateAcquisition,
        etat: data.etat,
        notesEtat: data.notesEtat === null ? undefined : data.notesEtat,
        cylindree: data.cylindree === null ? undefined : data.cylindree,
        heuresMoteur: data.heuresMoteur === null ? undefined : data.heuresMoteur
      };
      
      const result = await createMoteur(moteurData);
      
      if (result.success && result.data) {
        set((state) => {
          state.moteurs = [result.data!, ...state.moteurs];
          state.isLoading = false;
        });
        
        await get().fetchMoteurs(get().pagination.currentPage);
        return result;
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la création";
        });
        return result;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error };
    }
  },
  
  updateExistingMoteur: async (id, data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // Get the current moteur to provide required fields if they're missing
      const currentMoteur = get().activeMoteur || get().moteurs.find(m => m.id === id);
      
      // Create a clean version of data without null values
      const cleanData = { ...data };
      if (cleanData.notesEtat === null) cleanData.notesEtat = undefined;
      if (cleanData.cylindree === null) cleanData.cylindree = undefined;
      if (cleanData.heuresMoteur === null) cleanData.heuresMoteur = undefined;
      
      // Create update data object with required fields
      const updateData = {
        numSerie: cleanData.numSerie ?? currentMoteur?.numSerie ?? '',
        type: cleanData.type ?? currentMoteur?.type ?? '',
        dateAcquisition: cleanData.dateAcquisition,
        etat: cleanData.etat,
        notesEtat: cleanData.notesEtat,
        cylindree: cleanData.cylindree,
        heuresMoteur: cleanData.heuresMoteur
      };
      
      const result = await updateMoteur(id, updateData);
      
      if (result.success && result.data) {
        set((state) => {
          state.moteurs = state.moteurs.map((moteur: MotoMoteur) => 
            moteur.id === id ? { ...moteur, ...result.data } : moteur
          );
          
          if (state.activeMoteur && state.activeMoteur.id === id) {
            state.activeMoteur = { ...state.activeMoteur, ...result.data };
          }
          
          // Mettre à jour le cache
          state.cache[id] = { 
            data: state.activeMoteur || result.data!, 
            timestamp: Date.now() 
          };
          
          state.isLoading = false;
        });
        return result;
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la mise à jour";
        });
        return result;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error };
    }
  },
  
  changeMoteurStatus: async (id, newStatus, notes) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await changeEtatMoteur(id, newStatus, notes);
      
      if (result.success && result.data) {
        set((state) => {
          state.moteurs = state.moteurs.map((moteur: MotoMoteur) => 
            moteur.id === id ? { ...moteur, etat: newStatus, notesEtat: notes || moteur.notesEtat } : moteur
          );
          
          if (state.activeMoteur && state.activeMoteur.id === id) {
            state.activeMoteur = { 
              ...state.activeMoteur, 
              etat: newStatus, 
              notesEtat: notes || state.activeMoteur.notesEtat 
            };
          }
          
          // Mettre à jour le cache
          if (state.cache[id]) {
            state.cache[id] = { 
              data: state.activeMoteur || {
                ...state.cache[id].data,
                etat: newStatus,
                notesEtat: notes || state.cache[id].data.notesEtat
              }, 
              timestamp: Date.now() 
            };
          }
          
          state.isLoading = false;
        });
        return result;
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec du changement d'état";
        });
        return result;
      }
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error };
    }
  },
  
  monterMoteurSurCycle: async ({ moteurId, cycleId, technicien, notes }) => {
    try {
      set((state) => {
        state.isMounting = true;
        state.error = null;
      });
      
      const result = await monterMoteur({
        moteurId, 
        cycleId, 
        technicien, 
        date: new Date(), 
        notes
      });
      
      if (result.success) {
        // Succès - nous devons rafraîchir les données
        // car cette opération modifie plusieurs entités
        await get().fetchMoteurs(get().pagination.currentPage, get().filters);
        
        // Si nous avons un moteur actif, rafraîchissons-le aussi
        if (get().activeMoteur && get().activeMoteur?.id === moteurId) {
          await get().fetchMoteurById(moteurId, true);
        }
        
        set((state) => {
          state.isMounting = false;
        });
        
        return { success: true };
      } else {
        set((state) => {
          state.isMounting = false;
          state.error = result.error || "Échec du montage du moteur";
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set((state) => {
        state.isMounting = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error };
    }
  },
  
  demonterMoteurDeCycle: async ({ cycleId, technicien, notes }) => {
    try {
      set((state) => {
        state.isMounting = true;
        state.error = null;
      });
      
      const result = await demonterMoteur({
        cycleId, 
        technicien, 
        date: new Date(), 
        notes
      });
      
      if (result.success) {
        // Succès - nous devons rafraîchir les données
        // car cette opération modifie plusieurs entités
        await get().fetchMoteurs(get().pagination.currentPage, get().filters);
        
       // Si la relation existe via une autre propriété comme cycleId
       if (get().activeMoteur && (get().activeMoteur as any).cycleActuel?.id === cycleId) {
        const moteur = get().activeMoteur;
        if (moteur) {
          await get().fetchMoteurById(moteur.id, true);
        }
      }
        
        set((state) => {
          state.isMounting = false;
        });
        
        return { success: true };
      } else {
        set((state) => {
          state.isMounting = false;
          state.error = result.error || "Échec du démontage du moteur";
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set((state) => {
        state.isMounting = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error };
    }
  },
  
  setFilters: (filters) => {
    set((state) => {
      state.filters = filters;
    });
    // Appliquer les filtres immédiatement
    get().fetchMoteurs(1, filters);
  },
  
  setPage: (page) => {
    get().fetchMoteurs(page, get().filters);
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