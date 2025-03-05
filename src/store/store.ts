import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type StoreApi } from 'zustand';

// Définir les types pour remplacer GetState manquant
type GetState<T> = () => T;
type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

// Import des slices
import { UISlice, createUISlice } from './slices/uiSlice';
import { MotoSlice, createMotoSlice } from './slices/motoSlice';
import { MoteurSlice, createMoteurSlice } from './slices/moteurSlice';
import { PieceSlice, createPieceSlice } from './slices/pieceSlice';
import { MaintenanceSlice, createMaintenanceSlice } from './slices/maintenanceSlice';
import { StatsSlice, createStatsSlice } from './slices/statsSlice';
import { AlerteSlice, createAlerteSlice } from './slices/alerteSlice';
//import type { SetState, GetState } from 'zustand/vanilla';

// Type du store combiné
type CombinedState = {
  // UI
  ui: UISlice['ui'];
  theme: UISlice['theme'];
  setTheme: UISlice['setTheme'];
  setUI: UISlice['setUI'];
  toggleSidebar: UISlice['toggleSidebar'];
  currentPage: UISlice['currentPage'];
  setCurrentPage: UISlice['setCurrentPage'];
  modals: UISlice['modals'];
  openModal: UISlice['openModal'];
  closeModal: UISlice['closeModal'];
  toggleModal: UISlice['toggleModal'];
  toasts: UISlice['toasts'];
  addToast: UISlice['addToast'];
  removeToast: UISlice['removeToast'];
  isLoading: UISlice['isLoading'];
  setIsLoading: UISlice['setIsLoading'];
  
  // Motos
  motos: MotoSlice['motos'];
  currentMoto: MotoSlice['currentMoto'];
  motoFilters: MotoSlice['filters'];
  motoPagination: MotoSlice['pagination'];
  fetchMotos: MotoSlice['fetchMotos'];
  fetchMotoById: MotoSlice['fetchMotoById'];
  updateKilometrage: MotoSlice['updateKilometrage'];
  changeEtatMoto: MotoSlice['changeEtat'];
  setMotoPage: MotoSlice['setPage'];
  setMotoLimit: MotoSlice['setLimit'];
  setMotoFilters: MotoSlice['setFilters'];
  resetMotoFilters: MotoSlice['resetFilters'];
  getMotosDisponibles: MotoSlice['getMotosDisponibles'];
  getMotosSansMoteur: MotoSlice['getMotosSansMoteur'];
  
  // Moteurs
  moteurs: MoteurSlice['moteurs'];
  currentMoteur: MoteurSlice['currentMoteur'];
  moteurFilters: MoteurSlice['filters'];
  moteurPagination: MoteurSlice['pagination'];
  fetchMoteurs: MoteurSlice['fetchMoteurs'];
  fetchMoteurById: MoteurSlice['fetchMoteurById'];
  changeEtatMoteur: MoteurSlice['changeEtat'];
  monterMoteurSurCycle: MoteurSlice['monterMoteurSurCycle'];
  demonterMoteurDeCycle: MoteurSlice['demonterMoteurDeCycle'];
  setMoteurPage: MoteurSlice['setPage'];
  setMoteurLimit: MoteurSlice['setLimit'];
  setMoteurFilters: MoteurSlice['setFilters'];
  resetMoteurFilters: MoteurSlice['resetFilters'];
  getMoteursDisponibles: MoteurSlice['getMoteursDisponibles'];
  getMoteursMontes: MoteurSlice['getMoteursMontes'];
  
  // Pièces
  pieces: PieceSlice['pieces'];
  currentPiece: PieceSlice['currentPiece'];
  pieceFilters: PieceSlice['filters'];
  piecePagination: PieceSlice['pagination'];
  fetchPieces: PieceSlice['fetchPieces'];
  fetchPieceById: PieceSlice['fetchPieceById'];
  ajusterStock: PieceSlice['ajusterStock'];
  setPiecePage: PieceSlice['setPage'];
  setPieceLimit: PieceSlice['setLimit'];
  setPieceFilters: PieceSlice['setFilters'];
  resetPieceFilters: PieceSlice['resetFilters'];
  getPiecesStockBas: PieceSlice['getPiecesStockBas'];
  getPiecesParType: PieceSlice['getPiecesParType'];
  getTotalValeurStock: PieceSlice['getTotalValeurStock'];
  
  // Maintenances
  maintenances: MaintenanceSlice['maintenances'];
  currentMaintenance: MaintenanceSlice['currentMaintenance'];
  maintenanceFilters: MaintenanceSlice['maintenanceFilters'];
  maintenancePagination: MaintenanceSlice['maintenancePagination'];
  plannings: MaintenanceSlice['plannings'];
  currentPlanning: MaintenanceSlice['currentPlanning'];
  planningFilters: MaintenanceSlice['planningFilters'];
  planningPagination: MaintenanceSlice['planningPagination'];
  fetchMaintenances: MaintenanceSlice['fetchMaintenances'];
  fetchMaintenanceById: MaintenanceSlice['fetchMaintenanceById'];
  finaliserMaintenance: MaintenanceSlice['finaliserMaintenance'];
  fetchPlannings: MaintenanceSlice['fetchPlannings'];
  completerPlanning: MaintenanceSlice['completerPlanning'];
  setMaintenancePage: MaintenanceSlice['setMaintenancePage'];
  setMaintenanceLimit: MaintenanceSlice['setMaintenanceLimit'];
  setMaintenanceFilters: MaintenanceSlice['setMaintenanceFilters'];
  resetMaintenanceFilters: MaintenanceSlice['resetMaintenanceFilters'];
  setPlanningPage: MaintenanceSlice['setPlanningPage'];
  setPlanningLimit: MaintenanceSlice['setPlanningLimit'];
  setPlanningFilters: MaintenanceSlice['setPlanningFilters'];
  resetPlanningFilters: MaintenanceSlice['resetPlanningFilters'];
  getMaintenancesParType: MaintenanceSlice['getMaintenancesParType'];
  getPlanningsActifs: MaintenanceSlice['getPlanningsActifs'];
  getCoutTotalMaintenances: MaintenanceSlice['getCoutTotalMaintenances'];
  
  // Statistiques
  dashboard: StatsSlice['dashboard'];
  utilisationHebdomadaire: StatsSlice['utilisationHebdomadaire'];
  maintenanceStats: StatsSlice['maintenanceStats'];
  utilisationStats: StatsSlice['utilisationStats'];
  periodeMaintenance: StatsSlice['periodeMaintenance'];
  periodeUtilisation: StatsSlice['periodeUtilisation'];
  fetchDashboardData: StatsSlice['fetchDashboardData'];
  fetchUtilisationHebdomadaire: StatsSlice['fetchUtilisationHebdomadaire'];
  fetchMaintenanceStats: StatsSlice['fetchMaintenanceStats'];
  fetchUtilisationStats: StatsSlice['fetchUtilisationStats'];
  setPeriodeMaintenance: StatsSlice['setPeriodeMaintenance'];
  setPeriodeUtilisation: StatsSlice['setPeriodeUtilisation'];
  getTauxDisponibilite: StatsSlice['getTauxDisponibilite'];
  getTauxUtilisation: StatsSlice['getTauxUtilisation'];
  getCoutMoyenParKm: StatsSlice['getCoutMoyenParKm'];
  
  // Alertes
  alertes: AlerteSlice['alertes'];
  alerteFilters: AlerteSlice['filters'];
  alertePagination: AlerteSlice['pagination'];
  nombreAlertesNonTraitees: AlerteSlice['nombreAlertesNonTraitees'];
  fetchAlertes: AlerteSlice['fetchAlertes'];
  traiterAlerte: AlerteSlice['traiterAlerte'];
  genererAlertes: AlerteSlice['genererAlertes'];
  setAlertePage: AlerteSlice['setPage'];
  setAlerteLimit: AlerteSlice['setLimit'];
  setAlerteFilters: AlerteSlice['setFilters'];
  resetAlerteFilters: AlerteSlice['resetFilters'];
  getAlertesCritiques: AlerteSlice['getAlertesCritiques'];
  getAlertesParType: AlerteSlice['getAlertesParType'];
};

