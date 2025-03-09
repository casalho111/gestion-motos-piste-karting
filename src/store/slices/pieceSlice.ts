// store/slices/pieceSlice.ts
import { StateCreator } from 'zustand';
import { TypePiece } from '@prisma/client';
import { immer } from 'zustand/middleware/immer';
import { 
  Piece, 
  PaginationState, 
  PieceFilterOptions, 
  ServerActionResponse 
} from '../types';
import {
  getPieces,
  getPieceById,
  createPiece,
  updatePiece,
  deletePiece,
  ajusterStock
} from '@/app/actions/pieces';

// Définition de l'état du store
export interface PieceState {
  pieces: Piece[];
  activePiece: Piece | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isAdjustingStock: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: PieceFilterOptions;
  cache: Record<string, { data: Piece, timestamp: number }>;
  lastFetched: number | null;
  stockAlerts: Piece[]; // Pièces avec stock bas
}

// Définition des actions du store
export interface PieceActions {
  fetchPieces: (page?: number, options?: PieceFilterOptions) => Promise<void>;
  fetchPieceById: (id: string, forceRefresh?: boolean) => Promise<Piece | null>;
  createNewPiece: (data: {
    reference: string;
    nom: string;
    description?: string;
    type: TypePiece;
    fournisseur?: string;
    prixUnitaire: number;
    quantiteStock?: number;
    quantiteMinimale?: number;
    emplacement?: string;
  }) => Promise<ServerActionResponse<Piece>>;
  updateExistingPiece: (id: string, data: Partial<Piece>) => Promise<ServerActionResponse<Piece>>;
  removePiece: (id: string) => Promise<ServerActionResponse>;
  adjustStock: (id: string, quantite: number, notes?: string) => Promise<ServerActionResponse<Piece>>;
  fetchStockAlerts: () => Promise<void>;
  setFilters: (filters: PieceFilterOptions) => void;
  setPage: (page: number) => void;
  clearCache: () => void;
  invalidateCache: (id?: string) => void;
}

// Type complet du slice
export type PieceSlice = PieceState & PieceActions;

// 30 minutes en millisecondes pour le cache
const CACHE_DURATION = 30 * 60 * 1000;

// État initial
const initialState: PieceState = {
  pieces: [],
  activePiece: null,
  isLoading: false,
  isLoadingDetails: false,
  isAdjustingStock: false,
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
  stockAlerts: []
};

// Création du slice avec immer
export const createPieceSlice: StateCreator<
  PieceSlice,
  [["zustand/immer", never]],
  [["zustand/immer", never]],
  PieceSlice
