import { StateCreator } from 'zustand';
import { Theme, ViewMode, DensityMode } from '../types';

export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  viewMode: Record<string, ViewMode>; // Par section (motos, moteurs, etc.)
  density: DensityMode;
  mobileSidebarOpen: boolean;
  dashboardLayout: string[];
}

export interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setViewMode: (section: string, mode: ViewMode) => void;
  setDensity: (density: DensityMode) => void;
  toggleMobileSidebar: () => void;
  setDashboardLayout: (layout: string[]) => void;
  resetUIPreferences: () => void;
}

export type UISlice = UIState & UIActions;

// Configuration par défaut
const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  viewMode: {
    motos: 'card',
    moteurs: 'card',
    pieces: 'table',
    maintenances: 'table',
  },
  density: 'comfortable',
  mobileSidebarOpen: false,
  dashboardLayout: ['stats', 'alerts', 'maintenance', 'utilization'],
};

export const createUISlice: StateCreator<
  UISlice, 
  [], 
  [], 
  UISlice
> = (set) => ({
  ...initialState,
  
  setTheme: (theme) => set({ theme }),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  setViewMode: (section, mode) => set((state) => ({
    viewMode: { ...state.viewMode, [section]: mode }
  })),
  
  setDensity: (density) => set({ density }),
  
  toggleMobileSidebar: () => set((state) => ({
    mobileSidebarOpen: !state.mobileSidebarOpen
  })),
  
  setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
  
  resetUIPreferences: () => set(initialState),
});