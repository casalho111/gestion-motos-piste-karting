import { StateCreator } from 'zustand';
import { TypeEntretien } from '@prisma/client';
import { immer } from 'zustand/middleware/immer';
import { Maintenance, PaginationState, MaintenanceFilterOptions, PieceUtilisee } from '../types';
import {
  getMaintenances,
  getMaintenanceById,
  createMaintenance,
  finaliserMaintenance
} from '@/app/actions/maintenances';

export interface MaintenanceState {
  maintenances: Maintenance[];
  activeMaintenance: Maintenance | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isFinalizing: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: MaintenanceFilterOptions;
  cache: Record<string, { data: Maintenance, timestamp: number }>;
  lastFetched: number | null;
  // Pour le formulaire de création
  draftPiecesUtilisees: PieceUtilisee[];
}

export interface MaintenanceActions {
  fetchMaintenances: (page?: number, options?: MaintenanceFilterOptions) => Promise<void>;
  fetchMaintenanceById: (id: string, forceRefresh?: boolean) => Promise<Maintenance | null>;
  createNewMaintenance: (data: {
    type: TypeEntretien;
    dateRealisation: Date;
    kilometrageEffectue: number;
    coutTotal: number;
    technicien: string;
    description: string;
    notes?: string;
    cycleId?: string;
    moteurId?: string;
    piecesUtilisees?: PieceUtilisee[];
  }) => Promise<{ success: boolean; data?: Maintenance; error?: string }>;
  finalizeMaintenance: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  addDraftPiece: (piece: PieceUtilisee) => void;
  removeDraftPiece: (pieceId: string) => void;
  updateDraftPiece: (pieceId: string, quantite: number, prixUnitaire?: number) => void;
  clearDraftPieces: () => void;
  setFilters: (filters: MaintenanceFilterOptions) => void;
  setPage: (page: number) => void;
  clearCache: () => void;
  invalidateCache: (id?: string) => void;
}

export type MaintenanceSlice = MaintenanceState & MaintenanceActions;

// 30 minutes en millisecondes pour le cache
const CACHE_DURATION = 30 * 60 * 1000;

const initialState: MaintenanceState = {
  maintenances: [],
  activeMaintenance: null,
  isLoading: false,
  isLoadingDetails: false,
  isFinalizing: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  },
  filters: {},
  cache: {},
  lastFetched: null,
  draftPiecesUtilisees: []
};

export const createMaintenanceSlice: StateCreator<
  MaintenanceSlice,
  [["zustand/immer", never]],
  [["zustand/immer", never]],
  MaintenanceSlice