> = immer((set, get) => ({
  ...initialState,
  
  fetchPieces: async (page = 1, options = {}) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const filters = { ...get().filters, ...options };
      const result = await getPieces({
        page,
        limit: get().pagination.perPage,
        ...filters
      });
      
      set((state) => {
        state.pieces = result.data as unknown as Piece[];
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
  
  fetchPieceById: async (id, forceRefresh = false) => {
    const { cache } = get();
    const now = Date.now();
    
    // Vérifier le cache d'abord si on ne force pas le rafraîchissement
    if (!forceRefresh && cache[id] && (now - cache[id].timestamp) < CACHE_DURATION) {
      set((state) => {
        state.activePiece = cache[id].data;
      });
      return cache[id].data;
    }
    
    // Sinon, faire la requête
    try {
      set((state) => {
        state.isLoadingDetails = true;
        state.error = null;
      });
      
      const piece = await getPieceById(id);
      const typedPiece = piece as unknown as Piece;
      
      set((state) => {
        state.activePiece = typedPiece;
        state.isLoadingDetails = false;
        state.cache[id] = { data: typedPiece, timestamp: now };
      });
      
      return typedPiece;
    } catch (error) {
      set((state) => {
        state.isLoadingDetails = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
        state.activePiece = null;
      });
      return null;
    }
  },
  
  createNewPiece: async (data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // Ensure required fields have default values
      const pieceData = {
        ...data,
        quantiteStock: data.quantiteStock ?? 0,
        quantiteMinimale: data.quantiteMinimale ?? 0
      };
      
      const result = await createPiece(pieceData);
      
      if (result.success && result.data) {
        const newPiece = result.data as unknown as Piece;
        
        set((state) => {
          state.pieces = [newPiece, ...state.pieces];
          state.isLoading = false;
          
          // Ajouter aux alertes de stock si nécessaire
          if (newPiece.quantiteStock <= newPiece.quantiteMinimale) {
            state.stockAlerts = [...state.stockAlerts, newPiece];
          }
        });
        
        // Rafraîchir la liste pour être sûr que tout est à jour
        await get().fetchPieces(get().pagination.currentPage);
        return { success: true, data: newPiece };
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la création";
        });
        return result as ServerActionResponse<Piece>;
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
  
  updateExistingPiece: async (id, data) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      // Get the current piece to provide required fields if they're missing
      const currentPiece = get().activePiece || get().pieces.find(p => p.id === id);
      
      // Create a clean version of data without null values
      const cleanData = { ...data };
      // Convertir toutes les valeurs null en undefined
      if (cleanData.description === null) cleanData.description = undefined;
      if (cleanData.fournisseur === null) cleanData.fournisseur = undefined;
      if (cleanData.emplacement === null) cleanData.emplacement = undefined;
      
      // Vérification explicite des valeurs requises
      if (cleanData.quantiteStock === undefined && currentPiece?.quantiteStock === undefined) {
        set(state => { state.error = "La quantité en stock est requise"; state.isLoading = false; });
        return { success: false, error: "La quantité en stock est requise" };
      }

      if (cleanData.quantiteMinimale === undefined && currentPiece?.quantiteMinimale === undefined) {
        set(state => { state.error = "La quantité minimale est requise"; state.isLoading = false; });
        return { success: false, error: "La quantité minimale est requise" };
      }

      // Create update data object without spreading cleanData to ensure proper typing
      const updateData = {
        reference: cleanData.reference ?? currentPiece?.reference ?? '',
        nom: cleanData.nom ?? currentPiece?.nom ?? '',
        description: cleanData.description,
        type: cleanData.type ?? currentPiece?.type ?? 'AUTRES', // Valeur par défaut
        fournisseur: cleanData.fournisseur,
        prixUnitaire: cleanData.prixUnitaire ?? currentPiece?.prixUnitaire ?? 0,
        quantiteStock: cleanData.quantiteStock ?? currentPiece?.quantiteStock ?? 0, // Valeur par défaut 0
        quantiteMinimale: cleanData.quantiteMinimale ?? currentPiece?.quantiteMinimale ?? 0, // Valeur par défaut 0
        emplacement: cleanData.emplacement
      };
      
      const result = await updatePiece(id, updateData);
      
      if (result.success && result.data) {
        const updatedPiece = result.data as unknown as Piece;
        
        set((state) => {
          state.pieces = state.pieces.map(piece => 
            piece.id === id ? { ...piece, ...updatedPiece } : piece
          );
          
          if (state.activePiece && state.activePiece.id === id) {
            state.activePiece = { ...state.activePiece, ...updatedPiece };
          }
          
          // Mettre à jour le cache
          if (state.cache[id]) {
            const cacheData = state.activePiece || updatedPiece;
            state.cache[id] = { 
              data: cacheData, 
              timestamp: Date.now() 
            };
          }
          
          // Mettre à jour les alertes de stock si nécessaire
          if (updatedPiece.quantiteStock <= updatedPiece.quantiteMinimale) {
            const existingAlertIndex = state.stockAlerts.findIndex(p => p.id === id);
            if (existingAlertIndex >= 0) {
              state.stockAlerts[existingAlertIndex] = updatedPiece;
            } else {
              state.stockAlerts.push(updatedPiece);
            }
          } else {
            state.stockAlerts = state.stockAlerts.filter(p => p.id !== id);
          }
          
          state.isLoading = false;
        });
        return { success: true, data: updatedPiece };
      } else {
        set((state) => {
          state.isLoading = false;
          state.error = result.error || "Échec de la mise à jour";
        });
        return result as ServerActionResponse<Piece>;
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
  
  removePiece: async (id) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await deletePiece(id);
      
      if (result.success) {
        set((state) => {
          state.pieces = state.pieces.filter(piece => piece.id !== id);
          
          if (state.activePiece && state.activePiece.id === id) {
            state.activePiece = null;
          }
          
          // Supprimer du cache
          delete state.cache[id];
          
          // Supprimer des alertes
          state.stockAlerts = state.stockAlerts.filter(p => p.id !== id);
          
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
  
  adjustStock: async (id, quantite, notes) => {
    try {
      set((state) => {
        state.isAdjustingStock = true;
        state.error = null;
      });
      
      const result = await ajusterStock(id, quantite, notes);
      
      if (result.success && result.data) {
        const updatedPiece = result.data as unknown as Piece;
        
        set((state) => {
          state.pieces = state.pieces.map(piece => 
            piece.id === id ? { ...piece, ...updatedPiece } : piece
          );
          
          if (state.activePiece && state.activePiece.id === id) {
            state.activePiece = { ...state.activePiece, ...updatedPiece };
          }
          
          // Mettre à jour le cache
          if (state.cache[id]) {
            const cacheData = state.activePiece || updatedPiece;
            state.cache[id] = { 
              data: cacheData, 
              timestamp: Date.now() 
            };
          }
          
          // Mettre à jour les alertes de stock si nécessaire
          if (updatedPiece.quantiteStock <= updatedPiece.quantiteMinimale) {
            const existingAlertIndex = state.stockAlerts.findIndex(p => p.id === id);
            if (existingAlertIndex >= 0) {
              state.stockAlerts[existingAlertIndex] = updatedPiece;
            } else {
              state.stockAlerts.push(updatedPiece);
            }
          } else {
            state.stockAlerts = state.stockAlerts.filter(p => p.id !== id);
          }
          
          state.isAdjustingStock = false;
        });
        return { success: true, data: updatedPiece };
      } else {
        set((state) => {
          state.isAdjustingStock = false;
          state.error = result.error || "Échec de l'ajustement du stock";
        });
        return result as ServerActionResponse<Piece>;
      }
    } catch (error) {
      set((state) => {
        state.isAdjustingStock = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      return { 
        success: false, 
        error: get().error || 'Erreur inconnue' 
      };
    }
  },
  
  fetchStockAlerts: async () => {
    try {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      const result = await getPieces({
        stockBas: true,
        limit: 100 // On veut toutes les alertes
      });
      
      const alertPieces = result.data as unknown as Piece[];
      
      set((state) => {
        state.stockAlerts = alertPieces;
        state.isLoading = false;
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.error = error instanceof Error ? error.message : 'Une erreur est survenue';
      });
      console.error('Erreur lors de la récupération des alertes de stock:', error);
    }
  },
  
  setFilters: (filters) => {
    set((state) => {
      state.filters = filters;
    });
    // Appliquer les filtres immédiatement
    get().fetchPieces(1, filters);
  },
  
  setPage: (page) => {
    get().fetchPieces(page, get().filters);
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