export type StoreState = CombinedState;

// Création du store principal
export const useStore = create<StoreState>()(
  devtools(
    persist(
      // Utilisez any pour éviter les problèmes de typage complexes
      (set: any, get: any, api: any) => {
        // Les fonctions de création de slices attendent leur propre type de setter
        const uiSlice = createUISlice(set, get, api);
        const motoSlice = createMotoSlice(set, get, api);
        const moteurSlice = createMoteurSlice(set, get, api);
        const pieceSlice = createPieceSlice(set, get, api);
        const maintenanceSlice = createMaintenanceSlice(set, get, api);
        const statsSlice = createStatsSlice(set, get, api);
        const alerteSlice = createAlerteSlice(set, get, api);
        
        // Retourner un objet avec toutes les propriétés renommées pour éviter les conflits
        return {
          // UI Slice (pas de conflit)
          ...uiSlice,
          
          // Moto Slice
          motos: motoSlice.motos,
          currentMoto: motoSlice.currentMoto,
          motoFilters: motoSlice.filters,
          motoPagination: motoSlice.pagination,
          fetchMotos: motoSlice.fetchMotos,
          fetchMotoById: motoSlice.fetchMotoById,
          updateKilometrage: motoSlice.updateKilometrage,
          changeEtatMoto: motoSlice.changeEtat,
          setMotoPage: motoSlice.setPage,
          setMotoLimit: motoSlice.setLimit,
          setMotoFilters: motoSlice.setFilters,
          resetMotoFilters: motoSlice.resetFilters,
          getMotosDisponibles: motoSlice.getMotosDisponibles,
          getMotosSansMoteur: motoSlice.getMotosSansMoteur,
          
          // Moteur Slice
          moteurs: moteurSlice.moteurs,
          currentMoteur: moteurSlice.currentMoteur,
          moteurFilters: moteurSlice.filters,
          moteurPagination: moteurSlice.pagination,
          fetchMoteurs: moteurSlice.fetchMoteurs,
          fetchMoteurById: moteurSlice.fetchMoteurById,
          changeEtatMoteur: moteurSlice.changeEtat,
          monterMoteurSurCycle: moteurSlice.monterMoteurSurCycle,
          demonterMoteurDeCycle: moteurSlice.demonterMoteurDeCycle,
          setMoteurPage: moteurSlice.setPage,
          setMoteurLimit: moteurSlice.setLimit,
          setMoteurFilters: moteurSlice.setFilters,
          resetMoteurFilters: moteurSlice.resetFilters,
          getMoteursDisponibles: moteurSlice.getMoteursDisponibles,
          getMoteursMontes: moteurSlice.getMoteursMontes,
          
          // Piece Slice
          pieces: pieceSlice.pieces,
          currentPiece: pieceSlice.currentPiece,
          pieceFilters: pieceSlice.filters,
          piecePagination: pieceSlice.pagination,
          fetchPieces: pieceSlice.fetchPieces,
          fetchPieceById: pieceSlice.fetchPieceById,
          ajusterStock: pieceSlice.ajusterStock,
          setPiecePage: pieceSlice.setPage,
          setPieceLimit: pieceSlice.setLimit,
          setPieceFilters: pieceSlice.setFilters,
          resetPieceFilters: pieceSlice.resetFilters,
          getPiecesStockBas: pieceSlice.getPiecesStockBas,
          getPiecesParType: pieceSlice.getPiecesParType,
          getTotalValeurStock: pieceSlice.getTotalValeurStock,
          
          // Maintenance Slice (déjà des noms spécifiques, pas de conflit)
          ...maintenanceSlice,
          
          // Stats Slice (pas de conflit)
          ...statsSlice,
          
          // Alerte Slice
          alertes: alerteSlice.alertes,
          alerteFilters: alerteSlice.filters,
          alertePagination: alerteSlice.pagination,
          nombreAlertesNonTraitees: alerteSlice.nombreAlertesNonTraitees,
          fetchAlertes: alerteSlice.fetchAlertes,
          traiterAlerte: alerteSlice.traiterAlerte,
          genererAlertes: alerteSlice.genererAlertes,
          setAlertePage: alerteSlice.setPage,
          setAlerteLimit: alerteSlice.setLimit,
          setAlerteFilters: alerteSlice.setFilters,
          resetAlerteFilters: alerteSlice.resetFilters,
          getAlertesCritiques: alerteSlice.getAlertesCritiques,
          getAlertesParType: alerteSlice.getAlertesParType,
        };
      },
      {
        name: 'moto-management-storage',
        partialize: (state) => ({
          theme: state.theme,
          ui: state.ui,
          motoFilters: state.motoFilters,
          moteurFilters: state.moteurFilters,
          pieceFilters: state.pieceFilters,
          maintenanceFilters: state.maintenanceFilters,
          planningFilters: state.planningFilters,
          periodeMaintenance: state.periodeMaintenance,
          periodeUtilisation: state.periodeUtilisation,
        }),
        storage: {
          getItem: (name) => {
            if (typeof window === 'undefined') return null;
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: (name, value) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(name, JSON.stringify(value));
            }
          },
          removeItem: (name) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(name);
            }
          },
        },
        version: 1,
      }
    ),
    {
      name: 'MotoManagementStore',
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
);

