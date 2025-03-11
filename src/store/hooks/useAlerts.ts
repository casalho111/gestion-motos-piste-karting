'use client';

import { useEffect } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { AlertType } from '@/store/types';
import { Criticite } from '@prisma/client';

/**
 * Hook pour gérer les alertes et notifications
 */
export const useAlerts = () => {
  const {
    items,
    isLoading,
    error,
    unreadCount,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    addAlert,
    dismissAlert,
    setFilters
  } = useAlertStore();
  
  // Charger les alertes au montage du composant
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);
  
  /**
   * Crée une nouvelle alerte
   */
  const createAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    criticite: Criticite = 'MOYENNE',
    entity?: {
      id: string;
      type: 'moto' | 'moteur' | 'piece';
      name: string;
    },
    action?: {
      label: string;
      href?: string;
      onClick?: () => void;
    }
  ) => {
    addAlert({
      title,
      message,
      type,
      criticite,
      entity,
      action
    });
  };
  
  return {
    alerts: items,
    isLoading,
    error,
    unreadCount,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    createAlert,
    dismissAlert,
    setFilters
  };
};