import { useState, useEffect } from 'react';
import { useStore } from './store';
import { EtatEntite } from '@prisma/client';

/**
 * Hook pour initialiser les données essentielles au démarrage de l'application
 * Utilisé principalement dans le layout ou la page d'accueil
 */
export function useInitializeStore() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Actions à exécuter au démarrage
  const fetchDashboardData = useStore(state => state.fetchDashboardData);
  const fetchMotos = useStore(state => state.fetchMotos);
  const fetchMoteurs = useStore(state => state.fetchMoteurs);
  const fetchPieces = useStore(state => state.fetchPieces);
  const fetchAlertes = useStore(state => state.fetchAlertes);
  
  // Fonction pour précharger les données essentielles
  const initializeData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger d'abord les données du dashboard qui contiennent des informations générales
      await fetchDashboardData();
      
      // Charger les informations de base pour chaque type d'entité
      // Note: Ces appels sont faits en parallèle pour accélérer le chargement
      await Promise.all([
        // Motos disponibles (pour les sessions rapides)
        fetchMotos(),
        
        // Moteurs disponibles (pour les montages rapides)
        fetchMoteurs(),
        
        // Pièces avec stock bas (pour les alertes)
        fetchPieces(),
        
        // Alertes non traitées
        fetchAlertes()
      ]);
      
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation des données');
      console.error('Erreur lors de l\'initialisation du store:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialiser les données au montage du composant
  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized]);
  
  return {
    isInitialized,
    isLoading,
    error,
    reinitialize: initializeData
  };
}

/**
 * Hook pour obtenir des informations rapides sur l'état du système
 * Utile pour les widgets du dashboard et la barre de navigation
 */
export function useSystemStatus() {
  const dashboard = useStore(state => state.dashboard);
  const nombreAlertesNonTraitees = useStore(state => state.nombreAlertesNonTraitees);
  
  // Calcul des différents indicateurs d'état du système
  const tauxDisponibilite = dashboard.data 
    ? Math.round((dashboard.data.cycles.disponibles / dashboard.data.cycles.total) * 100) 
    : 0;
    
  const tauxMoteursMontés = dashboard.data && dashboard.data.moteurs.total > 0
    ? Math.round((dashboard.data.moteurs.montes / dashboard.data.moteurs.total) * 100)
    : 0;
    
  // Détermination de l'état de santé global du système
  const getSystemHealth = () => {
    if (!dashboard.data) return 'unknown';
    
    // Critères pour déterminer l'état de santé
    const hasUnhandledCriticalAlerts = nombreAlertesNonTraitees > 0;
    const lowAvailability = tauxDisponibilite < 50;
    const manyInMaintenance = dashboard.data.cycles.enMaintenance > dashboard.data.cycles.disponibles;
    
    if (hasUnhandledCriticalAlerts || lowAvailability) {
      return 'critical';
    } else if (manyInMaintenance) {
      return 'warning';
    } else {
      return 'healthy';
    }
  };
  
  return {
    isLoading: dashboard.status === 'loading',
    isReady: dashboard.status === 'success',
    tauxDisponibilite,
    tauxMoteursMontés,
    nombreAlertesNonTraitees,
    nombreMotosDisponibles: dashboard.data?.cycles.disponibles || 0,
    nombreMoteursDisponibles: dashboard.data?.moteurs.disponibles || 0,
    systemHealth: getSystemHealth(),
    lastUpdated: dashboard.timestamp
  };
}