'use client';

import React, { useEffect } from 'react';
import { useSystemStatus, useInitializeStore } from '@/store/initStore';
import { useDashboard } from '@/store/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EtatEntite } from '@prisma/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DashboardOverview = () => {
  // Initialiser les données requises
  const { isInitialized, isLoading: initLoading, error: initError } = useInitializeStore();
  
  // Récupérer les données du dashboard
  const { dashboardData, utilisationHebdomadaire, isLoading: dataLoading } = useDashboard();
  
  // État du système
  const { 
    tauxDisponibilite, 
    nombreMotosDisponibles, 
    nombreMoteursDisponibles,
    nombreAlertesNonTraitees,
    systemHealth,
    lastUpdated
  } = useSystemStatus();
  
  // Afficher un indicateur de chargement
  if (initLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (initError) {
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold">Erreur de chargement</h2>
        <p>{initError}</p>
      </div>
    );
  }
  
  // S'assurer que les données sont disponibles
  if (!dashboardData) {
    return (
      <div className="p-8 text-gray-500">
        <h2 className="text-xl font-bold">Données non disponibles</h2>
        <p>Les données du tableau de bord ne peuvent pas être chargées pour le moment.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Entête du dashboard avec dernière mise à jour */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: fr })}
          </p>
        )}
      </div>
      
      {/* Cartes d'aperçu */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Carte pour les motos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motos</CardTitle>
            <div className={`h-4 w-4 rounded-full ${systemHealth === 'healthy' ? 'bg-green-500' : systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.cycles.total}</div>
            <p className="text-xs text-muted-foreground">
              {nombreMotosDisponibles} disponibles ({tauxDisponibilite}%)
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-green-500 font-semibold">{dashboardData.cycles.disponibles}</span>
                <span className="text-muted-foreground">Dispo</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-yellow-500 font-semibold">{dashboardData.cycles.enMaintenance}</span>
                <span className="text-muted-foreground">Maint.</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-orange-500 font-semibold">{dashboardData.cycles.aVerifier}</span>
                <span className="text-muted-foreground">À vér.</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-red-500 font-semibold">{dashboardData.cycles.horsService}</span>
                <span className="text-muted-foreground">H.S.</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Carte pour les moteurs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.moteurs.total}</div>
            <p className="text-xs text-muted-foreground">
              {nombreMoteursDisponibles} disponibles, {dashboardData.moteurs.montes} montés
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-green-500 font-semibold">{dashboardData.moteurs.disponibles}</span>
                <span className="text-muted-foreground">Dispo</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-blue-500 font-semibold">{dashboardData.moteurs.montes}</span>
                <span className="text-muted-foreground">Montés</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-yellow-500 font-semibold">{dashboardData.moteurs.enMaintenance}</span>
                <span className="text-muted-foreground">Maint.</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-red-500 font-semibold">{dashboardData.moteurs.horsService}</span>
                <span className="text-muted-foreground">H.S.</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Carte pour les coûts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.maintenances.coutTotal.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              Coût total de maintenance
            </p>
            <div className="mt-3 h-[60px]">
              {dashboardData.maintenances.recentes.length > 0 ? (
                <div className="text-xs">
                  <div className="font-semibold">Dernière maintenance:</div>
                  <div>{dashboardData.maintenances.recentes[0].description}</div>
                  <div className="text-muted-foreground">
                    {new Date(dashboardData.maintenances.recentes[0].dateRealisation).toLocaleDateString()} - 
                    {dashboardData.maintenances.recentes[0].coutTotal.toFixed(2)} €
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucune maintenance récente</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Carte pour les alertes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            {nombreAlertesNonTraitees > 0 && (
              <div className="bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {nombreAlertesNonTraitees}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nombreAlertesNonTraitees}</div>
            <p className="text-xs text-muted-foreground">
              Alertes non traitées
            </p>
            <div className="mt-3 h-[60px]">
              {dashboardData.alertes.piecesStockBas.length > 0 ? (
                <div className="text-xs">
                  <div className="font-semibold">Stock bas:</div>
                  {dashboardData.alertes.piecesStockBas.slice(0, 2).map((piece, index) => (
                    <div key={index} className="text-muted-foreground">
                      {piece.nom}: {piece.quantiteStock}/{piece.quantiteMinimale}
                    </div>
                  ))}
                  {dashboardData.alertes.piecesStockBas.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      + {dashboardData.alertes.piecesStockBas.length - 2} autres...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucune alerte de stock</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphique d'utilisation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Utilisation hebdomadaire</CardTitle>
            <CardDescription>Distance totale parcourue par jour (en km)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {utilisationHebdomadaire && utilisationHebdomadaire.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={utilisationHebdomadaire}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="distanceTotale" 
                      name="Distance (km)" 
                      fill="#3b82f6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée d'utilisation disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Liste des dernières activités */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Contrôles et montages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.activite.controles.slice(0, 3).map((controle, index) => (
                <div key={`controle-${index}`} className="flex items-start gap-2">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${controle.estConforme ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">
                      Contrôle {controle.cycle.numSerie}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(controle.date).toLocaleDateString()} - {controle.controleur}
                    </p>
                  </div>
                </div>
              ))}
              
              {dashboardData.activite.montages.slice(0, 2).map((montage, index) => (
                <div key={`montage-${index}`} className="flex items-start gap-2">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      Moteur {montage.moteur.numSerie} → {montage.cycle.numSerie}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(montage.dateDebut).toLocaleDateString()} - {montage.technicien}
                    </p>
                  </div>
                </div>
              ))}
              
              {dashboardData.activite.controles.length === 0 && dashboardData.activite.montages.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Aucune activité récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;