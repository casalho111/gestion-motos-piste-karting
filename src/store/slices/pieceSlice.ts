import { StateCreator } from 'zustand';
import { QueryState, PaginationState, FilterState, PaginatedResult } from '../types';
import { TypePiece } from '@prisma/client';
import { getPieces, getPieceById, ajusterStock } from '@/app/actions/pieces';

// Valeurs par défaut
const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const defaultFilters: PieceFilters = {
  search: '',
  sortBy: 'nom',
  sortDirection: 'asc',
  stockBas: false
};

export const createPieceSlice: StateCreator<PieceSlice, [], []> = (set, get) => ({
  // État initial
  pieces: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  pagination: { ...defaultPagination },
  
  filters: { ...defaultFilters },
  
  currentPiece: {
    data: null,
    status: 'idle',
    error: null,
    timestamp: null
  },
  
  // Actions pour récupérer les données
  fetchPieces: async () => {
    const { page, limit } = get().pagination;
    const { search, type, stockBas } = get().filters;
    
    try {
      set(state => ({
        pieces: { ...state.pieces, status: 'loading', error: null }
      }));
      
      const result: PaginatedResult<PieceWithRelations> = await getPieces({
        page,
        limit,
        type,
        stockBas,
        search: search || undefined
      });
      
      set({
        pieces: {
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
        pieces: {
          ...state.pieces,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des pièces',
        }
      }));
    }
  },
  
  fetchPieceById: async (id) => {
    try {
      set(state => ({
        currentPiece: { ...state.currentPiece, status: 'loading', error: null }
      }));
      
      const result = await getPieceById(id);
      
      set({
        currentPiece: {
          data: result as PieceWithRelations,
          status: 'success',
          error: null,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      set(state => ({
        currentPiece: {
          ...state.currentPiece,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur lors du chargement de la pièce',
        }
      }));
    }
  },
  
  ajusterStock: async (id, quantite, notes) => {
    try {
      const result = await ajusterStock(id, quantite, notes);
      
      if (result.success) {
        // Mettre à jour la pièce dans l'état
        set(state => {
          if (!state.pieces.data) return state;
          
          // Trouver la pièce dans la liste actuelle
          const piece = state.pieces.data.find(p => p.id === id);
          if (!piece) return state;
          
          // Calculer la nouvelle quantité
          const nouvelleQuantite = piece.quantiteStock + quantite;
          
          // Mettre à jour les pièces
          const updatedPieces = state.pieces.data.map(p => 
            p.id === id 
              ? { ...p, quantiteStock: nouvelleQuantite } 
              : p
          );
          
          // Mettre à jour la pièce courante si c'est celle qui a été modifiée
          const updatedCurrentPiece = state.currentPiece.data?.id === id
            ? { ...state.currentPiece.data, quantiteStock: nouvelleQuantite }
            : state.currentPiece.data;
            
          return {
            pieces: {
              ...state.pieces,
              data: updatedPieces
            },
            currentPiece: {
              ...state.currentPiece,
              data: updatedCurrentPiece
            }
          };
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du stock:', error);
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
  getPiecesStockBas: () => {
    const { pieces } = get();
    if (!pieces.data) return [];
    return pieces.data.filter(piece => piece.quantiteStock <= piece.quantiteMinimale);
  },
  
  getPiecesParType: (type) => {
    const { pieces } = get();
    if (!pieces.data) return [];
    return pieces.data.filter(piece => piece.type === type);
  },
  
  getTotalValeurStock: () => {
    const { pieces } = get();
    if (!pieces.data) return 0;
    
    return pieces.data.reduce((total, piece) => {
      return total + (piece.prixUnitaire * piece.quantiteStock);
    }, 0);
  }
});

// Type pour une pièce avec ses relations
export interface PieceWithRelations {
  id: string;
  reference: string;
  nom: string;
  description?: string | null;
  type: TypePiece;
  fournisseur?: string | null;
  prixUnitaire: number;
  quantiteStock: number;
  quantiteMinimale: number;
  emplacement?: string | null;
  utilisations?: Array<{
    id: string;
    quantite: number;
    prixUnitaire: number;
    maintenance: {
      id: string;
      dateRealisation: Date;
      technicien: string;
    };
  }>;
}

// Type pour les filtres de pièce
export interface PieceFilters extends FilterState {
  type?: TypePiece;
  stockBas?: boolean;
}

export interface PieceSlice {
  // Liste des pièces avec pagination et filtres
  pieces: QueryState<PieceWithRelations[]>;
  pagination: PaginationState;
  filters: PieceFilters;
  
  // Pièce actuellement sélectionnée
  currentPiece: QueryState<PieceWithRelations>;
  
  // Actions
  fetchPieces: () => Promise<void>;
  fetchPieceById: (id: string) => Promise<void>;
  ajusterStock: (id: string, quantite: number, notes?: string) => Promise<boolean>;
  
  // Gestion des filtres et pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<PieceFilters>) => void;
  resetFilters: () => void;
  
  // Sélecteurs dérivés
  getPiecesStockBas: () => PieceWithRelations[];
  getPiecesParType: (type: TypePiece) => PieceWithRelations[];
  getTotalValeurStock: () => number;
}