// Hooks personnalisés avec les noms de propriétés corrigés
export const useMotoStore = () =>
  useStore((state) => ({
    motos: state.motos,
    pagination: state.motoPagination,
    filters: state.motoFilters,
    currentMoto: state.currentMoto,
    fetchMotos: state.fetchMotos,
    fetchMotoById: state.fetchMotoById,
    updateKilometrage: state.updateKilometrage,
    changeEtat: state.changeEtatMoto,
    setPage: state.setMotoPage,
    setLimit: state.setMotoLimit,
    setFilters: state.setMotoFilters,
    resetFilters: state.resetMotoFilters,
    getMotosDisponibles: state.getMotosDisponibles,
    getMotosSansMoteur: state.getMotosSansMoteur,
  }));

export const useMoteurStore = () =>
  useStore((state) => ({
    moteurs: state.moteurs,
    pagination: state.moteurPagination,
    filters: state.moteurFilters,
    currentMoteur: state.currentMoteur,
    fetchMoteurs: state.fetchMoteurs,
    fetchMoteurById: state.fetchMoteurById,
    changeEtat: state.changeEtatMoteur,
    monterMoteurSurCycle: state.monterMoteurSurCycle,
    demonterMoteurDeCycle: state.demonterMoteurDeCycle,
    setPage: state.setMoteurPage,
    setLimit: state.setMoteurLimit,
    setFilters: state.setMoteurFilters,
    resetFilters: state.resetMoteurFilters,
    getMoteursDisponibles: state.getMoteursDisponibles,
    getMoteursMontes: state.getMoteursMontes,
  }));

