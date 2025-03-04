import { StateCreator } from 'zustand';
import { ThemePreference, UIPreference } from '../types';

export interface UISlice {
  // Thème et préférences visuelles
  theme: ThemePreference;
  setTheme: (theme: Partial<ThemePreference>) => void;
  
  // Préférences d'interface
  ui: UIPreference;
  setUI: (preferences: Partial<UIPreference>) => void;
  toggleSidebar: () => void;
  
  // Navigation et routage
  currentPage: string;
  setCurrentPage: (page: string) => void;
  
  // Modales et fenêtres
  modals: {
    [key: string]: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  
  // Notifications temporaires (toasts)
  toasts: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration: number;
  }>;
  addToast: (toast: { type: 'info' | 'success' | 'warning' | 'error'; message: string; duration?: number }) => void;
  removeToast: (id: string) => void;
  
  // État de chargement global
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Valeurs par défaut pour les préférences
const defaultTheme: ThemePreference = {
  theme: 'system',
  reducedMotion: false,
  fontSize: 'medium'
};

const defaultUI: UIPreference = {
  sidebarCollapsed: false,
  tableCompactMode: false,
  cardsPerRow: 3,
  showNotifications: true,
  dashboardLayout: ['stats', 'motos', 'moteurs', 'maintenances']
};

export const createUISlice: StateCreator<UISlice, [], []> = (set) => ({
  // Thème et préférences visuelles
  theme: defaultTheme,
  setTheme: (newTheme) => set((state) => ({
    theme: { ...state.theme, ...newTheme }
  })),
  
  // Préférences d'interface
  ui: defaultUI,
  setUI: (preferences) => set((state) => ({
    ui: { ...state.ui, ...preferences }
  })),
  toggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed }
  })),
  
  // Navigation et routage
  currentPage: '/dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Modales et fenêtres
  modals: {},
  openModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: true }
  })),
  closeModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: false }
  })),
  toggleModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: !state.modals[modalId] }
  })),
  
  // Notifications temporaires (toasts)
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    const duration = toast.duration || 5000; // Valeur par défaut: 5 secondes
    
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast, duration }]
    }));
    
    // Auto-suppression après la durée spécifiée
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, duration);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  })),
  
  // État de chargement global
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading })
});