> = immer((set, get) => ({
  ...initialState,
  
  fetchMaintenances: async (page = 1, options = {}) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const filters = { ...get().filters, ...options };
      const result = await getMaintenances({
        page,
        limit: get().pagination.perPage,
        ...filters
      });
      
      set((state) => {
        // Convert null values to undefined to match the Maintenance type
        state.maintenances = result.data.map(item => ({
          ...item,
          notes: item.notes === null ? undefined : item.notes,
          cycleId: item.cycleId === null ? undefined : item.cycleId,
          moteurId: item.moteurId === null ? undefined : item.moteurId
        }));
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
  
  fetchMaintenanceById: async (id, forceRefresh = false) => {
    const { cache } = get();
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (!forceRefresh && cache[id] && (now - cache[id].timestamp) < CACHE_DURATION) {
      set((state) => {
        state.activeMaintenance = cache[id].data;
      });
      return cache[id].data;
    }
    
    try {
      set((state) => {
        state.isLoadingDetails = true;
        state.error = null;
      });
      
      const maintenanceData = await getMaintenanceById(id);
      
      // Transform null values to undefined to match the Maintenance type
      const maintenance = maintenanceData ? {
        ...maintenanceData,
        notes: maintenanceData.notes === null ? undefined : maintenanceData.notes,
        cycleId: maintenanceData.cycleId === null ? undefined : maintenanceData.cycleId,
        moteurId: maintenanceData.moteurId === null ? undefined : maintenanceData.moteurId
      } : null;
      
      set((state) => {
        state.activeMaintenance = maintenance;
        state.isLoadingDetails = false;
        // Mettre à jour le cache
        state.cache[id] = { data: maintenance!, timestamp: now };
      });
      
      return maintenance;
    } catch (error) {
      set((state) => {
        state.isLoadingDetails = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
        state.activeMaintenance = null;
      });
      return null;
    }
  },
  
  createNewMaintenance: async (data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // S'il n'y a pas de piecesUtilisees dans les données mais qu'il y en a dans le brouillon
      const maintenanceData = {
        ...data,
        piecesUtilisees: data.piecesUtilisees || get().draftPiecesUtilisees.length > 0 
          ? get().draftPiecesUtilisees 
          : undefined
      };
      
      const result = await createMaintenance(maintenanceData);
      
      if (result.success && result.data) {
        // Transform the API response data to match our Maintenance type
        const transformedData: Maintenance = {
          ...result.data,
          notes: result.data.notes === null ? undefined : result.data.notes,
          cycleId: result.data.cycleId === null ? undefined : result.data.cycleId,
          moteurId: result.data.moteurId === null ? undefined : result.data.moteurId
        } as Maintenance;
        
        set((state) => {
          state.maintenances = [transformedData, ...state.maintenances];
          state.isLoading = false;
          // Vider le brouillon
          state.draftPiecesUtilisees = [];
        });
        
        await get().fetchMaintenances(get().pagination.currentPage);
        return { success: true, data: transformedData };
      } else {
        const errorMessage = result.error || "Échec de la création";
        set((state) => {
          state.isLoading = false;
          state.error = errorMessage;
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      set((state) => {
        state.isLoading = false;
        state.error = errorMessage;
      });
      return { success: false, error: errorMessage };
    }
  },
  
  finalizeMaintenance: async (id, notes) => {
    try {
      set((state) => {
        state.isFinalizing = true;
        state.error = null;
      });
      
      const result = await finaliserMaintenance(id, notes);
      
      if (result.success) {
        // Cette opération nécessite de rafraîchir plusieurs entités
        await get().fetchMaintenances(get().pagination.currentPage);
        
        // Si la maintenance active est celle qu'on vient de finaliser, rafraîchissons-la
        if (get().activeMaintenance?.id === id) {
          await get().fetchMaintenanceById(id, true);
        }
        
        set((state) => {
          state.isFinalizing = false;
        });
        
        return { success: true };
      } else {
        set((state) => {
          state.isFinalizing = false;
          state.error = result.error || "Échec de la finalisation";
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set((state) => {
        state.isFinalizing = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { success: false, error: get().error || undefined };
    }
  },
  
  // Gestion du brouillon pour la création d'une maintenance
  addDraftPiece: (piece) => {
    set((state) => {
      const existingIndex = state.draftPiecesUtilisees.findIndex(p => p.pieceId === piece.pieceId);
      
      if (existingIndex >= 0) {
        // Mettre à jour si la pièce existe déjà
        state.draftPiecesUtilisees[existingIndex].quantite += piece.quantite;
      } else {
        // Ajouter une nouvelle pièce
        state.draftPiecesUtilisees.push(piece);
      }
    });
  },
  
  removeDraftPiece: (pieceId) => {
    set((state) => {
      state.draftPiecesUtilisees = state.draftPiecesUtilisees.filter(p => p.pieceId !== pieceId);
    });
  },
  
  updateDraftPiece: (pieceId, quantite, prixUnitaire) => {
    set((state) => {
      const existingIndex = state.draftPiecesUtilisees.findIndex(p => p.pieceId === pieceId);
      
      if (existingIndex >= 0) {
        state.draftPiecesUtilisees[existingIndex].quantite = quantite;
        
        if (prixUnitaire !== undefined) {
          state.draftPiecesUtilisees[existingIndex].prixUnitaire = prixUnitaire;
        }
      }
    });
  },
  
  clearDraftPieces: () => {
    set((state) => {
      state.draftPiecesUtilisees = [];
    });
  },
  
  setFilters: (filters) => {
    set((state) => {
      state.filters = filters;
    });
    // Appliquer les filtres immédiatement
    get().fetchMaintenances(1, filters);
  },
  
  setPage: (page) => {
    get().fetchMaintenances(page, get().filters);
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