export const usePieceStore = () =>
  useStore((state) => ({
    pieces: state.pieces,
    pagination: state.piecePagination,
    filters: state.pieceFilters,
    currentPiece: state.currentPiece,
    fetchPieces: state.fetchPieces,
    fetchPieceById: state.fetchPieceById,
    ajusterStock: state.ajusterStock,
    setPage: state.setPiecePage,
    setLimit: state.setPieceLimit,
    setFilters: state.setPieceFilters,
    resetFilters: state.resetPieceFilters,
    getPiecesStockBas: state.getPiecesStockBas,
    getPiecesParType: state.getPiecesParType,
    getTotalValeurStock: state.getTotalValeurStock,
  }));

export const useMaintenanceStore = () =>
  useStore((state) => ({
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
  }));

export const usePlanningStore = () =>
  useStore((state) => ({
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
  }));

export const useStatsStore = () =>
  useStore((state) => ({
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
  }));

export const useAlerteStore = () =>
  useStore((state) => ({
    alertes: state.alertes,
    pagination: state.alertePagination,
    filters: state.alerteFilters,
    nombreAlertesNonTraitees: state.nombreAlertesNonTraitees,
    fetchAlertes: state.fetchAlertes,
    traiterAlerte: state.traiterAlerte,
    genererAlertes: state.genererAlertes,
    setPage: state.setAlertePage,
    setLimit: state.setAlerteLimit,
    setFilters: state.setAlerteFilters,
    resetFilters: state.resetAlerteFilters,
    getAlertesCritiques: state.getAlertesCritiques,
    getAlertesParType: state.getAlertesParType,
  }));

export const useUIStore = () => 
  useStore((state) => ({
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
  }));

// Hook pour l'initialisation du store
export const useStoreInitialization = () => {
  const fetchDashboardData = useStore(state => state.fetchDashboardData);
  const fetchAlertes = useStore(state => state.fetchAlertes);
  
  const initializeStore = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchAlertes(),
    ]);
    return true;
  };
  
  return { initializeStore };
};