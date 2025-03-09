'use client';

import { useEffect } from 'react';
import { useMotoStore } from './motoStore';
import { useMoteurStore } from './moteurStore';
import { usePieceStore } from './pieceStore';
import { useMaintenanceStore } from './maintenanceStore';
import { useStatsStore } from './statsStore';
import { useUIStore } from './uiStore';
import { EtatEntite } from '@prisma/client';

// Hooks pour la gestion des motos
export const useMotos = (page = 1, filters = {}) => {
  const {
    motos,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    fetchMotos,
    setPage,
    setFilters
  } = useMotoStore();
  
  useEffect(() => {
    fetchMotos(page, filters);
  }, []);
  
  return {
    motos,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    setPage,
    setFilters,
    refetch: fetchMotos
  };
};

export const useMotoDetails = (id: string, forceRefresh = false) => {
  const {
    activeMoto,
    isLoadingDetails,
    error,
    fetchMotoById,
    updateExistingMoto,
    changeMotoStatus
  } = useMotoStore();
  
  useEffect(() => {
    fetchMotoById(id, forceRefresh);
  }, [id, forceRefresh]);
  
  return {
    moto: activeMoto,
    isLoading: isLoadingDetails,
    error,
    updateMoto: (data: any) => updateExistingMoto(id, data),
    changeStatus: (newStatus: EtatEntite, notes?: string) => changeMotoStatus(id, newStatus, notes),
    refetch: () => fetchMotoById(id, true)
  };
};

// Hooks pour la gestion des moteurs
export const useMoteurs = (page = 1, filters = {}) => {
  const {
    moteurs,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    fetchMoteurs,
    setPage,
    setFilters
  } = useMoteurStore();
  
  useEffect(() => {
    fetchMoteurs(page, filters);
  }, []);
  
  return {
    moteurs,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    setPage,
    setFilters,
    refetch: fetchMoteurs
  };
};

export const useMoteurDetails = (id: string, forceRefresh = false) => {
  const {
    activeMoteur,
    isLoadingDetails,
    error,
    fetchMoteurById,
    updateExistingMoteur,
    changeMoteurStatus
  } = useMoteurStore();
  
  useEffect(() => {
    fetchMoteurById(id, forceRefresh);
  }, [id, forceRefresh]);
  
  return {
    moteur: activeMoteur,
    isLoading: isLoadingDetails,
    error,
    updateMoteur: (data: any) => updateExistingMoteur(id, data),
    changeStatus: (newStatus: EtatEntite, notes?: string) => changeMoteurStatus(id, newStatus, notes),
    refetch: () => fetchMoteurById(id, true)
  };
};

export const useMoteurMounting = () => {
  const { isMounting, error, monterMoteurSurCycle, demonterMoteurDeCycle } = useMoteurStore();
  
  return {
    isMounting,
    error,
    monterMoteur: monterMoteurSurCycle,
    demonterMoteur: demonterMoteurDeCycle
  };
};

// Hooks pour la gestion des pièces
export const usePieces = (page = 1, filters = {}) => {
  const {
    pieces,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    fetchPieces,
    setPage,
    setFilters
  } = usePieceStore();
  
  useEffect(() => {
    fetchPieces(page, filters);
  }, []);
  
  return {
    pieces,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    setPage,
    setFilters,
    refetch: fetchPieces
  };
};

export const usePieceDetails = (id: string, forceRefresh = false) => {
  const {
    activePiece,
    isLoadingDetails,
    error,
    fetchPieceById,
    updateExistingPiece,
    adjustStock
  } = usePieceStore();
  
  useEffect(() => {
    fetchPieceById(id, forceRefresh);
  }, [id, forceRefresh]);
  
  return {
    piece: activePiece,
    isLoading: isLoadingDetails,
    error,
    updatePiece: (data: any) => updateExistingPiece(id, data),
    ajusterStock: (quantite: number, notes?: string) => adjustStock(id, quantite, notes),
    refetch: () => fetchPieceById(id, true)
  };
};

