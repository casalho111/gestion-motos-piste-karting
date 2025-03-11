'use client';

import { useState } from 'react';
import { useAlerts } from '@/store/hooks/useAlerts';
import { AlertsList } from '@/components/dashboard/alerts-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { AlertCircle, BellOff, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AlertsPage() {
  const { 
    alerts, 
    isLoading, 
    unreadCount, 
    markAllAsRead,
    dismissAlert
  } = useAlerts();
  
  // État local pour les onglets actifs
  const [activeTab, setActiveTab] = useState('all');
  
  // Configuration des onglets
  const tabs = [
    {
      id: 'all',
      label: 'Toutes les alertes',
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      id: 'unread',
      label: 'Non lues',
      icon: <BellOff className="h-4 w-4" />
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];
  
  // Filtrage des alertes selon l'onglet actif
  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'unread') return !alert.isRead;
    if (activeTab === 'maintenance') return alert.type === 'maintenance';
    return true; // 'all'
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertes et notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}.` 
              : 'Toutes les notifications ont été lues.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            disabled={unreadCount === 0}
            onClick={() => markAllAsRead()}
          >
            Tout marquer comme lu
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <TabNavigation 
        tabs={tabs}
        defaultTab="all"
        onChange={setActiveTab}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">
            {activeTab === 'all' ? 'Toutes les alertes' : 
             activeTab === 'unread' ? 'Alertes non lues' : 
             'Alertes de maintenance'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'all' 
              ? 'Toutes les alertes et notifications du système'
              : activeTab === 'unread'
                ? 'Alertes qui nécessitent votre attention'
                : 'Alertes liées à la maintenance des motos et moteurs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
        <AlertsList 
  alerts={filteredAlerts}
  isLoading={isLoading}
  onMarkAllAsRead={() => markAllAsRead()}
  emptyMessage={
    activeTab === 'unread' 
      ? 'Aucune alerte non lue' 
      : 'Aucune alerte'
  }
  maxHeight="none"
/>
        </CardContent>
      </Card>
    </div>
  );
}