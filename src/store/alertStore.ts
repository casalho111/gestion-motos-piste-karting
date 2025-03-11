import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Alert, AlertType } from '@/store/types';
import { Criticite } from '@prisma/client';

// Types
interface AlertState {
  items: Alert[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
  filters: {
    type?: AlertType;
    criticite?: Criticite;
    isRead?: boolean;
  };
}

interface AlertActions {
  fetchAlerts: (page?: number, filters?: AlertState['filters']) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'date' | 'isRead'>) => void;
  dismissAlert: (id: string) => void;
  setFilters: (filters: AlertState['filters']) => void;
  clearAlerts: () => void;
}

type AlertStore = AlertState & AlertActions;

// Store création
export const useAlertStore = create<AlertStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // État initial
        items: [],
        isLoading: false,
        error: null,
        unreadCount: 0,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          perPage: 10
        },
        filters: {},
        
        // Actions
        fetchAlerts: async (page = 1, filters = {}) => {
          try {
            set(state => {
              state.isLoading = true;
              state.error = null;
            });
            
            // Dans une implémentation réelle, vous appelleriez ici une API
            // Pour l'instant, simulons un résultat
            setTimeout(() => {
              set(state => {
                state.items = [...state.items]; // Pas de changement pour le moment
                state.isLoading = false;
                state.pagination.currentPage = page;
                state.filters = { ...filters };
                
                // Calculer le nombre de notifications non lues
                state.unreadCount = state.items.filter(alert => !alert.isRead).length;
              });
            }, 500);
            
          } catch (error) {
            set(state => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : 'Erreur lors du chargement des alertes';
            });
          }
        },
        
        markAsRead: (id) => {
          set(state => {
            const alertIndex = state.items.findIndex(alert => alert.id === id);
            if (alertIndex >= 0 && !state.items[alertIndex].isRead) {
              state.items[alertIndex].isRead = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
        },
        
        markAllAsRead: () => {
          set(state => {
            state.items.forEach(alert => {
              alert.isRead = true;
            });
            state.unreadCount = 0;
          });
        },
        
        addAlert: (alertData) => {
          const newAlert: Alert = {
            id: Date.now().toString(),
            ...alertData,
            date: new Date(),
            isRead: false
          };
          
          set(state => {
            state.items.unshift(newAlert);
            state.unreadCount++;
          });
        },
        
        dismissAlert: (id) => {
          set(state => {
            const alertIndex = state.items.findIndex(alert => alert.id === id);
            if (alertIndex >= 0) {
              const wasUnread = !state.items[alertIndex].isRead;
              state.items.splice(alertIndex, 1);
              if (wasUnread) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
            }
          });
        },
        
        setFilters: (filters) => {
          set(state => {
            state.filters = filters;
          });
          // Appliquer les filtres immédiatement
          get().fetchAlerts(1, get().filters);
        },
        
        clearAlerts: () => {
          set(state => {
            state.items = [];
            state.unreadCount = 0;
          });
        }
      })),
      {
        name: 'alerts-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          items: state.items,
          unreadCount: state.unreadCount
        }),
      }
    ),
    { name: 'AlertStore' }
  )
);