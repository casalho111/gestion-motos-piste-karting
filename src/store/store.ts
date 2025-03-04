import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Import des slices
import { UISlice, createUISlice } from './slices/uiSlice';
import { MotoSlice, createMotoSlice } from './slices/motoSlice';
import { MoteurSlice, createMoteurSlice } from './slices/moteurSlice';
import { PieceSlice, createPieceSlice } from './slices/pieceSlice';
import { MaintenanceSlice, createMaintenanceSlice } from './slices/maintenanceSlice';
import { StatsSlice, createStatsSlice } from './slices/statsSlice';
import { AlerteSlice, createAlerteSlice } from './slices/alerteSlice';

// Type du store combiné
export type StoreState = UISlice & MotoSlice & MoteurSlice & PieceSlice & MaintenanceSlice & StatsSlice & AlerteSlice;

// Création du store principal
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        // Combinaison de tous les slices
        ...createUISlice(...a),
        ...createMotoSlice(...a),
        ...createMoteurSlice(...a),
        ...createPieceSlice(...a),
        ...createMaintenanceSlice(...a),
        ...createStatsSlice(...a),
        ...createAlerteSlice(...a),
      }),
      {
        name: 'moto-management-storage',
        // Personnalisation de la persistance pour ne sauvegarder que certaines parties du store
        partialize: (state) => ({
          // On ne conserve que les préférences d'interface et les filtres
          theme: state.theme,
          ui: state.ui,
          filters: state.filters,
          maintenanceFilters: state.maintenanceFilters,
          planningFilters: state.planningFilters,
          periodeMaintenance: state.periodeMaintenance,
          periodeUtilisation: state.periodeUtilisation,
        }),
      }
    )
  )
);

// Hooks personnalisés pour accéder à des parties spécifiques du store
// Ces hooks permettent d'éviter les re-rendus inutiles

// Hook pour les préférences UI
export const useUIStore = () => 
  useStore(
    (state) => ({
      theme: state.theme,
      ui: state.ui,
      setTheme: state.setTheme,
      setUI: state.setUI,
      toggleSidebar: state.toggleSidebar,
      currentPage: state.currentPage,
      setCurrentPage: state.setCurrentPage,
      modals: state.modals,
      openModal: state.openModal,
      closeModal: state.closeModal,
      toggleModal: state.toggleModal,
      toasts: state.toasts,
      addToast: state.addToast,
      removeToast: state.removeToast,
      isLoading: state.isLoading,
      setIsLoading: state.setIsLoading,
    }),
    shallow
  );

// Hook pour les motos
export const useMotoStore = () =>
  useStore(
    (state) => ({
      motos: state.motos,
      pagination: state.pagination,
      filters: state.filters,
      currentMoto: state.currentMoto,
      fetchMotos: state.fetchMotos,
      fetchMotoById: state.fetchMotoById,
      updateKilometrage: state.updateKilometrage,
      changeEtat: state.changeEtat,
      setPage: state.setPage,
      setLimit: state.setLimit,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
      getMotosDisponibles: state.getMotosDisponibles,
      getMotosSansMoteur: state.getMotosSansMoteur,
    }),
    shallow
  );

// Hook pour les moteurs
export const useMoteurStore = () =>
  useStore(
    (state) => ({
      moteurs: state.moteurs,
      pagination: state.pagination,
      filters: state.filters,
      currentMoteur: state.currentMoteur,
      fetchMoteurs: state.fetchMoteurs,
      fetchMoteurById: state.fetchMoteurById,
      changeEtat: state.changeEtat,
      monterMoteurSurCycle: state.monterMoteurSurCycle,
      demonterMoteurDeCycle: state.demonterMoteurDeCycle,
      setPage: state.setPage,
      setLimit: state.setLimit,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
      getMoteursDisponibles: state.getMoteursDisponibles,
      getMoteursMontes: state.getMoteursMontes,
    }),
    shallow
  );

// Hook pour les pièces
export const usePieceStore = () =>
  useStore(
    (state) => ({
      pieces: state.pieces,
      pagination: state.pagination,
      filters: state.filters,
      currentPiece: state.currentPiece,
      fetchPieces: state.fetchPieces,
      fetchPieceById: state.fetchPieceById,
      ajusterStock: state.ajusterStock,
      setPage: state.setPage,
      setLimit: state.setLimit,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
      getPiecesStockBas: state.getPiecesStockBas,
      getPiecesParType: state.getPiecesParType,
      getTotalValeurStock: state.getTotalValeurStock,
    }),
    shallow
  );

// Hook pour les maintenances
export const useMaintenanceStore = () =>
  useStore(
    (state) => ({
      maintenances: state.maintenances,
      pagination: state.maintenancePagination,
      filters: state.maintenanceFilters,
      currentMaintenance: state.currentMaintenance,
      fetchMaintenances: state.fetchMaintenances,
      fetchMaintenanceById: state.fetchMaintenanceById,
      finaliserMaintenance: state.finaliserMaintenance,
      setPage: state.setMaintenancePage,
      setLimit: state.setMaintenanceLimit,
      setFilters: state.setMaintenanceFilters,
      resetFilters: state.resetMaintenanceFilters,
      getMaintenancesParType: state.getMaintenancesParType,
      getCoutTotalMaintenances: state.getCoutTotalMaintenances,
    }),
    shallow
  );

// Hook pour les plannings
export const usePlanningStore = () =>
  useStore(
    (state) => ({
      plannings: state.plannings,
      pagination: state.planningPagination,
      filters: state.planningFilters,
      currentPlanning: state.currentPlanning,
      fetchPlannings: state.fetchPlannings,
      completerPlanning: state.completerPlanning,
      setPage: state.setPlanningPage,
      setLimit: state.setPlanningLimit,
      setFilters: state.setPlanningFilters,
      resetFilters: state.resetPlanningFilters,
      getPlanningsActifs: state.getPlanningsActifs,
    }),
    shallow
  );

// Hook pour les statistiques
export const useStatsStore = () =>
  useStore(
    (state) => ({
      dashboard: state.dashboard,
      utilisationHebdomadaire: state.utilisationHebdomadaire,
      maintenanceStats: state.maintenanceStats,
      utilisationStats: state.utilisationStats,
      periodeMaintenance: state.periodeMaintenance,
      periodeUtilisation: state.periodeUtilisation,
      fetchDashboardData: state.fetchDashboardData,
      fetchUtilisationHebdomadaire: state.fetchUtilisationHebdomadaire,
      fetchMaintenanceStats: state.fetchMaintenanceStats,
      fetchUtilisationStats: state.fetchUtilisationStats,
      setPeriodeMaintenance: state.setPeriodeMaintenance,
      setPeriodeUtilisation: state.setPeriodeUtilisation,
      getTauxDisponibilite: state.getTauxDisponibilite,
      getTauxUtilisation: state.getTauxUtilisation,
      getCoutMoyenParKm: state.getCoutMoyenParKm,
    }),
    shallow
  );

// Hook pour les alertes
export const useAlerteStore = () =>
  useStore(
    (state) => ({
      alertes: state.alertes,
      pagination: state.pagination,
      filters: state.filters,
      nombreAlertesNonTraitees: state.nombreAlertesNonTraitees,
      fetchAlertes: state.fetchAlertes,
      traiterAlerte: state.traiterAlerte,
      genererAlertes: state.genererAlertes,
      setPage: state.setPage,
      setLimit: state.setLimit,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
      getAlertesCritiques: state.getAlertesCritiques,
      getAlertesParType: state.getAlertesParType,
    }),
    shallow
  );