export const useStockAlerts = () => {
  const { stockAlerts, isLoading, error, fetchStockAlerts } = usePieceStore();
  
  useEffect(() => {
    fetchStockAlerts();
  }, []);
  
  return {
    alerts: stockAlerts,
    isLoading,
    error,
    refetch: fetchStockAlerts
  };
};

// Hooks pour la gestion des maintenances
export const useMaintenances = (page = 1, filters = {}) => {
  const {
    maintenances,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    fetchMaintenances,
    setPage,
    setFilters
  } = useMaintenanceStore();
  
  useEffect(() => {
    fetchMaintenances(page, filters);
  }, []);
  
  return {
    maintenances,
    isLoading,
    error,
    pagination,
    filters: currentFilters,
    setPage,
    setFilters,
    refetch: fetchMaintenances
  };
};

export const useMaintenanceDetails = (id: string, forceRefresh = false) => {
  const {
    activeMaintenance,
    isLoadingDetails,
    isFinalizing,
    error,
    fetchMaintenanceById,
    finalizeMaintenance
  } = useMaintenanceStore();
  
  useEffect(() => {
    fetchMaintenanceById(id, forceRefresh);
  }, [id, forceRefresh]);
  
  return {
    maintenance: activeMaintenance,
    isLoading: isLoadingDetails,
    isFinalizing,
    error,
    finaliser: (notes?: string) => finalizeMaintenance(id, notes),
    refetch: () => fetchMaintenanceById(id, true)
  };
};

export const useMaintenanceDraft = () => {
  const {
    draftPiecesUtilisees,
    addDraftPiece,
    removeDraftPiece,
    updateDraftPiece,
    clearDraftPieces,
    createNewMaintenance
  } = useMaintenanceStore();
  
  return {
    piecesUtilisees: draftPiecesUtilisees,
    addPiece: addDraftPiece,
    removePiece: removeDraftPiece,
    updatePiece: updateDraftPiece,
    clear: clearDraftPieces,
    create: createNewMaintenance
  };
};

// Hooks pour les statistiques
export const useDashboardStats = () => {
  const { dashboardStats, isLoading, error, fetchDashboardStats } = useStatsStore();
  
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  return {
    stats: dashboardStats,
    isLoading,
    error,
    refetch: fetchDashboardStats
  };
};

export const useMaintenanceStats = () => {
  const {
    maintenanceStats,
    isLoading,
    error,
    selectedTimeRange,
    fetchMaintenanceStats,
    setTimeRange,
    setCustomDateRange,
    applySelectedTimeRange
  } = useStatsStore();
  
  useEffect(() => {
    if (!maintenanceStats) {
      applySelectedTimeRange();
    }
  }, []);
  
  return {
    stats: maintenanceStats,
    timeRange: selectedTimeRange,
    isLoading,
    error,
    setTimeRange,
    setCustomDateRange,
    apply: applySelectedTimeRange,
    refetch: fetchMaintenanceStats
  };
};

export const useUtilisationStats = () => {
  const {
    utilisationStats,
    utilisationHebdomadaire,
    isLoading,
    error,
    selectedTimeRange,
    fetchUtilisationStats,
    fetchUtilisationHebdomadaire,
    setTimeRange,
    applySelectedTimeRange
  } = useStatsStore();
  
  useEffect(() => {
    if (!utilisationHebdomadaire) {
      fetchUtilisationHebdomadaire();
    }
    
    if (!utilisationStats) {
      applySelectedTimeRange();
    }
  }, []);
  
  return {
    stats: utilisationStats,
    hebdomadaire: utilisationHebdomadaire,
    timeRange: selectedTimeRange,
    isLoading,
    error,
    setTimeRange,
    apply: applySelectedTimeRange,
    refetchStats: fetchUtilisationStats,
    refetchHebdo: fetchUtilisationHebdomadaire
  };
};